import urllib.request, json, urllib.error
try:
    req = urllib.request.Request('http://localhost:8000/auth/register', data=json.dumps({'email': 'test6@test.com', 'username': 'testuser6', 'password': 'password123', 'full_name': 'Test User'}).encode(), headers={'Content-Type': 'application/json'})
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
except Exception as e:
    print(str(e))
