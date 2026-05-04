import mongoose from 'mongoose';
import { dbConnect } from '../config/database.js';
import User from '../models/user.model.js';
import ReferralLog from '../models/referralLog.model.js';
import { UserService } from '../modules/user/user.service.js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * Script to verify the transaction-safe referral reward logic
 */
async function verifyReferralTransaction() {
  try {
    // Ensure DB connection
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // 1. Cleanup existing test data to ensure clean state
    await User.deleteMany({ email: /test-referral/ });
    // Note: We don't delete all ReferralLogs in production, but for this scratch test we look for specific ones
    
    // 2. Create a Mock Referrer
    const referrer = await User.create({
      firstName: 'Referrer',
      lastName: 'User',
      email: 'referrer' + Date.now() + '@test-referral.com',
      phone: '1' + Math.floor(Math.random() * 1000000000),
      referralCode: 'REF' + Math.floor(Math.random() * 10000),
      role: 'user',
      coinBalance: 1000 // Starting balance
    });
    console.log(`✅ Created Test Referrer: ${referrer.referralCode} (Balance: ${referrer.coinBalance})`);

    // 3. Create a Mock New User (The one who will apply the code)
    const newUser = await User.create({
      firstName: 'New',
      lastName: 'User',
      email: 'newuser' + Date.now() + '@test-referral.com',
      phone: '2' + Math.floor(Math.random() * 1000000000),
      referralCode: 'NEW' + Math.floor(Math.random() * 10000),
      role: 'user',
      coinBalance: 0 // Starting balance
    });
    console.log(`✅ Created Test New User: ${newUser.email} (Balance: ${newUser.coinBalance})`);

    // 4. Test: Core Referral Logic
    console.log('\n🚀 Step 1: Applying referral code...');
    const result = await UserService.applyReferral(newUser._id, referrer.referralCode);
    console.log('✨ Service Response:', JSON.stringify(result, null, 2));

    // 5. Audit Verification
    const updatedUser = await User.findById(newUser._id);
    const updatedReferrer = await User.findById(referrer._id);
    const log = await ReferralLog.findOne({ newUserId: newUser._id });

    console.log('\n--- Balance & Audit Check ---');
    console.log(`New User Coins: ${updatedUser.coinBalance} (Expected: 200)`);
    console.log(`Referrer Coins: ${updatedReferrer.coinBalance} (Expected: 1500)`);
    console.log(`Database Link Set: ${updatedUser.referredBy.toString() === referrer._id.toString() ? '✅ YES' : '❌ NO'}`);
    console.log(`Referral Log Created: ${log ? '✅ YES' : '❌ NO'}`);

    if (updatedUser.coinBalance === 200 && updatedReferrer.coinBalance === 1500 && log) {
      console.log('\n✅ Transaction test PASSED.');
    } else {
      console.log('\n❌ Transaction test FAILED.');
    }

    // 6. Abuse Prevention: Attempt self-referral
    console.log('\n🚀 Step 2: Testing self-referral prevention...');
    try {
      await UserService.applyReferral(referrer._id, referrer.referralCode);
      console.log('❌ Error: Self-referral was allowed!');
    } catch (err) {
      console.log('✅ Success: Blocked self-referral with message:', err.message);
    }

    // 7. Abuse Prevention: Attempt double-application
    console.log('\n🚀 Step 3: Testing duplicate application prevention...');
    try {
      await UserService.applyReferral(newUser._id, referrer.referralCode);
      console.log('❌ Error: Double-application was allowed!');
    } catch (err) {
      console.log('✅ Success: Blocked double-application with message:', err.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification script failed:', error);
    process.exit(1);
  }
}

verifyReferralTransaction();
