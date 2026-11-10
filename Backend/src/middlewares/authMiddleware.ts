import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthJwtPayload } from '../types/index.js';

export class AuthMiddleware {
  public static verifyToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập hoặc token không được cung cấp'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
      return;
    }

    try {
      const secret = process.env.JWT_SECRET || 'default_jwt_secret';
      const decoded = jwt.verify(token, secret) as AuthJwtPayload;
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      next();
    } catch {
      res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  }

  public static isAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Yêu cầu xác thực tài khoản'
      });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này (yêu cầu quyền Admin)'
      });
      return;
    }

    next();
  }
}

export default AuthMiddleware;
