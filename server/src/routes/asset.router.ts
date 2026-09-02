import { Router } from 'express';
import { Role } from '@prisma/client';
import { assetController } from '../controllers/asset.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

export const assetRouter = Router();

// All Asset routes require authentication
assetRouter.use(authenticateToken);

// View routes: Accessible by ADMIN, IT_OFFICER, and DISPOSAL_OFFICER
assetRouter.get('/', (req, res, next) => assetController.getAll(req, res, next));
assetRouter.get('/:id', (req, res, next) => assetController.getById(req, res, next));

// Mutation routes: Restricted strictly to ADMIN role
assetRouter.post(
  '/',
  authorizeRoles(Role.ADMIN),
  (req, res, next) => assetController.create(req, res, next)
);

assetRouter.put(
  '/:id',
  authorizeRoles(Role.ADMIN),
  (req, res, next) => assetController.update(req, res, next)
);

assetRouter.delete(
  '/:id',
  authorizeRoles(Role.ADMIN),
  (req, res, next) => assetController.delete(req, res, next)
);
