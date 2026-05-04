import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from './models/plan.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

const samplePlans = [
  {
    name: 'STANDARD',
    price: 4699,
    validityDays: 30,
    credits: 20,
    description: 'Basic plan for small businesses',
    isActive: true
  },
  {
    name: 'PREMIUM',
    price: 9499,
    validityDays: 30,
    credits: 40,
    description: 'Best for growing businesses',
    isActive: true
  },
  {
    name: 'ENTERPRISE',
    price: 19999,
    validityDays: 90,
    credits: 100,
    description: 'Ultimate power for established vendors',
    isActive: true
  }
];

async function seedPlans() {
  try {
    await dbConnect();
    
    // Clear existing plans to avoid duplicates
    await Plan.deleteMany({});
    console.log('🗑️ Existing plans cleared.');

    // Insert new plans
    await Plan.insertMany(samplePlans);
    console.log('✅ Sample plans seeded successfully!');
    
    const count = await Plan.countDocuments();
    console.log(`Total plans in DB: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedPlans();
