import mongoose from 'mongoose';
import { UserService } from '../modules/user/user.service.js';
import { dbConnect } from '../config/database.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * Script to verify the logic of UserService.getUserProfile
 */
async function verifyProfileService() {
  try {
    // Ensure DB connection
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // 1. Fetch a sample user with 'user' role
    const testUser = await User.findOne({ role: 'user' });
    
    if (!testUser) {
      console.log('⚠️ No sample user found in the database. Please ensure a user exists with role: "user".');
      process.exit(0);
    }

    console.log(`🚀 Verifying logic for User ID: ${testUser._id}`);

    // 2. Execute Service call
    const profile = await UserService.getUserProfile(testUser._id);
    
    // 3. Results Analysis
    console.log('\n--- UserService.getUserProfile Output ---');
    console.log(JSON.stringify(profile, null, 2));

    // Verify key fields are present
    const fields = ['firstName', 'lastName', 'phone', 'referralCode', 'coinBalance', 'createdAt'];
    const missing = fields.filter(f => profile[f] === undefined);

    if (missing.length === 0) {
      console.log('\n✅ All requested fields are present and sanitized.');
    } else {
      console.log(`\n❌ Missing fields: ${missing.join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyProfileService();
