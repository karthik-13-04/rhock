const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkVendors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Vendor = mongoose.model('Vendor', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors`);

    for (const vendor of vendors) {
      console.log(`Vendor: ${vendor._id}, Store: ${vendor.storeName || 'N/A'}, Mobile: ${vendor.mobileNumber}, userId: ${vendor.userId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVendors();
