# 🐾 Pet API Documentation

Role-based access for pet management. All endpoints require a valid session with `brand_id`.

---

## 🔐 Role Access Levels

| Endpoint | Method | Roles Allowed |
|---------|--------|---------------|
| `/api/pets` | `GET` | `SUPER_ADMIN`, `ADMIN` |
| `/api/pets/search` | `GET` | `ADMIN` |
| `/api/pets` | `POST` | `CUSTOMER` |
| `/api/pets/:id` | `PUT` | `CUSTOMER` |
| `/api/pets/:id` | `DELETE` | `CUSTOMER`, `SUPER_ADMIN` |

---

## 📥 Endpoints

### 1. Get All Pets (Paginated)
**GET** `/api/pets?page=1&limit=20`

#### Query Params
- `page` (optional, default: `1`)
- `limit` (optional, default: `20`, max: `100`)

#### ✅ Success Response (200)
```json
{
  "data": [
    {
      "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "owner_id": "user-uuid",
      "name": "Buddy",
      "species": "Dog",
      "sex": "male",
      "segment3": "7890",
      "created_at": "2026-01-05T08:00:00+08:00"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### 2. Search Pet by ID Segment
**GET** `/api/pets/search?query=7890`

#### Query Params
- `query` (required): 4-digit UUID segment (e.g., `7890`)

#### ✅ Success Response (200)
```json
[
  {
    "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Buddy",
    "segment3": "7890",
    ...
  }
]
```

---

### 3. Register Pet
**POST** `/api/pets`

#### Body (JSON)
```json
{
  "name": "Luna",
  "species": "Cat",
  "breed": "Siamese",
  "sex": "female",
  "dob": "2023-05-15",
  "color": "Cream",
  "weight_kg": 4.2,
  "microchip_id": "985123456789012",
  "status": "active"
}
```

#### ✅ Success Response (201)
```json
{
  "pet_id": "new-uuid",
  "owner_id": "session-user-id",
  "branch_id": null,
  "segment3": "abcd",
  ...
}
```

---

### 4. Update Pet
**PUT** `/api/pets/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### Body (JSON) – any field(s)
```json
{
  "weight_kg": 4.5,
  "color": "Light Cream"
}
```

#### ✅ Success Response (200)
```json
{
  "pet_id": "a1b2...",
  "weight_kg": 4.5,
  "color": "Light Cream",
  ...
}
```

---

### 5. Delete Pet
**DELETE** `/api/pets/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### ✅ Success Response (200)
```json
{ "success": true }
```

---

## ❌ Common Errors

| Status | Response |
|--------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Forbidden" }` |
| `404` | `{ "error": "Pet not found or access denied" }` |
| `500` | `{ "error": "Internal error" }` |

> 💡 **Note**:  
> - Customers can only manage their own pets  
> - All operations are scoped to the session’s `brand_id`  
> - `segment3` = 3rd UUID segment (e.g., `7890` in `...-e5f6-7890-abcd-...`)