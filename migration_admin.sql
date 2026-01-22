-- Update an existing user to be an admin
UPDATE profiles
SET role = 'admin'
WHERE correo = 'admin@example.com';
