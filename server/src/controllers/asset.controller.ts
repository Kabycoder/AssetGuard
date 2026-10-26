import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';
import { ApiResponse } from '../types';
import { PaginatedAssetResponse } from '../types/asset.types';

export class AssetController {
  /**
   * GET /api/v1/assets
   * Returns paginated, searchable, filtered list of assets.
   */
  async getAll(
    req: Request,
    res: Response<ApiResponse<PaginatedAssetResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await assetService.getAssets(req.query);
      res.status(200).json({
        success: true,
        message: 'Assets retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/assets/:id
   * Returns details of a specific asset including workflow history.
   */
  async getById(
    req: Request,
    res: Response<ApiResponse<{ asset: any }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetService.getAssetById(id);

      if (!asset) {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${id}' was not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Asset details retrieved successfully.',
        data: { asset },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/assets
   * Creates a new Asset record. ADMIN only.
   */
  async create(
    req: Request,
    res: Response<ApiResponse<{ asset: any }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { assetTag, serialNumber, assetType } = req.body;

      if (!assetTag || !serialNumber || !assetType) {
        res.status(400).json({
          success: false,
          message: 'Asset Tag, Serial Number, and Asset Type are required fields.',
        });
        return;
      }

      if (
        typeof assetTag !== 'string' ||
        typeof serialNumber !== 'string' ||
        typeof assetType !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid input format for asset fields.',
        });
        return;
      }

      const asset = await assetService.createAsset(req.body);

      res.status(201).json({
        success: true,
        message: 'Asset registered successfully.',
        data: { asset },
      });
    } catch (error: any) {
      if (error.message === 'DUPLICATE_ASSET_TAG') {
        res.status(409).json({
          success: false,
          message: `An asset with tag '${req.body.assetTag}' already exists.`,
        });
        return;
      }

      if (error.message === 'DUPLICATE_SERIAL_NUMBER') {
        res.status(409).json({
          success: false,
          message: `An asset with serial number '${req.body.serialNumber}' already exists.`,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * PUT /api/v1/assets/:id
   * Updates an existing Asset record. ADMIN only.
   */
  async update(
    req: Request,
    res: Response<ApiResponse<{ asset: any }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const asset = await assetService.updateAsset(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Asset updated successfully.',
        data: { asset },
      });
    } catch (error: any) {
      if (error.message === 'ASSET_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${req.params.id}' was not found.`,
        });
        return;
      }

      if (error.message === 'DUPLICATE_ASSET_TAG') {
        res.status(409).json({
          success: false,
          message: `Asset tag '${req.body.assetTag}' is already in use by another asset.`,
        });
        return;
      }

      if (error.message === 'DUPLICATE_SERIAL_NUMBER') {
        res.status(409).json({
          success: false,
          message: `Serial number '${req.body.serialNumber}' is already in use by another asset.`,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * DELETE /api/v1/assets/:id
   * Deletes an asset. ADMIN only.
   * Rejects deletion with 409 Conflict if workflow history exists.
   */
  async delete(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await assetService.deleteAsset(id);

      res.status(200).json({
        success: true,
        message: 'Asset deleted successfully.',
      });
    } catch (error: any) {
      if (error.message === 'ASSET_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `Asset with ID '${req.params.id}' was not found.`,
        });
        return;
      }

      if (error.message === 'ASSET_HAS_WORKFLOW_HISTORY') {
        res.status(409).json({
          success: false,
          error: 'ASSET_HAS_WORKFLOW_HISTORY',
          message:
            'Cannot delete asset: Active or completed data wiping/disposal audit records exist for this hardware. Permanent record retention is enforced.',
        });
        return;
      }

      next(error);
    }
  }
}

export const assetController = new AssetController();
