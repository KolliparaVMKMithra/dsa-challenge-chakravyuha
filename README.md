# Chakravyuha — Daily DSA Challenge Platform

Welcome to the **Chakravyuha Daily DSA Challenge Platform**! This repository hosts a customized web application designed for managing topic-wise problem sheets, monitoring daily attendance, and maintaining super-admin oversight with a premium Mahabharata battlefield aesthetic.

---

## 🏛️ Project Architecture
The platform is organized into two core layers:
* **`backend/`**: FastAPI (Python) server handling SQLite auto-migration, JWT authentication, OpenPyXL styled Excel exports, and real-time validations.
* **`frontend/`**: Next.js 14 client built with Next App Router, Lucide icons, custom responsive dashboards, and camera QR scanning overlays.

---

## 🚀 Port Assignments & URL Addresses

* **Client Application**: `http://localhost:3000` (Web UI interface)
* **Backend API Gateway**: `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`)

---

## 🔒 Platform Credentials

To ensure a clean dashboard for user testing, **all mock student data and registration logs have been cleared**. The database is initialized with the following production admin accounts:

### 1. Scan Admins (Access restricted to Scanner page `/admin/scan` only)
* **Passcode (Common for all)**: `scan@admin321`
* **Supported Login Usernames / Emails**:
  * `satya_shivani` (or `satya_shivani@chakravyuha.edu`)
  * `rithvik` (or `rithvik@chakravyuha.edu`)
  * `pranavi` (or `pranavi@chakravyuha.edu`)
  * `akhila` (or `akhila@chakravyuha.edu`)
  * `lalith_aditya` (or `lalith_aditya@chakravyuha.edu`)
  * `gayatri` (or `gayatri@chakravyuha.edu`)
  * `karthik` (or `karthik@chakravyuha.edu`)

### 2. Super Admins (Full platform access: `/admin/super` & `/admin/scan`)
* **Passcode (Common for all)**: `super@admin321`
* **Supported Login Usernames / Emails**:
  * `mithra` (or `mithra@chakravyuha.edu`)
  * `rudrabhishek` (or `rudrabhishek@chakravyuha.edu`)
  * `hari_kiran` (or `hari_kiran@chakravyuha.edu`)
  * `krishna` (or `krishna@chakravyuha.edu`)
  * `maneesh` (or `maneesh@chakravyuha.edu`)
  * `sindhuja` (or `sindhuja@chakravyuha.edu`)
  * `ganesh` (or `ganesh@chakravyuha.edu`)

---

## 🛠️ Step-by-Step Setup Guide

### 1. Backend Server Setup
From the repository root, execute the following commands in your shell:
```bash
# Navigate to the backend directory
cd backend

# Activate the virtual environment
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server using Uvicorn
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Next.js Client Setup
Open a separate terminal window and run:
```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Spin up the Next.js development client
npm run dev
```

---

## 🌟 Premium Features Summary

### 1. Direct-URL Inline Auth Prompts
Administrators bookmarking or navigating directly to `/admin/scan` or `/admin/super` will not be kicked back to the landing page. Instead, they will be greeted with an inline **"Authentication Required"** form. Entering correct credentials immediately unlocks the view.

### 2. Multi-Scanner Real-Time Synchronization
Attendance record cards automatically poll the server every **3 seconds**. When multiple Scan Admins scan students on different devices, the checked-in table logs refresh in real-time across all active dashboard displays.

### 3. Scan Admin CRUD Directory (Super Admin Only)
Super Admins can manage (register/remove) scanner roles from a dedicated **"Scan Admins"** dashboard tab. Adding a scanner admin automatically hashes their passwords and generates a secure scanner key.

### 4. Audio Beep Synthesizer
Webcam QR scans utilize the browser `AudioContext` API to generate distinct frequencies (high-pitch success beep, low-pitch error buzz) to confirm check-ins without loading heavy media files.

### 5. Styled openpyxl Excel Reports
Super Admins can download high-fidelity spreadsheets containing student progress summaries. These spreadsheets are custom styled with corporate gold `#8C7030` header fills, font hierarchies, bordered cells, and auto-scaled columns.

### 6. Live Validation Checks
* **Domain Check**: Blocks public email providers (gmail, yahoo, outlook) to enforce institutional student email registrations.
* **Format Regex**: Student roll numbers are validated on the fly against formats like `AV.SC.U4CSE23233` (allowing periods).

---

## ⚡ Power Automate Webhook Integration (Step-by-Step)

Follow these instructions to configure Microsoft Power Automate to dynamically construct and deliver a beautiful HTML email containing the warrior's registration QR code immediately upon signup.

### Step 1: Create the Flow Trigger
1. Log in to [Power Automate](https://make.powerautomate.com/).
2. Select **Create** -> **Instant cloud flow**.
3. Skip the dialog and select the **"When an HTTP request is received"** trigger.
4. Set the trigger to use the **POST** method (found under Show Advanced Options).
5. In the **"Request Body JSON Schema"**, paste the following schema structure:
```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string" },
    "full_name": { "type": "string" },
    "roll_number": { "type": "string" },
    "qr_key": { "type": "string" },
    "qr_image_url": { "type": "string" }
  }
}
```

### Step 2: Add Email Dispatch Action
1. Click **+ Next Step** and search for **"Send an email (V2) - Office 365 Outlook"** (or Gmail connector if using public SMTP).
2. Configure the action properties:
   * **To**: Click **"Add dynamic content"** and select the `email` property.
   * **Subject**: `🛡️ Chakravyuha DSA Challenge — Your Warrior QR Code`
   * **Body**: Click the **"Code View"** button `</>` in the text editor and insert the styled HTML template below:
```html
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #0c0a09; color: #e4e4e7; padding: 40px 30px; border: 1px solid #c5a059; border-radius: 8px;">
  <h1 style="color: #d4af37; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-family: 'Georgia', serif; font-size: 28px; margin-bottom: 5px;">CHAKRAVYUHA</h1>
  <p style="text-align: center; font-size: 10px; text-transform: uppercase; color: #a1a1aa; letter-spacing: 3px; margin-top: 0; margin-bottom: 25px;">Daily DSA Challenge Battlefield</p>
  <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;" />
  
  <p style="font-size: 14px; line-height: 1.6;">Hail Warrior <strong>@{triggerBody()?['full_name']}</strong>,</p>
  <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">Your registration is successful. Below are your unique battlefield credentials:</p>
  
  <div style="background-color: #1c1917; border-left: 3px solid #d4af37; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <table style="width: 100%; font-size: 13px; color: #e4e4e7; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 0; font-weight: bold; width: 120px; color: #c5a059;">Roll Number:</td>
        <td style="padding: 4px 0; font-family: monospace;">@{triggerBody()?['roll_number']}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold; color: #c5a059;">College Email:</td>
        <td style="padding: 4px 0;">@{triggerBody()?['email']}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold; color: #c5a059;">Battlefield Key:</td>
        <td style="padding: 4px 0; font-family: monospace; color: #38bdf8;">@{triggerBody()?['qr_key']}</td>
      </tr>
    </table>
  </div>
  
  <p style="font-size: 14px; line-height: 1.6; text-align: center; color: #a1a1aa; margin-top: 30px;">
    Your Permanent Attendance QR Code Credential:
  </p>
  <p style="text-align: center; margin: 20px 0;">
    <img src="@{triggerBody()?['qr_image_url']}" alt="Warrior QR Code" style="border: 4px solid #c5a059; border-radius: 6px; background-color: #ffffff; padding: 12px; width: 200px; height: 200px;" />
  </p>
  
  <p style="font-size: 12px; font-style: italic; color: #71717a; text-align: center; margin-top: 30px;">
    Present this QR Code daily at the battlefield scanner to record your attendance check-in.
  </p>
</div>
```
3. Save the flow. Copy the newly generated **"HTTP POST URL"** from the trigger.

### Step 3: Link FastAPI to the Webhook URL
To make the backend invoke your flow:
1. In your local backend server environment, configure the following environment variable with the copied URL:
   * **Windows Powershell**:
     ```powershell
     $env:POWER_AUTOMATE_SIGNUP_WEBHOOK_URL="PASTE_YOUR_POWER_AUTOMATE_HTTP_POST_URL_HERE"
     ```
2. Restart the FastAPI server. New sign-up operations will now immediately trigger the webhook and deliver the formatted email!

---

## ☁️ Azure Cloud Deployment Guide

Follow these details to deploy the platform to Azure without configurations mistakes.

### 1. Backend: FastAPI (Azure App Service - Linux Python)
* **Python Runtime**: Python 3.10+
* **Azure App Service Startup Command**:
  Configure this under **Settings** -> **Configuration** -> **General Settings** -> **Startup Command**:
  ```bash
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
  ```
* **Required Environment Variables**:
  Configure these in **Configuration** -> **Application Settings**:
  * `DATABASE_URL`: Set to your Azure Database for PostgreSQL connection string. If omitted, the app automatically falls back to hosting via SQLite.
  * `POWER_AUTOMATE_SIGNUP_WEBHOOK_URL`: The HTTP POST URL copied from your Power Automate flow.

### 2. Frontend: Next.js (Azure App Service - Linux Node or Static Web Apps)
* **Node Runtime**: Node.js 18+
* **Required Build-time Environment Variables**:
  * `NEXT_PUBLIC_API_URL`: Set this to the public URL of your deployed backend service (e.g. `https://your-backend.azurewebsites.net`). The API client resolves this dynamically.


