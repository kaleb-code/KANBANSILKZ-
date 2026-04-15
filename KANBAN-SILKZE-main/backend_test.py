import requests
import sys
import json
from datetime import datetime

class SilkZeAPITester:
    def __init__(self, base_url="https://web-transform-31.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()  # Use session to maintain cookies
        self.tests_run = 0
        self.tests_passed = 0
        self.created_pedido_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_correct(self):
        """Test login with correct password"""
        success, response = self.run_test(
            "Login with correct password",
            "POST",
            "auth/login",
            200,
            data={"password": "silkze1990"}
        )
        if success and response.get('authenticated'):
            print(f"   Authentication successful via httpOnly cookie")
            return True
        return False

    def test_login_wrong(self):
        """Test login with wrong password"""
        success, response = self.run_test(
            "Login with wrong password",
            "POST",
            "auth/login",
            401,
            data={"password": "wrongpassword"}
        )
        return success

    def test_verify_auth(self):
        """Test auth verification"""
        success, response = self.run_test(
            "Verify authentication",
            "GET",
            "auth/verify",
            200
        )
        return success

    def test_get_pedidos(self):
        """Test getting all pedidos"""
        success, response = self.run_test(
            "Get all pedidos",
            "GET",
            "pedidos",
            200
        )
        if success:
            print(f"   Found {len(response)} pedidos")
        return success

    def test_create_pedido(self):
        """Test creating a new pedido"""
        success, response = self.run_test(
            "Create new pedido",
            "POST",
            "pedidos",
            200,
            data={
                "status": "Orçamento",
                "cliente": "Test Client",
                "material": "Cotton T-shirt"
            }
        )
        if success and 'id' in response:
            self.created_pedido_id = response['id']
            print(f"   Created pedido ID: {self.created_pedido_id}")
            print(f"   Pedido number: {response.get('numero', 'N/A')}")
        return success

    def test_get_pedido(self):
        """Test getting a specific pedido"""
        if not self.created_pedido_id:
            print("❌ No pedido ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get specific pedido",
            "GET",
            f"pedidos/{self.created_pedido_id}",
            200
        )
        if success:
            print(f"   Retrieved pedido: {response.get('cliente', 'N/A')}")
        return success

    def test_update_pedido(self):
        """Test updating a pedido"""
        if not self.created_pedido_id:
            print("❌ No pedido ID available for testing")
            return False
        
        success, response = self.run_test(
            "Update pedido",
            "PUT",
            f"pedidos/{self.created_pedido_id}",
            200,
            data={
                "cliente": "Updated Test Client",
                "status": "Aprovado",
                "material": "Premium Cotton",
                "detalhes": "Updated details"
            }
        )
        return success

    def test_search_pedidos(self):
        """Test searching pedidos"""
        success, response = self.run_test(
            "Search pedidos",
            "GET",
            "pedidos?busca=Test",
            200
        )
        if success:
            print(f"   Search returned {len(response)} results")
        return success

    def test_backup(self):
        """Test backup endpoint"""
        success, response = self.run_test(
            "Create backup",
            "POST",
            "pedidos/backup",
            200
        )
        if success:
            print(f"   Backup contains {len(response.get('pedidos', []))} pedidos")
            print(f"   Backup version: {response.get('versao', 'N/A')}")
        return success

    def test_logout(self):
        """Test logout endpoint"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        if success:
            print(f"   Logout successful")
        return success

    def test_delete_pedido(self):
        """Test deleting a pedido"""
        if not self.created_pedido_id:
            print("❌ No pedido ID available for testing")
            return False
        
        success, response = self.run_test(
            "Delete pedido",
            "DELETE",
            f"pedidos/{self.created_pedido_id}",
            200
        )
        return success

def main():
    print("🚀 Starting SilkZé Kanban API Tests")
    print("=" * 50)
    
    # Setup
    tester = SilkZeAPITester()
    
    # Test sequence
    tests = [
        ("Login with wrong password", tester.test_login_wrong),
        ("Login with correct password", tester.test_login_correct),
        ("Verify authentication", tester.test_verify_auth),
        ("Get all pedidos", tester.test_get_pedidos),
        ("Create new pedido", tester.test_create_pedido),
        ("Get specific pedido", tester.test_get_pedido),
        ("Update pedido", tester.test_update_pedido),
        ("Search pedidos", tester.test_search_pedidos),
        ("Create backup", tester.test_backup),
        ("Delete pedido", tester.test_delete_pedido),
        ("Logout", tester.test_logout),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())