import { Router } from 'express';
import { Role } from '@prisma/client';
import { sanitizationController } from '../controllers/sanitization.controller';
import {
  authenticateToken,
  authorizeRoles,
  authorizeStrictRoles,
} from '../middleware/auth.middleware';

export const sanitizationRouter = Router();

// All Sanitization endpoints require authentication
sanitizationRouter.use(authenticateToken);

// View queue and asset sanitization history (ADMIN, IT_OFFICER)
sanitizationRouter.get(
  '/',
  authorizeRoles(Role.ADMIN, Role.IT_OFFICER),
  (req, res, next) => sanitizationController.getQueue(req, res, next)
);

sanitizationRouter.get(
  '/:assetId',
  authorizeRoles(Role.ADMIN, Role.IT_OFFICER),
  (req, res, next) => sanitizationController.getHistory(req, res, next)
);

// Sanitization workflow mutations: Strictly restricted to IT_OFFICER
sanitizationRouter.post(
  '/:assetId/start',
  authorizeStrictRoles(Role.IT_OFFICER),
  (req, res, next) => sanitizationController.start(req, res, next)
);

sanitizationRouter.post(
  '/:assetId/complete',
  authorizeStrictRoles(Role.IT_OFFICER),
  (req, res, next) => sanitizationController.complete(req, res, next)
);

sanitizationRouter.post(
  '/:assetId/fail',
  authorizeStrictRoles(Role.IT_OFFICER),
  (req, res, next) => sanitizationController.fail(req, res, next)
);
