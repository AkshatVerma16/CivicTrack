USE `civictrack`;

SELECT COUNT(*) AS admin_count FROM admins;
SELECT id,email FROM admins ORDER BY id DESC;
SELECT COUNT(*) AS complaint_count FROM complaints;
SELECT id,user_id,status,department,created_at FROM complaints ORDER BY id DESC LIMIT 10;





