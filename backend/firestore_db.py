"""
Firestore database adapter for Google Cloud Platform
Can switch between MongoDB (local) and Firestore (production)
"""
from google.cloud import firestore
from typing import List, Dict, Any, Optional
import os
from datetime import datetime

class FirestoreDB:
    """Firestore database wrapper with MongoDB-like interface"""
    
    def __init__(self, project_id: Optional[str] = None):
        """Initialize Firestore client"""
        self.db = firestore.Client(project=project_id) if project_id else firestore.Client()
        
    def collection(self, collection_name: str):
        """Get collection reference"""
        return FirestoreCollection(self.db.collection(collection_name))


class FirestoreCollection:
    """Collection wrapper with MongoDB-like methods"""
    
    def __init__(self, collection_ref):
        self.collection_ref = collection_ref
    
    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict] = None) -> Optional[Dict]:
        """Find single document"""
        try:
            # Handle simple queries
            if len(query) == 1:
                key, value = list(query.items())[0]
                docs = self.collection_ref.where(key, '==', value).limit(1).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data['_id'] = doc.id
                    return data
            return None
        except Exception as e:
            print(f"Firestore find_one error: {e}")
            return None
    
    async def find(self, query: Dict[str, Any] = None, projection: Optional[Dict] = None):
        """Find multiple documents"""
        return FirestoreCursor(self.collection_ref, query or {})
    
    async def insert_one(self, document: Dict[str, Any]) -> Any:
        """Insert single document"""
        # Convert datetime objects to strings
        doc = self._serialize_document(document)
        doc_id = doc.get('id', None)
        
        if doc_id:
            self.collection_ref.document(doc_id).set(doc)
        else:
            self.collection_ref.add(doc)
        return type('Result', (), {'inserted_id': doc_id})()
    
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> Any:
        """Update single document"""
        if len(query) == 1:
            key, value = list(query.items())[0]
            docs = self.collection_ref.where(key, '==', value).limit(1).stream()
            
            for doc in docs:
                update_data = update.get('$set', {})
                update_data = self._serialize_document(update_data)
                self.collection_ref.document(doc.id).update(update_data)
                return type('Result', (), {'modified_count': 1})()
        
        return type('Result', (), {'modified_count': 0})()
    
    async def delete_one(self, query: Dict[str, Any]) -> Any:
        """Delete single document"""
        if len(query) == 1:
            key, value = list(query.items())[0]
            docs = self.collection_ref.where(key, '==', value).limit(1).stream()
            
            for doc in docs:
                self.collection_ref.document(doc.id).delete()
                return type('Result', (), {'deleted_count': 1})()
        
        return type('Result', (), {'deleted_count': 0})()
    
    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        """Count documents matching query"""
        try:
            if not query or len(query) == 0:
                # Count all documents
                docs = list(self.collection_ref.stream())
                return len(docs)
            
            if len(query) == 1:
                key, value = list(query.items())[0]
                docs = list(self.collection_ref.where(key, '==', value).stream())
                return len(docs)
            
            return 0
        except Exception as e:
            print(f"Firestore count error: {e}")
            return 0
    
    async def distinct(self, field: str) -> List[Any]:
        """Get distinct values for a field"""
        try:
            docs = self.collection_ref.stream()
            values = set()
            for doc in docs:
                data = doc.to_dict()
                if field in data:
                    values.add(data[field])
            return list(values)
        except Exception as e:
            print(f"Firestore distinct error: {e}")
            return []
    
    def _serialize_document(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert datetime objects to ISO strings for Firestore"""
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = self._serialize_document(value)
            else:
                serialized[key] = value
        return serialized


class FirestoreCursor:
    """Cursor wrapper for query results"""
    
    def __init__(self, collection_ref, query: Dict[str, Any]):
        self.collection_ref = collection_ref
        self.query = query
        self._limit = None
    
    def limit(self, count: int):
        """Limit results"""
        self._limit = count
        return self
    
    async def to_list(self, length: int) -> List[Dict]:
        """Convert to list"""
        try:
            results = []
            
            # Build query
            if len(self.query) == 0:
                query_ref = self.collection_ref
            elif len(self.query) == 1 and '$or' not in self.query:
                key, value = list(self.query.items())[0]
                query_ref = self.collection_ref.where(key, '==', value)
            else:
                # For complex queries, fetch all and filter in memory
                query_ref = self.collection_ref
            
            # Apply limit
            if self._limit:
                query_ref = query_ref.limit(self._limit)
            else:
                query_ref = query_ref.limit(length)
            
            # Execute query
            docs = query_ref.stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['_id'] = doc.id
                
                # Apply complex filters if needed
                if self._matches_query(data, self.query):
                    results.append(data)
            
            return results[:length]
        except Exception as e:
            print(f"Firestore to_list error: {e}")
            return []
    
    def _matches_query(self, doc: Dict, query: Dict) -> bool:
        """Check if document matches complex query"""
        if not query:
            return True
        
        # Handle $or queries
        if '$or' in query:
            for condition in query['$or']:
                if all(doc.get(k, '').lower().find(v.get('$regex', '').lower()) >= 0 
                       for k, v in condition.items() if isinstance(v, dict) and '$regex' in v):
                    return True
            return False
        
        # Simple equality check
        return all(doc.get(k) == v for k, v in query.items())


def get_database():
    """Get database instance (Firestore or MongoDB based on environment)"""
    use_firestore = os.getenv('USE_FIRESTORE', 'false').lower() == 'true'
    
    if use_firestore:
        project_id = os.getenv('GCP_PROJECT_ID')
        return FirestoreDB(project_id)
    else:
        # Return MongoDB client (existing implementation)
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db_name = os.environ.get('DB_NAME', 'test_database')
        return client[db_name]
