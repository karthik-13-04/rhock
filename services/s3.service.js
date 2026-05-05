import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3 Storage Service
 * Handles media uploads to Contabo S3 via the official AWS SDK.
 * This resolves signature mismatch issues caused by special characters (like colons) in bucket names.
 */
export class S3Service {
  static _client = null;

  /**
   * Lazy-load the S3 client to ensure environment variables are loaded
   */
  static get client() {
    if (!this._client) {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION || 'SIN';
      
      // Robustly parse domain: remove protocol and any trailing path
      const rawDomain = process.env.AWS_S3_DOMAIN || '';
      const domainWithoutProtocol = rawDomain.replace(/^https?:\/\//i, '');
      const s3Domain = domainWithoutProtocol.split('/')[0];

      if (!accessKeyId || !secretAccessKey || !s3Domain) {
        console.error('[S3Service] Missing environment variables:', {
          accessKeyId: !!accessKeyId,
          secretAccessKey: !!secretAccessKey,
          s3Domain: !!s3Domain,
          rawDomain: rawDomain
        });
      }

      this._client = new S3Client({
        region,
        endpoint: `https://${s3Domain}`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Contabo requires path style access
      });
      
      console.log(`[S3Service] Initialised for endpoint: https://${s3Domain} (Region: ${region})`);
    }
    return this._client;
  }

  /**
   * Upload a file to S3
   * @param {File|Blob|Buffer} file   File object from FormData or Buffer
   * @param {string}   folder  Destination folder/prefix (e.g. "profiles")
   * @param {string}   customName Optional custom filename
   * @param {string}   customType Optional custom MIME type
   * @returns {Promise<{url: string, key: string, publicId: string}>}
   */
  static async upload(file, folder = 'general', customName = null, customType = null) {
    try {
      // ── Materialise the bytes ───────────────────────────────────────────
      let buffer;
      if (file && typeof file.arrayBuffer === 'function') {
        buffer = Buffer.from(await file.arrayBuffer());
      } else if (Buffer.isBuffer(file)) {
        buffer = file;
      } else if (file instanceof Uint8Array) {
        buffer = Buffer.from(file);
      } else {
        buffer = file;
      }

      if (!buffer || buffer.length === 0) {
        throw new Error('Upload file is empty (0 bytes).');
      }

      const originalName = customName || file.name || 'upload';
      const extension = originalName.split('.').pop().toLowerCase() || 'bin';
      const key = `${folder}/${crypto.randomUUID()}.${extension}`;
      
      const mimeMap = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf'
      };

      const contentType = customType || (file.type && file.type !== 'application/octet-stream'
        ? file.type
        : (mimeMap[extension] || 'application/octet-stream'));

      const bucketName = process.env.AWS_BUCKET_NAME;
      const rawDomain = process.env.AWS_S3_DOMAIN || '';
      const s3Domain = rawDomain.replace(/^https?:\/\//i, '').split('/')[0];

      console.log(`[S3Service.upload] Start: ${originalName} (${buffer.length} bytes)`);
      console.log(`[S3Service.upload] Target: bucket=${bucketName}, key=${key}, type=${contentType}`);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length, // Explicitly set content length
      });

      await this.client.send(command);

      const url = `https://${s3Domain}/${bucketName}/${key}`;
      console.log(`[S3Service.upload] SUCCESS: ${url}`);

      return { url, key, publicId: key };
    } catch (error) {
      console.error('[S3Service.upload Error]:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key  File key (path inside the bucket)
   */
  static async delete(key) {
    if (!key) return;
    
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      console.log(`[S3Service.delete] Deleting key: ${key} from bucket: ${bucketName}`);

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.client.send(command);
      console.log('[S3Service.delete] SUCCESS');
    } catch (error) {
      console.error('[S3Service.delete Error]:', error);
    }
  }
}

/**
 * Standalone upload utility (exported for compatibility)
 */
export const uploadToS3 = async (file, folder, customName, customType) => {
  return await S3Service.upload(file, folder, customName, customType);
};
