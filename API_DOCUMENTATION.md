# API Documentation

Base URL: `http://localhost:3000/api`

## Authentification

Header requis: `Authorization: Bearer <token>`
Expiration: 24h

## Endpoints

### Auth

#### POST `/auth/register`
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "first_name": "John",
  "last_name": "Doe",
  "role": "Manager" | "Employé"
}
```
**Réponse 201**: `{ user, token }`

#### POST `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password"
}
```
**Réponse 200**: `{ user, token }`

#### GET `/auth/me` 🔒
**Réponse 200**: `{ user }`

#### PUT `/auth/update` 🔒
```json
{
  "email": "new@example.com",
  "first_name": "Jane",
  "last_name": "Smith"
}
```
**Réponse 200**: `{ user }`

### Teams

#### GET `/teams` 🔒
**Réponse 200**: `[{ id, name, description, manager_id, members: [...] }]`

#### GET `/teams/:id` 🔒
**Réponse 200**: `{ id, name, description, manager, members }`

#### POST `/teams` 🔒 Manager only
```json
{
  "name": "Team Alpha",
  "description": "Description"
}
```
**Réponse 201**: `{ team }`

#### PUT `/teams/:id` 🔒 Manager only
```json
{
  "name": "Updated Name",
  "description": "Updated Desc"
}
```
**Réponse 200**: `{ team }`

#### DELETE `/teams/:id` 🔒 Manager only
**Réponse 204**: No content

#### POST `/teams/:id/members` 🔒 Manager only
```json
{
  "user_id": 5
}
```
**Réponse 200**: `{ team }`

#### DELETE `/teams/:teamId/members/:userId` 🔒 Manager only
**Réponse 200**: `{ team }`

### Users

#### GET `/users` 🔒 Manager only
**Réponse 200**: `[{ id, email, first_name, last_name, role, team_id }]`

#### GET `/users/:id` 🔒 Manager only
**Réponse 200**: `{ id, email, first_name, last_name, role, team_id }`

#### PUT `/users/:id` 🔒 Manager only
```json
{
  "email": "new@example.com",
  "role": "Manager",
  "team_id": 2
}
```
**Réponse 200**: `{ user }`

#### DELETE `/users/:id` 🔒 Manager only
**Réponse 204**: No content

#### GET `/users/:id/clocks` 🔒
Get clock entries for a specific user (self or manager can view team members)

**Query params**:
- `start_date`: ISO date string (optional)
- `end_date`: ISO date string (optional)

**Réponse 200**:
```json
{
  "user": { "id": 1, "email": "user@example.com", "first_name": "John", "last_name": "Doe", "role": "Employé" },
  "clocks": [
    { "id": 1, "user_id": 1, "clock_time": "2025-10-10T08:00:00Z", "status": "check-in" },
    { "id": 2, "user_id": 1, "clock_time": "2025-10-10T17:00:00Z", "status": "check-out" }
  ],
  "working_hours": [
    { "date": "2025-10-10", "check_in": "2025-10-10T08:00:00Z", "check_out": "2025-10-10T17:00:00Z", "hours_worked": 9.0 }
  ],
  "total_hours": 9.0
}
```

### Clocks

#### POST `/clocks` 🔒
Clock in or clock out for the authenticated user

```json
{
  "status": "check-in" | "check-out",
  "clock_time": "2025-10-10T08:00:00Z" (optional, defaults to now)
}
```
**Réponse 201**:
```json
{
  "message": "Successfully clocked check-in",
  "clock": { "id": 1, "user_id": 1, "clock_time": "2025-10-10T08:00:00Z", "status": "check-in" }
}
```

#### GET `/clocks` 🔒
Get all clock entries for the authenticated user

**Query params**:
- `start_date`: ISO date string (optional)
- `end_date`: ISO date string (optional)

**Réponse 200**: Same as `/users/:id/clocks`

#### GET `/clocks/status` 🔒
Get the current clock status for the authenticated user

**Réponse 200**:
```json
{
  "is_clocked_in": true,
  "last_clock": { "id": 1, "user_id": 1, "clock_time": "2025-10-10T08:00:00Z", "status": "check-in" }
}
```

### Reports

#### GET `/reports` 🔒 Manager only
Get global reports based on chosen KPIs

**Query params**:
- `type`: 'daily' | 'weekly' | 'team' (default: 'team')
- `start_date`: ISO date string (default: 30 days ago)
- `end_date`: ISO date string (default: today)
- `team_id`: team ID (optional, defaults to manager's team)

**Réponse 200** (for type='team'):
```json
{
  "team_id": 1,
  "team_name": "Team Alpha",
  "period_start": "2025-09-10T00:00:00Z",
  "period_end": "2025-10-10T23:59:59Z",
  "total_employees": 5,
  "total_hours": 180.5,
  "average_hours_per_employee": 36.1,
  "daily_reports": [...],
  "weekly_reports": [...]
}
```

#### GET `/reports/employee/:id` 🔒
Get individual employee report (self or manager can view team members)

**Query params**:
- `start_date`: ISO date string (default: 30 days ago)
- `end_date`: ISO date string (default: today)

**Réponse 200**:
```json
{
  "employee": { "id": 1, "email": "user@example.com", "first_name": "John", "last_name": "Doe", "role": "Employé" },
  "period": { "start": "2025-09-10T00:00:00Z", "end": "2025-10-10T23:59:59Z" },
  "summary": { "total_hours": 180.5, "days_worked": 20, "average_daily_hours": 9.0 },
  "daily_reports": [...],
  "weekly_reports": [...]
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (token missing/invalid) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Internal Server Error |

## Exemples cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.dupont@company.com","password":"password123"}'

# Get teams
curl http://localhost:3000/api/teams \
  -H "Authorization: Bearer <token>"

# Create team (Manager)
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Team Beta","description":"New team"}'
```

## Rate Limiting

- **Auth endpoints** (/login, /register): 5 req/15min
- **Other API endpoints**: 100 req/15min
- Header retourné: `RateLimit-Limit`, `RateLimit-Remaining`
