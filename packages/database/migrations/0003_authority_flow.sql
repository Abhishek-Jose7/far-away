-- 0003_authority_flow.sql
-- Alter reports table to support Citizen -> Operator -> Authority OS flow

-- Add category of issue
ALTER TABLE reports ADD COLUMN category TEXT DEFAULT 'other';

-- Add location detail (e.g. Platform 3, Entrance A)
ALTER TABLE reports ADD COLUMN location TEXT DEFAULT NULL;

-- Add issue status (pending verification, verified by operator, assigned to agency, resolved)
ALTER TABLE reports ADD COLUMN status TEXT CHECK(status IN ('pending', 'verified', 'assigned', 'resolved')) DEFAULT 'pending';

-- Add assignee agency (e.g. Western Railway, BMC, MMRDA)
ALTER TABLE reports ADD COLUMN assignee TEXT DEFAULT NULL;

-- Add cleanliness rating (for toilet/water facilities)
ALTER TABLE reports ADD COLUMN cleanliness_rating REAL DEFAULT NULL;
