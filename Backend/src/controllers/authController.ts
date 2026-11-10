import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type { RegisterRequestBody, LoginRequestBody } from '../types/index.js';

export class AuthController {
  public static async register(
    req: Request<Record<string, never>, unknown, RegisterRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, password, phoneNumber } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Họ tên, email và mật khẩu là bắt buộc'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có tối thiểu 6 ký tự'
        });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email này đã được sử dụng'
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        role: 'client'
      });

      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
      const token = jwt.sign(
        {
          id: newUser._id.toString(),
          role: newUser.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phoneNumber: newUser.phoneNumber
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(
    req: Request<Record<string, never>, unknown, LoginRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mật khẩu'
        });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.password) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
      const token = jwt.sign(
        {
          id: user._id.toString(),
          role: user.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập'
        });
        return;
      }

      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          googleId: user.googleId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
