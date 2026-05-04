import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Cloudinary Service
 * Handles uploading files to Cloudinary
 */
export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   * @param {File|Blob} file File object from FormData
   * @param {string} folder Destination folder in Cloudinary
   * @returns {Promise<Object>} Cloudinary upload result
   */
  static async upload(file, folder = 'vendors') {
    try {
      // 1. Convert File/Blob to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Upload to Cloudinary using a Promise-wrapped upload_stream
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || 'rhockdeal'}/${folder}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary Upload Error:', error);
              return reject(new Error('Cloudinary upload failed'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('[CloudinaryService] Error:', error);
      throw new Error('Media upload failed');
    }
  }

  /**
   * Delete a file from Cloudinary (optional but good practice)
   * @param {string} publicId
   */
  static async delete(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary Delete Error:', error);
    }
  }
}
