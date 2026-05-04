import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

const ADMIN_PHONE = '9493865707';

async function seedAdmin() {
  try {
    await dbConnect();
    
    // Find or create the user
    let user = await User.findOne({ phone: ADMIN_PHONE });
    
    if (user) {
      user.role = 'admin';
      user.firstName = 'Super';
      user.lastName = 'Admin';
      await user.save();
      console.log(`✅ User ${ADMIN_PHONE} promoted to ADMIN.`);
    } else {
      user = new User({
        phone: ADMIN_PHONE,
        role: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        phoneVerified: true
      });
      await user.save();
      console.log(`✅ New ADMIN created with phone ${ADMIN_PHONE}.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin seeding failed:', error);
    process.exit(1);
  }
}

seedAdmin();
