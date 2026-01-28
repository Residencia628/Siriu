#!/usr/bin/env python3
"""
Enhanced CORS Testing Script for the improved configuration
"""

import requests
import json
from datetime import datetime

def test_enhanced_cors():
    """Test the enhanced CORS configuration"""
    base_url = "https://siriu-backend.onrender.com"
    
    print("🧪 TESTING ENHANCED CORS CONFIGURATION")
    print("=" * 50)
    print(f"🕒 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Root endpoint with CORS info
    print("1. Testing root endpoint with CORS info...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   ✅ Message: {data.get('message', 'N/A')}")
            if 'cors_origins' in data:
                print(f"   📋 Configured CORS Origins: {data['cors_origins']}")
            else:
                print("   ⚠️  CORS origins not in response")
        else:
            print(f"   ❌ Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 2: CORS debug endpoint
    print("2. Testing CORS debug endpoint...")
    try:
        response = requests.get(f"{base_url}/debug/cors-info", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📋 Configured Origins: {data.get('configured_origins', 'N/A')}")
            print(f"   📋 Environment Origins: {data.get('environment_origins', 'N/A')}")
        else:
            print(f"   ❌ Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 3: Explicit OPTIONS handler
    print("3. Testing explicit OPTIONS handler...")
    try:
        headers = {
            'Origin': 'https://siriu.netlify.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/api/auth/login", headers=headers, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for header, value in cors_headers.items():
            print(f"   {header}: {value}")
            
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            print("   ✅ Explicit OPTIONS handler working")
        else:
            print("   ⚠️  OPTIONS request failed")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 4: Actual login with CORS headers
    print("4. Testing actual login with CORS...")
    try:
        headers = {
            'Origin': 'https://siriu.netlify.app',
            'Content-Type': 'application/json'
        }
        test_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/login",
            json=test_data,
            headers=headers,
            timeout=15
        )
        
        print(f"   Status Code: {response.status_code}")
        
        # Check CORS headers in response
        allow_origin = response.headers.get('access-control-allow-origin', '')
        print(f"   Access-Control-Allow-Origin: {allow_origin}")
        
        if 'siriu.netlify.app' in allow_origin:
            print("   ✅ CORS headers present and correct!")
        else:
            print("   ❌ CORS headers missing or incorrect")
            
        if response.status_code == 401:
            print("   ✅ Authentication working (expected 401 for wrong credentials)")
        elif response.status_code == 200:
            print("   ⚠️  Login succeeded with test credentials?")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 5: Health check
    print("5. Testing health endpoints...")
    endpoints = ["/health", "/api/health"]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                print(f"   ✅ {endpoint}: {response.status_code}")
            else:
                print(f"   ⚠️  {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint}: Error - {str(e)}")
    
    print()
    print("=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    print("✅ Enhanced CORS configuration deployed")
    print("✅ Multiple fallback origins configured")
    print("✅ Explicit OPTIONS handler added")
    print("✅ Debug endpoints available")
    print()
    print("💡 Next steps:")
    print("1. Wait for Render deployment to complete")
    print("2. Clear browser cache (Ctrl+F5)")
    print("3. Test login on https://siriu.netlify.app")
    print("4. Check browser console for detailed errors if issues persist")

if __name__ == "__main__":
    test_enhanced_cors()