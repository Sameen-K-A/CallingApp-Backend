import { IAdmin } from '../../types/admin'
import { IUserDocument, IReport } from '../../types/general'

// ============================================
// DTOs (Data Transfer Objects) for API Responses
// ============================================

// User data for lists.
export type UserListResponse = {
  _id: string
  phone: string
  name: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  createdAt: Date
}

// Telecaller data for lists.
export type TelecallerListResponse = {
  _id: string
  phone: string
  name: string | null
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  createdAt: Date
}

// Transaction data for lists.
export type TransactionListResponse = {
  _id: string
  type: 'RECHARGE' | 'WITHDRAWAL'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  createdAt: Date
  user: {
    name: string | null
  }
}

// Transaction details response DTO
export type TransactionDetailsResponse = {
  _id: string
  type: 'RECHARGE' | 'WITHDRAWAL'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  createdAt: Date
  updatedAt: Date
  user: {
    _id: string
    name: string
    phone: string
    walletBalance: number
  }
  // For RECHARGE
  coins?: number
  gatewayOrderId?: string
  gatewayPaymentId?: string
  // For WITHDRAWAL
  payoutId?: string
  utr?: string
}

// ============================================
// Plan DTOs
// ============================================

// Plan data for lists
export type PlanListResponse = {
  _id: string
  amount: number
  coins: number
  discountPercentage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Plan details for single view
export type PlanDetailsResponse = {
  _id: string
  amount: number
  coins: number
  discountPercentage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Input for creating a plan
export interface CreatePlanInput {
  amount: number
  coins: number
  discountPercentage?: number
}

// Input for updating a plan
export interface UpdatePlanInput {
  amount?: number
  coins?: number
  discountPercentage?: number
  isActive?: boolean
}

// Report details for individual view
export type ReportDetailsResponse = {
  _id: string
  description: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  adminNotes?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
  reporter: {
    _id: string
    name: string
    phone: string
    role: 'USER' | 'TELECALLER'
    accountStatus: 'ACTIVE' | 'SUSPENDED'
  }
  reportedAgainst: {
    _id: string
    name: string
    phone: string
    role: 'USER' | 'TELECALLER'
    accountStatus: 'ACTIVE' | 'SUSPENDED'
  }
  call: {
    _id: string
    status: 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'MISSED' | 'COMPLETED'
    createdAt: Date
    acceptedAt?: Date
    endedAt?: Date
    durationInSeconds: number
    coinsSpent: number
    coinsEarned: number
    userFeedback?: string
    telecallerFeedback?: string
  }
};

// Updated ReportListResponse with new field names
export type ReportListResponse = {
  _id: string
  reportedBy: string
  reportedAgainst: string
  reportedByName: string
  reportedAgainstName: string
  description: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  createdAt: Date
};

export type TelecallerComplaintItem = {
  _id: string
  reportedBy: string
  reportedByName: string
  description: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  createdAt: Date
};

// Detailed telecaller profile.
export type TelecallerDetailsResponse = {
  _id: string
  name: string | null
  phone: string
  dob: Date | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  createdAt: Date
  walletBalance: number
  telecallerProfile: {
    about?: string
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    verificationNotes?: string
    presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL'
  }
  complaints: TelecallerComplaintItem[]
  totalComplaints: number
}

// User complaint item for individual complaint display
export type UserComplaintItem = {
  _id: string
  reportedBy: string
  reportedByName: string
  description: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  createdAt: Date
};

// Detailed user profile response
export type UserDetailsResponse = {
  _id: string
  name: string | null
  phone: string
  dob: Date | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  createdAt: Date
  walletBalance: number
  complaints: UserComplaintItem[]
  totalComplaints: number
}

// Dashboard Stats Response
export interface DashboardStatsResponse {
  revenue: {
    totalRecharges: number;
    totalWithdrawals: number;
    platformProfit: number;
  };
  users: {
    total: number;
    newThisMonth: number;
    incompleteProfiles: number;
  };
  telecallers: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  calls: {
    total: number;
    totalDurationMinutes: number;
    averageDurationSeconds: number;
  };
};

// ============================================
// Pagination Wrappers
// ============================================

// Generic wrapper for paginated repository results.
export interface PaginatedResult<T> {
  items: T[]
  total: number
}

// Generic wrapper for paginated service/API results.
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  totalPages: number
}

// ============================================
// Service & Repository Interfaces
// ============================================

export interface IAdminRepository {
  findAdminByEmail(email: string): Promise<IAdmin | null>
  getAllUsers(page: number, limit: number): Promise<PaginatedResult<UserListResponse>>
  getUserDetails(userId: string): Promise<UserDetailsResponse | null>
  getTelecallers(status: 'PENDING' | 'APPROVED' | 'REJECTED', page: number, limit: number): Promise<PaginatedResult<TelecallerListResponse>>
  getTelecallerDetails(telecallerId: string): Promise<TelecallerDetailsResponse | null>
  getTransactions(type: 'RECHARGE' | 'WITHDRAWAL', page: number, limit: number): Promise<PaginatedResult<TransactionListResponse>>
  getTransactionDetails(transactionId: string): Promise<TransactionDetailsResponse | null>
  getAllReports(page: number, limit: number): Promise<PaginatedResult<ReportListResponse>>
  getReportDetails(reportId: string): Promise<ReportDetailsResponse | null>
  updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<IReport | null>
  blockUser(userId: string, isTelecaller?: boolean): Promise<boolean>
  unblockUser(userId: string): Promise<boolean>
  getUser(userId: string): Promise<IUserDocument | null>
  findTelecallerById(telecallerId: string): Promise<IUserDocument | null>
  updateTelecallerStatus(telecallerId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<IUserDocument | null>
  getDashboardStats(): Promise<DashboardStatsResponse>
  // Plan Management
  getAllPlans(page: number, limit: number): Promise<PaginatedResult<PlanListResponse>>
  getPlanById(planId: string): Promise<PlanDetailsResponse | null>
  createPlan(data: CreatePlanInput): Promise<PlanDetailsResponse>
  updatePlan(planId: string, data: UpdatePlanInput): Promise<PlanDetailsResponse | null>
  deletePlan(planId: string): Promise<boolean>
};

export interface IAdminService {
  verifyGoogleTokenAndLogin(googleToken: string): Promise<string>
  getUsers(page: number, limit: number): Promise<PaginatedResponse<UserListResponse>>
  getUserDetails(userId: string): Promise<UserDetailsResponse>
  getTelecallers(status: 'PENDING' | 'APPROVED' | 'REJECTED', page: number, limit: number): Promise<PaginatedResponse<TelecallerListResponse>>
  getTelecallerDetails(telecallerId: string): Promise<TelecallerDetailsResponse>
  approveTelecaller(telecallerId: string): Promise<TelecallerDetailsResponse>
  rejectTelecaller(telecallerId: string, reason: string): Promise<TelecallerDetailsResponse>
  getTransactions(type: 'RECHARGE' | 'WITHDRAWAL', page: number, limit: number): Promise<PaginatedResponse<TransactionListResponse>>
  getTransactionDetails(transactionId: string): Promise<TransactionDetailsResponse>
  getReports(page: number, limit: number): Promise<PaginatedResponse<ReportListResponse>>
  getReportDetails(reportId: string): Promise<ReportDetailsResponse>
  updateReportStatus(reportId: string, status: IReport["status"], adminNotes?: string): Promise<{ status: string, adminNotes?: string, resolvedAt?: Date }>
  blockUser(userId: string): Promise<{ success: boolean, message: string }>
  unblockUser(userId: string): Promise<{ success: boolean, message: string }>
  getDashboardStats(): Promise<DashboardStatsResponse>
  // Plan Management
  getPlans(page: number, limit: number): Promise<PaginatedResponse<PlanListResponse>>
  createPlan(data: CreatePlanInput): Promise<PlanDetailsResponse>
  updatePlan(planId: string, data: UpdatePlanInput): Promise<PlanDetailsResponse>
  deletePlan(planId: string): Promise<{ success: boolean; message: string }>
};