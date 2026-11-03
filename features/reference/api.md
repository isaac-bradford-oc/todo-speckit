# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 1** (authentication and session management).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| Lists CRUD | 2 |

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Fetch all lists for caller (ordered A-Z) |
| `POST` | `/todo/lists` | Yes | Create list |
| `PUT` | `/todo/lists/:listId` | Yes | Rename list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete list |

**Create / update list body:**
```json
{
  "name": "Groceries"
}
```

**List success response** (`201` create · `200` get/put):
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Delete list success** (`200` / `204`):
```json
{
  "message": "List was deleted successfully!"
}
```

**Common list errors:** empty/whitespace `400` with `"List name is required."`; > 100 chars `400` with `"List name must be 100 characters or fewer."`; unowned/missing list `404` with `"List with id=<id> not found."`; unauthenticated `401`.

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session token |

**Register body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**
```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register · `200` login):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

**Logout success** (`200`):
```json
{
  "message": "Signed out successfully."
}
```

**Common auth errors:** missing fields `400`; password < 8 chars `400`; duplicate username/email `400`; invalid login `401` with `"Invalid username or password."`; missing/invalid token on protected routes `401`.
