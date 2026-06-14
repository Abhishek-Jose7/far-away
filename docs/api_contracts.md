# API Contracts - TransitIQ Backend

This documentation outlines endpoint definitions, validation schemas, and payload examples for **TransitIQ** services.

---

## Distributed Agent Pipeline (4 Queues)

When a report is submitted, it flows through a sequential chain of 4 queues:

1. **Ingestion Queue (`transitiq-report-ingestion`)**: Handles initial entry checking.
2. **Verification Queue (`transitiq-verification`)**: Aggregates matching reports for the asset to calculate report confidence.
3. **Prediction Queue (`transitiq-prediction`)**: Evaluates maintenance intervals and active reports to compute the reliability index.
4. **Alert Queue (`transitiq-alerts`)**: Checks thresholds and issues edge notifications / writes to cache.

---

## 1. Stations API

### Get All Stations
- **Route**: `GET /api/stations`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "st_dadar",
      "name": "Dadar Junction",
      "city": "Mumbai",
      "latitude": 19.0178,
      "longitude": 72.8478,
      "created_at": "2026-05-01 00:00:00"
    }
  ]
}
```

### Get Single Station Details (with Assets)
- **Route**: `GET /api/stations/:id`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "st_dadar",
    "name": "Dadar Junction",
    "city": "Mumbai",
    "latitude": 19.0178,
    "longitude": 72.8478,
    "created_at": "2026-05-01 00:00:00",
    "infrastructure": [
      {
        "id": "inf_dadar_esc5",
        "station_id": "st_dadar",
        "name": "Dadar Platform 6 Escalator South",
        "type": "escalator",
        "status": "critical",
        "latitude": 19.0175,
        "longitude": 72.8475,
        "last_maintenance": "2026-04-01 09:00:00",
        "created_at": "2026-05-01 00:00:00",
        "score": 15,
        "failure_probability": 0.85
      }
    ]
  }
}
```

---

## 2. Infrastructure API

### Get All Assets
- **Route**: `GET /api/infrastructure`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "inf_dadar_esc5",
      "station_id": "st_dadar",
      "name": "Dadar Platform 6 Escalator South",
      "type": "escalator",
      "status": "critical",
      "latitude": 19.0175,
      "longitude": 72.8475,
      "last_maintenance": "2026-04-01 09:00:00",
      "created_at": "2026-05-01 00:00:00",
      "station_name": "Dadar Junction",
      "score": 15,
      "failure_probability": 0.85,
      "predicted_failure_time": "2026-06-10 12:00:00"
    }
  ]
}
```

### Get Single Asset details
- **Route**: `GET /api/infrastructure/:id`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "inf_dadar_esc5",
    "station_id": "st_dadar",
    "name": "Dadar Platform 6 Escalator South",
    "type": "escalator",
    "status": "critical",
    "latitude": 19.0175,
    "longitude": 72.8475,
    "last_maintenance": "2026-04-01 09:00:00",
    "created_at": "2026-05-01 00:00:00",
    "station_name": "Dadar Junction",
    "health": {
      "id": "hs_dadar_esc5",
      "infrastructure_id": "inf_dadar_esc5",
      "score": 15,
      "failure_probability": 0.85,
      "predicted_failure_time": "2026-06-10 12:00:00",
      "computed_at": "2026-06-10 00:00:00"
    },
    "activeAlerts": [
      {
        "id": "alt_1",
        "infrastructure_id": "inf_dadar_esc5",
        "title": "Critical Failure: Dadar Platform 6 Escalator South",
        "message": "Escalator has shut down following multiple structural component alarms.",
        "severity": "critical",
        "resolved": 0,
        "created_at": "2026-06-09 08:00:00"
      }
    ],
    "recentReports": [
      {
        "id": "rep_4",
        "infrastructure_id": "inf_dadar_esc5",
        "user_id": "usr_1",
        "description": "Escalator has stopped completely.",
        "severity": "high",
        "confidence": 0.5,
        "created_at": "2026-06-09 07:00:00",
        "user_name": "Rohan Sharma"
      }
    ]
  }
}
```

---

## 3. Reports API (Zod Validated)

### Submit Issue Report
- **Route**: `POST /api/reports`
- **Headers**:
  - `Authorization: Bearer <clerk_user_id_or_jwt>` (Required. Supports mock users like `usr_demo_1` or Clerk JWTs)
- **Request Body Validation (Zod)**:
  - `infrastructure_id` (string, min 1)
  - `user_id` (string, min 1 - auto-filled from authorization token)
  - `description` (string, min 5, max 500)
  - `severity` ("low" | "medium" | "high")
- **Payload Example**:
```json
{
  "infrastructure_id": "inf_cst_esc2",
  "description": "Loose metal bracket on top step. Tripping hazard.",
  "severity": "high"
}
```
- **Response**: `200 OK` (Queued)
```json
{
  "success": true,
  "message": "Report received and dispatched to prediction engine",
  "data": {
    "reportId": "rep_945fe2ba-23ab-41c3-8809-548c8b417e12"
  }
}
```

---

## 3b. Resolve Alerts API (Operator/Admin Authorized)

### Resolve Alert & Reset Asset
- **Route**: `POST /api/alerts/:id/resolve`
- **Headers**:
  - `Authorization: Bearer <clerk_operator_id_or_jwt>` (Required. Role of the user must be `operator` or `admin` in the database)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Alert resolved, asset status reset to healthy"
}
```


---

## 4. Alerts API

### Get Active Alerts
- **Route**: `GET /api/alerts`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "alt_1",
      "infrastructure_id": "inf_dadar_esc5",
      "title": "Critical Failure: Dadar Platform 6 Escalator South",
      "message": "Escalator has shut down following multiple structural component alarms.",
      "severity": "critical",
      "resolved": 0,
      "created_at": "2026-06-09 08:00:00",
      "asset_name": "Dadar Platform 6 Escalator South",
      "station_name": "Dadar Junction"
    }
  ]
}
```

---

## 5. Dashboard Summary API (KV Cached)

- **Route**: `GET /api/dashboard/summary`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalInfrastructure": 104,
    "activeAlerts": 5,
    "criticalAssets": 3,
    "averageReliability": 92
  },
  "cached": true
}
```
