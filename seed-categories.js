import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/category.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

const categories = [
  { name: 'Electronics' },
  { name: 'Fashion' },
  { name: 'Grocery' },
  { name: 'Home & Kitchen' },
  { name: 'Beauty' },
  { name: 'Services' },
  { name: 'Others' }
];

async function seedCategories() {
  try {
    await dbConnect();
    
    console.log('Seeding categories...');
    
    // Clear existing (optional - commented out for safety)
    // await Category.deleteMany({});
    
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }
    
    const allCats = await Category.find({});
    console.log('✅ Categories seeded successfully:', allCats.map(c => ({ id: c._id, name: c.name })));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedCategories();
