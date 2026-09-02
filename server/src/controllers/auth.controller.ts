import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../types';
import { AuthUser, LoginResponseData } from '../types/auth.types';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticate user credentials and return JWT with safe user object.
   */
  async login(
    req: Request,
    res: Response<ApiResponse<LoginResponseData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
        return;
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid email or password format.',
        });
        return;
      }

      const authData = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: authData,
      });
    } catch (error: any) {
      if (error?.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Retrieve currently authenticated user profile based on validated JWT token.
   */
  async me(
    req: Request,
    res: Response<ApiResponse<{ user: AuthUser }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const user = await authService.getCurrentUser(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Authenticated user account was not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Stateless token logout confirmation endpoint.
   */
  async logout(
    _req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
  ): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
}

export const authController = new AuthController();
