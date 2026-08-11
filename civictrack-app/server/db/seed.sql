USE `civictrack`;

INSERT INTO ministries (name, icon_identifier) VALUES
('Roads', 'road'),
('Water', 'water'),
('Pollution', 'leaf'),
('Education', 'graduation-cap')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO users (name, email, password, role, ministry_id) VALUES
('Akshat', 'akshat@example.com', '$2a$10$example.hash.here', 'user', NULL),
('akshat', 'akshatvision7@gmail.com', '$2b$10$CRzwxgfyQs7jcf6uWGGoh.Bl/Ks/ZdbDocD4hq4DPg4JVELBZfxka', 'admin', NULL),
('Roads Ministry', 'roads@ministry.com', '$2a$10$example.hash.here', 'ministry', (SELECT id FROM ministries WHERE name = 'Roads')),
('Water Ministry', 'water@ministry.com', '$2a$10$example.hash.here', 'ministry', (SELECT id FROM ministries WHERE name = 'Water')),
('Road Vendor 1', 'roadvendor1@example.com', '$2a$10$example.hash.here', 'vendor', NULL),
('Road Vendor 2', 'roadvendor2@example.com', '$2a$10$example.hash.here', 'vendor', NULL),
('Water Vendor 1', 'watervendor1@example.com', '$2a$10$example.hash.here', 'vendor', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO vendors (user_id, ministry_id) VALUES
((SELECT id FROM users WHERE email = 'roadvendor1@example.com'), (SELECT id FROM ministries WHERE name = 'Roads')),
((SELECT id FROM users WHERE email = 'roadvendor2@example.com'), (SELECT id FROM ministries WHERE name = 'Roads')),
((SELECT id FROM users WHERE email = 'watervendor1@example.com'), (SELECT id FROM ministries WHERE name = 'Water'))
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

INSERT INTO complaints (user_id, ministry_id, title, description, status)
SELECT 
  (SELECT id FROM users WHERE email = 'akshat@example.com'),
  m.id,
  CASE m.name 
    WHEN 'Roads' THEN 'Pothole near sector 18 gate'
    WHEN 'Water' THEN 'Water leakage in pipeline'
    WHEN 'Pollution' THEN 'Illegal dumping site'
    WHEN 'Education' THEN 'School infrastructure issue'
  END,
  CASE m.name 
    WHEN 'Roads' THEN 'There is a large pothole causing traffic issues'
    WHEN 'Water' THEN 'Water is leaking from the main pipeline'
    WHEN 'Pollution' THEN 'Illegal dumping of waste in the area'
    WHEN 'Education' THEN 'The school building needs repairs'
  END,
  CASE m.name 
    WHEN 'Roads' THEN 'Pending'
    WHEN 'Water' THEN 'In Progress'
    WHEN 'Pollution' THEN 'Complete'
    WHEN 'Education' THEN 'Pending'
  END
FROM ministries m
ON DUPLICATE KEY UPDATE title=VALUES(title);







