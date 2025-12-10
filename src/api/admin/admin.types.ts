import { IAdmin } from '../../types/admin'
import { ICall, IPlan, ITransaction } from '../../types/general'
import { IReport } from '../../types/general'
import { IUserDocument } from '../../models/user.model'
import { IUser } from '../../types/user'
import { ITelecaller } from '../../types/telecaller'

// ============================================
// DTOs (Data Transfer Objects) for API Responses
// ============================================

// User data for lists.
export type UserListResponse = Pick<IUser,
  | '_id'
  | 'phone'
  | 'name'
  | 'accountStatus'
  | 'createdAt'
> & {
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
}

// Telecaller data for lists.
export type TelecallerListResponse = Pick<ITelecaller,
  | '_id'
  | 'phone'
  | 'name'
  | 'accountStatus'
  | 'createdAt'
>

// Transaction data for lists.
export type TransactionListResponse = Pick<ITransaction,
  | '_id'
  | 'type'
  | 'amount'
  | 'status'
  | 'createdAt'
> & {
  user: {
    name: string | null
  }
}

// Transaction details response DTO
export type TransactionDetailsResponse = Pick<ITransaction,
  | "_id"
  | "type"
  | "amount"
  | "status"
  | "createdAt"
  | "coins"
  | "gatewayOrderId"
  | "gatewayPaymentId"
  | "payoutId"
  | "utr"
> & {
  user: Pick<IUser,
    | "_id"
    | "name"
    | "phone"
  > & {
    walletBalance: number
  }
}

// ============================================
// Plan DTOs
// ============================================

// Plan data for lists
export type PlanListResponse = Pick<IPlan,
  | '_id'
  | 'amount'
  | 'coins'
  | 'discountPercentage'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>

// Plan details for single view
export type PlanDetailsResponse = Pick<IPlan,
  | '_id'
  | 'amount'
  | 'coins'
  | 'discountPercentage'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>

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
export type ReportDetailsResponse = Pick<IReport,
  | "_id"
  | "description"
  | "status"
  | "adminNotes"
  | "resolvedAt"
  | "createdAt"
  | "updatedAt"
> & {
  reporter: Pick<IUser,
    | "_id"
    | "name"
    | "phone"
    | "role"
    | "accountStatus"
  >
  reportedAgainst: Pick<IUser,
    | "_id"
    | "name"
    | "phone"
    | "role"
    | "accountStatus"
  >
  call: Pick<ICall,
    | "_id"
    | "status"
    | "createdAt"
    | "acceptedAt"
    | "endedAt"
    | "durationInSeconds"
    | "coinsSpent"
    | "coinsEarned"
    | "userFeedback"
    | "telecallerFeedback"
  >
};

// Updated ReportListResponse with new field names
export type ReportListResponse = Pick<IReport,
  | '_id'
  | 'reportedBy'
  | 'reportedAgainst'
  | 'description'
  | 'status'
  | 'createdAt'
> & {
  reportedByName: string
  reportedAgainstName: string
};

export type TelecallerComplaintItem = Pick<IReport,
  | "_id"
  | "reportedBy"
  | "description"
  | "status"
  | "createdAt"
> & {
  reportedByName: string
};

// Detailed telecaller profile.
export type TelecallerDetailsResponse = Pick<ITelecaller,
  | '_id'
  | 'name'
  | 'phone'
  | 'dob'
  | 'gender'
  | 'accountStatus'
  | 'createdAt'
  | 'telecallerProfile'
> & {
  walletBalance: number
  complaints: TelecallerComplaintItem[]
  totalComplaints: number
}

// User complaint item for individual complaint display
export type UserComplaintItem = Pick<IReport,
  | "_id"
  | "reportedBy"
  | "description"
  | "status"
  | "createdAt"
> & {
  reportedByName: string;
};

// Detailed user profile response
export type UserDetailsResponse = Pick<IUser,
  | '_id'
  | 'name'
  | 'phone'
  | 'dob'
  | 'gender'
  | 'accountStatus'
  | 'createdAt'
> & {
  walletBalance: number;
  complaints: UserComplaintItem[];
  totalComplaints: number;
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
  blockUser(userId: string): Promise<boolean>
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