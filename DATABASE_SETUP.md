# Database Setup Guide for GCTU Promotion System

## Option 1: Local MySQL Installation (Recommended for Windows)

### Prerequisites
- Windows 10 or later
- Administrator access

### Step-by-Step Installation

#### A. Download MySQL

1. Visit [MySQL Community Downloads](https://dev.mysql.com/downloads/mysql/)
2. Select **Windows (x86, 64-bit)**
3. Choose **MySQL Server 8.0** (Latest Stable Release)
4. Download the **MSI Installer**

#### B. Install MySQL

1. Run the downloaded `.msi` installer
2. Choose **Setup Type**: Select "Server only" (default)
3. **MySQL Server Configuration**:
   - **Type and Networking**: Keep defaults (TCP/IP, port 3306)
   - **MySQL Server Instance Configuration**: 
     - Config Type: **Development Machine**
     - Server Logging: Enable (recommended)
4. **Accounts and Roles**:
   - MySQL Root Password: **Set a strong password** (save it!)
   - MySQL User Accounts: Add account `promotion_admin` with password
5. Complete the installation

#### C. Verify Installation

```powershell
# Open PowerShell as Administrator
mysql -u root -p

# When prompted, enter your root password
# If successful, you'll see:
# mysql>
```

Then run:
```sql
SELECT VERSION();
-- Output: 8.0.x
EXIT;
```

#### D. Create Database

```powershell
# Using the schema file
Get-Content .\database\schema.sql | mysql -u root -p

# Enter root password when prompted
```

**Verify the database was created:**

```powershell
mysql -u root -p -e "USE lecturer_performance_db; SHOW TABLES;"
```

You should see:
```
+--------------------------------+
| Tables_in_lecturer_performance |
+--------------------------------+
| lecturers                      |
| appraisals                     |
| performance_trends             |
| promotion_history              |
| admin_accounts                 |
+--------------------------------+
```

#### E. Update .env.local

Edit the `.env.local` file in your project:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=lecturer_performance_db
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### F. Start the Application

```powershell
npm run dev:safe
```

The app will now use your real MySQL database!

---

## Option 2: Docker Setup (Most Professional for FYP)

### Why Docker for FYP?

- **Reproducibility**: Same environment everywhere
- **Documentation**: Clear, professional setup
- **Portability**: Runs on any machine with Docker
- **Scalability**: Easy to extend later

### Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

### Quick Start

1. Ensure Docker Desktop is running
2. Place `docker-compose.yml` in your project root
3. Run:

```powershell
docker-compose up -d

# Wait 10 seconds for MySQL to start
Start-Sleep -Seconds 10

# Verify:
docker-compose ps
```

4. Load the database schema:

```powershell
# Get the container ID
$containerId = docker ps -q --filter "ancestor=mysql:8.0"

# Load schema
Get-Content .\database\schema.sql | docker exec -i $containerId mysql -uroot -proot123 lecturer_performance_db
```

5. Update `.env.local` for Docker:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123
DB_NAME=lecturer_performance_db
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

6. Start the app:

```powershell
npm run dev:safe
```

### Cleanup

```powershell
docker-compose down  # Stop containers
docker-compose down -v  # Stop and delete volumes
```

---

## Troubleshooting

### "Access denied for user 'root'@'localhost'"

Make sure:
- `.env.local` uses the correct password
- MySQL is running: `net start MySQL80`
- Try password again (case-sensitive!)

### "Can't connect to MySQL server on 'localhost'"

- Check MySQL service is running:
  ```powershell
  Get-Service MySQL80 | Start-Service
  ```

### "Database 'lecturer_performance_db' doesn't exist"

Run the schema file again:
```powershell
Get-Content .\database\schema.sql | mysql -u root -p lecturer_performance_db
```

---

## For FYP Submission

1. **Document your choice**: Include which option you used in your README
2. **Include setup steps**: Add the exact commands you ran
3. **Provide .env.local template**: Include in `.env.local.example`
4. **Test from clean state**: Delete local-db.json and verify everything works with the real DB

Recommended for submission:
- Use **Option 1 (Local MySQL)** if evaluators have Windows
- Include **Option 2 (Docker)** as alternative
- Document both clearly in SETUP.md or README

