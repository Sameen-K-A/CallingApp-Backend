import { NextFunction, Request, Response } from 'express'
import { IAdminService, UpdateConfigInput, UserDistributionPeriod } from './admin.types'
import { BaseController } from '../../utils/baseController';

export class AdminController extends BaseController {
  constructor(private adminService: IAdminService) {
    super();
  }

  public googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { googleToken } = req.body
      const token = await this.adminService.verifyGoogleTokenAndLogin(googleToken)

      res.cookie('authenticationToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.status(200).json({
        success: true,
        message: 'Admin login successful'
      })
    } catch (error) {
      next(error)
    }
  }

  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.adminService.getUsers(page, limit)

      res.status(200).json({
        success: true,
        users: result.data,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (error) {
      next(error)
    }
  }

  public getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const userDetails = await this.adminService.getUserDetails(id)

      res.status(200).json({
        success: true,
        data: userDetails
      })
    } catch (error) {
      next(error)
    }
  }

  public getTelecallers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED'
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.adminService.getTelecallers(status, page, limit)

      res.status(200).json({
        success: true,
        telecallers: result.data,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (error) {
      next(error)
    }
  }

  public getTelecallerDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const telecallerDetails = await this.adminService.getTelecallerDetails(id)

      res.status(200).json({
        success: true,
        data: telecallerDetails
      })
    } catch (error) {
      next(error)
    }
  }

  public approveTelecaller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const updatedTelecaller = await this.adminService.approveTelecaller(id)
      res.status(200).json({
        success: true,
        message: 'Telecaller approved successfully.',
        data: updatedTelecaller
      })
    } catch (error) {
      next(error)
    }
  }

  public rejectTelecaller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const { reason } = req.body
      const updatedTelecaller = await this.adminService.rejectTelecaller(id, reason)
      res.status(200).json({
        success: true,
        message: 'Telecaller rejected successfully.',
        data: updatedTelecaller
      })
    } catch (error) {
      next(error)
    }
  }

  public getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.query.type as 'RECHARGE' | 'WITHDRAWAL'
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.adminService.getTransactions(type, page, limit)

      res.status(200).json({
        success: true,
        transactions: result.data,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (error) {
      next(error)
    }
  }

  public getTransactionDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const transactionDetails = await this.adminService.getTransactionDetails(id)

      res.status(200).json({
        success: true,
        data: transactionDetails
      })
    } catch (error) {
      next(error)
    }
  }

  public getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.adminService.getReports(page, limit)

      res.status(200).json({
        success: true,
        reports: result.data,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (error) {
      next(error)
    }
  }

  public getReportDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reportDetails = await this.adminService.getReportDetails(id);

      res.status(200).json({
        success: true,
        data: reportDetails
      });
    } catch (error) {
      next(error);
    }
  }

  public updateReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const updatedFields = await this.adminService.updateReportStatus(id, status, adminNotes);

      res.status(200).json({
        success: true,
        message: 'Report status updated successfully.',
        data: updatedFields
      });
    } catch (error) {
      next(error);
    }
  };

  public blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.adminService.blockUser(id);

      res.status(200).json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  public unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.adminService.unblockUser(id);

      res.status(200).json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats()

      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  };

  public getUserDistribution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = req.query.period as UserDistributionPeriod
      const data = await this.adminService.getUserDistribution(period)

      res.status(200).json({
        success: true,
        message: 'User distribution fetched successfully',
        data
      })
    } catch (error) {
      next(error)
    }
  };

  // ============================================
  // Plan Management
  // ============================================

  public getPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.adminService.getPlans(page, limit)

      res.status(200).json({
        success: true,
        plans: result.data,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (error) {
      next(error)
    }
  };

  public createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, coins, discountPercentage } = req.body
      const plan = await this.adminService.createPlan({ amount, coins, discountPercentage })

      res.status(201).json({
        success: true,
        message: 'Plan created successfully.',
        data: plan
      })
    } catch (error) {
      next(error)
    }
  };

  public updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const { amount, coins, discountPercentage, isActive } = req.body
      const plan = await this.adminService.updatePlan(id, { amount, coins, discountPercentage, isActive })

      res.status(200).json({
        success: true,
        message: 'Plan updated successfully.',
        data: plan
      })
    } catch (error) {
      next(error)
    }
  };

  public deletePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.adminService.deletePlan(id)

      res.status(200).json({
        success: result.success,
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  };

  // ============================================
  // Config Management
  // ============================================
  public getConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.adminService.getConfig();

      res.status(200).json({
        success: true,
        message: 'Configuration retrieved successfully.',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UpdateConfigInput = req.body;
      const config = await this.adminService.updateConfig(data);

      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully.',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // Withdrawal Management
  // ============================================

  public completeWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { transferReference } = req.body;

      const result = await this.adminService.completeWithdrawal(id, { transferReference });

      res.status(200).json({
        success: true,
        message: 'Withdrawal completed successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  public rejectWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.adminService.rejectWithdrawal(id);

      res.status(200).json({
        success: true,
        message: 'Withdrawal request rejected.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

};