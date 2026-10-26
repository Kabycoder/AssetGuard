import { Request, Response, NextFunction } from 'express';
import { sanitizationService } from '../services/sanitization.service';
import { ApiResponse } from '../types';
import {
  PaginatedSanitizationResponse,
  SanitizationDetailResponse,
} from '../types/sanitization.types';

export class SanitizationController {
  /**
   * GET /api/v1/sanitization
   * Returns paginated queue of assets undergoing or requiring sanitization.
   */
  async getQueue(
    req: Request,
    res: Response<ApiResponse<PaginatedSanitizationResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await sanitizationService.getSanitizationQueue(req.query);
      res.status(200).json({
        success: true,
        message: 'Sanitization queue retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sanitization/:assetId
   * Returns asset information and full wiping history.
   */
  async getHistory(
    req: Request,
    res: Response<ApiResponse<SanitizationDetailResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const history = await sanitizationService.getAssetSanitizationHistory(assetId);

      if (!history) {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${assetId}' was not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Asset sanitization history retrieved successfully.',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sanitization/:assetId/start
   * Starts wiping on an asset. IT_OFFICER only.
   */
  async start(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const technicianId = req.user?.userId;

      if (!technicianId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to start wiping.',
        });
        return;
      }

      const result = await sanitizationService.startWiping(
        assetId,
        technicianId,
        req.body || {}
      );

      res.status(200).json({
        success: true,
        message: 'Wiping operation started successfully. Asset status is now WIPING_IN_PROGRESS.',
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

      if (error.message === 'WIPING_ALREADY_IN_PROGRESS') {
        res.status(409).json({
          success: false,
          message:
            'A data wiping operation is already active (IN_PROGRESS) for this hardware asset.',
        });
        return;
      }

      if (error.message === 'ASSET_ALREADY_DISPOSED') {
        res.status(409).json({
          success: false,
          message: 'Cannot sanitize an asset that has already been disposed.',
        });
        return;
      }

      next(error);
    }
  }

  /**
   * POST /api/v1/sanitization/:assetId/complete
   * Marks wiping as completed. IT_OFFICER only.
   */
  async complete(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const technicianId = req.user?.userId;
      const { wipingMethod, wipingTool, remarks } = req.body || {};

      if (!technicianId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to complete wiping.',
        });
        return;
      }

      if (!wipingMethod || typeof wipingMethod !== 'string' || !wipingMethod.trim()) {
        res.status(400).json({
          success: false,
          message: 'Wiping method is required to complete sanitization.',
        });
        return;
      }

      if (!wipingTool || typeof wipingTool !== 'string' || !wipingTool.trim()) {
        res.status(400).json({
          success: false,
          message: 'Wiping tool is required to complete sanitization.',
        });
        return;
      }

      const result = await sanitizationService.completeWiping(assetId, technicianId, {
        wipingMethod: wipingMethod.trim(),
        wipingTool: wipingTool.trim(),
        remarks: remarks ? String(remarks).trim() : undefined,
      });

      res.status(200).json({
        success: true,
        message:
          'Data sanitization completed successfully. Asset is now WIPING_COMPLETED and pending Phase 6 verification.',
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
            'Cannot complete wiping: Asset is not currently in WIPING_IN_PROGRESS state.',
        });
        return;
      }

      if (
        error.message === 'WIPING_METHOD_REQUIRED' ||
        error.message === 'WIPING_TOOL_REQUIRED'
      ) {
        res.status(400).json({
          success: false,
          message: 'Both wiping method and wiping tool are mandatory fields.',
        });
        return;
      }

      next(error);
    }
  }

  /**
   * POST /api/v1/sanitization/:assetId/fail
   * Marks wiping as failed. IT_OFFICER only.
   * Updates record status to FAILED and resets asset status to WIPING_PENDING.
   */
  async fail(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const technicianId = req.user?.userId;
      const { reason, remarks } = req.body || {};

      if (!technicianId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to mark wiping as failed.',
        });
        return;
      }

      const result = await sanitizationService.failWiping(assetId, technicianId, {
        reason: reason ? String(reason).trim() : undefined,
        remarks: remarks ? String(remarks).trim() : undefined,
      });

      res.status(200).json({
        success: true,
        message:
          'Wiping marked as failed. Asset status returned to WIPING_PENDING for re-sanitization.',
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
            'Cannot mark wiping as failed: Asset is not currently in WIPING_IN_PROGRESS state.',
        });
        return;
      }

      next(error);
    }
  }
}

export const sanitizationController = new SanitizationController();
