import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './models/vendor.model.js';
import Subscription from './models/subscription.model.js';
import SubscriptionPlan from './models/subscriptionPlan.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

async function seedSubscription() {
  try {
    await dbConnect();
    
    // 1. Get the first vendor (assuming one exists from our previous steps)
    const vendor = await Vendor.findOne().sort({ createdAt: -1 });
    if (!vendor) {
      console.log('❌ No vendor found. Please complete Step 1/2/3 first.');
      process.exit(1);
    }

    console.log(`Found vendor: ${vendor.fullName} (${vendor.status})`);

    // 2. Set vendor to active so they can post ads
    vendor.status = 'active';
    await vendor.save();
    console.log('✅ Vendor status updated to: active');

    // 3. Find or create a subscription plan
    let plan = await SubscriptionPlan.findOne({ name: 'Pro Plan' });
    if (!plan) {
      plan = new SubscriptionPlan({
        name: 'Pro Plan',
        price: 999,
        credits: 50,
        durationMonths: 1,
        isActive: true
      });
      await plan.save();
      console.log('✅ Created new Subscription Plan: Pro Plan');
    }

    // 4. Grant subscription with credits
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    const subscription = await Subscription.findOneAndUpdate(
      { vendorId: vendor._id },
      {
        planId: plan._id,
        creditsTotal: 50,
        creditsUsed: 0,
        expiryDate: expiry
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Subscription granted! 
      - Vendor: ${vendor.fullName}
      - Credits: ${subscription.creditsTotal}
      - Expiry: ${subscription.expiryDate.toLocaleDateString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedSubscription();
