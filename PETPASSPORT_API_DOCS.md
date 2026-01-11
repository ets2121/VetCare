# Pet Passport API Documentation

> ✅ All endpoints require a valid session cookie (`vetconnect-session`)  
> 🔒 Every query is automatically scoped to your `brand_id`  
> 📌 Base URL: `/api/pet-passports`

---

## 1. Get Pets with Passports (Customer)

**GET** `/api/pet-passports/by-owner`

### Description
Get all pets owned by the logged-in customer, including passport entries **visible to owner** and branch addresses.

### Roles Allowed
- `CUSTOMER`

### Request
- **Headers**:  
  `Cookie: vetconnect-session=...`

### Success Response (200)
```json
[
  {
    "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Buddy",
    "species": "Dog",
    "breed": "Golden Retriever",
    "sex": "male",
    "dob": "2023-05-15",
    "passport_entries": [
      {
        "entry_id": "x1y2z3-...",
        "entry_type": "VACCINE",
        "title": "Rabies Shot",
        "date_of_entry": "2025-12-01",
        "next_due_date": "2026-12-01",
        "notes": "Annual vaccination",
        "visible_to_owner": true,
        "branch_address": "123 Pet St, City"
      }
    ]
  }
]
```

### Error Responses
| Status | Response |
|--------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Only customers can view their pets' passports" }` |
| `500` | `{ "error": "Internal error" }` |

---

## 2. Search Pet by Microchip (Admin)

**GET** `/api/pet-passports/search?microchip=985123456789012`

### Description
Search pet by microchip ID. Returns pet details, owner info, and all passport entries with branch addresses.

### Roles Allowed
- `ADMIN`

### Request
- **Query Param**:  
  `microchip` (required, e.g., `985123456789012`)
- **Headers**:  
  `Cookie: vetconnect-session=...`

### Success Response (200)
```json
{
  "pet": {
    "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Luna",
    "microchip_id": "985123456789012",
    "owner": {
      "user_id": "u1v2w3-...",
      "full_name": "Jane Doe",
      "email": "jane@example.com"
    }
  },
  "passport_entries": [
    {
      "entry_id": "x1y2z3-...",
      "entry_type": "CHECKUP",
      "title": "Wellness Exam",
      "date_of_entry": "2026-01-05",
      "branch_address": "456 Animal Ave, Downtown"
    }
  ]
}
```

### Error Responses
| Status | Response |
|--------|----------|
| `400` | `{ "error": "Missing microchip parameter" }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Only admins can search by microchip" }` |
| `404` | `{ "error": "Pet not found" }` |
| `500` | `{ "error": "Search failed" }` |

---

## 3. Create Passport Entry

**POST** `/api/pet-passports`

### Description
Add a new passport entry for a pet. Automatically sets:
- `staff_id` = current user
- `brand_id` = your brand
- `branch_id` = your current branch

### Roles Allowed
- `ADMIN`
- `SUPER_ADMIN`

### Request
- **Headers**:  
  `Content-Type: application/json`  
  `Cookie: vetconnect-session=...`
- **Body**:
```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "entry_type": "VACCINE",
  "title": "Annual Vaccination",
  "date_of_entry": "2026-01-10",
  "visible_to_owner": true
}
```

### Success Response (201)
```json
{
  "entry_id": "new-entry-uuid",
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "entry_type": "VACCINE",
  "title": "Annual Vaccination",
  "date_of_entry": "2026-01-10",
  "visible_to_owner": true,
  "branch_address": "Your Branch Address"
}
```

### Error Responses
| Status | Response |
|--------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Only admins can create passport entries" }` |
| `500` | `{ "error": "Failed to create entry" }` |

---

## 4. Update Passport Entry

**PUT** `/api/pet-passports/{entry_id}`

### Description
Update any field of a passport entry. Automatically updates `branch_id` to your current branch.

### Roles Allowed
- `ADMIN`

### Request
- **URL Param**:  
  `entry_id` (e.g., `x1y2z3-...`)
- **Headers**:  
  `Content-Type: application/json`  
  `Cookie: vetconnect-session=...`
- **Body** (any field optional):
```json
{
  "notes": "Updated notes",
  "next_due_date": "2027-01-10"
}
```

### Success Response (200)
```json
{
  "entry_id": "x1y2z3-...",
  "notes": "Updated notes",
  "next_due_date": "2027-01-10",
  "branch_address": "Your Updated Branch Address"
}
```

### Error Responses
| Status | Response |
|--------|----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` |
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Only admins can update passport entries" }` |
| `404` | `{ "error": "Entry not found" }` |
| `500` | `{ "error": "Failed to update entry" }` |

---

## 5. Delete Passport Entry

**DELETE** `/api/pet-passports/{entry_id}`

### Description
Permanently delete a passport entry.

### Roles Allowed
- `ADMIN`

### Request
- **URL Param**:  
  `entry_id` (e.g., `x1y2z3-...`)
- **Headers**:  
  `Cookie: vetconnect-session=...`

### Success Response (200)
```json
{ "success": true }
```

### Error Responses
| Status | Response |
|--------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `403` | `{ "error": "Only admins can delete passport entries" }` |
| `500` | `{ "error": "Failed to delete entry" }` |

---

> 💡 **Note**:  
> - All dates use format `YYYY-MM-DD`  
> - `entry_type` must be one of: `VACCINE`, `CHECKUP`, `SURGERY`, `MEDICATION`, `OTHER`  
> - Branch address comes from the `branches` table linked via `branch_id`