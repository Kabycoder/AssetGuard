import { Request, Response, NextFunction } from 'express';
import { disposalService } from '../services/disposal.service';
import { ApiResponse } from '../types';
import { PaginatedDisposalResponse } from '../types/disposal.types';

export class DisposalController {
  /**
   * GET /api/v1/disposal
   * Returns paginated queue of VERIFIED assets awaiting disposition and completed records.
   */
  async getQueue(
    req: Request,
    res: Response<ApiResponse<PaginatedDisposalResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await disposalService.getDisposalQueue(req.query);
      res.status(200).json({
        success: true,
        message: 'Disposal queue and history retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/disposal/:assetId
   * Returns disposal record and asset status.
   */
  async getById(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const asset = await disposalService.getDisposalByAssetId(assetId);

      res.status(200).json({
        success: true,
        message: 'Disposal information retrieved successfully.',
        data: asset,
      });
    } catch (error: any) {
      if (error.message === 'ASSET_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${req.params.assetId}' was not found.`,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/disposal/:assetId
   * Records physical disposition / recycling. Restricted to ADMIN and DISPOSAL_OFFICER.
   */
  async recordDisposal(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetId } = req.params;
      const officerId = req.user?.userId;

      if (!officerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to record asset disposition.',
        });
        return;
      }

      const { disposalMethod, vendorName, certificateNumber, remarks } = req.body || {};

      if (!disposalMethod) {
        res.status(400).json({
          success: false,
          message: 'A valid disposal method (RECYCLING, PHYSICAL_SHREDDING, RESALE, DONATION) is required.',
        });
        return;
      }

      const result = await disposalService.recordDisposal(assetId, officerId, {
        disposalMethod,
        vendorName,
        certificateNumber,
        remarks,
      });

      res.status(200).json({
        success: true,
        message: 'Asset disposition recorded successfully. Asset status updated to DISPOSED.',
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

      if (error.message === 'ASSET_ALREADY_DISPOSED') {
        res.status(409).json({
          success: false,
          message: 'Cannot dispose asset: Asset is already in DISPOSED state.',
        });
        return;
      }

      if (error.message === 'ASSET_NOT_VERIFIED') {
        res.status(409).json({
          success: false,
          message: 'Cannot dispose asset: Asset must be verified by an administrator before final disposition.',
        });
        return;
      }

      if (error.message === 'DISPOSAL_METHOD_REQUIRED') {
        res.status(400).json({
          success: false,
          message: 'A valid disposal method is required.',
        });
        return;
      }

      next(error);
    }
  }
}

export const disposalController = new DisposalController();
