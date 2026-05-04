import { AuthService } from '@/modules/auth/auth.service.js';
import { authLimiter, otpLimiter } from '@/middleware/rateLimiter.js';

export class AuthController {
  /**
   * Controller for the POST /api/auth/send-otp endpoint
   */
  static async sendOtp(req) {
    try {
      // 1. Apply Rate Limiting
      const limitError = await otpLimiter(req);
      if (limitError) return limitError;

      // 2. Parse Body safely
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid or missing JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { mobileNumber } = body;

      if (!mobileNumber || mobileNumber.length !== 10) {
        return new Response(
          JSON.stringify({ success: false, message: 'Please provide a valid 10-digit mobile number' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await AuthService.sendVendorOtp(mobileNumber);

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('[AuthController.sendOtp Error]', error);
      
      const errorMessage = error?.message || '';
      const isRateLimit = errorMessage.includes('Rate limit');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: isRateLimit ? errorMessage : 'Internal server error' 
        }),
        { 
          status: isRateLimit ? 429 : 500, // Return 500 for actual server crashes to help debugging
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  /**
   * Controller for the POST /api/auth/check-user endpoint
   */
  static async checkUser(req) {
    try {
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid body' }), { status: 400 });
      }

      const { mobileNumber } = body;
      if (!mobileNumber) {
        return new Response(JSON.stringify({ success: false, message: 'Mobile number required' }), { status: 400 });
      }

      const result = await AuthService.checkUser(mobileNumber);
      return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
  }

  /**
   * Controller for the POST /api/auth/register endpoint
   */
  static async register(req) {
    try {
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid body' }), { status: 400 });
      }

      const { fullName, email, mobileNumber, state, district, mandal } = body;
      if (!fullName || !email || !mobileNumber || !state || !district || !mandal) {
        return new Response(JSON.stringify({ success: false, message: 'All fields are required' }), { status: 400 });
      }

      const result = await AuthService.registerUser(body);
      return new Response(JSON.stringify(result), { status: 201 });
    } catch (error) {
      console.error('[AuthController.register Error]', error);
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
    }
  }

  /**
   * Controller for the POST /api/auth/verify-otp endpoint
   */
  static async verifyOtp(req) {
    try {
      // 1. Apply Rate Limiting
      const limitError = await authLimiter(req);
      if (limitError) return limitError;

      // 2. Parse Body safely
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid or missing JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { mobileNumber, otp } = body;

      if (!mobileNumber || !otp) {
        return new Response(
          JSON.stringify({ success: false, message: 'Mobile number and OTP are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const result = await AuthService.verifyVendorOtp(mobileNumber, String(otp));

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('[AuthController.verifyOtp Error]', error);
      
      const errorMessage = error?.message || '';
      const message = errorMessage.includes('Invalid or expired OTP') || errorMessage.includes('Too many failed') 
        ? errorMessage 
        : 'Internal server error';

      return new Response(
        JSON.stringify({ success: false, message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}
