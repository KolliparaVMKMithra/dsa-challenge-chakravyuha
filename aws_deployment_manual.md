# Chakravyuha DSA Challenge — Complete AWS Production Deployment Manual

This guide covers step-by-step instructions to configure, deploy, and scale the Chakravyuha DSA Challenge platform on AWS to handle thousands of concurrent students without server errors, database corruption, or service interruption.

---

## 🛠️ Step 1: Secure Network Setup (VPC & Security Groups)
To keep the database secure, it must be hidden in a private network, and the backend must access it privately.

1. **Open the AWS VPC Console**.
2. **Create a Database Security Group**:
   * Go to **Security Groups** -> Click **Create security group**.
   * **Name**: `dsa-rds-sg`
   * **VPC**: Select your default VPC.
   * **Inbound Rules**:
     * Add a rule with Type: **PostgreSQL (5432)**.
     * Set Source to `0.0.0.0/0` (temporary for public testing) or restrict it to your App Runner's VPC connector IP ranges once created (private database rule).
   * **Outbound Rules**: Keep default (All traffic allowed).

---

## 💾 Step 2: Database Provisioning (AWS RDS PostgreSQL)
Create a managed PostgreSQL database that auto-saves, scales, and backs up data automatically.

1. **Go to AWS RDS Console** -> Click **Create database**.
2. **Choose Creation Method**: Standard create.
3. **Engine Options**: **PostgreSQL** (Version 15 or 16).
4. **Templates**: 
   * Select **Free Tier** for testing/low-cost.
   * Select **Production** for production scale (provides multi-AZ replication to ensure database remains online even if an entire AWS data center goes offline).
5. **Settings**:
   * **DB instance identifier**: `dsa-challenge-db`
   * **Master username**: `postgres`
   * **Master password**: Choose a strong password (e.g. `ChakraProdPass99!`).
6. **Instance Configuration**:
   * For thousands of users, select **Burstable classes** -> `db.t3.medium` or higher.
7. **Storage**:
   * **Storage type**: General Purpose SSD (gp3).
   * **Allocated storage**: `20 GiB` minimum.
   * **Enable storage autoscaling**: **Check this** (Max threshold: `100 GiB`). This ensures your database automatically gains storage if students submit thousands of solutions.
8. **Connectivity**:
   * **Virtual private cloud (VPC)**: Select the same VPC as your database security group.
   * **Existing VPC security groups**: Choose the `dsa-rds-sg` created in Step 1.
   * **Public access**: Select **No** (highly recommended for production database security).
9. Click **Create database** (takes 5-10 minutes to provision).
10. Once created, copy the **Endpoint** address (e.g. `dsa-challenge-db.xxxxx.us-east-1.rds.amazonaws.com`).

---

## 🐳 Step 3: Container Registry (AWS ECR Setup)
Upload your backend and frontend Docker containers to AWS ECR (Elastic Container Registry).

1. **Go to AWS ECR Console**.
2. **Create Repositories**:
   * Create a private repository named `dsa-backend`.
   * Create a private repository named `dsa-frontend`.
3. **Push Docker Images to ECR** (Run these commands from your local computer terminal):
   * **Login to ECR**:
     ```bash
     aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
     ```
   * **Build and Push Backend**:
     ```bash
     docker build -t dsa-backend ./backend
     docker tag dsa-backend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/dsa-backend:latest
     docker push your-account-id.dkr.ecr.your-region.amazonaws.com/dsa-backend:latest
     ```
   * **Build and Push Frontend**:
     ```bash
     docker build -t dsa-frontend ./frontend
     docker tag dsa-frontend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/dsa-frontend:latest
     docker push your-account-id.dkr.ecr.your-region.amazonaws.com/dsa-frontend:latest
     ```

---

## ⚡ Step 4: App Service Provisioning (AWS App Runner)
AWS App Runner is recommended because it is fully managed, handles automatic SSL configuration, includes a built-in load balancer, and automatically scales containers up or down based on incoming request volumes.

### 1. Deploy the Backend Service
1. **Go to AWS App Runner Console** -> Click **Create service**.
2. **Source**:
   * Repository type: **Container registry**.
   * Provider: **Amazon ECR**.
   * Container image URI: Browse and select `dsa-backend:latest`.
   * Deployment settings: Select **Automatic** (so new Git pushes to ECR automatically trigger backend deployments).
3. **Service Configuration**:
   * **Service name**: `dsa-backend-service`.
   * **Virtual CPU & Memory**: `1 vCPU & 2 GB Memory`.
   * **Port**: Set to `8000`.
4. **Environment Variables**:
   Add the following variables:
   * `DATABASE_URL`: `postgresql://postgres:ChakraProdPass99!@dsa-challenge-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres` (replace with your RDS endpoint and password).
   * `POWER_AUTOMATE_SIGNUP_WEBHOOK_URL`: Your Microsoft Power Automate HTTP POST URL.
5. **Networking (Crucial for Private RDS Access)**:
   * Under **Networking**, select **Custom VPC**.
   * Click **Add new VPC Connector** -> Select the subnets associated with your RDS database and the `dsa-rds-sg` security group.
   * This gives your backend containers a private gateway to communicate with your RDS database safely.
6. **Auto Scaling**:
   * Create a custom configuration:
     * **Concurrency**: Set to `100` (an instance will spawn a new copy of itself if it handles more than 100 concurrent requests).
     * **Min size**: `1` (or `2` to ensure high availability with zero start-up delay).
     * **Max size**: `10` (scales up to 10 parallel containers to handle thousands of requests).
7. Click **Create & Deploy**. App Runner will deploy the backend and provide a public URL (e.g. `https://xxx.us-east-1.awsapprunner.com`).

---

### 2. Deploy the Frontend Service
1. **Create Service** in App Runner.
2. **Source**: Select ECR image `dsa-frontend:latest` (Automatic deployment).
3. **Service Configuration**:
   * **Service name**: `dsa-frontend-service`.
   * **Virtual CPU & Memory**: `1 vCPU & 2 GB Memory`.
   * **Port**: Set to `3000`.
4. **Environment Variables**:
   * `NEXT_PUBLIC_API_URL`: Your backend App Runner URL (e.g. `https://xxx.us-east-1.awsapprunner.com`).
5. **Auto Scaling**: Same scaling configuration (Min: 1, Max: 10, Concurrency: 100).
6. Click **Create & Deploy**. AWS will build and deliver the live student portal with a pre-configured secure SSL connection (`https://`).

---

## 📈 Step 5: Handling High Traffic Loads Without Server Errors (Production Tuning)
To guarantee the system runs without errors under heavy traffic (e.g. when 1000+ students open the portal at 9:00 AM to submit their daily problem):

1. **Auto-Scaling Configuration**: Make sure you have configured a **Minimum Instance Count of 2** on your production App Runner services. This ensures that if one instance receives a sudden traffic burst, there is already a second hot standby container running to split the load, avoiding 502/504 timeout errors.
2. **RDS Connection Pooling**: Our SQLAlchemy engine is configured with connection pools. In AWS RDS, configure `Max Connections` to handle up to `500+` connections so the database server never rejects requests from scaled-out containers.
3. **Background Tasks**: The FastAPI backend handles webhook calls to Microsoft Power Automate using asynchronous `BackgroundTasks`. This means the server immediately responds to the student's browser with a "success" payload and handles the webhook call in a background thread, ensuring registration pages load in milliseconds.
