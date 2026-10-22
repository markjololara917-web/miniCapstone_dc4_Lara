# ClassReady — Classroom Readiness Monitoring and Issue Reporting System

**Student:** Markjolo Lara  
**Program/Section:** BSIT 3 – Section 2

## 1. Theme Description

ClassReady is a web-based system designed to monitor classroom readiness, report facility problems, and track issue resolution. It helps teachers and administrators manage classroom inspections and facility concerns in one system.

## 2. Features

- User login and registration
- Role-based access for Admin, Temporary Admin, and Teacher
- Classroom management and readiness monitoring
- Facility issue reporting
- Issue assignment and status tracking
- Dashboard statistics
- Search, filtering, and pagination

## 3. Technology Stack

- **Frontend:** React and Vite
- **Backend:** Laravel REST API
- **Database:** MySQL/MariaDB
- **Authentication:** Laravel Sanctum

## 4. Installation and Setup

### Backend

1. Open a terminal and navigate to the `backend` folder.
2. Install dependencies:

   `composer install`

3. Copy `.env.example` to `.env`.
4. Configure your database credentials in `.env`.
5. Generate the application key:

   `php artisan key:generate`

6. Run migrations and seeders:

   `php artisan migrate --seed`

7. Start the Laravel server:

   `php artisan serve`

### Frontend

1. Open another terminal in the `frontend` folder.
2. Install dependencies:

   `npm install`

3. Start the development server:

   `npm run dev`

4. Open the local URL displayed in the terminal.

## 5. Demo Account Credentials

Use the accounts configured in the database seeder.

| Role | Email | Password |
|---|---|---|
| Admin | Use the actual seeded admin account | Use its seeded password |
| Teacher | Use the actual seeded teacher account | Use its seeded password |

**Note:** Replace these placeholders with the actual development credentials and verify that both accounts can log in.

## 6. Documentation

- ERD: https://docs.google.com/document/d/1owyvWOKBaePVdzSI1t8czvRudCUzo9ycc_PCZGUZFwY/edit?usp=sharing
- API Documentation: https://docs.google.com/document/d/1951TzLbNjhhmc5DPz62yB3af928djh-pe5DA18JHj0g/edit?usp=sharing
- Screenshots: https://docs.google.com/document/d/1bMtK1y5_Bh8gIJQxSzTx9ECvGgrq2RyfaC3G9dl53iI/edit?tab=t.0

## 7. Demo Video

**Video Link:**.
