import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAdminVendors() {
  try {
    // 1. Login to get token
    console.log('Logging in as admin...');
    const loginRes = await axios.post('http://localhost:3000/api/admin/login', {
      email: 'admin@hotelrockdale.com',
      password: 'AdminPassword123!'
    });

    const token = loginRes.data.token;
    console.log('Login successful.');

    // 2. Fetch vendors
    console.log('Fetching pending vendors...');
    const vendorsRes = await axios.get('http://localhost:3000/api/admin/vendors?status=pending_approval', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Success! Found ${vendorsRes.data.data.length} pending vendors.`);
    vendorsRes.data.data.forEach(v => {
      console.log(`- ${v.storeName} (${v.status})`);
    });

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

testAdminVendors();
