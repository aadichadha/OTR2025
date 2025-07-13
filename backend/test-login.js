const bcrypt = require('bcrypt');

async function testLogin() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash for password123:', hash);
  
  // Test if our hash matches the stored hash
  const storedHash = '$2a$10$5SyyHlOe/H3re58eBDmmAO0aR9xL01gdK3QZ5oQis/wW3ssC67L.K';
  const isMatch = await bcrypt.compare(password, storedHash);
  console.log('Password matches stored hash:', isMatch);
}

testLogin().catch(console.error); 