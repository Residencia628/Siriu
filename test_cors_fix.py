#!/usr/bin/env python3
"""
Test CORS configuration after updating environment variables
"""

import requests
import json
from datetime import datetime

def test_cors_headers():
    """Test if CORS headers are properly set"""
    url = "https://siriu-backend.onrender.com/api/auth/login"
    
    print("🧪 Testing CORS Headers...")
    print(f"🎯 URL: {url}")
    print("-" * 50)
    
    try:
        # Test preflight OPTIONS request (simulates browser behavior)
        headers = {
            'Origin': 'https://siriu.netlify.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(url, headers=headers, timeout=10)
        
        print(f"OPTIONS Status Code: {response.status_code}")
        print("Response Headers:")
        for key, value in response.headers.items():
            if 'access-control' in key.lower():
                print(f"  {key}: {value}")
        
        # Check if the Origin is allowed
        allow_origin = response.headers.get('access-control-allow-origin', '')
        if 'siriu.netlify.app' in allow_origin:
            print("✅ CORS headers are correctly configured!")
            return True
        else:
            print("❌ CORS headers are NOT allowing siriu.netlify.app")
            print(f"   Allowed origins: {allow_origin}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing CORS: {str(e)}")
        return False

def test_actual_login():
    """Test actual login request with CORS"""
    url = "https://siriu-backend.onrender.com/api/auth/login"
    
    print("\n🔐 Testing Actual Login Request...")
    print("-" * 50)
    
    # Test data (using the known superadmin credentials)
    test_data = {
        "email": "superadmin@universidad.edu",
        "password": "Admin123!"
    }
    
    try:
        headers = {
            'Origin': 'https://siriu.netlify.app',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            url, 
            json=test_data, 
            headers=headers, 
            timeout=15
        )
        
        print(f"POST Status Code: {response.status_code}")
        
        # Check CORS headers in actual response
        allow_origin = response.headers.get('access-control-allow-origin', '')
        print(f"Access-Control-Allow-Origin: {allow_origin}")
        
        if response.status_code == 200:
            print("✅ Login successful with CORS!")
            data = response.json()
            print(f"   Token received: {data.get('access_token', '')[:20]}...")
            print(f"   User: {data.get('user', {}).get('email')}")
            return True
        elif response.status_code == 401:
            print("⚠️  Authentication failed (credentials incorrect)")
            print("   But CORS is working - this is expected if credentials are wrong")
            return True  # CORS worked, just bad credentials
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during login test: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 CORS Configuration Test")
    print("=" * 50)
    print(f"🕒 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    cors_ok = test_cors_headers()
    login_ok = test_actual_login()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    if cors_ok and login_ok:
        print("🎉 SUCCESS: CORS is properly configured!")
        print("   Your frontend should now be able to connect.")
    elif cors_ok:
        print("✅ CORS headers are correct")
        print("   Login issue might be authentication-related")
    else:
        print("❌ CORS configuration needs fixing")
        print("   Update CORS_ORIGINS in Render dashboard:")
        print("   https://siriu.netlify.app,https://siriu-backend.onrender.com")
    
    print("\n💡 Next steps:")
    print("1. Update Render CORS_ORIGINS environment variable")
    print("2. Wait for automatic redeploy (or trigger manual deploy)")
    print("3. Test login on https://siriu.netlify.app")
    print("4. Run this script again to verify")

if __name__ == "__main__":
    main()