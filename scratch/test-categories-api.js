import mongoose from 'mongoose';
import { dbConnect } from '../config/database.js';
import { CategoryService } from '../modules/category/category.service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCategoriesAPI() {
  try {
    console.log('Connecting to DB...');
    await dbConnect();
    console.log('Connected.');

    // Test 1: Fetch active categories
    console.log('--- Test 1: Fetch Active Categories ---');
    const categories = await CategoryService.getActiveCategories();
    console.log(`Total Active Categories: ${categories.length}`);
    
    if (categories.length > 0) {
      console.log('Sample Category:', JSON.stringify(categories[0], null, 2));
    } else {
      console.log('No active categories found in database.');
    }

    console.log('DONE.');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testCategoriesAPI();
