# Environment Variables Configuration

This document explains all the environment variables needed for the RouteMaster backend.

## 📋 Required Variables

### Application Settings

| Variable         | Description                          | Example                               | Required                |
| ---------------- | ------------------------------------ | ------------------------------------- | ----------------------- |
| `APP_NAME`       | Application name                     | `Sri Lanka Travel Recommendation API` | No (has default)        |
| `DEBUG`          | Enable debug mode (logs SQL queries) | `True` or `False`                     | No (default: False)     |
| `DATA_FILE_PATH` | Path to travel data JSON file        | `data.json`                           | No (default: data.json) |

### Database Configuration

| Variable       | Description                      | Example                                            | Required |
| -------------- | -------------------------------- | -------------------------------------------------- | -------- |
| `DATABASE_URL` | MySQL database connection string | `mysql+pymysql://user:password@host:port/database` | **YES**  |

**Database URL Format:**

```
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Examples:**

- Local: `mysql+pymysql://root:password123@localhost:3306/routemaster_db`
- Remote: `mysql+pymysql://admin:securepass@192.168.1.100:3306/routemaster_db`

### Security & JWT Configuration

| Variable                      | Description                                     | Example                                        | Required            |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------- | ------------------- |
| `SECRET_KEY`                  | Secret key for JWT token signing (min 32 chars) | `super-secret-key-change-in-production-123456` | **YES**             |
| `ALGORITHM`                   | JWT signing algorithm                           | `HS256`                                        | No (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes                | `30`                                           | No (default: 30)    |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token lifetime in days                  | `30`                                           | No (default: 30)    |

**🔐 Security Notes:**

- **SECRET_KEY**: Generate a random 256-bit key. Use `openssl rand -hex 32` to generate one.
- Never commit the `.env` file to version control
- Use different keys for development and production
- In production, set `DEBUG=False`

### CORS Settings

| Variable          | Description                                      | Example                                       | Required                     |
| ----------------- | ------------------------------------------------ | --------------------------------------------- | ---------------------------- |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:3000,http://localhost:5173` | No (default: localhost:3000) |

**Examples:**

- Development: `http://localhost:3000,http://localhost:5173`
- Production: `https://routemaster.com,https://www.routemaster.com`

## 🔧 Setup Instructions

### 1. Copy the example file

```bash
cp .env .env.local  # Or just edit .env directly
```

### 2. Update Required Variables

**Must configure:**

1. **DATABASE_URL** - Update with your MySQL credentials
2. **SECRET_KEY** - Generate a secure random key

**Generate a secure SECRET_KEY:**

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. MySQL Setup

Make sure your MySQL database exists:

```sql
CREATE DATABASE routemaster_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Update DATABASE_URL

Replace in `.env`:

```env
DATABASE_URL=mysql+pymysql://YOUR_USERNAME:YOUR_PASSWORD@localhost:3306/routemaster_db
```

**Common MySQL usernames:**

- `root` (default on most systems)
- `admin` (on some cloud services)

**Finding your MySQL port:**

- Default: `3306`
- Check with: `mysql -e "SHOW VARIABLES LIKE 'port';"`

## ✅ Verification

After configuring `.env`, test the connection:

```bash
# Activate virtual environment
source venv/bin/activate

# Initialize database tables
python init_db.py

# Run the application
uvicorn main:app --reload
```

If configuration is correct, you should see:

- ✅ Database tables created successfully
- Server running at http://localhost:8000

## 🚨 Common Issues

### Issue: "Access denied for user"

**Solution:** Check MySQL username and password in `DATABASE_URL`

### Issue: "Unknown database 'routemaster_db'"

**Solution:** Create the database first:

```bash
mysql -u root -p -e "CREATE DATABASE routemaster_db;"
```

### Issue: "Can't connect to MySQL server"

**Solution:**

- Verify MySQL is running: `mysql --version` or `brew services list`
- Check the port (default: 3306)
- Check host (use `localhost` or `127.0.0.1`)

### Issue: Token validation errors

**Solution:** Ensure `SECRET_KEY` is at least 32 characters long

## 📝 Example .env File

```env
# Application Settings
APP_NAME=Sri Lanka Travel Recommendation API
DEBUG=True

# Database Configuration
DATABASE_URL=mysql+pymysql://root:mypassword@localhost:3306/routemaster_db

# Security & JWT Configuration
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Data File
DATA_FILE_PATH=data.json
```
