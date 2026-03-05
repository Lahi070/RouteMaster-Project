import urllib.request, json, urllib.error
try:
    req = urllib.request.Request('http://localhost:8000/api/v1/auth/register', data=json.dumps({'email': 'test5@test.com', 'username': 'testuser5', 'password': 'password123', 'full_name': 'Test User'}).encode(), headers={'Content-Type': 'application/json'})
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
except Exception as e:
    print(str(e))
