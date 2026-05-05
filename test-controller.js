import { AdminController } from './modules/admin/admin.controller.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testControllerDirectly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Mock request
    const req = {
      url: 'http://localhost:3000/api/admin/vendors?status=pending_approval'
    };

    const response = await AdminController.getVendors(req);
    const data = await response.json();

    console.log('Controller Response:', JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testControllerDirectly();
