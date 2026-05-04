import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

async function seedUserCoins() {
  try {
    await dbConnect();
    
    // 1. Create a test user with a specific referral code and balance
    const referralCode = '89612863';
    
    let user = await User.findOne({ referralCode });
    
    if (user) {
      console.log('✅ Test user already exists. Updating balance...');
      user.coinBalance = 5000;
      await user.save();
    } else {
      console.log('✅ Creating new test user...');
      user = new User({
        firstName: 'Subramanyam',
        lastName: 'Demo',
        email: 'user@demo.com',
        phone: '9988776655',
        referralCode: referralCode,
        coinBalance: 5000,
        status: 'active',
        role: 'user'
      });
      await user.save();
    }

    console.log(`
      Test User Ready:
      Name: ${user.firstName} ${user.lastName}
      Referral Code: ${user.referralCode}
      Available Coins: ${user.coinBalance}
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedUserCoins();
