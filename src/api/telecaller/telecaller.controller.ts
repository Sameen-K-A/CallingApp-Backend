import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../../utils/baseController';
import { ITelecallerService, EditProfileDto } from './telecaller.types';

export class TelecallerController extends BaseController {
  constructor(private telecallerService: ITelecallerService) {
    super();
  };

  public editProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profileData: EditProfileDto = req.body;

      const updatedProfile = await this.telecallerService.editUserProfile(userId, profileData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };

};