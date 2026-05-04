import crypto from 'crypto';

/**
 * Verify Razorpay Payment Signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!secret) {
    console.error('🚫 RAZORPAY_KEY_SECRET missing in environment');
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + "|" + paymentId)
    .digest('hex');

  return generatedSignature === signature;
};
