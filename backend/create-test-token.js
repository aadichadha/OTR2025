const jwt = require('jsonwebtoken');

// Create a test token for the admin user
const payload = {
  userId: 1,
  email: 'admin@demo.com',
  name: 'Demo Admin',
  role: 'admin'
};

// Use the fallback secret that the backend is actually using (since JWT_SECRET is NOT SET)
const secret = 'your-secret-key';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('🔑 Generated test token:');
console.log(token);
console.log('\n📋 Use this token in your API requests:');
console.log(`Authorization: Bearer ${token}`); 