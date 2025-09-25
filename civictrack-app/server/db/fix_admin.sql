USE `civictrack`;

UPDATE admins SET password='Admin@123' WHERE email='admin@example.com';
SELECT id,email,password FROM admins WHERE email='admin@example.com';





