/**
 * Generate a random 4-digit OTP
 * @returns {string}
 */
export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
