import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
}

export class ErrorMiddleware {
  public static notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
    res.status(404).json({
      success: false,
      message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`
    });
  }

  public static errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi phát sinh từ máy chủ nội bộ';

    // Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
      statusCode = 400;
      message = 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp giá trị duy nhất)';
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Định dạng ID không hợp lệ';
    }

    // Mongoose ValidationError
    if (err.name === 'ValidationError' && err.errors) {
      statusCode = 400;
      const details = Object.values(err.errors).map((e) => e.message);
      message = details.join(', ');
    }

    // Multer limit error
    if (err.name === 'MulterError') {
      statusCode = 400;
      message = `Lỗi tải lên tệp: ${err.message}`;
    }

    console.error(`[Error] ${statusCode} - ${message}`);

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
  }
}

export default ErrorMiddleware;
