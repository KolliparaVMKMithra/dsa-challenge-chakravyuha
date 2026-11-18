# Chakravyuha DSA Challenge — AWS Production Deployment & Maintenance Guide

This document is the official, complete reference manual for the Chakravyuha DSA Challenge platform in production on AWS. It covers server architecture, deployment details, security guidelines, routine maintenance, and step-by-step procedures for pushing future updates.

---

## 🏛️ 1. Production Architecture Overview

* **Hosting Provider**: Amazon Web Services (AWS Free Tier)
* **AWS Region**: `ap-southeast-2` (Asia Pacific - Sydney)
* **Elastic IP (Static IP)**: `52.64.81.93`
* **Instance Type**: `t3.micro` / `t2.micro` (Ubuntu Server 24.04 LTS)
* **Storage**: `25 GiB` General Purpose SSD (`gp3`) *(Covered under AWS 30 GB Free Tier)*
* **Virtual Memory (Swap)**: `2.0 GiB` Swap file (`/swapfile`) *(Prevents Next.js compile memory freezes)*
* **Domain**: 
  * Main URL: [https://chakravyuha-avv.tech](https://chakravyuha-avv.tech)
  * WWW URL: [https://www.chakravyuha-avv.tech](https://www.chakravyuha-avv.tech)
* **SSL / TLS Encryption**: Automated Let's Encrypt certificate managed by Certbot with automatic HTTP-to-HTTPS redirection.

---

## 🐳 2. Containerized Application Architecture

The platform runs inside isolated Docker containers managed by **Docker Compose**:

| Service | Technology | Internal Port | External Route | Data Persistence |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend`** | Next.js 14 (Node 18 Alpine) | `3000` | `https://chakravyuha-avv.tech/` | Stateless |
| **`backend`** | FastAPI (Python 3.10) | `8000` | `https://chakravyuha-avv.tech/api/` | Stateless |
| **`db`** | PostgreSQL 15 (Alpine) | `5432` | Internal Docker Network only | Docker Volume: `postgres_data` |

### Host Web Server (Nginx Reverse Proxy)
Nginx listens on ports `80` (HTTP) and `443` (HTTPS) on the host machine:
* Any traffic to `/api/` is forwarded internally to `http://localhost:8000/`.
* All other traffic (`/`) is forwarded internally to `http://localhost:3000/`.
* Configuration file location on server: `/etc/nginx/sites-available/chakravyuha`.

---

## 🔑 3. Server Access & SSH

To access the server terminal from your local computer:

1. Open PowerShell on your Windows PC.
2. Navigate to your project directory containing the key:
   ```powershell
   cd "C:\Users\DELL\Documents\Personals\CHAKRAVYUHA\dsa_challenge"
   ```
3. Connect using SSH:
   ```powershell
   ssh -i "chakravyuha-v2-key.pem" ubuntu@52.64.81.93
   ```

*(Note: In Windows, if you ever get a "bad permissions" warning for the `.pem` file, run: `icacls .\chakravyuha-v2-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"`)*

---

## 🚀 4. Automated CI/CD & Deployment Procedures

The repository is equipped with **GitHub Actions CI/CD** (`.github/workflows/deploy.yml`). Any push to the `main` branch automatically deploys changes to your AWS EC2 server without any manual SSH commands!

### 4.1 Automated GitHub Actions Deployment
Whenever you push changes:
```powershell
git add .
git commit -m "Your update message"
git push origin main
```
1. GitHub Actions will trigger automatically on your push.
2. It securely connects to your EC2 instance via SSH.
3. It pulls the latest code from `main`.
4. It rebuilds the updated containers with `docker compose up -d --build`.
5. It cleans dangling build layers to conserve disk space.
6. Your live site updates automatically with zero downtime.

#### Required GitHub Secrets:
Set these once under **GitHub Repository** -> **Settings** -> **Secrets and variables** -> **Actions**:
* **`EC2_HOST`**: `52.64.81.93`
* **`EC2_USER`**: `ubuntu`
* **`EC2_SSH_KEY`**: Complete private key contents of `chakravyuha-v2-key.pem`

---

### 4.2 Manual Deployment Fallback (If Ever Needed)
If you ever want to update the server manually from your terminal:
1. SSH into the server:
   ```powershell
   ssh -i "chakravyuha-v2-key.pem" ubuntu@52.64.81.93
   ```
2. Run inside EC2:
   ```bash
   cd ~/dsa-challenge-chakravyuha
   git pull origin main
   docker compose up -d --build
   ```

---

## 💾 5. Database Backup & Disaster Recovery

### How to Create a Fresh Database Backup (Run Periodic Backups)
Always take a backup before making major database schema changes or running big events:

On the **EC2 Server**:
```bash
# Export a clean PostgreSQL dump from the running database container
docker exec -t dsa-challenge-chakravyuha-db-1 pg_dump -U postgres -d dsa_challenge --clean --if-exists > ~/backup_$(date +%F).sql

# Verify the backup file was created
ls -lh ~/backup_*.sql
```

To download the backup safely to your **local computer**:
In your **local** PowerShell:
```powershell
cd "C:\Users\DELL\Documents\Personals\CHAKRAVYUHA\dsa_challenge"
scp -i "chakravyuha-v2-key.pem" ubuntu@52.64.81.93:~/backup_*.sql ./
```

### How to Restore a Database Backup
If you ever need to restore from a backup file on the server:
```bash
cd ~/dsa-challenge-chakravyuha
cat ~/your_backup_file.sql | docker compose exec -T db psql -U postgres -d dsa_challenge
```

---

## 🛠️ 6. Useful Server & Monitoring Commands

### Check Running Containers
```bash
docker compose ps
```

### View Live Logs
```bash
# View backend FastAPI logs
docker compose logs -f backend

# View frontend Next.js logs
docker compose logs -f frontend

# View database logs
docker compose logs -f db
```

### Check Server Resources (RAM & Disk Space)
```bash
# Check RAM & Swap usage
free -h

# Check hard drive free space
df -h
```

### Restart Services If Needed
```bash
# Restart Docker containers
docker compose restart

# Restart Nginx web server
sudo systemctl restart nginx
```

---

## 🔒 7. Security & Confidential Files Policy

The project `.gitignore` is strictly configured to protect private credentials. **Never remove these rules**:

* **Private Keys (`*.pem`)**: `chakravyuha-v2-key.pem` and `chakravyuha-key.pem` provide root SSH access to your cloud servers. Never push them to GitHub.
* **Environment Files (`.env`, `.env.*`)**: Contains the database password and Power Automate webhook URLs.
* **Database Backups (`*.sql`, `*.db`)**: Contains real student names, roll numbers, emails, phone numbers, and attendance logs.
* **Log Files (`*.log`)**: Debug email and outbox logs contain transient verification codes and credentials.

If you ever need to set new environment variables in production, edit them directly on the server via `nano ~/dsa-challenge-chakravyuha/.env` and run `docker compose up -d`.

