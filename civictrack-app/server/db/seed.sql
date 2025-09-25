USE `civictrack`;

INSERT INTO users (name, email, password) VALUES
('Akshat', 'akshat@example.com', 'pass1')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO admins (email, password) VALUES
('admin@example.com', 'secret')
ON DUPLICATE KEY UPDATE email=VALUES(email);

INSERT INTO complaints (user_id, description, latitude, longitude, status, department)
VALUES
(1, 'Pothole near sector 18 gate', 28.626, 77.210, 'Pending', 'Roads'),
(1, 'Streetlight not working', 28.621, 77.206, 'In Progress', 'Electricity'),
(1, 'Garbage not collected', 28.629, 77.214, 'Resolved', 'Sanitation');







