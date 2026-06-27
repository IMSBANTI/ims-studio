# IMS Studio Work Management System

IMS Studio WMS is a custom-built, full-stack, responsive work management platform designed specifically for **IMS Studio** (an experiential design studio). It consolidates project tracking, team management, task planning, daily time logging, monthly productivity analytics, and Business Development (BD) brief tracking into one internal portal.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database Backend**: Prisma ORM with **SQLite** (configured as a single `.db` file for instant local execution without database server configuration)
- **Data Visualizations**: Recharts

---

## 🚀 Setup & Launch Guide

Follow these simple steps to install and run the application locally on your system.

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed (version 18.x or 20.x recommended). You can download it from [nodejs.org](https://nodejs.org/).

### 2. Installation
Open your terminal (PowerShell, Command Prompt, or Bash), navigate to the project directory `ims-studio/`, and execute:
```bash
# Install NPM dependencies
npm install
```

### 3. Database Initialization (Prisma & SQLite)
Initialize the local SQLite database schema and tables:
```bash
# Push database models and generate Prisma client
npx prisma db push
```

### 4. Seed Sample Data
Load pre-populated studio departments, roles, visualizer accounts, sample projects with tasks, time logs, and BD source notes:
```bash
# Run database seed script
npm run db:seed
```

### 5. Launch Development Server
Start the Next.js local server:
```bash
# Run local dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Quick Access Accounts

Use these accounts to test the system according to different user roles:

| Role | Email | Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ims.studio` | `password123` | Can create/edit/delete all data, manage users/roles/depts. |
| **Sr. Studio Manager** | `sr.manager2d@ims.studio` | `password123` | Can create projects, tasks, assign team, view dept reports. |
| **Manager** | `manager2d@ims.studio` | `password123` | Can update project statuses, assign tasks, review progress. |
| **Team Member / Visualizer** | `vis1.2d@ims.studio` | `password123` | Can view assigned tasks, update status, log daily work hours. |
| **BD Representative** | `bd.sarah@ims.studio` | `password123` | Brief overview, BD inputs, client sources logs. |

---

## 🛠️ Switching database to PostgreSQL (Production)

To migrate from SQLite to PostgreSQL:
1. Open [prisma/schema.prisma](file:///C:/Users/ABIR/.gemini/antigravity/scratch/ims-studio/prisma/schema.prisma) and change the database datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Create a `.env` file in the project root containing your connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ims_studio_db?schema=public"
   ```
3. Run migrations and regenerate client:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
