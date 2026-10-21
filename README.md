# Classroom Readiness Monitoring and Issue Reporting System

React + Vite frontend and Laravel 12 REST API backend for classroom inspections and facilities issue tracking.

## Requirements
- PHP 8.2+, Composer
- Node.js and npm
- XAMPP MySQL/MariaDB
- A MySQL database named `classroom_monitoring`

## Backend setup (Windows)
1. Start **MySQL** in XAMPP.
2. In phpMyAdmin, create a database named `classroom_monitoring`.
3. Open a terminal in `MonitoringSystem\backend`.
4. Copy `.env.example` to `.env` if `.env` does not exist. Set:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306`
   - `DB_DATABASE=classroom_monitoring`
   - `DB_USERNAME=root`
   - `DB_PASSWORD=` (empty only if your local XAMPP root account has no password)
5. Run:
   ```bash
   composer install
   php artisan key:generate
   php artisan config:clear
   php artisan migrate --seed
   php artisan serve
   ```
   Keep this terminal open. API runs at `http://127.0.0.1:8000`.

### Demo accounts
- Admin: `admin@classready.test` / `Admin12345!`
- Teacher: `teacher@classready.test` / `Teacher12345!`

These are development-only demo credentials. Change/remove them before any public deployment.

## Frontend setup
Open a second terminal in the project root (`MonitoringSystem`):
```bash
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally `http://localhost:5173`. **Do not use VS Code Live Server for this React/Vite app**; `npm run dev` is required to transform and serve the React source correctly.

## Create an account and sign in
- The login page now has a **Create an account** option.
- Public registration creates a **Teacher** account only; users cannot choose or self-assign the Administrator role.
- Registration validates the name, unique email, password (minimum 8 characters), and matching password confirmation. A token is issued and the new user is signed in automatically.
- API endpoint: `POST /api/register` with JSON fields `name`, `email`, `password`, and `password_confirmation`.

## API authentication token
The login endpoint is `POST http://127.0.0.1:8000/api/login` with JSON:
```json
{ "email": "admin@classready.test", "password": "Admin12345!" }
```
The response includes a `token`. The React frontend stores it for this development app and sends it on protected requests as:
`Authorization: Bearer YOUR_TOKEN_HERE`.

Use `POST /api/logout` with the same Bearer token to revoke the current token. Do not share or commit real tokens or `.env` secrets. A token is not a user's password; it is a credential that grants API access until revoked or expired according to your application's token policy.

## Main API endpoints
- `POST /api/register`, `POST /api/login`, `GET /api/me`, `POST /api/logout`
- `GET|POST /api/classrooms`, `GET|PUT|DELETE /api/classrooms/{id}`
- `GET|POST /api/readiness-checks`, `GET|PUT|DELETE /api/readiness-checks/{id}`
- `GET|POST /api/issue-reports`, `GET|PUT|DELETE /api/issue-reports/{id}`
- Admin only: `GET|POST /api/users`, `PUT|DELETE /api/users/{id}`
- `GET /api/dashboard`

All resources use JSON responses. Lists are paginated. Protected endpoints require a Sanctum Bearer token.

## Important
Never run `php artisan migrate:fresh` against a database containing data you need; it drops tables. For this project, use `php artisan migrate` after reviewing the migration files.


## Role access, assignments, and notifications

- The first screen asks whether you are signing in as an administrator or teacher. Public registration only creates teacher accounts and requires an administrator invite code.
- **Main admin:** manages classrooms, adds/edits/revokes teacher accounts, promotes a teacher to temporary admin, assigns classroom inspections, and manages report status/resolution.
- **Temporary admin:** can review the admin's organization's reports and update status/resolution notes only. They cannot assign reports, edit classrooms, manage users, or revoke teacher access.
- **Teacher:** can view buildings/classrooms and school overview counts, submit issue reports, see their own reports, and see reports specifically assigned to them. They cannot edit classroom records or report status.
- When the main admin assigns a report to a teacher, it appears in that teacher's Assignments notification. The teacher can send a comment on the assignment; the response is visible to the main admin only.
- Teachers cannot browse other teachers' reports. Laravel applies the same access restrictions in the API, not just in the React interface.
- Run `php artisan migrate --seed` in `backend` to create/update the development administrator and initial records. Back up existing data first; do not use `migrate:fresh` on a database you need.

The development administrator is `admin@classready.test` / `Admin12345!`, with initial invite code `CLASSREADY26`. These are local-development credentials only; replace them before deployment.
