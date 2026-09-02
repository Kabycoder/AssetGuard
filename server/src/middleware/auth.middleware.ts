import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { JwtPayload } from '../types/auth.types';

/**
 * Middleware to authenticate JWT Bearer tokens from incoming Authorization headers.
 * Attaches decoded payload (userId, email, role) to req.user.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authorization header provided.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Access denied. Malformed authorization token. Format must be "Bearer <token>".',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access token has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or corrupted access token.',
    });
    return;
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 * ADMIN role automatically has access to all protected resources.
 */
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before verifying role permissions.',
      });
      return;
    }

    // ADMIN has full authorized access across all protected resources
    if (req.user.role === Role.ADMIN || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required roles: [${allowedRoles.join(', ')}].`,
    });
  };
};
