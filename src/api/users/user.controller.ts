import { NextFunction, Request, Response } from 'express'
import { IUserService } from './user.types'
import { BaseController } from '../../utils/baseController';

export class UserController extends BaseController {
  constructor(private userService: IUserService) {
    super();
  };

  public getMyDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const user = await this.userService.getProfile(userId)

      res.status(200).json({
        success: true,
        message: 'collect profile details successfully.',
        data: user
      })
    } catch (error) {
      next(error)
    }
  };

  public completeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profileData = req.body
      const updatedUser = await this.userService.completeUserProfile(userId, profileData)

      res.status(200).json({
        success: true,
        message: 'Profile completed successfully.',
        data: updatedUser
      })
    } catch (error) {
      next(error)
    }
  };

  public editProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profileData = req.body
      const updatedUser = await this.userService.editUserProfile(userId, profileData)

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser
      })
    } catch (error) {
      next(error)
    }
  };

  public getPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await this.userService.getActivePlans()

      res.status(200).json({
        success: true,
        message: 'Plans fetched successfully.',
        data: plans
      })
    } catch (error) {
      next(error)
    }
  };

  public getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 15

      const result = await this.userService.getFavorites(userId, page, limit)

      res.status(200).json({
        success: true,
        message: 'Favorites fetched successfully.',
        data: result
      })
    } catch (error) {
      next(error)
    }
  };

  public addToFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { telecallerId } = req.params
      const result = await this.userService.addToFavorites(userId, telecallerId)

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  };

  public removeFromFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { telecallerId } = req.params
      const result = await this.userService.removeFromFavorites(userId, telecallerId)

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  };

  public getTelecallers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 15

      const result = await this.userService.getTelecallers(userId, page, limit)

      res.status(200).json({
        success: true,
        message: 'Telecallers fetched successfully.',
        data: result
      })
    } catch (error) {
      next(error)
    }
  };

};