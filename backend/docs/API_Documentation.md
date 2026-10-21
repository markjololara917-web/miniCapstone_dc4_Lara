# ClassReady API Documentation

## Bse URL

`http:`a`//127.0.0.1:8000/api`

## Authentication

Protected endpoints require a Bearer token obtained after login.

| Method | Endpoint    | Purpose              |
| ------ | ----------- | -------------------- |
| POST   | `/register` | Register an account  |
| POST   | `/login`    | Log in               |
| POST   | `/logout`   | Log out              |
| GET    | `/user`     | Get the current user |

## Classroom Management

| Method | Endpoint           | Purpose            |
| ------ | ------------------ | ------------------ |
| GET    | `/classrooms`      | View classrooms    |
| POST   | `/classrooms`      | Add a classroom    |
| GET    | `/classrooms/{id}` | View one classroom |
| PUT    | `/classrooms/{id}` | Update a classroom |
| DELETE | `/classrooms/{id}` | Delete a classroom |

## Issue Reports

| Method | Endpoint              | Purpose                |
| ------ | --------------------- | ---------------------- |
| GET    | `/issue-reports`      | View issue reports     |
| POST   | `/issue-reports`      | Submit an issue report |
| GET    | `/issue-reports/{id}` | View one report        |
| PUT    | `/issue-reports/{id}` | Update a report        |
| DELETE | `/issue-reports/{id}` | Delete a report        |

