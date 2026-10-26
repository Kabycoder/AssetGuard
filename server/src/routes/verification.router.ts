import { Router } from 'express';
import { Role } from '@prisma/client';
import { verificationController } from '../controllers/verification.controller';
import {
  authenticateToken,
  authorizeRoles,
  authorizeStrictRoles,
} from '../middleware/auth.middleware';

export const verificationRouter = Router();

// All verification endpoints require authentication
verificationRouter.use(authenticateToken);

// View queue and verification details (ADMIN, IT_OFFICER)
verificationRouter.get(
  '/',
  authorizeRoles(Role.ADMIN, Role.IT_OFFICER),
  (req, res, next) => verificationController.getQueue(req, res, next)
);

verificationRouter.get(
  '/:assetId',
  authorizeRoles(Role.ADMIN, Role.IT_OFFICER),
  (req, res, next) => verificationController.getDetail(req, res, next)
);

// Verification mutations: Strictly restricted to ADMIN
verificationRouter.post(
  '/:assetId/verify',
  authorizeStrictRoles(Role.ADMIN),
  (req, res, next) => verificationController.verify(req, res, next)
);

verificationRouter.post(
  '/:assetId/reject',
  authorizeStrictRoles(Role.ADMIN),
  (req, res, next) => verificationController.reject(req, res, next)
);
