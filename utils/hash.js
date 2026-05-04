import bcrypt from 'bcrypt';

/**
 * Hash data using bcrypt
 * @param {string} data 
 * @returns {Promise<string>}
 */
export const hashData = async (data) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(data, salt);
};

/**
 * Compare plain text data with a hash
 * @param {string} data 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export const compareHash = async (data, hash) => {
  return await bcrypt.compare(data, hash);
};
