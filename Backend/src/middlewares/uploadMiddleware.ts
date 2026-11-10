import multer from 'multer';
import type { Request, RequestHandler } from 'express';

export class UploadMiddleware {
  private static instance = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback
    ): void => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Chỉ chấp nhận tệp hình ảnh (JPEG, PNG, WEBP, v.v.)'));
      }
    }
  });

  public static single(fieldName: string): RequestHandler {
    return this.instance.single(fieldName);
  }

  public static get uploader(): multer.Multer {
    return this.instance;
  }
}

export default UploadMiddleware;
