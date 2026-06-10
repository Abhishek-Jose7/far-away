-- 0002_seed_mumbai.sql
-- Seed script for Transit Infrastructure Intelligence

-- Users
INSERT INTO users (id, clerk_id, name, email, role, created_at) VALUES
('usr_1', 'user_clerk_1', 'Rohan Sharma', 'rohan@example.com', 'commuter', '2026-05-01 08:00:00'),
('usr_2', 'user_clerk_2', 'Priya Patel', 'priya@example.com', 'commuter', '2026-05-02 09:15:00'),
('usr_3', 'user_clerk_3', 'Vikram Singh', 'vikram@example.com', 'operator', '2026-05-03 10:30:00'),
('usr_4', 'user_clerk_4', 'Anjali Desai', 'anjali@example.com', 'admin', '2026-05-04 11:45:00'),
('usr_5', 'user_clerk_5', 'Abhishek Patil', 'abhishek@example.com', 'operator', '2026-05-05 12:00:00');

-- Stations
INSERT INTO stations (id, name, city, latitude, longitude, created_at) VALUES
('st_cst', 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', 'Mumbai', 18.9400, 72.8353, '2026-05-01 00:00:00'),
('st_dadar', 'Dadar Junction', 'Mumbai', 19.0178, 72.8478, '2026-05-01 00:00:00'),
('st_andheri', 'Andheri Metro & Railway Station', 'Mumbai', 19.1197, 72.8468, '2026-05-01 00:00:00'),
('st_kurla', 'Kurla Junction', 'Mumbai', 19.0652, 72.8797, '2026-05-01 00:00:00'),
('st_ghatkopar', 'Ghatkopar Station', 'Mumbai', 19.0860, 72.9082, '2026-05-01 00:00:00'),
('st_thane', 'Thane Central', 'Mumbai', 19.1860, 72.9759, '2026-05-01 00:00:00');

-- Infrastructure Assets
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
-- CSMT Assets
('inf_cst_esc1', 'st_cst', 'Platform 1 Escalator', 'escalator', 'healthy', 18.9401, 72.8354, '2026-06-01 08:00:00', '2026-05-01 00:00:00'),
('inf_cst_esc2', 'st_cst', 'Main Exit Escalator', 'escalator', 'warning', 18.9405, 72.8351, '2026-05-15 10:00:00', '2026-05-01 00:00:00'),
('inf_cst_elv1', 'st_cst', 'Platform 3-4 Elevator', 'elevator', 'healthy', 18.9402, 72.8355, '2026-06-05 09:30:00', '2026-05-01 00:00:00'),
('inf_cst_bridge', 'st_cst', 'North Footbridge Walkway', 'footbridge', 'healthy', 18.9412, 72.8358, '2026-04-10 11:00:00', '2026-05-01 00:00:00'),
('inf_cst_charger', 'st_cst', 'EV Fast Charger Hub 1', 'charger', 'healthy', 18.9395, 72.8348, '2026-05-20 14:00:00', '2026-05-01 00:00:00'),

-- Dadar Assets
('inf_dadar_esc1', 'st_dadar', 'Platform 6 Escalator North', 'escalator', 'healthy', 19.0179, 72.8479, '2026-06-02 08:30:00', '2026-05-01 00:00:00'),
('inf_dadar_esc2', 'st_dadar', 'Platform 6 Escalator South', 'escalator', 'critical', 19.0175, 72.8475, '2026-04-01 09:00:00', '2026-05-01 00:00:00'),
('inf_dadar_elv1', 'st_dadar', 'Central Footbridge Elevator', 'elevator', 'healthy', 19.0181, 72.8481, '2026-05-28 11:00:00', '2026-05-01 00:00:00'),
('inf_dadar_bus1', 'st_dadar', 'Dadar TT Circle Bus Stop', 'bus_stop', 'warning', 19.0205, 72.8530, '2026-03-15 12:00:00', '2026-05-01 00:00:00'),
('inf_dadar_ent1', 'st_dadar', 'Western Entrance Ramp', 'metro_entrance', 'healthy', 19.0172, 72.8470, '2026-06-08 10:00:00', '2026-05-01 00:00:00'),

-- Andheri Assets
('inf_andheri_esc1', 'st_andheri', 'Metro Platform L1 Escalator', 'escalator', 'healthy', 19.1198, 72.8469, '2026-06-03 14:00:00', '2026-05-01 00:00:00'),
('inf_andheri_esc2', 'st_andheri', 'Metro to Railway Interchange Escalator', 'escalator', 'critical', 19.1195, 72.8465, '2026-04-20 15:30:00', '2026-05-01 00:00:00'),
('inf_andheri_elv1', 'st_andheri', 'Street-level Accessibility Elevator', 'elevator', 'healthy', 19.1192, 72.8462, '2026-05-30 08:30:00', '2026-05-01 00:00:00'),
('inf_andheri_charger', 'st_andheri', 'Platform 1 EV Charger', 'charger', 'warning', 19.1200, 72.8472, '2026-05-10 10:00:00', '2026-05-01 00:00:00'),

-- Kurla Assets
('inf_kurla_esc1', 'st_kurla', 'Platform 1 Escalator South', 'escalator', 'healthy', 19.0653, 72.8798, '2026-06-04 10:00:00', '2026-05-01 00:00:00'),
('inf_kurla_esc2', 'st_kurla', 'Platform 7-8 Escalator North', 'escalator', 'warning', 19.0655, 72.8795, '2026-05-05 11:30:00', '2026-05-01 00:00:00'),
('inf_kurla_elv1', 'st_kurla', 'Platform 5-6 Central Elevator', 'elevator', 'healthy', 19.0650, 72.8792, '2026-05-25 12:00:00', '2026-05-01 00:00:00'),
('inf_kurla_bridge', 'st_kurla', 'East-West Connecting Skywalk', 'footbridge', 'warning', 19.0660, 72.8810, '2025-12-15 09:00:00', '2026-05-01 00:00:00'),

-- Ghatkopar Assets
('inf_ghatkopar_esc1', 'st_ghatkopar', 'Metro Interchange Escalator A', 'escalator', 'healthy', 19.0861, 72.9083, '2026-06-07 09:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_esc2', 'st_ghatkopar', 'Metro Interchange Escalator B', 'escalator', 'warning', 19.0863, 72.9085, '2026-05-18 10:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_elv1', 'st_ghatkopar', 'Platform 1 Elevator to Metro', 'elevator', 'healthy', 19.0858, 72.9080, '2026-06-06 14:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_bus', 'st_ghatkopar', 'Ghatkopar East Depot Stop', 'bus_stop', 'healthy', 19.0870, 72.9100, '2026-05-01 11:00:00', '2026-05-01 00:00:00'),

-- Thane Assets
('inf_thane_esc1', 'st_thane', 'Platform 3 Escalator', 'escalator', 'healthy', 19.1861, 72.9760, '2026-06-06 10:00:00', '2026-05-01 00:00:00'),
('inf_thane_esc2', 'st_thane', 'Platform 5 Escalator', 'escalator', 'warning', 19.1865, 72.9755, '2026-05-12 11:30:00', '2026-05-01 00:00:00'),
('inf_thane_elv1', 'st_thane', 'Platform 1-2 Elevator', 'elevator', 'healthy', 19.1859, 72.9758, '2026-05-27 13:00:00', '2026-05-01 00:00:00'),
('inf_thane_charger1', 'st_thane', 'Thane West EV Station', 'charger', 'healthy', 19.1850, 72.9745, '2026-06-01 15:00:00', '2026-05-01 00:00:00'),
('inf_thane_charger2', 'st_thane', 'Thane East EV Station', 'charger', 'critical', 19.1870, 72.9780, '2026-03-10 16:00:00', '2026-05-01 00:00:00'),
('inf_thane_bridge', 'st_thane', 'New Platform 10 Skywalk', 'footbridge', 'healthy', 19.1880, 72.9770, '2026-06-09 11:00:00', '2026-05-01 00:00:00');

-- Citizen Issue Reports (Total 40 reports for density)
INSERT INTO reports (id, infrastructure_id, user_id, description, severity, confidence, created_at) VALUES
-- CSMT Main Exit Escalator (st_cst)
('rep_1', 'inf_cst_esc2', 'usr_1', 'Escalator making screeching noises.', 'medium', 0.5, '2026-06-08 08:30:00'),
('rep_2', 'inf_cst_esc2', 'usr_2', 'Handrail is not moving sync with steps.', 'medium', 0.75, '2026-06-08 09:10:00'),
('rep_3', 'inf_cst_esc2', 'usr_3', 'Escalator handrail slipping periodically.', 'medium', 1.0, '2026-06-08 12:00:00'), -- operator report

-- Dadar Platform 6 Escalator South (Critical Asset)
('rep_4', 'inf_dadar_esc2', 'usr_1', 'Escalator has stopped completely.', 'high', 0.5, '2026-06-09 07:00:00'),
('rep_5', 'inf_dadar_esc2', 'usr_2', 'Severe backup at escalator due to outage.', 'high', 0.75, '2026-06-09 07:30:00'),
('rep_6', 'inf_dadar_esc2', 'usr_3', 'Confirmed step damage, requires immediate overhaul.', 'high', 1.0, '2026-06-09 08:00:00'), -- operator
('rep_7', 'inf_dadar_esc2', 'usr_5', 'Emergency stop button engaged, won''t reset.', 'high', 1.0, '2026-06-09 08:30:00'), -- operator

-- Dadar TT Circle Bus Stop
('rep_8', 'inf_dadar_bus1', 'usr_1', 'Roof glass is cracked and leaking rainwater.', 'medium', 0.5, '2026-06-05 15:00:00'),
('rep_9', 'inf_dadar_bus1', 'usr_2', 'Display panel showing garbage characters.', 'low', 0.75, '2026-06-06 09:00:00'),

-- Andheri Metro to Railway Interchange Escalator (Critical Asset)
('rep_10', 'inf_andheri_esc2', 'usr_1', 'Escalator makes a thumping sound when weight is applied.', 'medium', 0.5, '2026-06-09 16:00:00'),
('rep_11', 'inf_andheri_esc2', 'usr_2', 'Comb plate damaged at top landing.', 'high', 0.75, '2026-06-09 16:45:00'),
('rep_12', 'inf_andheri_esc2', 'usr_3', 'Shutting down for commuter safety due to landing gap.', 'high', 1.0, '2026-06-09 17:00:00'), -- operator
('rep_13', 'inf_andheri_esc2', 'usr_5', 'Technician assessment confirms roller chain wear.', 'high', 1.0, '2026-06-09 18:00:00'), -- operator

-- Andheri Platform 1 EV Charger
('rep_14', 'inf_andheri_charger', 'usr_1', 'Charging gun locking pin broken.', 'low', 0.5, '2026-06-08 14:00:00'),
('rep_15', 'inf_andheri_charger', 'usr_2', 'Charging starts but drops connection in 5 mins.', 'medium', 0.75, '2026-06-08 18:30:00'),

-- Kurla Platform 7-8 Escalator North
('rep_16', 'inf_kurla_esc2', 'usr_1', 'Step chains are loose, makes weird sounds.', 'medium', 0.5, '2026-06-09 08:00:00'),
('rep_17', 'inf_kurla_esc2', 'usr_2', 'Handrail friction issues reported.', 'low', 0.75, '2026-06-09 11:00:00'),

-- Kurla East-West Connecting Skywalk
('rep_18', 'inf_kurla_bridge', 'usr_1', 'Pothole in concrete slab on eastern walkway section.', 'medium', 0.5, '2026-06-04 10:00:00'),
('rep_19', 'inf_kurla_bridge', 'usr_2', 'Light fixtures are completely dark at night.', 'medium', 0.75, '2026-06-05 20:00:00'),

-- Ghatkopar Metro Interchange Escalator B
('rep_20', 'inf_ghatkopar_esc2', 'usr_1', 'Overheating smell from the drive cabinet.', 'high', 0.5, '2026-06-08 17:00:00'),
('rep_21', 'inf_ghatkopar_esc2', 'usr_2', 'Vibrating heavily during peak hour loads.', 'medium', 0.75, '2026-06-08 18:00:00'),

-- Thane Platform 5 Escalator
('rep_22', 'inf_thane_esc2', 'usr_1', 'Occasionally jerks when starting up.', 'low', 0.5, '2026-06-07 09:00:00'),
('rep_23', 'inf_thane_esc2', 'usr_2', 'Emergency stop switch cover is broken off.', 'medium', 0.75, '2026-06-07 15:00:00'),

-- Thane East EV Charger (Critical Asset)
('rep_24', 'inf_thane_charger2', 'usr_1', 'Display is dead, card scanner not working.', 'medium', 0.5, '2026-06-05 10:00:00'),
('rep_25', 'inf_thane_charger2', 'usr_2', 'Connector melted due to short circuit.', 'high', 0.75, '2026-06-05 11:30:00'),
('rep_26', 'inf_thane_charger2', 'usr_3', 'Power cabinet breaker tripped, no output.', 'high', 1.0, '2026-06-05 12:00:00'), -- operator

-- Miscellaneous healthy asset check reports
('rep_27', 'inf_cst_esc1', 'usr_1', 'Slight rattle but functioning fine.', 'low', 0.5, '2026-06-09 10:00:00'),
('rep_28', 'inf_cst_elv1', 'usr_1', 'Button light for Floor 2 is dim.', 'low', 0.5, '2026-06-09 11:00:00'),
('rep_29', 'inf_dadar_esc1', 'usr_2', 'Speed seems slightly slower than normal.', 'low', 0.5, '2026-06-09 12:00:00'),
('rep_30', 'inf_dadar_elv1', 'usr_2', 'Fan inside elevator cabin is noisy.', 'low', 0.5, '2026-06-09 13:00:00'),
('rep_31', 'inf_andheri_esc1', 'usr_1', 'Smooth ride today.', 'low', 0.5, '2026-06-09 14:00:00'),
('rep_32', 'inf_andheri_elv1', 'usr_1', 'Clean and working correctly.', 'low', 0.5, '2026-06-09 15:00:00'),
('rep_33', 'inf_kurla_esc1', 'usr_2', 'Clean escalators today.', 'low', 0.5, '2026-06-09 16:00:00'),
('rep_34', 'inf_kurla_elv1', 'usr_2', 'No issues, worked fine.', 'low', 0.5, '2026-06-09 17:00:00'),
('rep_35', 'inf_ghatkopar_esc1', 'usr_1', 'Operating normally.', 'low', 0.5, '2026-06-09 18:00:00'),
('rep_36', 'inf_ghatkopar_elv1', 'usr_1', 'Elevator is fast and responsive.', 'low', 0.5, '2026-06-09 19:00:00'),
('rep_37', 'inf_thane_esc1', 'usr_2', 'No vibrations, runs perfectly.', 'low', 0.5, '2026-06-09 20:00:00'),
('rep_38', 'inf_thane_elv1', 'usr_2', 'Good condition.', 'low', 0.5, '2026-06-09 21:00:00'),
('rep_39', 'inf_thane_charger1', 'usr_1', 'Charger works at full speed.', 'low', 0.5, '2026-06-09 22:00:00'),
('rep_40', 'inf_thane_bridge', 'usr_1', 'Well-lit bridge, very safe.', 'low', 0.5, '2026-06-09 23:00:00');

-- Health Scores (Generated corresponding to current reports/maintenance age)
INSERT INTO health_scores (id, infrastructure_id, score, failure_probability, predicted_failure_time, computed_at) VALUES
('hs_cst_esc1', 'inf_cst_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_cst_esc2', 'inf_cst_esc2', 72, 0.28, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_cst_elv1', 'inf_cst_elv1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_cst_bridge', 'inf_cst_bridge', 94, 0.06, NULL, '2026-06-10 00:00:00'),
('hs_cst_charger', 'inf_cst_charger', 97, 0.03, NULL, '2026-06-10 00:00:00'),

('hs_dadar_esc1', 'inf_dadar_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_dadar_esc2', 'inf_dadar_esc2', 15, 0.85, '2026-06-10 12:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_dadar_elv1', 'inf_dadar_elv1', 97, 0.03, NULL, '2026-06-10 00:00:00'),
('hs_dadar_bus1', 'inf_dadar_bus1', 78, 0.22, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_dadar_ent1', 'inf_dadar_ent1', 99, 0.01, NULL, '2026-06-10 00:00:00'),

('hs_andheri_esc1', 'inf_andheri_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_andheri_esc2', 'inf_andheri_esc2', 22, 0.78, '2026-06-12 00:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_andheri_elv1', 'inf_andheri_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_andheri_charger', 'inf_andheri_charger', 81, 0.19, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),

('hs_kurla_esc1', 'inf_kurla_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_kurla_esc2', 'inf_kurla_esc2', 82, 0.18, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_kurla_elv1', 'inf_kurla_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_kurla_bridge', 'inf_kurla_bridge', 75, 0.25, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),

('hs_ghatkopar_esc1', 'inf_ghatkopar_esc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_esc2', 'inf_ghatkopar_esc2', 68, 0.32, '2026-06-17 00:00:00', '2026-06-10 00:00:00'),
('hs_ghatkopar_elv1', 'inf_ghatkopar_elv1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_bus', 'inf_ghatkopar_bus', 99, 0.01, NULL, '2026-06-10 00:00:00'),

('hs_thane_esc1', 'inf_thane_esc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_thane_esc2', 'inf_thane_esc2', 84, 0.16, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_thane_elv1', 'inf_thane_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_thane_charger1', 'inf_thane_charger1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_thane_charger2', 'inf_thane_charger2', 12, 0.88, '2026-06-10 20:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_thane_bridge', 'inf_thane_bridge', 99, 0.01, NULL, '2026-06-10 00:00:00');

-- Alerts (Active alerts for critical/warning assets)
INSERT INTO alerts (id, infrastructure_id, title, message, severity, resolved, created_at) VALUES
('alt_1', 'inf_dadar_esc2', 'Critical Failure: Platform 6 Escalator South', 'Escalator has shut down following multiple structural component alarms and user outage confirmations. Tech dispatch required.', 'critical', 0, '2026-06-09 08:00:00'),
('alt_2', 'inf_andheri_esc2', 'Critical Failure: Metro to Railway Interchange Escalator', 'Interchange escalator stopped due to safety trip triggered by landing comb-plate displacement.', 'critical', 0, '2026-06-09 17:00:00'),
('alt_3', 'inf_thane_charger2', 'Critical Failure: Thane East EV Station', 'EV charger power supply unit short circuit and connector melt. High risk of electrical fire.', 'critical', 0, '2026-06-05 12:00:00'),
('alt_4', 'inf_cst_esc2', 'Maintenance Needed: Main Exit Escalator', 'Vibrations and slipping reported. Handrail speed mismatch detected.', 'warning', 0, '2026-06-08 12:00:00'),
('alt_5', 'inf_kurla_bridge', 'Maintenance Needed: East-West Connecting Skywalk', 'Skywalk structural pavement wear and lighting failures reported.', 'warning', 0, '2026-06-05 20:00:00'),
-- Seed two historical resolved alerts
('alt_6', 'inf_cst_esc1', 'Resolved: Platform 1 Escalator Obstruction', 'Resolved object jam in comb plate.', 'warning', 1, '2026-06-01 08:00:00'),
('alt_7', 'inf_andheri_elv1', 'Resolved: Street-level Elevator Door Reset', 'Elevator door photodetector sensor cleaned and calibrated.', 'critical', 1, '2026-05-30 08:30:00');

-- Maintenance Logs
INSERT INTO maintenance_logs (id, infrastructure_id, action, technician, completed_at) VALUES
('maint_1', 'inf_cst_esc1', 'Replaced landing comb plates and step rollers.', 'Ramesh Kumar', '2026-06-01 08:00:00'),
('maint_2', 'inf_cst_elv1', 'Annual safety check and motor calibration.', 'Karan Johar', '2026-06-05 09:30:00'),
('maint_3', 'inf_dadar_elv1', 'Hydraulic fluid top-up and seal check.', 'Suresh Patil', '2026-05-28 11:00:00'),
('maint_4', 'inf_dadar_ent1', 'Concrete repair and anti-skid step surface paint.', 'Ramesh Kumar', '2026-06-08 10:00:00'),
('maint_5', 'inf_andheri_elv1', 'Cleaned laser proximity sensors and reset cabin system.', 'Karan Johar', '2026-05-30 08:30:00'),
('maint_6', 'inf_kurla_elv1', 'Cabin display board replacement.', 'Suresh Patil', '2026-05-25 12:00:00'),
('maint_7', 'inf_ghatkopar_esc1', 'Gearbox oil change and chain tension adjustment.', 'Avanish Shah', '2026-06-07 09:00:00'),
('maint_8', 'inf_ghatkopar_elv1', 'Safety brake drop testing.', 'Avanish Shah', '2026-06-06 14:00:00'),
('maint_9', 'inf_thane_esc1', 'Drive belt replacements and alignment.', 'Vijay Kadam', '2026-06-06 10:00:00'),
('maint_10', 'inf_thane_charger1', 'Firmware upgrade and communication module check.', 'Vijay Kadam', '2026-06-01 15:00:00');
