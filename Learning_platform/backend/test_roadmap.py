import requests
import json

base_url = "http://localhost:8000"

def test_api():
    # 1. Signup/Login to get token
    session = requests.Session()
    email = "dbg_test@test.com"
    password = "password"
    
    # Try signup
    res_signup = session.post(f"{base_url}/auth/signup", json={
        "name": "Debug Test", "email": email, "password": password
    })
    
    # Try login
    res_login = session.post(f"{base_url}/auth/login", json={
        "email": email, "password": password
    })
    
    if res_login.status_code != 200:
        print("Login failed!", res_login.text)
        return
        
    token = res_login.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Try generate custom roadmap
    payload = {
        "subject": "Master React",
        "description": "I want to learn react from scratch",
        "duration": "30 Days",
        "num_topics": 30
    }
    
    print("Sending payload:", payload)
    res_generate = session.post(f"{base_url}/roadmap/generate_custom", json=payload, headers=headers)
    print("Response Status:", res_generate.status_code)
    print("Response Body:", res_generate.text)

if __name__ == "__main__":
    test_api()
