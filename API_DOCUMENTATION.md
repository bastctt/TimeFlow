# API Documentation

Base URL: `http://localhost/api`

## Auth

Toutes les routes (sauf `/auth/register` et `/auth/login`) nécessitent :
```
Authorization: Bearer <token>
```

### POST `/auth/register`
```json
{ "email": "user@example.com", "password": "min6chars", "first_name": "John", "last_name": "Doe", "role": "Manager" }
```
**200**: `{ user, token }`

### POST `/auth/login`
```json
{ "email": "user@example.com", "password": "password" }
```
**200**: `{ user, token }`

### GET `/auth/me`
**200**: `{ user }`

### PUT `/auth/update`
```json
{ "email": "new@example.com", "first_name": "Jane", "last_name": "Smith" }
```
**200**: `{ user }`

## Teams

### GET `/teams`
**200**: `[{ id, name, description, manager_id, members }]`

### GET `/teams/:id`
**200**: `{ id, name, description, manager, members }`

### POST `/teams` (Manager only)
```json
{ "name": "Team Alpha", "description": "Description" }
```
**201**: `{ team }`

### PUT `/teams/:id` (Manager only)
```json
{ "name": "Updated Name", "description": "Updated Desc" }
```
**200**: `{ team }`

### DELETE `/teams/:id` (Manager only)
**204**: No content

### POST `/teams/:id/members` (Manager only)
```json
{ "user_id": 5 }
```
**200**: `{ team }`

### DELETE `/teams/:teamId/members/:userId` (Manager only)
**200**: `{ team }`

## Users

### GET `/users` (Manager only)
**200**: `[{ id, email, first_name, last_name, role, team_id }]`

### GET `/users/:id` (Manager only)
**200**: `{ id, email, first_name, last_name, role, team_id }`

### PUT `/users/:id` (Manager only)
```json
{ "email": "new@example.com", "role": "Manager", "team_id": 2 }
```
**200**: `{ user }`

### DELETE `/users/:id` (Manager only)
**204**: No content

### GET `/users/:id/clocks`
Query: `?start_date=<ISO>&end_date=<ISO>`

**200**: `{ user, clocks, working_hours, total_hours }`

## Clocks

### POST `/clocks`
```json
{ "status": "check-in", "clock_time": "2025-10-10T08:00:00Z" }
```
**201**: `{ message, clock }`

### GET `/clocks`
Query: `?start_date=<ISO>&end_date=<ISO>`

**200**: `{ user, clocks, working_hours, total_hours }`

### GET `/clocks/status`
**200**: `{ is_clocked_in, last_clock }`

## Reports

### GET `/reports` (Manager only)
Query: `?type=team&start_date=<ISO>&end_date=<ISO>&team_id=<id>`

**200**: `{ team_id, team_name, period_start, period_end, total_employees, total_hours, average_hours_per_employee, daily_reports, weekly_reports }`

### GET `/reports/employee/:id`
Query: `?start_date=<ISO>&end_date=<ISO>`

**200**: `{ employee, period, summary, daily_reports, weekly_reports }`

## Status Codes

- **200**: OK
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## Example

```bash
# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager1@timeflow.com","password":"password123"}'

# Get teams
curl http://localhost/api/teams \
  -H "Authorization: Bearer <token>"
```
