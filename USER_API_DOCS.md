Absolutely! Here's a **beginner-friendly, copy-paste ready API documentation** for your **Users API** (Phase 2) — complete with role levels, sample requests, success/error responses, and clear explanations.

You can copy this directly into a `docs/users-api.md` file or share with your team.

---

# 🐾 VetConnect API — Users Module  
**Version**: 1.0  
**Base URL**: `http://localhost:3000/api/users`  
**Authentication**: Session cookie (`vetconnect-session`) required for all endpoints

---

## 🔐 Authentication & Roles

Before using any endpoint, you **must** have a valid session cookie.  
Your session must include:
```json
{
  "isLoggedIn": true,
  "brand_id": "a1b2c3d4-...",
  "role": "SUPER_ADMIN" // or "ADMIN", "STAFF", "CUSTOMER"
}
```

### 🎖️ Role Permissions

| Role | Can Do |
|------|--------|
| `SUPER_ADMIN` | 🔹 Create admins & customers<br>🔹 Update **any** user<br>🔹 Delete **any** user<br>🔹 Read all users<br>🔹 Search users |
| `ADMIN` | 🔹 Create customers<br>🔹 Read all users<br>🔹 Search users<br>❌ Cannot create/update/delete admins |
| `STAFF` / `CUSTOMER` | ❌ No access to `/users` API (except `GET /users/:id` for their own profile if allowed elsewhere) |

> 💡 **Note**: `GET /users/:id` is **public within brand** — any logged-in user (even `CUSTOMER`) can fetch **any user’s public info** (but not `password_hash`).

---

## 📋 Endpoint Summary

| Method | Endpoint | Description | Roles Allowed |
|--------|----------|-------------|---------------|
| `GET` | `/` | List all users in brand | `SUPER_ADMIN`, `ADMIN` |
| `GET` | `/:id` | Get user by ID | **All roles** (within brand) |
| `GET` | `/search?query=…` | Search by username, email, or partial ID | `SUPER_ADMIN`, `ADMIN` |
| `POST` | `/customer` | Create customer | `SUPER_ADMIN`, `ADMIN` |
| `POST` | `/admin` | Create admin/staff | `SUPER_ADMIN` only |
| `PUT` | `/:id` | Update user (basic info) | `SUPER_ADMIN` only |
| `DELETE` | `/:id?type=customer` | Delete customer + all data | `SUPER_ADMIN` only |
| `DELETE` | `/:id?type=admin` | Delete admin + data (keep branches) | `SUPER_ADMIN` only |

---

## 📥 Detailed Endpoints

---

### 1. `GET /` — List All Users
**Description**: Get all users in your brand (includes `segment3` for display).  
**Roles**: `SUPER_ADMIN`, `ADMIN`

#### ✅ Success (200)
```json
[
  {
    "user_id": "fe80bed5-ec58-4966-82ab-6b612f7af824",
    "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "branch_id": "b1c2d3e4-f5g6-7890-hijk-lmno12345678",
    "username": "dr_john",
    "email": "john@vet.com",
    "full_name": "Dr. John Smith",
    "phone": "+63 2 1234 5678",
    "role": "ADMIN",
    "status": "active",
    "profile_photo": "https://example.com/photo.jpg",
    "created_at": "2026-01-05T08:00:00+08:00",
    "updated_at": "2026-01-05T08:00:00+08:00",
    "segment3": "4966"   // ← 3rd part of UUID (for quick ID reference)
  }
]
```

#### ❌ Errors
| Code | Response |
|------|----------|
| `401` | `{ "error": "Unauthorized" }` (missing/invalid session) |
| `403` | `{ "error": "Forbidden" }` (role not allowed) |
| `500` | `{ "error": "Internal error" }` |

---

### 2. `GET /:id` — Get User by ID
**Description**: Get a single user. Returns `segment3` automatically.  
**Roles**: **All logged-in users** (as long as `brand_id` matches)

#### 📥 Path Param
| Param | Example | Required |
|-------|---------|----------|
| `id` | `fe80bed5-ec58-4966-82ab-6b612f7af824` | ✅ Yes |

#### ✅ Success (200)
```json
{
  "user_id": "fe80bed5-ec58-4966-82ab-6b612f7af824",
  "brand_id": "a1b2...",
  "branch_id": "b1c2...",
  "username": "petlover123",
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "status": "active",
  "segment3": "4966",
  "created_at": "2026-01-05T10:30:00+08:00",
  ...
}
```

#### ❌ Errors
| Code | Response |
|------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `404` | `{ "error": "User not found" }` |

---

### 3. `GET /search?query=…` — Search Users
**Description**: Search by `username`, `email`, or **partial ID** (`segment3`, e.g., `4966`).  
**Roles**: `SUPER_ADMIN`, `ADMIN`

#### 📥 Query Param
| Param | Example | Notes |
|-------|---------|-------|
| `query` | `4966` or `john` or `john@vet.com` | ✅ Required |

#### ✅ Example Requests
```bash
GET /search?query=4966        # Finds user with ID "...-4966-..."
GET /search?query=john        # Finds username/email containing "john"
```

#### ✅ Success (200)
→ Same shape as `GET /`, array of users with `segment3`.

#### ❌ Errors
| Code | Response |
|------|----------|
| `400` | `{ "error": "Missing query param" }` |
| `401`/`403` | As above |

---

### 4. `POST /customer` — Create Customer
**Description**: Create a **customer** (no branch, auto-hashed password).  
**Roles**: `SUPER_ADMIN`, `ADMIN`

#### 📥 Request Body (JSON)
```json
{
  "username": "petlover123",
  "email": "customer@example.com",
  "password": "SecurePass123!",   // ✅ 8+ chars
  "full_name": "Jane Doe",        // optional
  "phone": "+639123456789"        // optional
}
```

#### ✅ Success (201)
```json
{
  "user_id": "new-uuid-here",
  "brand_id": "a1b2...",
  "branch_id": null,              // ← null for customers
  "username": "petlover123",
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "status": "active",
  "segment3": "abcd",
  ...
}
```

#### ❌ Errors
| Code | Response |
|------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` (e.g., weak password) |
| `401`/`403` | As above |
| `500` | `{ "error": "Failed to create customer" }` |

---

### 5. `POST /admin` — Create Admin or Staff
**Description**: Create **admin/staff** (requires `branch_id`, creates default settings).  
**Roles**: `SUPER_ADMIN` only

#### 📥 Request Body (JSON)
```json
{
  "username": "nurse_anna",
  "email": "anna@vet.com",
  "password": "StaffPass456!",
  "full_name": "Anna Smith",
  "phone": "+63 2 8765 4321",
  "role": "STAFF",                // or "ADMIN"
  "branch_id": "b1c2d3e4-f5g6-7890-hijk-lmno12345678"
}
```

#### ✅ Success (201)
→ Same as customer, but:
- `"branch_id"` is set
- `"role"` is `"ADMIN"` or `"STAFF"`

#### ❌ Errors
| Code | Response |
|------|----------|
| `400` | Validation error (e.g., invalid UUID) |
| `403` | `{ "error": "Only SUPER_ADMIN can create admins" }` |

---

### 6. `PUT /:id` — Update User
**Description**: Update username, email, password, or basic info.  
**Roles**: `SUPER_ADMIN` only

#### 📥 Path Param
| Param | Example |
|-------|---------|
| `id` | `fe80bed5-ec58-4966-82ab-6b612f7af824` |

#### 📥 Request Body (JSON)
```json
{
  "username": "new_username",     // optional
  "email": "new@email.com",       // optional
  "password": "NewPass789!",      // optional — rehashes if provided
  "full_name": "New Name",        // optional
  "phone": "+63 2 1111 2222",     // optional
  "profile_photo": "https://..."  // optional
}
```

#### ✅ Success (200)
→ Updated user object (with `segment3`).

#### ❌ Errors
| Code | Response |
|------|----------|
| `403` | `{ "error": "Only SUPER_ADMIN can update users" }` |
| `404` | `{ "error": "User not found" }` |

---

### 7. `DELETE /:id?type=…` — Delete User
**Description**: Delete user + associated data.  
**Roles**: `SUPER_ADMIN` only

#### 📥 Path & Query Params
| Param | Example | Required |
|-------|---------|----------|
| `id` | `fe80bed5-ec58-4966-82ab-6b612f7af824` | ✅ |
| `type` | `customer` or `admin` | ✅ |

#### ✅ Example Requests
```bash
DELETE /fe80...?type=customer
DELETE /fe80...?type=admin
```

#### ✅ Success (200)
```json
{ "success": true }
```

#### 🔍 What Gets Deleted?
| Type | Deleted Data |
|------|--------------|
| `customer` | ✅ User<br>✅ Pets<br>✅ Appointments (as owner)<br>✅ Passport entries<br>✅ Files<br>✅ Notifications & audit logs |
| `admin` | ✅ User<br>✅ Appointments (created_by)<br>✅ Notifications & audit logs<br>❌ **Branches kept** |

#### ❌ Errors
| Code | Response |
|------|----------|
| `400` | `{ "error": "Missing or invalid type (customer\|admin)" }` |
| `403` | `{ "error": "Only SUPER_ADMIN can delete users" }` |

---

## 🛠️ How to Test in Postman

### Step 1: Get a Valid Session Cookie
1. Log in via your frontend (or dev route)
2. In browser DevTools → **Application** → **Cookies** → Copy value of `vetconnect-session`
3. In Postman:
   - Go to **Cookies** (top-right, 🍪 icon)
   - Add:
     ```
     Domain: localhost
     Cookie: vetconnect-session=YOUR_COOKIES_HERE
     ```

### Step 2: Send Requests
- **Method**: Choose GET/POST/PUT/DELETE  
- **URL**: `http://localhost:3000/api/users/...`  
- **Headers** (for POST/PUT):
  ```
  Content-Type: application/json
  ```
- **Body** (for POST/PUT): raw JSON (see examples above)

---

## 🧪 Quick Test Checklist

| Test | Expected |
|------|----------|
| `GET /` as `ADMIN` | ✅ 200 + user list |
| `GET /invalid-uuid` | ✅ 404 |
| `POST /customer` with weak password (`"123"`) | ✅ 400 |
| `POST /admin` as `ADMIN` | ✅ 403 |
| `DELETE /id?type=customer` as `SUPER_ADMIN` | ✅ 200 → check pets/appointments gone |
| Search `4966` → get user with ID `...-4966-...` | ✅ |

---

## ✅ Best Practices

1. **Always use `brand_id`** — all queries are automatically scoped.
2. **Never store plaintext passwords** — bcrypt used automatically.
3. **Use `segment3` for quick ID display** (e.g., “User #4966”).
4. **Prefer `type=customer`/`admin` in DELETE** — behavior differs!
5. **Validate roles in controller** — service layer assumes trust.

---

## 📞 Need Help?
- Check server logs (`console.error` in service/controller)
- Verify session has `brand_id` and correct `role`
- Test in development first (`http://localhost:3000`)

---

✅ **You’re ready to integrate!**  
Copy, paste, and share with your team 🐾

Let me know when you'd like the **Appointments API docs** — I’ll generate the same beginner-friendly format!