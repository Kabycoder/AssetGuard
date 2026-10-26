import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verification.service';
import { ApiResponse } from '../types';
import {
  PaginatedVerificationResponse,
  VerificationDetailResponse,
} from '../types/verification.types';

export class VerificationController {
  /**
   * GET /api/v1/verification
   * Returns paginated queue of assets awaiting verification or verified.
   */
  async getQueue(
    req: Request,
    res: Response<ApiResponse<PaginatedVerificationResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await verificationService.getVerificationQueue(req.query);
      res.status(200).json({
        success: true,
        message: 'Verification queue retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/verification/:assetId
   * Returns asset information and full verification history.
   */
  async getDetail(
    req: Request,
    res: Response<ApiResponse<VerificationDetailResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const detail = await verificationService.getAssetVerificationDetail(assetId);

      if (!detail) {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${assetId}' was not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Asset verification details retrieved successfully.',
        data: detail,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/verification/:assetId/verify
   * Admin approves/verifies wiping on an asset. ADMIN only.
   */
  async verify(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to verify assets.',
        });
        return;
      }

      const result = await verificationService.verifyAsset(
        assetId,
        adminId,
        req.body || {}
      );

      res.status(200).json({
        success: true,
        message:
          'Data sanitization verified and approved. Asset status is now VERIFIED and cleared for final disposition.',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'ASSET_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${req.params.assetId}' was not found.`,
        });
        return;
      }

      if (error.message === 'INVALID_WORKFLOW_STATE') {
        res.status(409).json({
          success: false,
          message:
            'Cannot verify asset: Asset is not in WIPING_COMPLETED state awaiting verification.',
        });
        return;
      }

      if (error.message === 'NO_COMPLETED_WIPING_RECORD') {
        res.status(409).json({
          success: false,
          message:
            'Cannot verify asset: No completed data wiping record found for this asset.',
        });
        return;
      }

      next(error);
    }
  }

  /**
   * POST /api/v1/verification/:assetId/reject
   * Admin rejects wiping on an asset with a reason. ADMIN only.
   */
  async reject(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const adminId = req.user?.userId;
      const { rejectionReason, remarks } = req.body || {};

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to reject verification.',
        });
        return;
      }

      if (
        !rejectionReason ||
        typeof rejectionReason !== 'string' ||
        !rejectionReason.trim()
      ) {
        res.status(400).json({
          success: false,
          message: 'A rejection reason is required to reject verification.',
        });
        return;
      }

      const result = await verificationService.rejectAsset(assetId, adminId, {
        rejectionReason: rejectionReason.trim(),
        remarks: remarks ? String(remarks).trim() : undefined,
      });

      res.status(200).json({
        success: true,
        message:
          'Data sanitization rejected. Asset returned to WIPING_PENDING for technician re-wiping.',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'ASSET_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${req.params.assetId}' was not found.`,
        });
        return;
      }

      if (error.message === 'INVALID_WORKFLOW_STATE') {
        res.status(409).json({
          success: false,
          message:
            'Cannot reject verification: Asset is not in WIPING_COMPLETED state.',
        });
        return;
      }

      if (error.message === 'REJECTION_REASON_REQUIRED') {
        res.status(400).json({
          success: false,
          message: 'A valid rejection reason must be provided.',
        });
        return;
      }

      next(error);
    }
  }
}

export const verificationController = new VerificationController();
