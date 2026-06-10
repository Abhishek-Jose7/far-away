# API Contracts - Transit Infrastructure Intelligence

This documentation outlines the endpoint definitions, payload schemas, and mock response payloads for the Transit Infrastructure API.

---

## 1. Infrastructure API

### Get All Assets
- **Route**: `GET /api/infrastructure`
- **Response Status**: `200 OK`
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "inf_cst_esc2",
      "station_id": "st_cst",
      "name": "Main Exit Escalator",
      "type": "escalator",
      "status": "warning",
      "latitude": 18.9405,
      "longitude": 72.8351,
      "last_maintenance": "2026-05-15 10:00:00",
      "created_at": "2026-05-01 00:00:00",
      "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
      "score": 72,
      "failure_probability": 0.28,
      "predicted_failure_time": "2026-07-10 12:00:00"
    }
  ]
}
```

### Get Single Asset Detail
- **Route**: `GET /api/infrastructure/:id`
- **Response Status**: `200 OK`
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "id": "inf_cst_esc2",
    "station_id": "st_cst",
    "name": "Main Exit Escalator",
    "type": "escalator",
    "status": "warning",
    "latitude": 18.9405,
    "longitude": 72.8351,
    "last_maintenance": "2026-05-15 10:00:00",
    "created_at": "2026-05-01 00:00:00",
    "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
    "health": {
      "id": "hs_cst_esc2",
      "infrastructure_id": "inf_cst_esc2",
      "score": 72,
      "failure_probability": 0.28,
      "predicted_failure_time": "2026-07-10 12:00:00",
      "computed_at": "2026-06-10 00:00:00"
    },
    "activeAlerts": [],
    "recentReports": [
      {
        "id": "rep_1",
        "infrastructure_id": "inf_cst_esc2",
        "user_id": "usr_1",
        "description": "Escalator making screeching noises.",
        "severity": "medium",
        "confidence": 0.75,
        "created_at": "2026-06-08 08:30:00",
        "user_name": "Rohan Sharma"
      }
    ]
  }
}
```

---

## 2. Citizen Reports API

### Submit Issue Report
- **Route**: `POST /api/reports`
- **Payload Schema**:
```json
{
  "infrastructure_id": "inf_cst_esc2",
  "user_id": "usr_demo_1",
  "description": "Loose metal bracket on top step. Tripping hazard.",
  "severity": "high"
}
```
- **Response Status**: `200 OK` (Queued)
- **Response Format**:
```json
{
  "success": true,
  "message": "Report received and queued for analysis",
  "data": {
    "reportId": "rep_e782be1e-d4c3-487c-8809-548c8b417e29"
  }
}
```

---

## 3. Alerts API

### Get Active & Resolved Alerts
- **Route**: `GET /api/alerts`
- **Response Status**: `200 OK`
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "alt_1",
      "infrastructure_id": "inf_dadar_esc2",
      "title": "Critical Failure: Platform 6 Escalator South",
      "message": "Escalator has shut down following multiple structural component alarms.",
      "severity": "critical",
      "resolved": 0,
      "created_at": "2026-06-09 08:00:00",
      "asset_name": "Platform 6 Escalator South",
      "station_name": "Dadar Junction"
    }
  ]
}
```

### Resolve Active Alert
- **Route**: `POST /api/alerts/:id/resolve`
- **Response Status**: `200 OK`
- **Response Format**:
```json
{
  "success": true,
  "message": "Alert resolved, asset restored to healthy status"
}
```

---

## 4. Operator Dashboard API

### Get Summary Statistics
- **Route**: `GET /api/dashboard/summary`
- **Headers**:
  - `Cache-Control: public, max-age=300` (KV cached under the hood)
- **Response Status**: `200 OK`
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "totalInfrastructure": 30,
    "activeAlerts": 3,
    "criticalAssets": 3,
    "averageReliability": 87
  },
  "cached": true
}
```
