DELETE FROM users WHERE email = 'test@example.com';
INSERT INTO users (email, password, name, role) VALUES (
  'test@example.com',
  '$2a$12$xEt.KRsEY3S0ha.qTVl5se5PLq5aZ1pXfhX4PfPow/NI8Qys3EEJq',
  'Test User',
  'user'
); 