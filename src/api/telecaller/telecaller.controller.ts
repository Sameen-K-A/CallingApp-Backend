import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../../utils/baseController';
import { ITelecallerService, EditProfileDto, ReapplyDto, BankDetailsDto } from './telecaller.types';

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

  public reapply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const reapplyData: ReapplyDto = req.body;

      const updatedProfile = await this.telecallerService.reapplyApplication(userId, reapplyData);

      res.status(200).json({
        success: true,
        message: 'Application re-submitted successfully. Please wait for admin approval.',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };

  public getBankDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const bankDetails = await this.telecallerService.getBankDetails(userId);

      res.status(200).json({
        success: true,
        message: bankDetails === null ? 'No bank details found.' : 'Bank details retrieved successfully.',
        data: bankDetails === null ? null : bankDetails,
      });
    } catch (error) {
      next(error);
    }
  };

  public addBankDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const bankDetailsDto: BankDetailsDto = req.body;

      const bankDetails = await this.telecallerService.addBankDetails(userId, bankDetailsDto);

      res.status(201).json({
        success: true,
        message: 'Bank details added successfully.',
        data: bankDetails,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteBankDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await this.telecallerService.deleteBankDetails(userId);

      res.status(200).json({
        success: true,
        message: 'Bank details removed successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

};