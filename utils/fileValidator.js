/**
 * File Validation Utility
 */
export class FileValidator {
  /**
   * Validates an image file
   * @param {File} file The file to validate
   * @param {Object} options Validation options (maxSize, allowedTypes)
   */
  static validateImage(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png']
    } = options;

    if (!file) {
      throw new Error('File is required');
    }

    // 1. Validate Type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
    }

    // 2. Validate Size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit (${(maxSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    return true;
  }
}
