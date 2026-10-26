import { Router } from 'express';
import { healthRouter } from './health.router';
import { authRouter } from './auth.router';
import { assetRouter } from './asset.router';
import { sanitizationRouter } from './sanitization.router';
import { verificationRouter } from './verification.router';
import { dashboardRouter } from './dashboard.router';
import { disposalRouter } from './disposal.router';
import { reportRouter } from './report.router';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/assets', assetRouter);
apiRouter.use('/sanitization', sanitizationRouter);
apiRouter.use('/verification', verificationRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/disposal', disposalRouter);
apiRouter.use('/reports', reportRouter);


