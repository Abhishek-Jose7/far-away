-- 0002_seed_mumbai.sql
-- Seed script for TransitIQ (100+ Infrastructure Assets)

-- 1. Users
INSERT INTO users (id, clerk_id, name, email, role, created_at) VALUES
('usr_1', 'user_clerk_1', 'Rohan Sharma', 'rohan@example.com', 'commuter', '2026-05-01 08:00:00'),
('usr_2', 'user_clerk_2', 'Priya Patel', 'priya@example.com', 'commuter', '2026-05-02 09:15:00'),
('usr_3', 'user_clerk_3', 'Vikram Singh', 'vikram@example.com', 'operator', '2026-05-03 10:30:00'),
('usr_4', 'user_clerk_4', 'Anjali Desai', 'anjali@example.com', 'admin', '2026-05-04 11:45:00'),
('usr_5', 'user_clerk_5', 'Abhishek Patil', 'abhishek@example.com', 'operator', '2026-05-05 12:00:00');

-- 2. Stations
INSERT INTO stations (id, name, city, latitude, longitude, created_at) VALUES
('st_cst', 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', 'Mumbai', 18.9400, 72.8353, '2026-05-01 00:00:00'),
('st_dadar', 'Dadar Junction', 'Mumbai', 19.0178, 72.8478, '2026-05-01 00:00:00'),
('st_andheri', 'Andheri Metro & Railway Station', 'Mumbai', 19.1197, 72.8468, '2026-05-01 00:00:00'),
('st_kurla', 'Kurla Junction', 'Mumbai', 19.0652, 72.8797, '2026-05-01 00:00:00'),
('st_ghatkopar', 'Ghatkopar Station', 'Mumbai', 19.0860, 72.9082, '2026-05-01 00:00:00'),
('st_thane', 'Thane Central', 'Mumbai', 19.1860, 72.9759, '2026-05-01 00:00:00');

-- 3. Infrastructure Assets (100+ Items)

-- CSMT Assets (18 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_cst_esc1', 'st_cst', 'CSMT Platform 1 Escalator', 'escalator', 'healthy', 18.9401, 72.8354, '2026-06-01 08:00:00', '2026-05-01 00:00:00'),
('inf_cst_esc2', 'st_cst', 'CSMT Platform 2 Escalator', 'escalator', 'warning', 18.9402, 72.8355, '2026-05-15 10:00:00', '2026-05-01 00:00:00'),
('inf_cst_esc3', 'st_cst', 'CSMT Platform 3 Escalator', 'escalator', 'healthy', 18.9403, 72.8356, '2026-06-02 08:00:00', '2026-05-01 00:00:00'),
('inf_cst_esc4', 'st_cst', 'CSMT Main Exit Escalator East', 'escalator', 'healthy', 18.9405, 72.8351, '2026-06-03 08:00:00', '2026-05-01 00:00:00'),
('inf_cst_esc5', 'st_cst', 'CSMT Main Exit Escalator West', 'escalator', 'healthy', 18.9406, 72.8350, '2026-06-03 08:30:00', '2026-05-01 00:00:00'),
('inf_cst_elv1', 'st_cst', 'CSMT Platform 1-2 Elevator', 'elevator', 'healthy', 18.9401, 72.8353, '2026-06-05 09:30:00', '2026-05-01 00:00:00'),
('inf_cst_elv2', 'st_cst', 'CSMT Platform 3-4 Elevator', 'elevator', 'healthy', 18.9403, 72.8355, '2026-06-05 10:00:00', '2026-05-01 00:00:00'),
('inf_cst_elv3', 'st_cst', 'CSMT Main Ticket Office Elevator', 'elevator', 'healthy', 18.9404, 72.8352, '2026-06-05 10:30:00', '2026-05-01 00:00:00'),
('inf_cst_charger1', 'st_cst', 'CSMT EV Charger Port A', 'charger', 'healthy', 18.9395, 72.8348, '2026-05-20 14:00:00', '2026-05-01 00:00:00'),
('inf_cst_charger2', 'st_cst', 'CSMT EV Charger Port B', 'charger', 'healthy', 18.9396, 72.8349, '2026-05-20 14:30:00', '2026-05-01 00:00:00'),
('inf_cst_charger3', 'st_cst', 'CSMT EV Charger Port C', 'charger', 'healthy', 18.9397, 72.8350, '2026-05-20 15:00:00', '2026-05-01 00:00:00'),
('inf_cst_charger4', 'st_cst', 'CSMT EV Charger Port D', 'charger', 'healthy', 18.9398, 72.8351, '2026-05-20 15:30:00', '2026-05-01 00:00:00'),
('inf_cst_bus1', 'st_cst', 'CSMT Outer Depot Bus Stop A', 'bus_stop', 'healthy', 18.9410, 72.8360, '2026-05-25 09:00:00', '2026-05-01 00:00:00'),
('inf_cst_bus2', 'st_cst', 'CSMT Outer Depot Bus Stop B', 'bus_stop', 'healthy', 18.9411, 72.8361, '2026-05-25 09:30:00', '2026-05-01 00:00:00'),
('inf_cst_bridge1', 'st_cst', 'CSMT Footbridge East Deck', 'footbridge', 'healthy', 18.9412, 72.8358, '2026-04-10 11:00:00', '2026-05-01 00:00:00'),
('inf_cst_bridge2', 'st_cst', 'CSMT Footbridge West Deck', 'footbridge', 'healthy', 18.9413, 72.8357, '2026-04-10 11:30:00', '2026-05-01 00:00:00'),
('inf_cst_acc1', 'st_cst', 'CSMT Platform 1 Accessibility Ramp', 'footbridge', 'healthy', 18.9400, 72.8352, '2026-06-08 10:00:00', '2026-05-01 00:00:00'),
('inf_cst_acc2', 'st_cst', 'CSMT Sub-level Accessibility Lift', 'elevator', 'healthy', 18.9404, 72.8354, '2026-06-08 10:30:00', '2026-05-01 00:00:00');

-- Dadar Junction Assets (18 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_dadar_esc1', 'st_dadar', 'Dadar Platform 1 Escalator', 'escalator', 'healthy', 19.0179, 72.8479, '2026-06-02 08:30:00', '2026-05-01 00:00:00'),
('inf_dadar_esc2', 'st_dadar', 'Dadar Platform 2 Escalator', 'escalator', 'healthy', 19.0178, 72.8478, '2026-06-02 09:00:00', '2026-05-01 00:00:00'),
('inf_dadar_esc3', 'st_dadar', 'Dadar Platform 3 Escalator', 'escalator', 'healthy', 19.0177, 72.8477, '2026-06-02 09:30:00', '2026-05-01 00:00:00'),
('inf_dadar_esc4', 'st_dadar', 'Dadar Platform 5 Escalator', 'escalator', 'healthy', 19.0176, 72.8476, '2026-06-02 10:00:00', '2026-05-01 00:00:00'),
('inf_dadar_esc5', 'st_dadar', 'Dadar Platform 6 Escalator South', 'escalator', 'critical', 19.0175, 72.8475, '2026-04-01 09:00:00', '2026-05-01 00:00:00'),
('inf_dadar_elv1', 'st_dadar', 'Dadar Platform 1-2 Elevator', 'elevator', 'healthy', 19.0181, 72.8481, '2026-05-28 11:00:00', '2026-05-01 00:00:00'),
('inf_dadar_elv2', 'st_dadar', 'Dadar Platform 3-4 Elevator', 'elevator', 'healthy', 19.0180, 72.8480, '2026-05-28 11:30:00', '2026-05-01 00:00:00'),
('inf_dadar_elv3', 'st_dadar', 'Dadar Platform 5-6 Elevator', 'elevator', 'healthy', 19.0179, 72.8479, '2026-05-28 12:00:00', '2026-05-01 00:00:00'),
('inf_dadar_charger1', 'st_dadar', 'Dadar Central Parking Charger A', 'charger', 'healthy', 19.0190, 72.8490, '2026-05-22 10:00:00', '2026-05-01 00:00:00'),
('inf_dadar_charger2', 'st_dadar', 'Dadar Central Parking Charger B', 'charger', 'healthy', 19.0191, 72.8491, '2026-05-22 10:30:00', '2026-05-01 00:00:00'),
('inf_dadar_charger3', 'st_dadar', 'Dadar Central Parking Charger C', 'charger', 'healthy', 19.0192, 72.8492, '2026-05-22 11:00:00', '2026-05-01 00:00:00'),
('inf_dadar_charger4', 'st_dadar', 'Dadar Central Parking Charger D', 'charger', 'healthy', 19.0193, 72.8493, '2026-05-22 11:30:00', '2026-05-01 00:00:00'),
('inf_dadar_bus1', 'st_dadar', 'Dadar TT Circle Bus Stop A', 'bus_stop', 'warning', 19.0205, 72.8530, '2026-03-15 12:00:00', '2026-05-01 00:00:00'),
('inf_dadar_bus2', 'st_dadar', 'Dadar TT Circle Bus Stop B', 'bus_stop', 'healthy', 19.0206, 72.8531, '2026-05-25 10:00:00', '2026-05-01 00:00:00'),
('inf_dadar_bridge1', 'st_dadar', 'Dadar Central Footbridge Deck A', 'footbridge', 'healthy', 19.0185, 72.8485, '2026-04-12 10:00:00', '2026-05-01 00:00:00'),
('inf_dadar_bridge2', 'st_dadar', 'Dadar Central Footbridge Deck B', 'footbridge', 'healthy', 19.0186, 72.8486, '2026-04-12 10:30:00', '2026-05-01 00:00:00'),
('inf_dadar_acc1', 'st_dadar', 'Dadar Platform 3 Wheelchair Lift', 'elevator', 'healthy', 19.0177, 72.8478, '2026-06-08 11:00:00', '2026-05-01 00:00:00'),
('inf_dadar_acc2', 'st_dadar', 'Dadar North Entrance Access Ramp', 'footbridge', 'healthy', 19.0172, 72.8470, '2026-06-08 11:30:00', '2026-05-01 00:00:00');

-- Andheri Station Assets (18 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_andheri_esc1', 'st_andheri', 'Andheri Metro Platform Escalator L1', 'escalator', 'healthy', 19.1198, 72.8469, '2026-06-03 14:00:00', '2026-05-01 00:00:00'),
('inf_andheri_esc2', 'st_andheri', 'Andheri Metro Interchange Escalator', 'escalator', 'critical', 19.1195, 72.8465, '2026-04-20 15:30:00', '2026-05-01 00:00:00'),
('inf_andheri_esc3', 'st_andheri', 'Andheri Railway Platform 1 Escalator', 'escalator', 'healthy', 19.1196, 72.8466, '2026-06-04 09:00:00', '2026-05-01 00:00:00'),
('inf_andheri_esc4', 'st_andheri', 'Andheri Railway Platform 2 Escalator', 'escalator', 'healthy', 19.1197, 72.8467, '2026-06-04 09:30:00', '2026-05-01 00:00:00'),
('inf_andheri_esc5', 'st_andheri', 'Andheri Railway Platform 3 Escalator', 'escalator', 'healthy', 19.1198, 72.8468, '2026-06-04 10:00:00', '2026-05-01 00:00:00'),
('inf_andheri_elv1', 'st_andheri', 'Andheri West Street-level Elevator', 'elevator', 'healthy', 19.1192, 72.8462, '2026-05-30 08:30:00', '2026-05-01 00:00:00'),
('inf_andheri_elv2', 'st_andheri', 'Andheri East Street-level Elevator', 'elevator', 'healthy', 19.1193, 72.8463, '2026-05-30 09:00:00', '2026-05-01 00:00:00'),
('inf_andheri_elv3', 'st_andheri', 'Andheri Metro Platform 2 Elevator', 'elevator', 'healthy', 19.1194, 72.8464, '2026-05-30 09:30:00', '2026-05-01 00:00:00'),
('inf_andheri_charger1', 'st_andheri', 'Andheri East Station Charger A', 'charger', 'warning', 19.1200, 72.8472, '2026-05-10 10:00:00', '2026-05-01 00:00:00'),
('inf_andheri_charger2', 'st_andheri', 'Andheri East Station Charger B', 'charger', 'healthy', 19.1201, 72.8473, '2026-05-10 10:30:00', '2026-05-01 00:00:00'),
('inf_andheri_charger3', 'st_andheri', 'Andheri West Station Charger C', 'charger', 'healthy', 19.1190, 72.8450, '2026-05-12 11:00:00', '2026-05-01 00:00:00'),
('inf_andheri_charger4', 'st_andheri', 'Andheri West Station Charger D', 'charger', 'healthy', 19.1191, 72.8451, '2026-05-12 11:30:00', '2026-05-01 00:00:00'),
('inf_andheri_bus1', 'st_andheri', 'Andheri Station East Bus Stop A', 'bus_stop', 'healthy', 19.1205, 72.8480, '2026-05-26 10:00:00', '2026-05-01 00:00:00'),
('inf_andheri_bus2', 'st_andheri', 'Andheri Station East Bus Stop B', 'bus_stop', 'healthy', 19.1206, 72.8481, '2026-05-26 10:30:00', '2026-05-01 00:00:00'),
('inf_andheri_bridge1', 'st_andheri', 'Andheri East-West Skywalk Section A', 'footbridge', 'healthy', 19.1195, 72.8460, '2026-04-15 09:00:00', '2026-05-01 00:00:00'),
('inf_andheri_bridge2', 'st_andheri', 'Andheri East-West Skywalk Section B', 'footbridge', 'healthy', 19.1196, 72.8461, '2026-04-15 09:30:00', '2026-05-01 00:00:00'),
('inf_andheri_acc1', 'st_andheri', 'Andheri Western Platform Escalator Lift', 'elevator', 'healthy', 19.1197, 72.8464, '2026-06-08 12:00:00', '2026-05-01 00:00:00'),
('inf_andheri_acc2', 'st_andheri', 'Andheri Metro Platform Tactile Paths', 'footbridge', 'healthy', 19.1198, 72.8465, '2026-06-08 12:30:00', '2026-05-01 00:00:00');

-- Kurla Junction Assets (18 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_kurla_esc1', 'st_kurla', 'Kurla Platform 1 Escalator South', 'escalator', 'healthy', 19.0653, 72.8798, '2026-06-04 10:00:00', '2026-05-01 00:00:00'),
('inf_kurla_esc2', 'st_kurla', 'Kurla Platform 2 Escalator North', 'escalator', 'healthy', 19.0654, 72.8799, '2026-06-04 10:30:00', '2026-05-01 00:00:00'),
('inf_kurla_esc3', 'st_kurla', 'Kurla Platform 3 Escalator South', 'escalator', 'healthy', 19.0655, 72.8800, '2026-06-04 11:00:00', '2026-05-01 00:00:00'),
('inf_kurla_esc4', 'st_kurla', 'Kurla Platform 5 Escalator North', 'escalator', 'healthy', 19.0656, 72.8801, '2026-06-04 11:30:00', '2026-05-01 00:00:00'),
('inf_kurla_esc5', 'st_kurla', 'Kurla Platform 7-8 Escalator North', 'escalator', 'warning', 19.0655, 72.8795, '2026-05-05 11:30:00', '2026-05-01 00:00:00'),
('inf_kurla_elv1', 'st_kurla', 'Kurla Platform 1 Central Elevator', 'elevator', 'healthy', 19.0650, 72.8792, '2026-05-25 12:00:00', '2026-05-01 00:00:00'),
('inf_kurla_elv2', 'st_kurla', 'Kurla Platform 3-4 Central Elevator', 'elevator', 'healthy', 19.0651, 72.8793, '2026-05-25 12:30:00', '2026-05-01 00:00:00'),
('inf_kurla_elv3', 'st_kurla', 'Kurla Platform 5-6 Central Elevator', 'elevator', 'healthy', 19.0652, 72.8794, '2026-05-25 13:00:00', '2026-05-01 00:00:00'),
('inf_kurla_charger1', 'st_kurla', 'Kurla West Depot Charger A', 'charger', 'healthy', 19.0645, 72.8780, '2026-05-24 10:00:00', '2026-05-01 00:00:00'),
('inf_kurla_charger2', 'st_kurla', 'Kurla West Depot Charger B', 'charger', 'healthy', 19.0646, 72.8781, '2026-05-24 10:30:00', '2026-05-01 00:00:00'),
('inf_kurla_charger3', 'st_kurla', 'Kurla East Depot Charger C', 'charger', 'healthy', 19.0660, 72.8810, '2026-05-24 11:00:00', '2026-05-01 00:00:00'),
('inf_kurla_charger4', 'st_kurla', 'Kurla East Depot Charger D', 'charger', 'healthy', 19.0661, 72.8811, '2026-05-24 11:30:00', '2026-05-01 00:00:00'),
('inf_kurla_bus1', 'st_kurla', 'Kurla Station West Bus Depot A', 'bus_stop', 'healthy', 19.0640, 72.8775, '2026-05-28 09:00:00', '2026-05-01 00:00:00'),
('inf_kurla_bus2', 'st_kurla', 'Kurla Station West Bus Depot B', 'bus_stop', 'healthy', 19.0641, 72.8776, '2026-05-28 09:30:00', '2026-05-01 00:00:00'),
('inf_kurla_bridge1', 'st_kurla', 'Kurla Connecting Skywalk Section East', 'footbridge', 'warning', 19.0660, 72.8810, '2025-12-15 09:00:00', '2026-05-01 00:00:00'),
('inf_kurla_bridge2', 'st_kurla', 'Kurla Connecting Skywalk Section West', 'footbridge', 'healthy', 19.0648, 72.8790, '2026-04-18 10:00:00', '2026-05-01 00:00:00'),
('inf_kurla_acc1', 'st_kurla', 'Kurla Sub-level Platform Access Ramp', 'footbridge', 'healthy', 19.0651, 72.8791, '2026-06-08 13:00:00', '2026-05-01 00:00:00'),
('inf_kurla_acc2', 'st_kurla', 'Kurla Sub-level Accessibility Lift', 'elevator', 'healthy', 19.0652, 72.8792, '2026-06-08 13:30:00', '2026-05-01 00:00:00');

-- Ghatkopar Station Assets (16 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_ghatkopar_esc1', 'st_ghatkopar', 'Ghatkopar Platform 1 Escalator', 'escalator', 'healthy', 19.0861, 72.9083, '2026-06-07 09:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_esc2', 'st_ghatkopar', 'Ghatkopar Platform 2 Escalator', 'escalator', 'healthy', 19.0862, 72.9084, '2026-06-07 09:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_esc3', 'st_ghatkopar', 'Ghatkopar Platform 3 Escalator', 'escalator', 'healthy', 19.0863, 72.9085, '2026-06-07 10:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_esc4', 'st_ghatkopar', 'Ghatkopar Metro Interchange Escalator A', 'escalator', 'healthy', 19.0864, 72.9086, '2026-06-07 10:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_esc5', 'st_ghatkopar', 'Ghatkopar Metro Interchange Escalator B', 'escalator', 'warning', 19.0863, 72.9085, '2026-05-18 10:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_elv1', 'st_ghatkopar', 'Ghatkopar Platform 1 Elevator', 'elevator', 'healthy', 19.0858, 72.9080, '2026-06-06 14:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_elv2', 'st_ghatkopar', 'Ghatkopar Metro L2 Platform Elevator', 'elevator', 'healthy', 19.0859, 72.9081, '2026-06-06 14:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_elv3', 'st_ghatkopar', 'Ghatkopar Sub-level Access Elevator', 'elevator', 'healthy', 19.0860, 72.9082, '2026-06-06 15:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_charger1', 'st_ghatkopar', 'Ghatkopar Station West Charger A', 'charger', 'healthy', 19.0850, 72.9070, '2026-05-24 12:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_charger2', 'st_ghatkopar', 'Ghatkopar Station West Charger B', 'charger', 'healthy', 19.0851, 72.9071, '2026-05-24 12:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_charger3', 'st_ghatkopar', 'Ghatkopar Station East Charger C', 'charger', 'healthy', 19.0870, 72.9095, '2026-05-24 13:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_bus1', 'st_ghatkopar', 'Ghatkopar East Depot Bus Stop A', 'bus_stop', 'healthy', 19.0870, 72.9100, '2026-05-01 11:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_bus2', 'st_ghatkopar', 'Ghatkopar East Depot Bus Stop B', 'bus_stop', 'healthy', 19.0871, 72.9101, '2026-05-01 11:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_bridge1', 'st_ghatkopar', 'Ghatkopar Platform 1-2 Footbridge A', 'footbridge', 'healthy', 19.0862, 72.9080, '2026-04-20 10:00:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_bridge2', 'st_ghatkopar', 'Ghatkopar Platform 1-2 Footbridge B', 'footbridge', 'healthy', 19.0863, 72.9081, '2026-04-20 10:30:00', '2026-05-01 00:00:00'),
('inf_ghatkopar_acc1', 'st_ghatkopar', 'Ghatkopar Station Entrance Access Ramp', 'footbridge', 'healthy', 19.0855, 72.9075, '2026-06-08 14:00:00', '2026-05-01 00:00:00');

-- Thane Station Assets (16 items)
INSERT INTO infrastructure (id, station_id, name, type, status, latitude, longitude, last_maintenance, created_at) VALUES
('inf_thane_esc1', 'st_thane', 'Thane Platform 1 Escalator', 'escalator', 'healthy', 19.1861, 72.9760, '2026-06-06 10:00:00', '2026-05-01 00:00:00'),
('inf_thane_esc2', 'st_thane', 'Thane Platform 3 Escalator', 'escalator', 'healthy', 19.1862, 72.9761, '2026-06-06 10:30:00', '2026-05-01 00:00:00'),
('inf_thane_esc3', 'st_thane', 'Thane Platform 5 Escalator', 'escalator', 'warning', 19.1865, 72.9755, '2026-05-12 11:30:00', '2026-05-01 00:00:00'),
('inf_thane_esc4', 'st_thane', 'Thane Platform 6 Escalator', 'escalator', 'healthy', 19.1866, 72.9756, '2026-06-06 11:00:00', '2026-05-01 00:00:00'),
('inf_thane_elv1', 'st_thane', 'Thane Platform 1-2 Elevator', 'elevator', 'healthy', 19.1859, 72.9758, '2026-05-27 13:00:00', '2026-05-01 00:00:00'),
('inf_thane_elv2', 'st_thane', 'Thane Platform 3-4 Elevator', 'elevator', 'healthy', 19.1860, 72.9759, '2026-05-27 13:30:00', '2026-05-01 00:00:00'),
('inf_thane_elv3', 'st_thane', 'Thane Platform 5-6 Elevator', 'elevator', 'healthy', 19.1861, 72.9760, '2026-05-27 14:00:00', '2026-05-01 00:00:00'),
('inf_thane_charger1', 'st_thane', 'Thane West Parking EV Charger A', 'charger', 'healthy', 19.1850, 72.9745, '2026-06-01 15:00:00', '2026-05-01 00:00:00'),
('inf_thane_charger2', 'st_thane', 'Thane West Parking EV Charger B', 'charger', 'healthy', 19.1851, 72.9746, '2026-06-01 15:30:00', '2026-05-01 00:00:00'),
('inf_thane_charger3', 'st_thane', 'Thane East Parking EV Charger C', 'charger', 'critical', 19.1870, 72.9780, '2026-03-10 16:00:00', '2026-05-01 00:00:00'),
('inf_thane_charger4', 'st_thane', 'Thane East Parking EV Charger D', 'charger', 'healthy', 19.1871, 72.9781, '2026-06-01 16:00:00', '2026-05-01 00:00:00'),
('inf_thane_bus1', 'st_thane', 'Thane West Bus Depot Stop A', 'bus_stop', 'healthy', 19.1845, 72.9740, '2026-05-20 10:00:00', '2026-05-01 00:00:00'),
('inf_thane_bus2', 'st_thane', 'Thane West Bus Depot Stop B', 'bus_stop', 'healthy', 19.1846, 72.9741, '2026-05-20 10:30:00', '2026-05-01 00:00:00'),
('inf_thane_bridge1', 'st_thane', 'Thane Platform 1-10 Connection Skywalk', 'footbridge', 'healthy', 19.1880, 72.9770, '2026-06-09 11:00:00', '2026-05-01 00:00:00'),
('inf_thane_bridge2', 'st_thane', 'Thane Platform 1-10 Bypass Bridge', 'footbridge', 'healthy', 19.1881, 72.9771, '2026-06-09 11:30:00', '2026-05-01 00:00:00'),
('inf_thane_acc1', 'st_thane', 'Thane East Station Entrance Ramp', 'footbridge', 'healthy', 19.1872, 72.9782, '2026-06-08 15:00:00', '2026-05-01 00:00:00');

-- 4. Citizen Issue Reports
INSERT INTO reports (id, infrastructure_id, user_id, description, severity, confidence, created_at) VALUES
-- CSMT Main Exit Escalator (st_cst)
('rep_1', 'inf_cst_esc2', 'usr_1', 'Escalator making screeching noises.', 'medium', 0.5, '2026-06-08 08:30:00'),
('rep_2', 'inf_cst_esc2', 'usr_2', 'Handrail is not moving sync with steps.', 'medium', 0.75, '2026-06-08 09:10:00'),
('rep_3', 'inf_cst_esc2', 'usr_3', 'Escalator handrail slipping periodically.', 'medium', 1.0, '2026-06-08 12:00:00'), -- operator

-- Dadar Platform 6 Escalator South (Critical Asset)
('rep_4', 'inf_dadar_esc5', 'usr_1', 'Escalator has stopped completely.', 'high', 0.5, '2026-06-09 07:00:00'),
('rep_5', 'inf_dadar_esc5', 'usr_2', 'Severe backup at escalator due to outage.', 'high', 0.75, '2026-06-09 07:30:00'),
('rep_6', 'inf_dadar_esc5', 'usr_3', 'Confirmed step damage, requires immediate overhaul.', 'high', 1.0, '2026-06-09 08:00:00'), -- operator
('rep_7', 'inf_dadar_esc5', 'usr_5', 'Emergency stop button engaged, won''t reset.', 'high', 1.0, '2026-06-09 08:30:00'), -- operator

-- Dadar TT Circle Bus Stop A
('rep_8', 'inf_dadar_bus1', 'usr_1', 'Roof glass is cracked and leaking rainwater.', 'medium', 0.5, '2026-06-05 15:00:00'),
('rep_9', 'inf_dadar_bus1', 'usr_2', 'Display panel showing garbage characters.', 'low', 0.75, '2026-06-06 09:00:00'),

-- Andheri Metro to Railway Interchange Escalator (Critical Asset)
('rep_10', 'inf_andheri_esc2', 'usr_1', 'Escalator makes a thumping sound when weight is applied.', 'medium', 0.5, '2026-06-09 16:00:00'),
('rep_11', 'inf_andheri_esc2', 'usr_2', 'Comb plate damaged at top landing.', 'high', 0.75, '2026-06-09 16:45:00'),
('rep_12', 'inf_andheri_esc2', 'usr_3', 'Shutting down for commuter safety due to landing gap.', 'high', 1.0, '2026-06-09 17:00:00'), -- operator
('rep_13', 'inf_andheri_esc2', 'usr_5', 'Technician assessment confirms roller chain wear.', 'high', 1.0, '2026-06-09 18:00:00'), -- operator

-- Andheri Platform 1 EV Charger
('rep_14', 'inf_andheri_charger1', 'usr_1', 'Charging gun locking pin broken.', 'low', 0.5, '2026-06-08 14:00:00'),
('rep_15', 'inf_andheri_charger1', 'usr_2', 'Charging starts but drops connection in 5 mins.', 'medium', 0.75, '2026-06-08 18:30:00'),

-- Kurla Platform 7-8 Escalator North
('rep_16', 'inf_kurla_esc5', 'usr_1', 'Step chains are loose, makes weird sounds.', 'medium', 0.5, '2026-06-09 08:00:00'),
('rep_17', 'inf_kurla_esc5', 'usr_2', 'Handrail friction issues reported.', 'low', 0.75, '2026-06-09 11:00:00'),

-- Kurla East-West Connecting Skywalk
('rep_18', 'inf_kurla_bridge1', 'usr_1', 'Pothole in concrete slab on eastern walkway section.', 'medium', 0.5, '2026-06-04 10:00:00'),
('rep_19', 'inf_kurla_bridge1', 'usr_2', 'Light fixtures are completely dark at night.', 'medium', 0.75, '2026-06-05 20:00:00'),

-- Ghatkopar Metro Interchange Escalator B
('rep_20', 'inf_ghatkopar_esc5', 'usr_1', 'Overheating smell from the drive cabinet.', 'high', 0.5, '2026-06-08 17:00:00'),
('rep_21', 'inf_ghatkopar_esc5', 'usr_2', 'Vibrating heavily during peak hour loads.', 'medium', 0.75, '2026-06-08 18:00:00'),

-- Thane Platform 5 Escalator
('rep_22', 'inf_thane_esc3', 'usr_1', 'Occasionally jerks when starting up.', 'low', 0.5, '2026-06-07 09:00:00'),
('rep_23', 'inf_thane_esc3', 'usr_2', 'Emergency stop switch cover is broken off.', 'medium', 0.75, '2026-06-07 15:00:00'),

-- Thane East EV Charger (Critical Asset)
('rep_24', 'inf_thane_charger3', 'usr_1', 'Display is dead, card scanner not working.', 'medium', 0.5, '2026-06-05 10:00:00'),
('rep_25', 'inf_thane_charger3', 'usr_2', 'Connector melted due to short circuit.', 'high', 0.75, '2026-06-05 11:30:00'),
('rep_26', 'inf_thane_charger3', 'usr_3', 'Power cabinet breaker tripped, no output.', 'high', 1.0, '2026-06-05 12:00:00'); -- operator

-- 5. Health Scores (Initial values for all 104 assets, plus historic computations for critical ones)
INSERT INTO health_scores (id, infrastructure_id, score, failure_probability, predicted_failure_time, computed_at) VALUES
-- CSMT
('hs_cst_esc1', 'inf_cst_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_cst_esc2', 'inf_cst_esc2', 72, 0.28, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_cst_esc3', 'inf_cst_esc3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_esc4', 'inf_cst_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_esc5', 'inf_cst_esc5', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_elv1', 'inf_cst_elv1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_cst_elv2', 'inf_cst_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_elv3', 'inf_cst_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_chg1', 'inf_cst_charger1', 97, 0.03, NULL, '2026-06-10 00:00:00'),
('hs_cst_chg2', 'inf_cst_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_chg3', 'inf_cst_charger3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_chg4', 'inf_cst_charger4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_bus1', 'inf_cst_bus1', 95, 0.05, NULL, '2026-06-10 00:00:00'),
('hs_cst_bus2', 'inf_cst_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_brg1', 'inf_cst_bridge1', 94, 0.06, NULL, '2026-06-10 00:00:00'),
('hs_cst_brg2', 'inf_cst_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_cst_acc1', 'inf_cst_acc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_cst_acc2', 'inf_cst_acc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),

-- Dadar
('hs_dadar_esc1', 'inf_dadar_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_dadar_esc2', 'inf_dadar_esc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_esc3', 'inf_dadar_esc3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_esc4', 'inf_dadar_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_esc5', 'inf_dadar_esc5', 15, 0.85, '2026-06-10 12:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_dadar_elv1', 'inf_dadar_elv1', 97, 0.03, NULL, '2026-06-10 00:00:00'),
('hs_dadar_elv2', 'inf_dadar_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_elv3', 'inf_dadar_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_chg1', 'inf_dadar_charger1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_chg2', 'inf_dadar_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_chg3', 'inf_dadar_charger3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_chg4', 'inf_dadar_charger4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_bus1', 'inf_dadar_bus1', 78, 0.22, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_dadar_bus2', 'inf_dadar_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_brg1', 'inf_dadar_bridge1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_brg2', 'inf_dadar_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_dadar_acc1', 'inf_dadar_acc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_dadar_acc2', 'inf_dadar_acc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),

-- Andheri
('hs_andheri_esc1', 'inf_andheri_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_andheri_esc2', 'inf_andheri_esc2', 22, 0.78, '2026-06-12 00:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_andheri_esc3', 'inf_andheri_esc3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_esc4', 'inf_andheri_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_esc5', 'inf_andheri_esc5', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_elv1', 'inf_andheri_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_andheri_elv2', 'inf_andheri_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_elv3', 'inf_andheri_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_chg1', 'inf_andheri_charger1', 81, 0.19, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_andheri_chg2', 'inf_andheri_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_chg3', 'inf_andheri_charger3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_chg4', 'inf_andheri_charger4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_bus1', 'inf_andheri_bus1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_bus2', 'inf_andheri_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_brg1', 'inf_andheri_bridge1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_brg2', 'inf_andheri_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_andheri_acc1', 'inf_andheri_acc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_andheri_acc2', 'inf_andheri_acc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),

-- Kurla
('hs_kurla_esc1', 'inf_kurla_esc1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_kurla_esc2', 'inf_kurla_esc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_esc3', 'inf_kurla_esc3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_esc4', 'inf_kurla_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_esc5', 'inf_kurla_esc5', 82, 0.18, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_kurla_elv1', 'inf_kurla_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_kurla_elv2', 'inf_kurla_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_elv3', 'inf_kurla_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_chg1', 'inf_kurla_charger1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_chg2', 'inf_kurla_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_chg3', 'inf_kurla_charger3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_chg4', 'inf_kurla_charger4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_bus1', 'inf_kurla_bus1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_bus2', 'inf_kurla_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_brg1', 'inf_kurla_bridge1', 75, 0.25, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_kurla_brg2', 'inf_kurla_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_kurla_acc1', 'inf_kurla_acc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_kurla_acc2', 'inf_kurla_acc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),

-- Ghatkopar
('hs_ghatkopar_esc1', 'inf_ghatkopar_esc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_esc2', 'inf_ghatkopar_esc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_esc3', 'inf_ghatkopar_esc3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_esc4', 'inf_ghatkopar_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_esc5', 'inf_ghatkopar_esc5', 68, 0.32, '2026-06-17 00:00:00', '2026-06-10 00:00:00'),
('hs_ghatkopar_elv1', 'inf_ghatkopar_elv1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_elv2', 'inf_ghatkopar_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_elv3', 'inf_ghatkopar_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_chg1', 'inf_ghatkopar_charger1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_chg2', 'inf_ghatkopar_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_chg3', 'inf_ghatkopar_charger3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_bus1', 'inf_ghatkopar_bus1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_bus2', 'inf_ghatkopar_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_brg1', 'inf_ghatkopar_bridge1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_brg2', 'inf_ghatkopar_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_ghatkopar_acc1', 'inf_ghatkopar_acc1', 100, 0.00, NULL, '2026-06-10 00:00:00'),

-- Thane
('hs_thane_esc1', 'inf_thane_esc1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_thane_esc2', 'inf_thane_esc2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_esc3', 'inf_thane_esc3', 84, 0.16, '2026-07-10 12:00:00', '2026-06-10 00:00:00'),
('hs_thane_esc4', 'inf_thane_esc4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_elv1', 'inf_thane_elv1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_thane_elv2', 'inf_thane_elv2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_elv3', 'inf_thane_elv3', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_chg1', 'inf_thane_charger1', 98, 0.02, NULL, '2026-06-10 00:00:00'),
('hs_thane_chg2', 'inf_thane_charger2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_chg3', 'inf_thane_charger3', 12, 0.88, '2026-06-10 20:00:00', '2026-06-10 00:00:00'), -- Critical
('hs_thane_chg4', 'inf_thane_charger4', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_bus1', 'inf_thane_bus1', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_bus2', 'inf_thane_bus2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_brg1', 'inf_thane_bridge1', 99, 0.01, NULL, '2026-06-10 00:00:00'),
('hs_thane_brg2', 'inf_thane_bridge2', 100, 0.00, NULL, '2026-06-10 00:00:00'),
('hs_thane_acc1', 'inf_thane_acc1', 100, 0.00, NULL, '2026-06-10 00:00:00');

-- 6. Alerts
INSERT INTO alerts (id, infrastructure_id, title, message, severity, resolved, created_at) VALUES
('alt_1', 'inf_dadar_esc5', 'Critical Failure: Dadar Platform 6 Escalator South', 'Escalator has shut down following multiple structural component alarms and user outage confirmations.', 'critical', 0, '2026-06-09 08:00:00'),
('alt_2', 'inf_andheri_esc2', 'Critical Failure: Andheri Metro Interchange Escalator', 'Interchange escalator stopped due to safety trip triggered by landing comb-plate displacement.', 'critical', 0, '2026-06-09 17:00:00'),
('alt_3', 'inf_thane_charger3', 'Critical Failure: Thane East Parking EV Charger C', 'EV charger power supply unit short circuit and connector melt. High risk of electrical fire.', 'critical', 0, '2026-06-05 12:00:00'),
('alt_4', 'inf_cst_esc2', 'Maintenance Needed: CSMT Platform 2 Escalator', 'Vibrations and slipping reported. Handrail speed mismatch detected.', 'warning', 0, '2026-06-08 12:00:00'),
('alt_5', 'inf_kurla_bridge1', 'Maintenance Needed: Kurla Connecting Skywalk Section East', 'Skywalk structural pavement wear and lighting failures reported.', 'warning', 0, '2026-06-05 20:00:00');

-- 7. Maintenance Logs
INSERT INTO maintenance_logs (id, infrastructure_id, action, technician, completed_at) VALUES
('maint_1', 'inf_cst_esc1', 'Replaced landing comb plates and step rollers.', 'Ramesh Kumar', '2026-06-01 08:00:00'),
('maint_2', 'inf_cst_elv1', 'Annual safety check and motor calibration.', 'Karan Johar', '2026-06-05 09:30:00'),
('maint_3', 'inf_dadar_elv1', 'Hydraulic fluid top-up and seal check.', 'Suresh Patil', '2026-05-28 11:00:00'),
('maint_4', 'inf_dadar_acc2', 'Concrete repair and anti-skid step surface paint.', 'Ramesh Kumar', '2026-06-08 10:00:00'),
('maint_5', 'inf_andheri_elv1', 'Cleaned laser proximity sensors and reset cabin system.', 'Karan Johar', '2026-05-30 08:30:00'),
('maint_6', 'inf_kurla_elv1', 'Cabin display board replacement.', 'Suresh Patil', '2026-05-25 12:00:00'),
('maint_7', 'inf_ghatkopar_esc1', 'Gearbox oil change and chain tension adjustment.', 'Avanish Shah', '2026-06-07 09:00:00'),
('maint_8', 'inf_ghatkopar_elv1', 'Safety brake drop testing.', 'Avanish Shah', '2026-06-06 14:00:00'),
('maint_9', 'inf_thane_esc1', 'Drive belt replacements and alignment.', 'Vijay Kadam', '2026-06-06 10:00:00'),
('maint_10', 'inf_thane_charger1', 'Firmware upgrade and communication module check.', 'Vijay Kadam', '2026-06-01 15:00:00');

-- 8. Infrastructure Status History (7-day degradation progression for demo charts)
INSERT INTO infrastructure_status_history (id, infrastructure_id, health_score, failure_probability, created_at) VALUES
-- Dadar Escalator South degradation from 98% to 15%
('sh_dadar_1', 'inf_dadar_esc5', 98, 0.02, '2026-06-04 08:00:00'),
('sh_dadar_2', 'inf_dadar_esc5', 92, 0.08, '2026-06-05 08:00:00'),
('sh_dadar_3', 'inf_dadar_esc5', 85, 0.15, '2026-06-06 08:00:00'),
('sh_dadar_4', 'inf_dadar_esc5', 71, 0.29, '2026-06-07 08:00:00'),
('sh_dadar_5', 'inf_dadar_esc5', 54, 0.46, '2026-06-08 08:00:00'),
('sh_dadar_6', 'inf_dadar_esc5', 35, 0.65, '2026-06-09 08:00:00'),
('sh_dadar_7', 'inf_dadar_esc5', 15, 0.85, '2026-06-10 08:00:00'),

-- Andheri Metro Interchange Escalator degradation from 96% to 22%
('sh_andheri_1', 'inf_andheri_esc2', 96, 0.04, '2026-06-04 09:00:00'),
('sh_andheri_2', 'inf_andheri_esc2', 80, 0.20, '2026-06-06 09:00:00'),
('sh_andheri_3', 'inf_andheri_esc2', 52, 0.48, '2026-06-08 09:00:00'),
('sh_andheri_4', 'inf_andheri_esc2', 22, 0.78, '2026-06-10 09:00:00'),

-- Thane East Parking EV Charger C degradation from 99% to 12%
('sh_thane_1', 'inf_thane_charger3', 99, 0.01, '2026-06-04 10:00:00'),
('sh_thane_2', 'inf_thane_charger3', 88, 0.12, '2026-06-06 10:00:00'),
('sh_thane_3', 'inf_thane_charger3', 48, 0.52, '2026-06-08 10:00:00'),
('sh_thane_4', 'inf_thane_charger3', 12, 0.88, '2026-06-10 10:00:00'),

-- CSMT Escalator 1 (Constant stable healthy asset)
('sh_csmt_1', 'inf_cst_esc1', 98, 0.02, '2026-06-04 12:00:00'),
('sh_csmt_2', 'inf_cst_esc1', 98, 0.02, '2026-06-06 12:00:00'),
('sh_csmt_3', 'inf_cst_esc1', 98, 0.02, '2026-06-08 12:00:00'),
('sh_csmt_4', 'inf_cst_esc1', 98, 0.02, '2026-06-10 12:00:00');

