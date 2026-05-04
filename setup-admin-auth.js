import User from './models/user.model.js';
import { dbConnect } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupAdminAuth() {
  try {
    await dbConnect();
    const adminPhone = '9493865707';
    const user = await User.findOne({ phone: adminPhone });
    
    if (user) {
      user.email = 'admin@test.com';
      user.password = '123456';
      await user.save();
      console.log('✅ Admin auth updated: admin@test.com / 123456');
    } else {
      console.log('❌ Admin user not found. Please run seed-admin.js first.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to setup admin auth:', error);
    process.exit(1);
  }
}

setupAdminAuth();
