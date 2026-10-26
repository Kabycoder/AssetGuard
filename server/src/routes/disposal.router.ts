import { Router } from 'express';
import { Role } from '@prisma/client';
import { disposalController } from '../controllers/disposal.controller';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/auth.middleware';

export const disposalRouter = Router();

// All disposal endpoints require authentication
disposalRouter.use(authenticateToken);

// View queue and disposal details
disposalRouter.get(
  '/',
  authorizeRoles(Role.ADMIN, Role.DISPOSAL_OFFICER, Role.IT_OFFICER),
  (req, res, next) => disposalController.getQueue(req, res, next)
);

disposalRouter.get(
  '/:assetId',
  authorizeRoles(Role.ADMIN, Role.DISPOSAL_OFFICER, Role.IT_OFFICER),
  (req, res, next) => disposalController.getById(req, res, next)
);

// Record disposal: restricted to ADMIN and DISPOSAL_OFFICER
disposalRouter.post(
  '/:assetId',
  authorizeRoles(Role.ADMIN, Role.DISPOSAL_OFFICER),
  (req, res, next) => disposalController.recordDisposal(req, res, next)
);
