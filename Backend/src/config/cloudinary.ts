import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

export class CloudinaryService {
  private static isConfigured = false;

  private static configure(): void {
    if (!this.isConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      this.isConfigured = true;
    }
  }

  public static async uploadToCloudinary(buffer: Buffer, folder = 'esports'): Promise<string> {
    this.configure();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary failed: Empty response'));
          }
          resolve(result.secure_url);
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }
}

export default CloudinaryService;
