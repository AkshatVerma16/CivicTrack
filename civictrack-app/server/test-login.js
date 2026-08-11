const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@civictrack.com',
      password: 'admin' // typical default
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR STATUS:", err.response ? err.response.status : err.message);
    console.log("ERROR DATA:", err.response ? err.response.data : err.message);
  }
}

testLogin();
