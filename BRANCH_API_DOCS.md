# 🌿 VetConnect API: Branches

> **Base URL**: `http://localhost:3000/api/branches`  
> **Authentication**: Session cookie `vetconnect-session` required for all endpoints  
> **Multi-tenancy**: All operations automatically scoped to current brand (`brand_id` from session)

---

## 🔑 Role Definitions
| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access (create/delete/update) |
| `ADMIN` | View/update branches |
| `STAFF`/`CUSTOMER` | View branches only |

---

## 📋 Endpoints

### 1. Get All Branches
```markdown
**GET** `/api/branches`
**Access**: All authenticated users (any role)
**Headers**:
  Cookie: vetconnect-session=<YOUR_SESSION_COOKIE>

✅ **200 Success Response**:
```json
[
  {
    "branch_id": "f8d7e6c5-b4a3-4c2d-9e8f-1a2b3c4d5e6f",
    "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Main Clinic",
    "address": "123 Pet St, City",
    "phone": "+63 2 1234 5678",
    "status": "active",
    "created_at": "2026-01-05T08:00:00+08:00",
    "updated_at": "2026-01-05T08:00:00+08:00"
  }
]
```

❌ **Error Responses**:
| Code | Response |
|------|----------|
| `401` | `{ "error": "Unauthorized: Brand context required" }` |
| `500` | `{ "error": "Internal server error" }` |
```

---

### 2. Get Branch by ID
```markdown
**GET** `/api/branches/{branch_id}`
**Access**: `ADMIN`, `SUPER_ADMIN`
**Headers**:
  Cookie: vetconnect-session=<YOUR_SESSION_COOKIE>

✅ **200 Success Response**:
```json
{
  "branch_id": "f8d7e6c5-b4a3-4c2d-9e8f-1a2b3c4d5e6f",
  "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Main Clinic",
  "address": "123 Pet St, City",
  "phone": "+63 2 1234 5678",
  "status": "active",
  "created_at": "2026-01-05T08:00:00+08:00",
  "updated_at": "2026-01-05T08:00:00+08:00"
}
```

❌ **Error Responses**:
| Code | Response |
|------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Forbidden: Insufficient permissions" }` |
| `404` | `{ "error": "Branch not found" }` |
| `500` | `{ "error": "Internal server error" }` |
```

---

### 3. Create Branch
```markdown
**POST** `/api/branches`
**Access**: `SUPER_ADMIN` only
**Headers**:
  Content-Type: application/json
  Cookie: vetconnect-session=<YOUR_SESSION_COOKIE>

.RequestBody**:
```json
{
  "name": "Downtown Branch",
  "address": "456 Animal Ave, Downtown",
  "phone": "+63 2 8765 4321",
  "status": "active"
}
```

✅ **201 Success Response**:
```json
{
  "branch_id": "new-uuid-here",
  "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Downtown Branch",
  "address": "456 Animal Ave, Downtown",
  "phone": "+63 2 8765 4321",
  "status": "active",
  "created_at": "2026-01-05T10:30:00+08:00",
  "updated_at": "2026-01-05T10:30:00+08:00"
}
```

❌ **Error Responses**:
| Code | Response |
|------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Forbidden: Only SUPER_ADMIN can create branches" }` |
| `500` | `{ "error": "Failed to create branch" }` |
```

---

### 4. Update Branch
```markdown
**PUT** `/api/branches/{branch_id}`
**Access**: `ADMIN`, `SUPER_ADMIN`
**Headers**:
  Content-Type: application/json
  Cookie: vetconnect-session=<YOUR_SESSION_COOKIE>

.RequestBody** (partial updates allowed):
```json
{
  "name": "Main Clinic - Updated",
  "phone": "+63 2 1111 2222"
}
```

✅ **200 Success Response**:
```json
{
  "branch_id": "f8d7e6c5-b4a3-4c2d-9e8f-1a2b3c4d5e6f",
  "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Main Clinic - Updated",
  "address": "123 Pet St, City",
  "phone": "+63 2 1111 2222",
  "status": "active",
  "created_at": "2026-01-05T08:00:00+08:00",
  "updated_at": "2026-01-05T10:35:00+08:00"
}
```

❌ **Error Responses**:
| Code | Response |
|------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Forbidden: Insufficient permissions" }` |
| `404` | `{ "error": "Branch not found" }` |
| `500` | `{ "error": "Failed to update branch" }` |
```

---

### 5. Delete Branch
```markdown
**DELETE** `/api/branches/{branch_id}`
**Access**: `SUPER_ADMIN` only
**Headers**:
  Cookie: vetconnect-session=<YOUR_SESSION_COOKIE>

✅ **200 Success Response**:
```json
{ "success": true }
```

❌ **Error Responses**:
| Code | Response |
|------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Forbidden: Only SUPER_ADMIN can delete branches" }` |
| `404` | `{ "error": "Branch not found" }` |
| `500` | `{ "error": "Failed to delete branch" }` |
```

---

## ⚠️ Critical Notes
1. **Brand Isolation**: All operations automatically filter by `brand_id` from session - no cross-brand access possible
2. **Session Required**: Missing/invalid session → `401 Unauthorized`
3. **Validation**: 
   - `name` required for create
   - `branch_id` must be valid UUID
   - Phone numbers must be strings (no format enforcement at API layer)
4. **Soft Delete**: This implementation uses hard delete (DB lacks `deleted_at` column)

> 💡 **Pro Tip**: For production, add soft delete with `deleted_at` column and archive instead of hard delete.