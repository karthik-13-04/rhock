import mongoose from 'mongoose';
import Vendor from './models/vendor.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function diagnoseVendors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const allVendors = await Vendor.find({});
    console.log(`Found ${allVendors.length} total vendors.`);

    allVendors.forEach(v => {
      console.log(`- Vendor: ${v.storeName || 'Unnamed'} | Status: ${v.status} | RegistrationStep: ${v.registrationStep} | ID: ${v._id}`);
    });

    const pending = await Vendor.find({ status: 'pending_approval' });
    console.log(`\nFound ${pending.length} vendors with status 'pending_approval'.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diagnoseVendors();
