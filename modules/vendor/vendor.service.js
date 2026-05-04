import Vendor from '../../models/vendor.model.js';
import User from '../../models/user.model.js';
import Category from '../../models/category.model.js';
import Agent from '../../models/agent.model.js';
import Otp from '../../models/otp.model.js';
import Store from '../../models/store.model.js';
import { generateOtp } from '../../utils/generateOtp.js';
import { hashData, compareHash } from '../../utils/hash.js';
import { generateToken } from '../../utils/jwt.js';
import { dbConnect } from '../../config/database.js';

/**
 * Vendor Service
 * Handles database operations for Vendor management
 */
export class VendorService {
  /**
   * Find a vendor by their associated User ID
   * @param {string} userId
   */
  static async findVendorByUserId(userId) {
    return await Vendor.findOne({ userId });
  }

  /**
   * Upsert Step 1 Registration Data
   * CASE A: Update existing vendor
   * CASE B: Create new vendor
   * @param {Object} data Registration data (userId, fullName, email)
   */
  static async upsertVendorStep1(data) {
    const { userId, fullName, email } = data;

    // Check if vendor already exists for this user
    let vendor = await Vendor.findOne({ userId });

    if (vendor) {
      // CASE A: Update existing record
      vendor.fullName = fullName;
      vendor.email = email;
      vendor.registrationStep = 1; // Explicitly set to 1 for this step
      await vendor.save();
      return { vendor, isNew: false };
    }

    // CASE B: Create new vendor record
    // Need mobileNumber from User model
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const mobileNumber = user.phone || '0000000000'; // Fallback if phone is missing

    vendor = new Vendor({
      userId,
      fullName,
      email,
      mobileNumber,
      registrationStep: 1,
      status: 'draft',
    });

    await vendor.save();

    // Link back to User profile
    user.vendorProfile = vendor._id;
    await user.save();

    return { vendor, isNew: true };
  }

  /**
   * Update Vendor Step 2 Data
   * @param {string} userId
   * @param {Object} stepData Step 2 data
   */
  static async updateVendorStep2(userId, stepData) {
    const { categoryId, storeName, storeAbout, location, media } = stepData;

    // 1. Find vendor
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      throw new Error('Vendor profile not found. Please complete Step 1 first.');
    }

    // 2. Validate Category
    const category = await Category.findOne({ _id: categoryId, isActive: true });
    if (!category) {
      throw new Error('Invalid or inactive category selected');
    }

    // 3. Update fields
    vendor.categoryId = categoryId;
    vendor.storeName = storeName;
    vendor.storeAbout = storeAbout;
    vendor.location = location;
    vendor.media = media;
    vendor.registrationStep = 2;

    await vendor.save();
    return vendor;
  }

  /**
   * Complete Vendor Registration (Step 3)
   * @param {string} userId
   * @param {Object} stepData Step 3 data
   */
  static async completeRegistrationStep3(userId, stepData) {
    const { locationCoordinates, fullAddress, agentCode } = stepData;

    // 1. Find vendor
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    // 2. Validate current progress
    if (vendor.registrationStep < 2) {
      throw new Error('Please complete Step 2 first');
    }

    // 3. Validate Agent Code (if provided)
    let agent = null;
    if (agentCode) {
      agent = await Agent.findOne({ code: agentCode.toUpperCase(), isActive: true });
      if (!agent) {
        throw new Error('Invalid or inactive agent code');
      }
    }

    // 4. Update vendor
    vendor.locationCoordinates = locationCoordinates;
    vendor.fullAddress = fullAddress;
    vendor.agentCode = agentCode ? agentCode.toUpperCase() : undefined;
    vendor.registrationStep = 3;
    vendor.status = 'pending_approval';

    await vendor.save();

    // 5. If agent exists, link vendor
    if (agent) {
      if (!agent.assignedVendors.includes(vendor._id)) {
        agent.assignedVendors.push(vendor._id);
        await agent.save();
      }
    }

    return vendor;
  }

  /**
   * Create or Update Store Details
   * @param {string} userId 
   * @param {Object} data 
   */
  static async createStore(userId, data) {
    const { 
      businessName, category, phone, email, address, 
      state, district, mandal, location, businessHours, images 
    } = data;

    // 1. Find or create the category by name
    let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
    if (!categoryObj) {
      // For this flow, we'll create the category if it doesn't exist, or we could throw an error
      categoryObj = new Category({ name: category });
      await categoryObj.save();
    }

    // 2. Prepare update data
    const updateData = {
      storeName: businessName,
      categoryId: categoryObj._id,
      mobileNumber: phone,
      email: email,
      fullAddress: address,
      location: { state, district, mandal },
      locationCoordinates: {
        type: 'Point',
        coordinates: [location.lng, location.lat] // GeoJSON format: [lng, lat]
      },
      workingHours: businessHours,
      'media.images': images,
      status: 'pending_approval',
      registrationStep: 3 // Mark as fully submitted
    };

    // 3. Upsert vendor record for this user
    let vendor = await Vendor.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return vendor;
  }

  /**
   * Vendor Registration Step 1: Basic Details
   * AUTH: Not Required (Public)
   * @param {Object} data { ownerName, mobileNumber, email }
   */
  static async registerVendorStep1(data) {
    const { ownerName, mobileNumber, email } = data;

    await dbConnect();

    // 1. Check if user already exists with this mobile number
    let user = await User.findOne({ phone: mobileNumber });
    
    if (!user) {
      user = new User({
        phone: mobileNumber,
        email: email,
        role: 'vendor',
        status: 'active',
        phoneVerified: false
      });
      await user.save();
    } else {
      if (user.role !== 'vendor' && user.role !== 'admin') {
        user.role = 'vendor';
        await user.save();
      }
    }

    // 2. Check if vendor already exists
    let vendor = await Vendor.findOne({ userId: user._id });
    
    if (vendor) {
      // If vendor exists, we update the basic info and allow them to proceed
      vendor.fullName = ownerName;
      vendor.email = email;
      vendor.mobileNumber = mobileNumber;
      await vendor.save();
    } else {
      // 3. Create new vendor record as draft
      vendor = new Vendor({
        userId: user._id,
        fullName: ownerName,
        email: email,
        mobileNumber: mobileNumber,
        status: 'draft',
        registrationStep: 1
      });
      await vendor.save();

      // Link to user
      user.vendorProfile = vendor._id;
      await user.save();
    }

    return { vendor, user };
  }

  /**
   * Vendor Registration Step 2: Business Details
   * AUTH: Not Required (Uses vendorId)
   * @param {Object} data { vendorId, businessName, category, businessHours, images }
   */
  static async registerVendorStep2(data) {
    const { vendorId, businessName, category, businessHours, images } = data;

    await dbConnect();

    // 1. Find vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // 2. Resolve Category (search by name)
    let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
    if (!categoryObj) {
      categoryObj = new Category({ name: category });
      await categoryObj.save();
    }

    // 3. Update details
    vendor.storeName = businessName;
    vendor.categoryId = categoryObj._id;
    vendor.workingHours = businessHours;
    vendor.media.images = images;
    vendor.registrationStep = 2;

    await vendor.save();

    return vendor;
  }

  /**
   * Vendor Registration Step 3: Location + Final Submit
   * AUTH: Not Required (Uses vendorId)
   * @param {Object} data { vendorId, state, district, mandal, address, location }
   */
  static async registerVendorStep3(data) {
    const { vendorId, state, district, mandal, address, location } = data;

    await dbConnect();

    // 1. Find vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // 2. Validate current step
    if (vendor.registrationStep < 1) {
      throw new Error('Please complete Step 1 first');
    }

    // 3. Update location details
    vendor.location = { state, district, mandal };
    vendor.fullAddress = address;
    vendor.locationCoordinates = {
      type: 'Point',
      coordinates: [location.lng, location.lat]
    };
    
    // 4. Finalize
    vendor.status = 'pending_approval';
    vendor.registrationStep = 3;

    await vendor.save();

    return vendor;
  }

  /**
   * Check if a vendor exists by mobile number
   * @param {string} mobileNumber 
   */
  static async checkVendorExists(mobileNumber) {
    await dbConnect();
    const vendor = await Vendor.findOne({ mobileNumber });
    if (!vendor) {
      return { exists: false, message: 'Vendor not found' };
    }
    return { exists: true, vendorId: vendor._id };
  }

  /**
   * Send OTP to a vendor's mobile number
   * @param {string} mobileNumber 
   */
  static async sendVendorOtp(mobileNumber) {
    await dbConnect();

    // 1. Check if vendor exists
    const vendor = await Vendor.findOne({ mobileNumber });
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // 2. Generate OTP
    const plainOtp = generateOtp();
    const hashedOtp = await hashData(plainOtp);

    // 3. Save OTP (5 min expiry)
    await Otp.findOneAndUpdate(
      { target: mobileNumber, type: 'phone' },
      { 
        code: hashedOtp, 
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isVerified: false,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // 4. Log for dev
    console.log(`[SIMULATION] Vendor OTP for ${mobileNumber}: ${plainOtp}`);

    return { success: true, message: 'OTP sent successfully' };
  }

  /**
   * Verify OTP and generate token
   * @param {string} mobileNumber 
   * @param {string} otpCode 
   */
  static async verifyVendorOtp(mobileNumber, otpCode) {
    await dbConnect();

    // 1. Find OTP record
    const otpRecord = await Otp.findOne({ target: mobileNumber, type: 'phone' });
    if (!otpRecord) {
      throw new Error('OTP not found or expired');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new Error('OTP expired');
    }

    if (otpRecord.attempts >= 3) {
      throw new Error('Max attempts reached. Please request a new OTP.');
    }

    // 2. Match hashed OTP
    const isMatch = await compareHash(otpCode, otpRecord.code);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new Error('Invalid OTP');
    }

    // 3. Find Vendor and User
    const vendor = await Vendor.findOne({ mobileNumber });
    if (!vendor) {
      throw new Error('Vendor profile missing');
    }

    const user = await User.findById(vendor.userId);
    if (!user) {
      throw new Error('Associated user account not found');
    }

    // 4. Generate JWT Token
    const token = generateToken({
      userId: user._id.toString(),
      vendorId: vendor._id.toString(),
      role: 'vendor',
      mobileNumber: vendor.mobileNumber
    });

    // 5. Clean up
    await Otp.deleteOne({ _id: otpRecord._id });

    return {
      success: true,
      message: 'Login successful',
      token,
      vendor: {
        vendorId: vendor._id,
        status: vendor.status
      }
    };
  }

  /**
   * Create a new Store (Protected)
   * ONLY ACTIVE vendors can create stores
   * @param {string} vendorId 
   * @param {Object} storeData 
   */
  static async createStore(vendorId, storeData) {
    await dbConnect();

    // 1. Fetch and Validate Vendor Status
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    if (vendor.status !== 'active') {
      const error = new Error('Vendor not active');
      error.statusCode = 403;
      throw error;
    }

    // 2. Map and Validate Input
    const { 
      businessName, category, phone, email, address, 
      state, district, mandal, location, businessHours, images 
    } = storeData;

    if (!businessName || !category || !phone || !address || !location) {
      throw new Error('Missing required store details');
    }

    // 3. Create Store Record
    const store = new Store({
      vendorId,
      businessName,
      category,
      phone,
      email,
      address,
      state,
      district,
      mandal,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat] // [lng, lat]
      },
      businessHours,
      images,
      status: 'pending_approval'
    });

    await store.save();

    return store;
  }
}
