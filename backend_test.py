#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for University IT Inventory System
Tests all endpoints with different user roles and validates functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class InventoryAPITester:
    def __init__(self, base_url="https://school-itassets.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.superadmin_token = None
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_equipment_id = None
        self.test_user_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, token: str = None, data: Dict = None, expect_status: int = 200) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expect_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_superadmin_login(self):
        """Test superadmin login"""
        success, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "admin@universidad.edu", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.superadmin_token = response['access_token']
            return self.log_test("Superadmin Login", True, f"- Role: {response.get('user', {}).get('role')}")
        else:
            return self.log_test("Superadmin Login", False, f"- {response}")

    def test_create_admin_user(self):
        """Test creating admin user"""
        admin_data = {
            "email": f"admin_test_{datetime.now().strftime('%H%M%S')}@universidad.edu",
            "name": "Admin Test User",
            "password": "admin123",
            "role": "admin"
        }
        
        success, response = self.make_request(
            'POST', 'auth/register',
            token=self.superadmin_token,
            data=admin_data,
            expect_status=200
        )
        
        if success:
            # Login as admin
            login_success, login_response = self.make_request(
                'POST', 'auth/login',
                data={"email": admin_data["email"], "password": admin_data["password"]}
            )
            if login_success:
                self.admin_token = login_response['access_token']
                return self.log_test("Create Admin User", True, f"- Email: {admin_data['email']}")
        
        return self.log_test("Create Admin User", False, f"- {response}")

    def test_create_regular_user(self):
        """Test creating regular user"""
        user_data = {
            "email": f"user_test_{datetime.now().strftime('%H%M%S')}@universidad.edu",
            "name": "Regular Test User",
            "password": "user123",
            "role": "user"
        }
        
        success, response = self.make_request(
            'POST', 'auth/register',
            token=self.superadmin_token,
            data=user_data,
            expect_status=200
        )
        
        if success:
            # Login as user
            login_success, login_response = self.make_request(
                'POST', 'auth/login',
                data={"email": user_data["email"], "password": user_data["password"]}
            )
            if login_success:
                self.user_token = login_response['access_token']
                self.test_user_id = login_response['user']['id']
                return self.log_test("Create Regular User", True, f"- Email: {user_data['email']}")
        
        return self.log_test("Create Regular User", False, f"- {response}")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.make_request(
            'GET', 'dashboard/stats',
            token=self.superadmin_token
        )
        
        if success and 'total_equipment' in response:
            return self.log_test("Dashboard Stats", True, f"- Total equipment: {response['total_equipment']}")
        else:
            return self.log_test("Dashboard Stats", False, f"- {response}")

    def test_create_equipment(self):
        """Test creating equipment (admin role)"""
        equipment_data = {
            "ubicacion": "Edificio A, Piso 2, Aula 201",
            "resguardante": "Juan Pérez",
            "departamento": "Sistemas",
            "tipo_bien": "computadora",
            "numero_serie": f"TEST{datetime.now().strftime('%H%M%S')}",
            "marca": "Dell",
            "modelo": "OptiPlex 7090",
            "fecha_adquisicion": "2024-01-15",
            "estado_operativo": "disponible",
            "observaciones": "Equipo de prueba para testing"
        }
        
        success, response = self.make_request(
            'POST', 'equipment',
            token=self.admin_token,
            data=equipment_data,
            expect_status=200
        )
        
        if success and 'id' in response:
            self.test_equipment_id = response['id']
            return self.log_test("Create Equipment (Admin)", True, f"- ID: {self.test_equipment_id}")
        else:
            return self.log_test("Create Equipment (Admin)", False, f"- {response}")

    def test_create_equipment_user_forbidden(self):
        """Test that regular users cannot create equipment"""
        equipment_data = {
            "ubicacion": "Test Location",
            "resguardante": "Test User",
            "departamento": "Test Dept",
            "tipo_bien": "computadora",
            "numero_serie": "TESTFORBIDDEN",
            "marca": "Test Brand",
            "modelo": "Test Model",
            "fecha_adquisicion": "2024-01-15",
            "estado_operativo": "disponible"
        }
        
        success, response = self.make_request(
            'POST', 'equipment',
            token=self.user_token,
            data=equipment_data,
            expect_status=403
        )
        
        return self.log_test("Create Equipment (User Forbidden)", success, f"- Status: 403 as expected")

    def test_get_equipment_list(self):
        """Test getting equipment list"""
        success, response = self.make_request(
            'GET', 'equipment',
            token=self.user_token
        )
        
        if success and isinstance(response, list):
            return self.log_test("Get Equipment List", True, f"- Found {len(response)} items")
        else:
            return self.log_test("Get Equipment List", False, f"- {response}")

    def test_get_equipment_detail(self):
        """Test getting equipment detail"""
        if not self.test_equipment_id:
            return self.log_test("Get Equipment Detail", False, "- No test equipment ID available")
        
        success, response = self.make_request(
            'GET', f'equipment/{self.test_equipment_id}',
            token=self.user_token
        )
        
        if success and 'id' in response:
            return self.log_test("Get Equipment Detail", True, f"- Equipment: {response.get('marca')} {response.get('modelo')}")
        else:
            return self.log_test("Get Equipment Detail", False, f"- {response}")

    def test_update_equipment(self):
        """Test updating equipment (admin role)"""
        if not self.test_equipment_id:
            return self.log_test("Update Equipment", False, "- No test equipment ID available")
        
        update_data = {
            "observaciones": "Actualizado durante testing",
            "estado_operativo": "asignado"
        }
        
        success, response = self.make_request(
            'PUT', f'equipment/{self.test_equipment_id}',
            token=self.admin_token,
            data=update_data
        )
        
        if success and 'id' in response:
            return self.log_test("Update Equipment (Admin)", True, f"- Status: {response.get('estado_operativo')}")
        else:
            return self.log_test("Update Equipment (Admin)", False, f"- {response}")

    def test_update_equipment_user_forbidden(self):
        """Test that regular users cannot update equipment"""
        if not self.test_equipment_id:
            return self.log_test("Update Equipment (User Forbidden)", False, "- No test equipment ID available")
        
        update_data = {"observaciones": "Should not work"}
        
        success, response = self.make_request(
            'PUT', f'equipment/{self.test_equipment_id}',
            token=self.user_token,
            data=update_data,
            expect_status=403
        )
        
        return self.log_test("Update Equipment (User Forbidden)", success, "- Status: 403 as expected")

    def test_equipment_history(self):
        """Test getting equipment history"""
        if not self.test_equipment_id:
            return self.log_test("Equipment History", False, "- No test equipment ID available")
        
        success, response = self.make_request(
            'GET', f'history/{self.test_equipment_id}',
            token=self.user_token
        )
        
        if success and isinstance(response, list):
            return self.log_test("Equipment History", True, f"- Found {len(response)} history entries")
        else:
            return self.log_test("Equipment History", False, f"- {response}")

    def test_equipment_filters(self):
        """Test equipment filtering"""
        # Test filter by type
        success, response = self.make_request(
            'GET', 'equipment?tipo_bien=computadora',
            token=self.user_token
        )
        
        if success and isinstance(response, list):
            return self.log_test("Equipment Filters", True, f"- Filtered by type: {len(response)} items")
        else:
            return self.log_test("Equipment Filters", False, f"- {response}")

    def test_equipment_search(self):
        """Test equipment search"""
        success, response = self.make_request(
            'GET', 'equipment?search=Dell',
            token=self.user_token
        )
        
        if success and isinstance(response, list):
            return self.log_test("Equipment Search", True, f"- Search results: {len(response)} items")
        else:
            return self.log_test("Equipment Search", False, f"- {response}")

    def test_export_excel(self):
        """Test Excel export"""
        success, response = self.make_request(
            'GET', 'equipment/export/excel',
            token=self.user_token
        )
        
        # For file downloads, we expect different handling
        if success or (hasattr(response, 'get') and response.get('status_code') == 200):
            return self.log_test("Export Excel", True, "- Export endpoint accessible")
        else:
            return self.log_test("Export Excel", False, f"- {response}")

    def test_export_pdf(self):
        """Test PDF export"""
        success, response = self.make_request(
            'GET', 'equipment/export/pdf',
            token=self.user_token
        )
        
        # For file downloads, we expect different handling
        if success or (hasattr(response, 'get') and response.get('status_code') == 200):
            return self.log_test("Export PDF", True, "- Export endpoint accessible")
        else:
            return self.log_test("Export PDF", False, f"- {response}")

    def test_user_management_list(self):
        """Test user management - list users (superadmin only)"""
        success, response = self.make_request(
            'GET', 'users',
            token=self.superadmin_token
        )
        
        if success and isinstance(response, list):
            return self.log_test("User Management - List", True, f"- Found {len(response)} users")
        else:
            return self.log_test("User Management - List", False, f"- {response}")

    def test_user_management_forbidden(self):
        """Test that regular users cannot access user management"""
        success, response = self.make_request(
            'GET', 'users',
            token=self.user_token,
            expect_status=403
        )
        
        return self.log_test("User Management (User Forbidden)", success, "- Status: 403 as expected")

    def test_delete_equipment_superadmin_only(self):
        """Test that only superadmin can delete equipment"""
        if not self.test_equipment_id:
            return self.log_test("Delete Equipment (Superadmin Only)", False, "- No test equipment ID available")
        
        # First test admin cannot delete
        admin_success, admin_response = self.make_request(
            'DELETE', f'equipment/{self.test_equipment_id}',
            token=self.admin_token,
            expect_status=403
        )
        
        if not admin_success:
            return self.log_test("Delete Equipment (Superadmin Only)", False, "- Admin should be forbidden")
        
        # Now test superadmin can delete
        success, response = self.make_request(
            'DELETE', f'equipment/{self.test_equipment_id}',
            token=self.superadmin_token
        )
        
        if success and 'message' in response:
            return self.log_test("Delete Equipment (Superadmin Only)", True, "- Superadmin can delete")
        else:
            return self.log_test("Delete Equipment (Superadmin Only)", False, f"- {response}")

    def test_delete_user(self):
        """Test deleting user (superadmin only)"""
        if not self.test_user_id:
            return self.log_test("Delete User", False, "- No test user ID available")
        
        success, response = self.make_request(
            'DELETE', f'users/{self.test_user_id}',
            token=self.superadmin_token
        )
        
        if success and 'message' in response:
            return self.log_test("Delete User", True, "- User deleted successfully")
        else:
            return self.log_test("Delete User", False, f"- {response}")

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint"""
        success, response = self.make_request(
            'GET', 'auth/me',
            token=self.superadmin_token
        )
        
        if success and 'email' in response:
            return self.log_test("Auth Me Endpoint", True, f"- User: {response.get('email')}")
        else:
            return self.log_test("Auth Me Endpoint", False, f"- {response}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting University IT Inventory System Backend Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)

        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        if not self.test_superadmin_login():
            print("❌ Cannot proceed without superadmin login")
            return False

        self.test_auth_me_endpoint()
        self.test_create_admin_user()
        self.test_create_regular_user()

        # Dashboard Tests
        print("\n📊 DASHBOARD TESTS")
        self.test_dashboard_stats()

        # Equipment CRUD Tests
        print("\n🖥️ EQUIPMENT CRUD TESTS")
        self.test_create_equipment()
        self.test_create_equipment_user_forbidden()
        self.test_get_equipment_list()
        self.test_get_equipment_detail()
        self.test_update_equipment()
        self.test_update_equipment_user_forbidden()
        self.test_equipment_history()

        # Search and Filter Tests
        print("\n🔍 SEARCH & FILTER TESTS")
        self.test_equipment_filters()
        self.test_equipment_search()

        # Export Tests
        print("\n📄 EXPORT TESTS")
        self.test_export_excel()
        self.test_export_pdf()

        # User Management Tests
        print("\n👥 USER MANAGEMENT TESTS")
        self.test_user_management_list()
        self.test_user_management_forbidden()

        # Permission Tests
        print("\n🔒 PERMISSION TESTS")
        self.test_delete_equipment_superadmin_only()
        self.test_delete_user()

        # Final Results
        print("\n" + "=" * 60)
        print(f"📈 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! Backend is working well.")
        elif success_rate >= 70:
            print("⚠️ Good, but some issues need attention.")
        else:
            print("🚨 Critical issues found. Backend needs fixes.")

        return success_rate >= 70

def main():
    tester = InventoryAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())