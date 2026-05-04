import Otp from '../models/otp.model.js';
import User from '../models/user.model.js';
import { generateOtp, getOtpExpiryTime, isOtpExpired } from '../utils/generateOtp.js';
import { generateToken } from '../utils/jwt.js';
import { isValidEmail, isValidPhone } from '../middleware/validation.middleware.js';

/**
 * Auth Service
 * Handles OTP generation, sending, and verification logic
 */

/**
 * Send OTP to email or phone
 * Creates or finds user, generates OTP, stores in DB
 * 
 * @param {string} identifier - Email or phone number
 * @param {string} type - 'email' or 'phone'
 * @param {string} ipAddress - Request IP for security tracking
 * @returns {Promise<object>} OTP record and expiry info
 */
export async function sendOtp(identifier, type, ipAddress) {
  // Validate identifier format
  if (type === 'email' && !isValidEmail(identifier)) {
    throw { statusCode: 400, message: 'Invalid email format', errorType: 'VALIDATION_ERROR' };
  }

  if (type === 'phone' && !isValidPhone(identifier)) {
    throw { statusCode: 400, message: 'Invalid phone number (10 digits, starting with 6-9)', errorType: 'VALIDATION_ERROR' };
  }

  // Check if user exists, create if not
  let user = await User.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
    ],
  });

  if (!user) {
    // Create new user with identifier
    const userData = type === 'email'
      ? { email: identifier, referralCode: generateReferralCode() }
      : { phone: identifier, referralCode: generateReferralCode() };

    user = await User.create(userData);
  }

  // Invalidate any existing active OTPs for this identifier
  await Otp.deleteMany({
    target: identifier,
    isVerified: false,
    expiresAt: { $gt: new Date() },
  });

  // Generate new OTP
  const otpCode = generateOtp();
  const expiresAt = getOtpExpiryTime();

  // Store OTP in database
  const otpRecord = await Otp.create({
    target: identifier,
    code: otpCode,
    type,
    expiresAt,
    userId: user._id,
    ipAddress,
  });

  // TODO: Integrate email/SMS service to deliver OTP
  // For now, log OTP for testing (remove in production)
  console.log(`\n🔐 OTP for ${identifier}: ${otpCode} (expires in ${process.env.OTP_EXPIRY_MINUTES || 5} min)\n`);

  return {
    message: `OTP sent to ${type === 'email' ? 'email' : 'phone'}`,
    expiresAt,
    targetMasked: maskIdentifier(identifier, type),
  };
}

/**
 * Verify OTP code
 * Validates the OTP, marks as verified, returns JWT token
 * 
 * @param {string} identifier - Email or phone number
 * @param {string} code - OTP code entered by user
 * @returns {Promise<object>} JWT token and user data
 */
export async function verifyOtp(identifier, code) {
  // Find the latest active OTP for this identifier
  const otpRecord = await Otp.findOne({
    target: identifier,
    isVerified: false,
    expiresAt: { $gt: new Date() }, // Not expired
  }).sort({ createdAt: -1 });

  // No active OTP found
  if (!otpRecord) {
    throw {
      statusCode: 400,
      message: 'No active OTP found. Please request a new one.',
      errorType: 'AUTHENTICATION_ERROR'
    };
  }

  // Check max attempts
  if (otpRecord.isMaxAttemptsReached()) {
    throw {
      statusCode: 429,
      message: 'Too many failed attempts. Please request a new OTP.',
      errorType: 'RATE_LIMIT_ERROR'
    };
  }

  // Verify OTP code
  if (otpRecord.code !== code) {
    await otpRecord.incrementAttempts();

    const remainingAttempts = 5 - otpRecord.attempts;
    throw {
      statusCode: 400,
      message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
      errorType: 'AUTHENTICATION_ERROR',
      details: { remainingAttempts },
    };
  }

  // OTP is valid - mark as verified
  await otpRecord.markVerified();

  // Find the user
  const user = await User.findById(otpRecord.userId);

  if (!user) {
    throw {
      statusCode: 404,
      message: 'User not found',
      errorType: 'NOT_FOUND_ERROR'
    };
  }

  // Update verification status
  if (otpRecord.type === 'email' || otpRecord.type === 'both') {
    user.emailVerified = true;
  }
  if (otpRecord.type === 'phone' || otpRecord.type === 'both') {
    user.phoneVerified = true;
  }

  // Update status to active if still pending
  if (user.status === 'pending') {
    user.status = 'active';
  }

  // Update last login
  await user.updateLastLogin();

  // Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    phone: user.phone,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      coinBalance: user.coinBalance,
    },
  };
}

/**
 * Helper: Mask identifier for security (show last 3 chars)
 */
function maskIdentifier(identifier, type) {
  if (type === 'email') {
    const [name, domain] = identifier.split('@');
    const maskedName = name.length > 2
      ? name[0] + '***' + name[name.length - 1]
      : '***';
    return `${maskedName}@${domain}`;
  }

  // Phone
  return '******' + identifier.slice(-3);
}

/**
 * Helper: Generate unique referral code
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RH';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
