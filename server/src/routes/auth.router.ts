import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { authController } from '../controllers/auth.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

export const authRouter = Router();

// Public Routes
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Protected Routes
authRouter.get('/me', authenticateToken, (req, res, next) => authController.me(req, res, next));

// RBAC Test & Demonstration Routes
authRouter.get(
  '/test/admin-only',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to Admin-only resource.',
      data: { user: req.user },
    });
  }
);

authRouter.get(
  '/test/it-only',
  authenticateToken,
  authorizeRoles(Role.IT_OFFICER),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to IT Officer resource.',
      data: { user: req.user },
    });
  }
);

authRouter.get(
  '/test/disposal-only',
  authenticateToken,
  authorizeRoles(Role.DISPOSAL_OFFICER),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to Disposal Officer resource.',
      data: { user: req.user },
    });
  }
);
