# Test Evidence

## Test Environment

- **Base URL:** `http://localhost:8787/api`
- **Runtime:** Cloudflare Workers local dev (`wrangler dev`, Miniflare, and local D1 SQLite)
- **Test date:** 2026-10-06
- **Live URL (deployed):** `https://equipment-booking-api.ayeminaung-mfu.workers.dev/api`

## Results

### Cleanup: Delete Leftover Booking

```http
HTTP/1.1 204 No Content
```

### 1. Create a Booking

`POST /bookings`

```http
HTTP/1.1 201 Created
Content-Length: 279
Content-Type: application/json
```

```json
{
	"id": "d6226cd8-84ec-4ef7-abbd-744fcf9807c5",
	"equipmentId": "eq-1",
	"borrowerName": "Somchai Jaidee",
	"startAt": "2026-10-20T09:00:00.000Z",
	"endAt": "2026-10-20T11:00:00.000Z",
	"purpose": "Class presentation",
	"createdAt": "2026-10-06T06:52:44.097Z",
	"updatedAt": "2026-10-06T06:52:44.097Z"
}
```

### 2. Reject a Conflicting Booking

`POST /bookings` with the same time slot

```http
HTTP/1.1 409 Conflict
Content-Length: 59
Content-Type: application/json
```

```json
{
	"error": "Booking time conflicts with an existing booking"
}
```

### 3. Reject Invalid Time Ordering

`POST /bookings` with `startAt` after `endAt`

```http
HTTP/1.1 400 Bad Request
Content-Length: 40
Content-Type: application/json
```

```json
{
	"error": "startAt must be before endAt"
}
```

### 4. Reject an Unknown Equipment ID

`POST /bookings` with an unknown `equipmentId`

```http
HTTP/1.1 400 Bad Request
Content-Length: 38
Content-Type: application/json
```

```json
{
	"error": "equipmentId does not exist"
}
```

### 5. Reject a Missing Required Field

`POST /bookings` without `startAt`

```http
HTTP/1.1 400 Bad Request
Content-Length: 31
Content-Type: application/json
```

```json
{
	"error": "startAt is required"
}
```

### 6. List Equipment

`GET /equipment`

```http
HTTP/1.1 200 OK
Content-Length: 184
Content-Type: application/json
```

```json
[
	{
		"id": "eq-1",
		"name": "Projector A",
		"location": "Building 1"
	},
	{
		"id": "eq-2",
		"name": "DSLR Camera Kit",
		"location": "Media Lab"
	},
	{
		"id": "eq-3",
		"name": "Meeting Room 4",
		"location": "Building 3"
	}
]
```

### 7. List Bookings

`GET /bookings`

```http
HTTP/1.1 200 OK
Content-Length: 281
Content-Type: application/json
```

```json
[
	{
		"id": "d6226cd8-84ec-4ef7-abbd-744fcf9807c5",
		"equipmentId": "eq-1",
		"borrowerName": "Somchai Jaidee",
		"startAt": "2026-10-20T09:00:00.000Z",
		"endAt": "2026-10-20T11:00:00.000Z",
		"purpose": "Class presentation",
		"createdAt": "2026-10-06T06:52:44.097Z",
		"updatedAt": "2026-10-06T06:52:44.097Z"
	}
]
```

### 8. Get a Booking by ID

`GET /bookings/:id`

```http
HTTP/1.1 200 OK
Content-Length: 279
Content-Type: application/json
```

```json
{
	"id": "d6226cd8-84ec-4ef7-abbd-744fcf9807c5",
	"equipmentId": "eq-1",
	"borrowerName": "Somchai Jaidee",
	"startAt": "2026-10-20T09:00:00.000Z",
	"endAt": "2026-10-20T11:00:00.000Z",
	"purpose": "Class presentation",
	"createdAt": "2026-10-06T06:52:44.097Z",
	"updatedAt": "2026-10-06T06:52:44.097Z"
}
```

### 9. Update a Booking

`PATCH /bookings/:id`

```http
HTTP/1.1 200 OK
Content-Length: 277
Content-Type: application/json
```

```json
{
	"id": "d6226cd8-84ec-4ef7-abbd-744fcf9807c5",
	"equipmentId": "eq-1",
	"borrowerName": "Somchai Jaidee",
	"startAt": "2026-10-20T09:00:00.000Z",
	"endAt": "2026-10-20T12:00:00.000Z",
	"purpose": "Thesis rehearsal",
	"createdAt": "2026-10-06T06:52:44.097Z",
	"updatedAt": "2026-10-06T06:52:49.947Z"
}
```

### 10. Reject an Unknown Booking ID

`PATCH /bookings/:id` with an unknown ID

```http
HTTP/1.1 404 Not Found
Content-Length: 29
Content-Type: application/json
```

```json
{
	"error": "Booking not found"
}
```

### 11. Delete a Booking

`DELETE /bookings/:id`

```http
HTTP/1.1 204 No Content
```

### 12. Confirm the Booking Was Deleted

`GET /bookings/:id`

```http
HTTP/1.1 404 Not Found
Content-Length: 29
Content-Type: application/json
```

```json
{
	"error": "Booking not found"
}
```
