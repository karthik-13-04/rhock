import Razorpay from 'razorpay';

/**
 * Razorpay Service
 * Wrapper for SDK interactions
 */
export class RazorpayService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('🚫 Razorpay Credentials Missing in .env.local');
    }

    this.instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'PLACEHOLDER_KEY',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET',
    });
  }

  /**
   * Create a new order
   * @param {number} amount In paise
   * @param {string} currency Default INR
   */
  async createOrder(amount, currency = 'INR') {
    try {
      const options = {
        amount, // Amount in paise
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await this.instance.orders.create(options);
      return order;
    } catch (error) {
      console.error('[RazorpayService CreateOrder Error]', error);
      throw new Error('Failed to initiate payment with Razorpay: ' + (error.description || error.message));
    }
  }
}

// Export a singleton instance
export const razorpayService = new RazorpayService();
