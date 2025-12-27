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
  PlanListResponse,
  PlanDetailsResponse,
  CreatePlanInput,
  UpdatePlanInput
} from './admin.types'
import { createToken } from '../../utils/jwt'
import { OAuth2Client } from 'google-auth-library'
import { ApiError } from '../../middleware/errors/ApiError'
import { isTelecaller } from '../../utils/guards';
import { IReport } from '../../types/general';

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

};