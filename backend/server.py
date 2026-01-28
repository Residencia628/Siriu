from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from io import BytesIO
from fastapi.responses import StreamingResponse
import openpyxl
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database connection (MongoDB or Firestore)
USE_FIRESTORE = os.getenv('USE_FIRESTORE', 'false').lower() == 'true'

if USE_FIRESTORE:
    from firestore_db import get_database
    db = get_database()
    logger = logging.getLogger(__name__)
    logger.info("Using Firestore database")
else:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    logger = logging.getLogger(__name__)
    logger.info("Using MongoDB database")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No JWT_SECRET_KEY set for Flask application")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Password utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # user, admin, superadmin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ubicacion: str
    resguardante: str
    departamento: str
    tipo_bien: str  # computadora, periferico, componente_red, dispositivo_movil, insumo_critico
    numero_serie: str
    numero_factura: Optional[str] = ""
    numero_inventario: Optional[str] = ""
    marca: str
    modelo: str
    fecha_adquisicion: str
    estado_operativo: str  # disponible, asignado, en_mantenimiento, dado_de_baja, en_resguardo
    observaciones: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = ""

class EquipmentCreate(BaseModel):
    ubicacion: str
    resguardante: str
    departamento: str
    tipo_bien: str
    numero_serie: str
    numero_factura: Optional[str] = ""
    numero_inventario: Optional[str] = ""
    marca: str
    modelo: str
    fecha_adquisicion: str
    estado_operativo: str
    observaciones: Optional[str] = ""

class EquipmentUpdate(BaseModel):
    ubicacion: Optional[str] = None
    resguardante: Optional[str] = None
    departamento: Optional[str] = None
    tipo_bien: Optional[str] = None
    numero_serie: Optional[str] = None
    numero_factura: Optional[str] = None
    numero_inventario: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    fecha_adquisicion: Optional[str] = None
    estado_operativo: Optional[str] = None
    observaciones: Optional[str] = None

class HistoryEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_id: str
    action: str
    changed_by: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    old_values: Optional[Dict[str, Any]] = {}
    new_values: Optional[Dict[str, Any]] = {}

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    edificio: str
    piso: str
    salon_aula: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationCreate(BaseModel):
    edificio: str
    piso: str
    salon_aula: str

class LocationUpdate(BaseModel):
    edificio: Optional[str] = None
    piso: Optional[str] = None
    salon_aula: Optional[str] = None

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    ubicacion_id: str
    numero_trabajadores: int
    trabajadores: List[Dict[str, str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    nombre: str
    ubicacion_id: str
    numero_trabajadores: int
    trabajadores: List[Dict[str, str]] = []

class DepartmentUpdate(BaseModel):
    nombre: Optional[str] = None
    ubicacion_id: Optional[str] = None
    numero_trabajadores: Optional[int] = None
    trabajadores: Optional[List[Dict[str, str]]] = None

class TipoBien(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TipoBienCreate(BaseModel):
    nombre: str

class TipoBienUpdate(BaseModel):
    nombre: Optional[str] = None

class Marca(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarcaCreate(BaseModel):
    nombre: str

class MarcaUpdate(BaseModel):
    nombre: Optional[str] = None

class Edificio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    direccion: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EdificioCreate(BaseModel):
    nombre: str
    direccion: Optional[str] = ""

class EdificioUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede crear usuarios")
    
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_obj = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    doc = user_obj.model_dump()
    doc["password"] = get_password_hash(user_data.password)
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

@api_router.put("/auth/change-password")
async def change_password(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Verify current password is provided
    if not user_data.current_password:
        raise HTTPException(status_code=400, detail="La contraseña actual es requerida")
    
    # Verify new password is provided
    if not user_data.new_password:
        raise HTTPException(status_code=400, detail="La nueva contraseña es requerida")
    
    # Get the full user document to verify current password
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user or not verify_password(user_data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    
    # Update the password
    hashed_password = get_password_hash(user_data.new_password)
    await db.users.update_one(
        {"id": current_user["id"]}, 
        {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Contraseña actualizada exitosamente"}

# Equipment Routes
@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(
    current_user: dict = Depends(get_current_user),
    tipo_bien: Optional[str] = None,
    estado_operativo: Optional[str] = None,
    departamento: Optional[str] = None,
    ubicacion: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    if tipo_bien:
        query["tipo_bien"] = tipo_bien
    if estado_operativo:
        query["estado_operativo"] = estado_operativo
    if departamento:
        query["departamento"] = departamento
    if ubicacion:
        query["ubicacion"] = ubicacion
    if search:
        query["$or"] = [
            {"numero_serie": {"$regex": search, "$options": "i"}},
            {"marca": {"$regex": search, "$options": "i"}},
            {"modelo": {"$regex": search, "$options": "i"}},
            {"resguardante": {"$regex": search, "$options": "i"}}
        ]
    
    equipment_list = await db.equipment.find(query, {"_id": 0}).to_list(1000)
    for eq in equipment_list:
        if isinstance(eq.get("created_at"), str):
            eq["created_at"] = datetime.fromisoformat(eq["created_at"])
        if isinstance(eq.get("updated_at"), str):
            eq["updated_at"] = datetime.fromisoformat(eq["updated_at"])
    return equipment_list

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)
async def get_equipment_by_id(
    equipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    if isinstance(equipment.get("created_at"), str):
        equipment["created_at"] = datetime.fromisoformat(equipment["created_at"])
    if isinstance(equipment.get("updated_at"), str):
        equipment["updated_at"] = datetime.fromisoformat(equipment["updated_at"])
    return equipment

@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(
    equipment_data: EquipmentCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear equipos")
    
    equipment_obj = Equipment(
        **equipment_data.model_dump(),
        created_by=current_user["email"]
    )
    
    doc = equipment_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.equipment.insert_one(doc)
    
    # Create history entry
    history_entry = HistoryEntry(
        equipment_id=equipment_obj.id,
        action="created",
        changed_by=current_user["email"],
        new_values=doc
    )
    history_doc = history_entry.model_dump()
    history_doc["timestamp"] = history_doc["timestamp"].isoformat()
    await db.history.insert_one(history_doc)
    
    return equipment_obj

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(
    equipment_id: str,
    equipment_data: EquipmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar equipos")
    
    existing_equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not existing_equipment:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    update_data = {k: v for k, v in equipment_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    
    # Create history entry
    history_entry = HistoryEntry(
        equipment_id=equipment_id,
        action="updated",
        changed_by=current_user["email"],
        old_values=existing_equipment,
        new_values=update_data
    )
    history_doc = history_entry.model_dump()
    history_doc["timestamp"] = history_doc["timestamp"].isoformat()
    await db.history.insert_one(history_doc)
    
    updated_equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if isinstance(updated_equipment.get("created_at"), str):
        updated_equipment["created_at"] = datetime.fromisoformat(updated_equipment["created_at"])
    if isinstance(updated_equipment.get("updated_at"), str):
        updated_equipment["updated_at"] = datetime.fromisoformat(updated_equipment["updated_at"])
    return updated_equipment

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede eliminar equipos")
    
    existing_equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not existing_equipment:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    await db.equipment.delete_one({"id": equipment_id})
    
    # Create history entry
    history_entry = HistoryEntry(
        equipment_id=equipment_id,
        action="deleted",
        changed_by=current_user["email"],
        old_values=existing_equipment
    )
    history_doc = history_entry.model_dump()
    history_doc["timestamp"] = history_doc["timestamp"].isoformat()
    await db.history.insert_one(history_doc)
    
    return {"message": "Equipo eliminado exitosamente"}

# History Routes
def clean_dict_for_json(obj):
    """Recursively clean dictionary to remove ObjectId and other non-JSON serializable objects"""
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if key == '_id':  # Skip MongoDB _id fields
                continue
            cleaned[key] = clean_dict_for_json(value)
        return cleaned
    elif isinstance(obj, list):
        return [clean_dict_for_json(item) for item in obj]
    elif hasattr(obj, '__dict__') and not isinstance(obj, (str, int, float, bool)):
        # Skip complex objects that aren't basic types
        return str(obj)
    else:
        return obj

@api_router.get("/history/{equipment_id}")
async def get_equipment_history(
    equipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        history_list = await db.history.find({"equipment_id": equipment_id}, {"_id": 0}).to_list(1000)
        result = []
        for entry in history_list:
            # Create a clean dict with only the fields we need
            clean_entry = {
                "id": entry.get("id", ""),
                "equipment_id": entry.get("equipment_id", ""),
                "action": entry.get("action", ""),
                "changed_by": entry.get("changed_by", ""),
                "timestamp": entry.get("timestamp", ""),
                "old_values": clean_dict_for_json(entry.get("old_values", {})),
                "new_values": clean_dict_for_json(entry.get("new_values", {}))
            }
            
            # Convert timestamp if needed
            if isinstance(clean_entry["timestamp"], str):
                try:
                    clean_entry["timestamp"] = datetime.fromisoformat(clean_entry["timestamp"]).isoformat()
                except:
                    pass
            elif hasattr(clean_entry["timestamp"], 'isoformat'):
                clean_entry["timestamp"] = clean_entry["timestamp"].isoformat()
                
            result.append(clean_entry)
        return result
    except Exception as e:
        # Return empty list if there's an error
        return []

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_equipment = await db.equipment.count_documents({})
    
    # Get all tipos_bien from the new collection
    tipos_bien_docs = await db.tipos_bien.find({}, {"_id": 0}).to_list(1000)
    tipos_bien_list = [tipo["nombre"] for tipo in tipos_bien_docs]
    
    # By type - dynamically from tipos_bien collection
    by_type = {}
    for tipo in tipos_bien_list:
        count = await db.equipment.count_documents({"tipo_bien": tipo})
        by_type[tipo] = count
    
    # By status
    by_status = {}
    for status in ["disponible", "asignado", "en_mantenimiento", "dado_de_baja", "en_resguardo"]:
        count = await db.equipment.count_documents({"estado_operativo": status})
        by_status[status] = count
    
    # By department
    departments = await db.equipment.distinct("departamento")
    by_department = {}
    for dept in departments:
        count = await db.equipment.count_documents({"departamento": dept})
        by_department[dept] = count
    
    return {
        "total_equipment": total_equipment,
        "by_type": by_type,
        "by_status": by_status,
        "by_department": by_department
    }

# Business Intelligence Dashboard - Equipment by Department
@api_router.get("/dashboard/equipment-by-department")
async def get_equipment_by_department(current_user: dict = Depends(get_current_user)):
    # Aggregate equipment by department with detailed stats
    pipeline = [
        {
            "$group": {
                "_id": "$departamento",
                "count": {"$sum": 1},
                "by_status": {
                    "$push": "$estado_operativo"
                },
                "by_type": {
                    "$push": "$tipo_bien"
                }
            }
        },
        {
            "$sort": {"count": -1}
        }
    ]
    
    result = await db.equipment.aggregate(pipeline).to_list(length=100)
    
    # Process the results
    department_stats = []
    for item in result:
        # Count status distribution
        status_counts = {}
        for status in item["by_status"]:
            status_counts[status] = status_counts.get(status, 0) + 1
            
        # Count type distribution
        type_counts = {}
        for type_bien in item["by_type"]:
            type_counts[type_bien] = type_counts.get(type_bien, 0) + 1
            
        department_stats.append({
            "department": item["_id"],
            "total": item["count"],
            "by_status": status_counts,
            "by_type": type_counts
        })
    
    return department_stats

# Business Intelligence Dashboard - Equipment by Location
@api_router.get("/dashboard/equipment-by-location")
async def get_equipment_by_location(current_user: dict = Depends(get_current_user)):
    # Aggregate equipment by location with detailed stats
    pipeline = [
        {
            "$group": {
                "_id": "$ubicacion",
                "count": {"$sum": 1},
                "by_status": {
                    "$push": "$estado_operativo"
                },
                "by_type": {
                    "$push": "$tipo_bien"
                }
            }
        },
        {
            "$sort": {"count": -1}
        }
    ]
    
    result = await db.equipment.aggregate(pipeline).to_list(length=100)
    
    # Process the results
    location_stats = []
    for item in result:
        # Count status distribution
        status_counts = {}
        for status in item["by_status"]:
            status_counts[status] = status_counts.get(status, 0) + 1
            
        # Count type distribution
        type_counts = {}
        for type_bien in item["by_type"]:
            type_counts[type_bien] = type_counts.get(type_bien, 0) + 1
            
        location_stats.append({
            "location": item["_id"],
            "total": item["count"],
            "by_status": status_counts,
            "by_type": type_counts
        })
    
    return location_stats

# Export Routes
@api_router.get("/equipment/export/excel")
async def export_excel(current_user: dict = Depends(get_current_user)):
    equipment_list = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inventario"
    
    # Headers
    headers = ["ID", "Ubicación", "Resguardante", "Departamento", "Tipo", "Número de Serie", 
               "Marca", "Modelo", "Fecha Adquisición", "Estado", "Observaciones"]
    ws.append(headers)
    
    # Data
    for eq in equipment_list:
        ws.append([
            eq.get("id", ""),
            eq.get("ubicacion", ""),
            eq.get("resguardante", ""),
            eq.get("departamento", ""),
            eq.get("tipo_bien", ""),
            eq.get("numero_serie", ""),
            eq.get("marca", ""),
            eq.get("modelo", ""),
            eq.get("fecha_adquisicion", ""),
            eq.get("estado_operativo", ""),
            eq.get("observaciones", "")
        ])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inventario.xlsx"}
    )

@api_router.get("/equipment/export/pdf")
async def export_pdf(current_user: dict = Depends(get_current_user)):
    equipment_list = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    
    styles = getSampleStyleSheet()
    title = Paragraph("Inventario de Recursos Informáticos", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Table data
    headers = ["Tipo", "Marca", "Modelo", "Serie", "Estado", "Ubicación", "Resguardante", "Depto"]
    data = [headers]
    
    for eq in equipment_list:  # Removed limit of 50
        data.append([
            eq.get("tipo_bien", "")[:15],
            eq.get("marca", "")[:15],
            eq.get("modelo", "")[:15],
            eq.get("numero_serie", "")[:15],
            eq.get("estado_operativo", "")[:15],
            eq.get("ubicacion", "")[:15],
            eq.get("resguardante", "")[:15],
            eq.get("departamento", "")[:15]
        ])
    
    # Calculate column widths based on page width
    # Landscape letter is 792 points wide. Margins are usually 72 points each side.
    # Available width approx 650 points.
    col_widths = [80, 80, 80, 80, 80, 80, 80, 80] # Approx 640 total
    
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10), # Reduced font size for more columns
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8), # Smaller font for data
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=inventario.pdf"}
    )

# Location Management
@api_router.get("/locations", response_model=List[Location])
async def get_locations(current_user: dict = Depends(get_current_user)):
    """Get all locations (accessible to all authenticated users)"""
    locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    for location in locations:
        if isinstance(location.get("created_at"), str):
            location["created_at"] = datetime.fromisoformat(location["created_at"])
        if isinstance(location.get("updated_at"), str):
            location["updated_at"] = datetime.fromisoformat(location["updated_at"])
    return locations

@api_router.post("/locations", response_model=Location)
async def create_location(
    location_data: LocationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new location (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear ubicaciones")
    
    location_obj = Location(
        edificio=location_data.edificio,
        piso=location_data.piso,
        salon_aula=location_data.salon_aula
    )
    
    doc = location_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.locations.insert_one(doc)
    return location_obj

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(
    location_id: str,
    location_data: LocationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a location (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar ubicaciones")
    
    # Check if location exists
    existing_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not existing_location:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    
    # Prepare update data
    update_data = {}
    if location_data.edificio is not None:
        update_data["edificio"] = location_data.edificio
    if location_data.piso is not None:
        update_data["piso"] = location_data.piso
    if location_data.salon_aula is not None:
        update_data["salon_aula"] = location_data.salon_aula
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.locations.update_one({"id": location_id}, {"$set": update_data})
    
    # Return updated location
    updated_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    return updated_location

@api_router.delete("/locations/{location_id}")
async def delete_location(
    location_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a location (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar ubicaciones")
    
    # Check if location is being used by equipment
    equipment_count = await db.equipment.count_documents({"ubicacion": {"$regex": f".*{location_id}.*"}})
    if equipment_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar la ubicación porque está siendo usada por equipos")
    
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    
    return {"message": "Ubicación eliminada exitosamente"}

# Department Management
@api_router.get("/departments", response_model=List[Department])
async def get_departments(current_user: dict = Depends(get_current_user)):
    """Get all departments (accessible to all authenticated users)"""
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    for department in departments:
        if isinstance(department.get("created_at"), str):
            department["created_at"] = datetime.fromisoformat(department["created_at"])
        if isinstance(department.get("updated_at"), str):
            department["updated_at"] = datetime.fromisoformat(department["updated_at"])
    return departments

@api_router.post("/departments", response_model=Department)
async def create_department(
    department_data: DepartmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new department (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear departamentos")
    
    # Validate location exists
    location = await db.locations.find_one({"id": department_data.ubicacion_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=400, detail="Ubicación no encontrada")
    
    department_obj = Department(
        nombre=department_data.nombre,
        ubicacion_id=department_data.ubicacion_id,
        numero_trabajadores=department_data.numero_trabajadores,
        trabajadores=department_data.trabajadores
    )
    
    doc = department_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.departments.insert_one(doc)
    return department_obj

@api_router.put("/departments/{department_id}", response_model=Department)
async def update_department(
    department_id: str,
    department_data: DepartmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a department (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar departamentos")
    
    # Check if department exists
    existing_department = await db.departments.find_one({"id": department_id}, {"_id": 0})
    if not existing_department:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    # Validate location exists if provided
    if department_data.ubicacion_id is not None:
        location = await db.locations.find_one({"id": department_data.ubicacion_id}, {"_id": 0})
        if not location:
            raise HTTPException(status_code=400, detail="Ubicación no encontrada")
    
    # Prepare update data
    update_data = {}
    if department_data.nombre is not None:
        update_data["nombre"] = department_data.nombre
    if department_data.ubicacion_id is not None:
        update_data["ubicacion_id"] = department_data.ubicacion_id
    if department_data.numero_trabajadores is not None:
        update_data["numero_trabajadores"] = department_data.numero_trabajadores
    if department_data.trabajadores is not None:
        update_data["trabajadores"] = department_data.trabajadores
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.departments.update_one({"id": department_id}, {"$set": update_data})
    
    # Return updated department
    updated_department = await db.departments.find_one({"id": department_id}, {"_id": 0})
    return updated_department

@api_router.delete("/departments/{department_id}")
async def delete_department(
    department_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a department (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar departamentos")
    
    # Check if department is being used by equipment
    equipment_count = await db.equipment.count_documents({"departamento": {"$regex": f".*{department_id}.*"}})
    if equipment_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar el departamento porque está siendo usado por equipos")
    
    result = await db.departments.delete_one({"id": department_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    
    return {"message": "Departamento eliminado exitosamente"}

# Dashboard Stats by Edificio
@api_router.get("/dashboard/equipment-by-edificio")
async def get_equipment_by_edificio(current_user: dict = Depends(get_current_user)):
    """Get equipment statistics by edificio"""
    # Get all edificios
    edificios = await db.edificios.find({}, {"_id": 0}).to_list(1000)
    
    edificio_stats = []
    for edificio in edificios:
        equipment_in_edificio = []
        
        # 1. Find all locations in this edificio
        locations = await db.locations.find({"edificio": edificio["nombre"]}, {"_id": 0}).to_list(1000)
        location_names = [f"{loc['edificio']} - {loc['piso']} - {loc['salon_aula']}" for loc in locations]
        
        # Count equipment in these locations
        for loc_name in location_names:
            equip_list = await db.equipment.find({"ubicacion": loc_name}, {"_id": 0}).to_list(1000)
            equipment_in_edificio.extend(equip_list)
        
        # 2. Find all departments in this edificio (by their ubicacion_id)
        # Get location IDs for this edificio
        location_ids = [loc["id"] for loc in locations]
        
        # Find departments located in this edificio
        departments_in_edificio = await db.departments.find(
            {"ubicacion_id": {"$in": location_ids}}, 
            {"_id": 0}
        ).to_list(1000)
        
        department_names = [dept["nombre"] for dept in departments_in_edificio]
        
        # Count equipment assigned to these departments
        for dept_name in department_names:
            equip_list = await db.equipment.find({"departamento": dept_name}, {"_id": 0}).to_list(1000)
            # Avoid duplicates: only add if not already counted by location
            for equip in equip_list:
                if equip not in equipment_in_edificio:
                    equipment_in_edificio.append(equip)
        
        # Count by status
        status_counts = {}
        for equip in equipment_in_edificio:
            status = equip.get("estado_operativo", "")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count by type
        type_counts = {}
        for equip in equipment_in_edificio:
            tipo = equip.get("tipo_bien", "")
            type_counts[tipo] = type_counts.get(tipo, 0) + 1
        
        edificio_stats.append({
            "edificio": edificio["nombre"],
            "total": len(equipment_in_edificio),
            "by_status": status_counts,
            "by_type": type_counts
        })
    
    return edificio_stats

# Tipo Bien Management (Admin and Superadmin only)
@api_router.get("/tipos-bien", response_model=List[TipoBien])
async def get_tipos_bien(current_user: dict = Depends(get_current_user)):
    """Get all tipos bien (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver tipos de bien")
    
    tipos = await db.tipos_bien.find({}, {"_id": 0}).to_list(1000)
    for tipo in tipos:
        if isinstance(tipo.get("created_at"), str):
            tipo["created_at"] = datetime.fromisoformat(tipo["created_at"])
        if isinstance(tipo.get("updated_at"), str):
            tipo["updated_at"] = datetime.fromisoformat(tipo["updated_at"])
    return tipos

@api_router.post("/tipos-bien", response_model=TipoBien)
async def create_tipo_bien(
    tipo_data: TipoBienCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new tipo bien (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear tipos de bien")
    
    # Check if tipo already exists
    existing_tipo = await db.tipos_bien.find_one({"nombre": tipo_data.nombre})
    if existing_tipo:
        raise HTTPException(status_code=400, detail="Este tipo de bien ya existe")
    
    tipo_obj = TipoBien(nombre=tipo_data.nombre)
    doc = tipo_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.tipos_bien.insert_one(doc)
    return tipo_obj

@api_router.put("/tipos-bien/{tipo_id}", response_model=TipoBien)
async def update_tipo_bien(
    tipo_id: str,
    tipo_data: TipoBienUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a tipo bien (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar tipos de bien")
    
    # Check if tipo exists
    existing_tipo = await db.tipos_bien.find_one({"id": tipo_id}, {"_id": 0})
    if not existing_tipo:
        raise HTTPException(status_code=404, detail="Tipo de bien no encontrado")
    
    # Check if new name already exists
    if tipo_data.nombre and tipo_data.nombre != existing_tipo["nombre"]:
        name_check = await db.tipos_bien.find_one({"nombre": tipo_data.nombre})
        if name_check:
            raise HTTPException(status_code=400, detail="Este tipo de bien ya existe")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if tipo_data.nombre:
        update_data["nombre"] = tipo_data.nombre
    
    await db.tipos_bien.update_one({"id": tipo_id}, {"$set": update_data})
    
    # Return updated tipo
    updated_tipo = await db.tipos_bien.find_one({"id": tipo_id}, {"_id": 0})
    if isinstance(updated_tipo.get("created_at"), str):
        updated_tipo["created_at"] = datetime.fromisoformat(updated_tipo["created_at"])
    if isinstance(updated_tipo.get("updated_at"), str):
        updated_tipo["updated_at"] = datetime.fromisoformat(updated_tipo["updated_at"])
    return updated_tipo

@api_router.delete("/tipos-bien/{tipo_id}")
async def delete_tipo_bien(
    tipo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a tipo bien (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar tipos de bien")
    
    # Check if tipo is being used by equipment
    equipment_count = await db.equipment.count_documents({"tipo_bien": {"$regex": f".*{tipo_id}.*"}})
    if equipment_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar el tipo de bien porque está siendo usado por equipos")
    
    result = await db.tipos_bien.delete_one({"id": tipo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tipo de bien no encontrado")
    
    return {"message": "Tipo de bien eliminado exitosamente"}

# Marca Management (Admin and Superadmin only)
@api_router.get("/marcas", response_model=List[Marca])
async def get_marcas(current_user: dict = Depends(get_current_user)):
    """Get all marcas (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver marcas")
    
    marcas = await db.marcas.find({}, {"_id": 0}).to_list(1000)
    for marca in marcas:
        if isinstance(marca.get("created_at"), str):
            marca["created_at"] = datetime.fromisoformat(marca["created_at"])
        if isinstance(marca.get("updated_at"), str):
            marca["updated_at"] = datetime.fromisoformat(marca["updated_at"])
    return marcas

@api_router.post("/marcas", response_model=Marca)
async def create_marca(
    marca_data: MarcaCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new marca (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear marcas")
    
    # Check if marca already exists
    existing_marca = await db.marcas.find_one({"nombre": marca_data.nombre})
    if existing_marca:
        raise HTTPException(status_code=400, detail="Esta marca ya existe")
    
    marca_obj = Marca(nombre=marca_data.nombre)
    doc = marca_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.marcas.insert_one(doc)
    return marca_obj

@api_router.put("/marcas/{marca_id}", response_model=Marca)
async def update_marca(
    marca_id: str,
    marca_data: MarcaUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a marca (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar marcas")
    
    # Check if marca exists
    existing_marca = await db.marcas.find_one({"id": marca_id}, {"_id": 0})
    if not existing_marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    # Check if new name already exists
    if marca_data.nombre and marca_data.nombre != existing_marca["nombre"]:
        name_check = await db.marcas.find_one({"nombre": marca_data.nombre})
        if name_check:
            raise HTTPException(status_code=400, detail="Esta marca ya existe")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if marca_data.nombre:
        update_data["nombre"] = marca_data.nombre
    
    await db.marcas.update_one({"id": marca_id}, {"$set": update_data})
    
    # Return updated marca
    updated_marca = await db.marcas.find_one({"id": marca_id}, {"_id": 0})
    if isinstance(updated_marca.get("created_at"), str):
        updated_marca["created_at"] = datetime.fromisoformat(updated_marca["created_at"])
    if isinstance(updated_marca.get("updated_at"), str):
        updated_marca["updated_at"] = datetime.fromisoformat(updated_marca["updated_at"])
    return updated_marca

@api_router.delete("/marcas/{marca_id}")
async def delete_marca(
    marca_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a marca (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar marcas")
    
    # Check if marca is being used by equipment
    equipment_count = await db.equipment.count_documents({"marca": {"$regex": f".*{marca_id}.*"}})
    if equipment_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar la marca porque está siendo usada por equipos")
    
    result = await db.marcas.delete_one({"id": marca_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    return {"message": "Marca eliminada exitosamente"}

# Edificio Management (Admin and Superadmin only)
@api_router.get("/edificios", response_model=List[Edificio])
async def get_edificios(current_user: dict = Depends(get_current_user)):
    """Get all edificios (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver edificios")
    
    edificios = await db.edificios.find({}, {"_id": 0}).to_list(1000)
    for edificio in edificios:
        if isinstance(edificio.get("created_at"), str):
            edificio["created_at"] = datetime.fromisoformat(edificio["created_at"])
        if isinstance(edificio.get("updated_at"), str):
            edificio["updated_at"] = datetime.fromisoformat(edificio["updated_at"])
    return edificios

@api_router.post("/edificios", response_model=Edificio)
async def create_edificio(
    edificio_data: EdificioCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new edificio (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear edificios")
    
    # Check if edificio already exists
    existing_edificio = await db.edificios.find_one({"nombre": edificio_data.nombre})
    if existing_edificio:
        raise HTTPException(status_code=400, detail="Este edificio ya existe")
    
    edificio_obj = Edificio(
        nombre=edificio_data.nombre,
        direccion=edificio_data.direccion or ""
    )
    doc = edificio_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.edificios.insert_one(doc)
    return edificio_obj

@api_router.put("/edificios/{edificio_id}", response_model=Edificio)
async def update_edificio(
    edificio_id: str,
    edificio_data: EdificioUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an edificio (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar edificios")
    
    # Check if edificio exists
    existing_edificio = await db.edificios.find_one({"id": edificio_id}, {"_id": 0})
    if not existing_edificio:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    
    # Check if new name already exists
    if edificio_data.nombre and edificio_data.nombre != existing_edificio["nombre"]:
        name_check = await db.edificios.find_one({"nombre": edificio_data.nombre})
        if name_check:
            raise HTTPException(status_code=400, detail="Este edificio ya existe")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if edificio_data.nombre:
        update_data["nombre"] = edificio_data.nombre
    if edificio_data.direccion is not None:
        update_data["direccion"] = edificio_data.direccion
    
    await db.edificios.update_one({"id": edificio_id}, {"$set": update_data})
    
    # Return updated edificio
    updated_edificio = await db.edificios.find_one({"id": edificio_id}, {"_id": 0})
    if isinstance(updated_edificio.get("created_at"), str):
        updated_edificio["created_at"] = datetime.fromisoformat(updated_edificio["created_at"])
    if isinstance(updated_edificio.get("updated_at"), str):
        updated_edificio["updated_at"] = datetime.fromisoformat(updated_edificio["updated_at"])
    return updated_edificio

@api_router.delete("/edificios/{edificio_id}")
async def delete_edificio(
    edificio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an edificio (admin and superadmin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar edificios")
    
    # Check if edificio is being used by locations
    location_count = await db.locations.count_documents({"edificio": {"$regex": f".*{edificio_id}.*"}})
    if location_count > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar el edificio porque está siendo usado por ubicaciones")
    
    result = await db.edificios.delete_one({"id": edificio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    
    return {"message": "Edificio eliminado exitosamente"}

# User Management (Superadmin only)
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede ver usuarios")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede eliminar usuarios")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario eliminado exitosamente"}

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede editar usuarios")
    
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Check if email is already taken by another user
    if user_data.email != existing_user["email"]:
        email_check = await db.users.find_one({"email": user_data.email})
        if email_check:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Prepare update data
    update_data = {
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update password if provided
    if user_data.password:
        update_data["password"] = get_password_hash(user_data.password)
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Return updated user (without password)
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated_user

@api_router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el superadmin puede restablecer contraseñas")
    
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Generate a default password (you can customize this)
    default_password = "TempPass123!"
    hashed_password = get_password_hash(default_password)
    
    # Update the user's password
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Contraseña restablecida a: {default_password}"}

# Include router
app.include_router(api_router)

# Enhanced CORS configuration with fallback
allowed_origins = [
    "https://siriu.netlify.app",  # Production frontend
    "https://siriu-backend.onrender.com",  # Backend domain
    "http://localhost:3000",  # Local development
    "http://localhost:3001",  # Alternative local port
    "http://127.0.0.1:3000",  # Local IP
    "null"  # For local file testing
]

# Add any additional origins from environment variable
env_origins = os.environ.get('CORS_ORIGINS', '').strip()
if env_origins:
    for origin in env_origins.split(','):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in allowed_origins:
            allowed_origins.append(clean_origin)

logger.info(f"CORS Origins configured: {allowed_origins}")

# Custom CORS middleware for flexible origin handling
class FlexibleCORSMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] in ["OPTIONS", "GET", "POST", "PUT", "DELETE"]:
            # Handle CORS preflight
            if scope["method"] == "OPTIONS":
                headers = [
                    (b"access-control-allow-origin", b"*"),
                    (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, OPTIONS"),
                    (b"access-control-allow-headers", b"*")
                ]
                await send({
                    "type": "http.response.start",
                    "status": 200,
                    "headers": headers
                })
                await send({"type": "http.response.body", "body": b""})
                return
            
            # Add CORS headers to regular responses
            async def send_with_cors(message):
                if message["type"] == "http.response.start":
                    headers = message.get("headers", [])
                    headers.extend([
                        (b"access-control-allow-origin", b"*"),
                        (b"access-control-allow-credentials", b"true")
                    ])
                    message["headers"] = headers
                await send(message)
            
            await self.app(scope, receive, send_with_cors)
        else:
            await self.app(scope, receive, send)

# Apply flexible CORS for development/testing
if os.getenv("ENVIRONMENT", "production") != "production":
    app.add_middleware(FlexibleCORSMiddleware)
else:
    # Production CORS with specific origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check endpoints for cloud platforms
@app.get("/")
async def root():
    """Root endpoint"""
    return {"status": "ok", "message": "SIRIU API is running", "version": "1.0.0", "cors_origins": allowed_origins}

@app.options("/api/auth/login")
async def login_preflight():
    """Explicit CORS preflight handler for login endpoint"""
    return {"message": "CORS preflight accepted"}

@app.get("/debug/cors-info")
async def cors_debug_info():
    """Debug endpoint to check CORS configuration"""
    return {
        "configured_origins": allowed_origins,
        "environment_origins": os.environ.get('CORS_ORIGINS', 'Not set'),
        "current_time": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring services"""
    try:
        # Test database connection
        if USE_FIRESTORE:
            # Firestore health check
            await db.users.limit(1).get()
        else:
            # MongoDB health check
            await db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return await health_check()

@app.on_event("startup")
async def startup_event():
    # Create default superadmin if not exists
    existing_superadmin = await db.users.find_one({"role": "superadmin"})
    if not existing_superadmin:
        superadmin = User(
            email="admin@universidad.edu",
            name="Super Administrador",
            role="superadmin"
        )
        doc = superadmin.model_dump()
        doc["password"] = get_password_hash("admin123")
        doc["created_at"] = doc["created_at"].isoformat()
        await db.users.insert_one(doc)
        logger.info("Superadmin creado: admin@universidad.edu / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    if not USE_FIRESTORE:
        client.close()