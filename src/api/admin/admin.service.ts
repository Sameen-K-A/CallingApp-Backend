import {
  IAdminRepository,
  IAdminService,
  PaginatedResponse,
  UserListResponse,
  TelecallerListResponse,
  TransactionListResponse,
  ReportListResponse,
  TelecallerDetailsResponse,
  TransactionDetailsResponse,
  ReportDetailsResponse,
  UserDetailsResponse,
  DashboardStatsResponse,
  UserDistributionPeriod,
  UserDistributionResponse,
  RechargeWithdrawalTrendsPeriod,
  RechargeWithdrawalTrendsResponse,
  PlanListResponse,
  TrendDataPoint,

  PlanDetailsResponse,
  CreatePlanInput,
  UpdatePlanInput,
  ConfigResponse,
  UpdateConfigInput,
  CompleteWithdrawalInput,
  CompleteWithdrawalResponse,
  RejectWithdrawalResponse
} from './admin.types'
import { createToken } from '../../utils/jwt'
import { OAuth2Client } from 'google-auth-library'
import { ApiError } from '../../middleware/errors/ApiError'
import { isTelecaller } from '../../utils/guards';
import { IReport } from '../../types/general';
import mongoose from 'mongoose';

export class AdminService implements IAdminService {
  private googleClient: OAuth2Client

  constructor(private adminRepository: IAdminRepository) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not defined in environment variables.')
    }
    this.googleClient = new OAuth2Client(clientId)
  };

  // ================== Admin Authentication ==================
  public async verifyGoogleTokenAndLogin(googleToken: string): Promise<string> {
    let payload
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      })
      payload = ticket.getPayload()
    } catch (error) {
      throw new ApiError(401, 'Invalid Google token.')
    }

    if (!payload || !payload.email || !payload.name) {
      throw new ApiError(400, 'Invalid Google token payload.')
    }

    const admin = await this.adminRepository.findAdminByEmail(payload.email)
    if (!admin) {
      throw new ApiError(403, 'Access denied. You are not an authorized admin.')
    }

    const token = createToken(admin.id, admin.email, 'ADMIN')
    return token
  };

  // ================== Data Listing Services ==================
  public async getUsers(page: number, limit: number): Promise<PaginatedResponse<UserListResponse>> {
    const { items, total } = await this.adminRepository.getAllUsers(page, limit)
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  public async getTelecallers(status: 'PENDING' | 'APPROVED' | 'REJECTED', page: number, limit: number): Promise<PaginatedResponse<TelecallerListResponse>> {
    const { items, total } = await this.adminRepository.getTelecallers(status, page, limit)
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  public async getTransactions(type: 'RECHARGE' | 'WITHDRAWAL', page: number, limit: number): Promise<PaginatedResponse<TransactionListResponse>> {
    const { items, total } = await this.adminRepository.getTransactions(type, page, limit)
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  public async getTransactionDetails(transactionId: string): Promise<TransactionDetailsResponse> {
    const transactionDetails = await this.adminRepository.getTransactionDetails(transactionId)

    if (!transactionDetails) {
      throw new ApiError(404, 'Transaction not found.')
    }

    return transactionDetails
  };

  public async getReports(page: number, limit: number): Promise<PaginatedResponse<ReportListResponse>> {
    const { items, total } = await this.adminRepository.getAllReports(page, limit)
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  // ================== Telecaller Management Services ==================
  public async getTelecallerDetails(telecallerId: string): Promise<TelecallerDetailsResponse> {
    const telecallerDetails = await this.adminRepository.getTelecallerDetails(telecallerId);

    if (!telecallerDetails) {
      throw new ApiError(404, 'Telecaller not found or user does not have a telecaller role.')
    };

    return telecallerDetails;
  };

  // Approves a pending telecaller application.
  public async approveTelecaller(telecallerId: string): Promise<TelecallerDetailsResponse> {
    const telecallerDoc = await this.adminRepository.findTelecallerById(telecallerId)
    if (!telecallerDoc) {
      throw new ApiError(404, 'Telecaller application not found.')
    }
    if (!isTelecaller(telecallerDoc)) {
      throw new ApiError(400, 'This user is not a telecaller.')
    }
    if (telecallerDoc.telecallerProfile.approvalStatus === 'APPROVED') {
      throw new ApiError(400, 'This telecaller is already approved.')
    }
    if (telecallerDoc.telecallerProfile.approvalStatus === 'REJECTED') {
      throw new ApiError(400, 'Cannot approve a rejected telecaller. They must re-apply first.')
    }

    const updated = await this.adminRepository.updateTelecallerStatus(telecallerId, 'APPROVED')
    if (!updated || !isTelecaller(updated)) {
      throw new ApiError(500, 'Failed to update telecaller status.')
    }

    const telecallerDetails = await this.adminRepository.getTelecallerDetails(telecallerId)
    if (!telecallerDetails) {
      throw new ApiError(500, 'Failed to fetch updated telecaller details.')
    }

    return telecallerDetails;
  };

  // Rejects a pending telecaller application with a reason.
  public async rejectTelecaller(telecallerId: string, reason: string): Promise<TelecallerDetailsResponse> {
    const telecallerDoc = await this.adminRepository.findTelecallerById(telecallerId)
    if (!telecallerDoc) {
      throw new ApiError(404, 'Telecaller application not found.')
    }
    if (!isTelecaller(telecallerDoc)) {
      throw new ApiError(400, 'This user is not a telecaller.')
    }

    const updated = await this.adminRepository.updateTelecallerStatus(telecallerId, 'REJECTED', reason)
    if (!updated || !isTelecaller(updated)) {
      throw new ApiError(500, 'Failed to update telecaller status.')
    }

    const telecallerDetails = await this.adminRepository.getTelecallerDetails(telecallerId)
    if (!telecallerDetails) {
      throw new ApiError(500, 'Failed to fetch updated telecaller details.')
    }

    return telecallerDetails;
  };

  // ======================== Report and management ====================
  public async getReportDetails(reportId: string): Promise<ReportDetailsResponse> {
    const reportDetails = await this.adminRepository.getReportDetails(reportId)

    if (!reportDetails) {
      throw new ApiError(404, 'Report not found.')
    }

    return reportDetails;
  };

  public async updateReportStatus(reportId: string, status: IReport["status"], adminNotes?: string): Promise<{ status: string, adminNotes?: string, resolvedAt?: Date }> {
    const updatedReport = await this.adminRepository.updateReportStatus(reportId, status, adminNotes);

    if (!updatedReport) {
      throw new ApiError(404, 'Report not found.');
    }

    return {
      status: updatedReport.status,
      adminNotes: updatedReport.adminNotes,
      resolvedAt: updatedReport.resolvedAt
    };
  };

  // ============================ User management ======================
  public async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const userDetails = await this.adminRepository.getUserDetails(userId);

    if (!userDetails) {
      throw new ApiError(404, 'User not found or user does not have a user role.');
    }

    return userDetails;
  };

  public async blockUser(userId: string): Promise<{ success: boolean, message: string }> {
    const user = await this.adminRepository.getUser(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    };

    if (user.accountStatus === 'SUSPENDED') {
      return {
        success: false,
        message: 'User is already blocked.'
      };
    };

    if (isTelecaller(user)) {
      if (user.telecallerProfile.approvalStatus !== 'APPROVED') {
        return {
          success: false,
          message: 'Only approved telecallers can be blocked. This telecaller is not yet approved.'
        };
      }
    };

    const blockResult = await this.adminRepository.blockUser(userId, isTelecaller(user));
    if (!blockResult) {
      throw new ApiError(500, 'Failed to block user.');
    };

    return {
      success: true,
      message: `${user.name || 'User'} has been blocked successfully.`
    };
  };

  public async unblockUser(userId: string): Promise<{ success: boolean, message: string }> {
    const user = await this.adminRepository.getUser(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    if (user.accountStatus === 'ACTIVE') {
      return {
        success: false,
        message: 'User is already active.'
      };
    };

    if (isTelecaller(user)) {
      if (user.telecallerProfile.approvalStatus !== 'APPROVED') {
        return {
          success: false,
          message: 'Only approved telecallers can be unblocked. This telecaller is not approved.'
        };
      }
    };

    const unblockResult = await this.adminRepository.unblockUser(userId);
    if (!unblockResult) throw new ApiError(500, 'Failed to unblock user.');

    return {
      success: true,
      message: `${user.name || 'User'} has been unblocked successfully.`
    };
  };

  // =========================== Dashboard management========================
  public async getDashboardStats(): Promise<DashboardStatsResponse> {
    return await this.adminRepository.getDashboardStats();
  };

  public async getUserDistribution(period: UserDistributionPeriod): Promise<UserDistributionResponse> {
    return await this.adminRepository.getUserDistribution(period);
  };

  public async getRechargeWithdrawalTrends(period: RechargeWithdrawalTrendsPeriod): Promise<RechargeWithdrawalTrendsResponse> {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'hour' | 'day';
    let numberOfPoints: number;

    switch (period) {
      case 'last24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = 'hour';
        numberOfPoints = 24;
        break;
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        numberOfPoints = 7;
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        numberOfPoints = 30;
        break;
    }

    const trendsData = await this.adminRepository.getRechargeWithdrawalStats(startDate, now, groupBy);

    // Generate all time slots and fill with data or zeros
    const trends: TrendDataPoint[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Create a map from aggregation results for quick lookup
    const dataMap = new Map<string, { recharge: number; withdrawal: number }>();
    for (const item of trendsData) {
      let key: string;
      if (period === 'last24hours') {
        key = `${item._id.year}-${item._id.month}-${item._id.day}-${item._id.hour}`;
      } else {
        key = `${item._id.year}-${item._id.month}-${item._id.day}`;
      }
      dataMap.set(key, { recharge: item.recharge, withdrawal: item.withdrawal });
    }

    // Generate all time points
    for (let i = 0; i < numberOfPoints; i++) {
      let pointDate: Date;
      let label: string;
      let key: string;

      if (period === 'last24hours') {
        // Go backwards from now, hour by hour
        pointDate = new Date(now.getTime() - (numberOfPoints - 1 - i) * 60 * 60 * 1000);
        const hour = pointDate.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        label = `${hour12.toString().padStart(2, '0')} ${ampm}`;
        key = `${pointDate.getFullYear()}-${pointDate.getMonth() + 1}-${pointDate.getDate()}-${hour}`;
      } else {
        // Go backwards from now, day by day
        pointDate = new Date(now.getTime() - (numberOfPoints - 1 - i) * 24 * 60 * 60 * 1000);
        pointDate.setHours(0, 0, 0, 0);

        if (period === 'last7days') {
          const weekday = weekdays[pointDate.getDay()];
          const day = pointDate.getDate();
          label = `${weekday} ${day}`;
        } else {
          // last30days
          const day = pointDate.getDate();
          const month = months[pointDate.getMonth()];
          label = `${day} ${month}`;
        }
        key = `${pointDate.getFullYear()}-${pointDate.getMonth() + 1}-${pointDate.getDate()}`;
      }

      const data = dataMap.get(key) || { recharge: 0, withdrawal: 0 };
      trends.push({
        label,
        recharge: data.recharge,
        withdrawal: data.withdrawal
      });
    }

    return {
      period,
      trends
    };
  };

  // ============================================
  // Plan Management
  // ============================================

  // Fetches paginated list of all plans
  public async getPlans(page: number, limit: number): Promise<PaginatedResponse<PlanListResponse>> {
    const { items, total } = await this.adminRepository.getAllPlans(page, limit)

    return {
      data: items,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  // Creates a new plan
  public async createPlan(data: CreatePlanInput): Promise<PlanDetailsResponse> {
    return await this.adminRepository.createPlan(data)
  };

  // Updates an existing plan
  public async updatePlan(planId: string, data: UpdatePlanInput): Promise<PlanDetailsResponse> {
    const plan = await this.adminRepository.updatePlan(planId, data)
    if (!plan) {
      throw new ApiError(404, 'Plan not found.')
    };

    return plan;
  };

  // Soft deletes a plan
  public async deletePlan(planId: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.adminRepository.getPlanById(planId)

    if (!plan) {
      throw new ApiError(404, 'Plan not found.')
    }

    const deleted = await this.adminRepository.deletePlan(planId)

    if (!deleted) {
      throw new ApiError(500, 'Failed to delete plan.')
    }

    return {
      success: true,
      message: 'Plan deleted successfully.'
    }
  };

  // ============================================
  // Config Management
  // ============================================
  public async getConfig(): Promise<ConfigResponse> {
    const config = await this.adminRepository.getConfig();

    if (!config) {
      throw new ApiError(404, 'Configuration not found.');
    }

    return {
      withdrawal: {
        inrToCoinRatio: {
          value: config.inrToCoinRatio,
          label: 'INR to Coin Ratio',
          description: 'This setting controls how many coins equal ₹1 when calculating withdrawal amounts. For example, if set to 1, then 1 coin equals ₹1, so 500 coins will be worth ₹500. If set to 2, then 2 coins equal ₹1, meaning 500 coins would be worth ₹250. A higher value means telecallers need more coins to earn the same amount of money.',
        },
        minWithdrawalCoins: {
          value: config.minWithdrawalCoins,
          label: 'Minimum Withdrawal Coins',
          description: 'This is the minimum number of coins a telecaller must have in their wallet to request a withdrawal. For example, if you set this to 100, telecallers cannot request a withdrawal until they have earned at least 100 coins. This helps reduce the number of small withdrawal requests and processing overhead. Set a higher value to encourage telecallers to accumulate more earnings before withdrawing.',
        },
      },
      videoCall: {
        userCoinPerSec: {
          value: config.userVideoCallCoinPerSec,
          label: 'User Coins Per Second (Video)',
          description: 'This is how many coins are deducted from the user\'s wallet every second during a video call. For example, if set to 3, a 10-minute (600 seconds) video call will cost the user 1,800 coins. Higher values mean users pay more per call, so set this based on what you want to charge users for video calling telecallers.',
        },
        telecallerCoinPerSec: {
          value: config.telecallerVideoCallCoinPerSec,
          label: 'Telecaller Coins Per Second (Video)',
          description: 'This is how many coins the telecaller earns every second during a video call. For example, if set to 1, a 10-minute (600 seconds) video call will earn the telecaller 600 coins. The difference between what the user pays and what the telecaller earns is your platform\'s profit. Make sure this value is less than or equal to the user\'s rate.',
        },
      },
      audioCall: {
        userCoinPerSec: {
          value: config.userAudioCallCoinPerSec,
          label: 'User Coins Per Second (Audio)',
          description: 'This is how many coins are deducted from the user\'s wallet every second during an audio call. Audio calls are typically cheaper than video calls. For example, if set to 2, a 10-minute (600 seconds) audio call will cost the user 1,200 coins. Adjust this to be lower than the video call rate to offer users a more affordable option.',
        },
        telecallerCoinPerSec: {
          value: config.telecallerAudioCallCoinPerSec,
          label: 'Telecaller Coins Per Second (Audio)',
          description: 'This is how many coins the telecaller earns every second during an audio call. For example, if set to 1, a 10-minute (600 seconds) audio call will earn the telecaller 600 coins. Similar to video calls, the difference between the user rate and telecaller rate is your platform\'s earnings from each audio call.',
        },
      },
      updatedAt: config.updatedAt,
    };
  };

  public async updateConfig(data: UpdateConfigInput): Promise<ConfigResponse> {
    await this.adminRepository.updateConfig(data);
    return this.getConfig();
  };

  // ============================================
  // Withdrawal Management
  // ============================================
  public async completeWithdrawal(transactionId: string, input: CompleteWithdrawalInput): Promise<CompleteWithdrawalResponse> {
    // Find withdrawal transaction
    const withdrawal = await this.adminRepository.findWithdrawalById(transactionId);

    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal transaction not found.');
    }
    if (withdrawal.status !== 'PENDING') {
      throw new ApiError(400, `Cannot complete withdrawal. Current status is ${withdrawal.status}.`);
    }

    // Start MongoDB transaction for atomic operation
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Deduct coins from telecaller wallet
      const newBalance = await this.adminRepository.deductUserBalance(
        withdrawal.userId,
        withdrawal.coins,
        session
      );

      if (newBalance === null) {
        throw new Error('Failed to deduct balance from user wallet.');
      }

      // Update transaction status
      const updated = await this.adminRepository.completeWithdrawal(
        transactionId,
        input.transferReference,
        session
      );

      if (!updated) {
        throw new Error('Failed to update withdrawal status.');
      }

      await session.commitTransaction();

      return {
        _id: transactionId,
        status: 'SUCCESS',
        transferReference: input.transferReference,
        processedAt: new Date(),
        coinsDeducted: withdrawal.coins,
        newBalance: newBalance
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Complete withdrawal failed:', error);
      throw new ApiError(500, 'Failed to complete withdrawal. Please try again.');
    } finally {
      session.endSession();
    }
  };

  public async rejectWithdrawal(transactionId: string): Promise<RejectWithdrawalResponse> {
    // Find withdrawal transaction
    const withdrawal = await this.adminRepository.findWithdrawalById(transactionId);

    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal transaction not found.');
    }
    if (withdrawal.status !== 'PENDING') {
      throw new ApiError(400, `Cannot reject withdrawal. Current status is ${withdrawal.status}.`);
    }

    // Update transaction status
    const updated = await this.adminRepository.rejectWithdrawal(transactionId);

    if (!updated) {
      throw new ApiError(500, 'Failed to reject withdrawal. Please try again.');
    }

    return {
      _id: transactionId,
      status: 'REJECTED',
      processedAt: new Date()
    };
  };

};