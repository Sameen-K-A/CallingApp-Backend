import {
  IAdminRepository,
  PaginatedResult,
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
  UpdatePlanInput,
  UpdateConfigInput,
} from './admin.types'
import AdminModel from '../../models/admin.model'
import UserModel from '../../models/user.model'
import TransactionModel from '../../models/transaction.model'
import ReportModel from '../../models/report.model'
import { IAdmin } from '../../types/admin'
import mongoose from 'mongoose'
import { IReport, IUserDocument } from '../../types/general'
import CallModel from '../../models/call.model'
import PlanModel from '../../models/plan.model'
import { IAppConfigDocument } from '../../types/config'
import { getConfigDocument, updateConfig } from '../../services/config.service';

export class AdminRepository implements IAdminRepository {

  // Finds an admin by email for whitelist verification.
  public async findAdminByEmail(email: string): Promise<IAdmin | null> {
    return AdminModel.findOne({ email })
  };

  // ============================================
  // Data Fetching (Read Operations)
  // ============================================

  // Fetches a paginated list of all regular users.
  public async getAllUsers(page: number, limit: number): Promise<PaginatedResult<UserListResponse>> {
    const skip = (page - 1) * limit
    const items = await UserModel.aggregate<UserListResponse>([
      { $match: { role: 'USER' } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: { $toString: '$_id' },
          phone: 1,
          name: { $ifNull: ['$name', null] },
          gender: { $ifNull: ['$gender', null] },
          accountStatus: 1,
          createdAt: 1
        }
      }
    ])
    const total = await UserModel.countDocuments({ role: 'USER' })
    return { items, total }
  }

  // Fetches detailed information for a single user.
  public async getUserDetails(userId: string): Promise<UserDetailsResponse | null> {
    const results = await UserModel.aggregate<UserDetailsResponse>([
      { $match: { _id: new mongoose.Types.ObjectId(userId), role: 'USER' } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'reports',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$reportedAgainst', '$$userId'] }
              }
            },
            { $sort: { createdAt: -1 } },
            {
              $lookup: {
                from: 'users',
                localField: 'reportedBy',
                foreignField: '_id',
                as: 'reporter'
              }
            },
            { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: { $toString: '$_id' },
                reportedBy: { $toString: '$reportedBy' },
                reportedByName: { $ifNull: ['$reporter.name', 'Deleted User'] },
                description: 1,
                status: 1,
                createdAt: 1
              }
            }
          ],
          as: 'allComplaints'
        }
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: { $ifNull: ['$name', null] },
          phone: 1,
          dob: { $ifNull: ['$dob', null] },
          gender: { $ifNull: ['$gender', null] },
          accountStatus: 1,
          walletBalance: '$wallet.balance',
          createdAt: 1,
          // Get last 5 complaints
          complaints: { $slice: ['$allComplaints', 5] },
          // Get total count of all complaints
          totalComplaints: { $size: '$allComplaints' }
        }
      }
    ])

    return results[0] || null;
  };

  // Fetches a paginated list of all plans (excluding soft deleted)
  public async getAllPlans(page: number, limit: number): Promise<PaginatedResult<PlanListResponse>> {
    const skip = (page - 1) * limit

    const items = await PlanModel.aggregate<PlanListResponse>([
      { $match: { isDeleted: false } },
      { $sort: { amount: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: { $toString: '$_id' },
          amount: 1,
          coins: 1,
          discountPercentage: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ])

    const total = await PlanModel.countDocuments({ isDeleted: false })

    return { items, total }
  };

  // Fetches a single plan by ID
  public async getPlanById(planId: string): Promise<PlanDetailsResponse | null> {
    const results = await PlanModel.aggregate<PlanDetailsResponse>([
      { $match: { _id: new mongoose.Types.ObjectId(planId), isDeleted: false } },
      { $limit: 1 },
      {
        $project: {
          _id: { $toString: '$_id' },
          amount: 1,
          coins: 1,
          discountPercentage: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ])

    return results[0] || null
  };

  // Fetches a paginated list of telecallers by their approval status.
  public async getTelecallers(status: 'PENDING' | 'APPROVED' | 'REJECTED', page: number, limit: number): Promise<PaginatedResult<TelecallerListResponse>> {
    const skip = (page - 1) * limit
    const items = await UserModel.aggregate<TelecallerListResponse>([
      { $match: { role: 'TELECALLER', 'telecallerProfile.approvalStatus': status } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: { $toString: '$_id' },
          phone: 1,
          name: { $ifNull: ['$name', null] },
          accountStatus: 1,
          createdAt: 1
        }
      }
    ])
    const total = await UserModel.countDocuments({ role: 'TELECALLER', 'telecallerProfile.approvalStatus': status })
    return { items, total }
  }

  // Fetches detailed information for a single telecaller.
  public async getTelecallerDetails(telecallerId: string): Promise<TelecallerDetailsResponse | null> {
    const results = await UserModel.aggregate<TelecallerDetailsResponse>([
      { $match: { _id: new mongoose.Types.ObjectId(telecallerId), role: 'TELECALLER' } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'reports',
          let: {
            telecallerId: '$_id',
            isApproved: { $eq: ['$telecallerProfile.approvalStatus', 'APPROVED'] }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$reportedAgainst', '$$telecallerId'] },
                    '$$isApproved'  // Only fetch if approved
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            {
              $lookup: {
                from: 'users',
                localField: 'reportedBy',
                foreignField: '_id',
                as: 'reporter'
              }
            },
            { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: { $toString: '$_id' },
                reportedBy: { $toString: '$reportedBy' },
                reportedByName: { $ifNull: ['$reporter.name', 'Deleted User'] },
                description: 1,
                status: 1,
                createdAt: 1
              }
            }
          ],
          as: 'allComplaints'
        }
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: { $ifNull: ['$name', null] },
          phone: 1,
          dob: { $ifNull: ['$dob', null] },
          gender: { $ifNull: ['$gender', null] },
          accountStatus: 1,
          walletBalance: '$wallet.balance',
          createdAt: 1,
          telecallerProfile: 1,
          // Get last 5 complaints (will be empty array if not approved)
          complaints: { $slice: ['$allComplaints', 5] },
          // Get total count of all complaints (will be 0 if not approved)
          totalComplaints: { $size: '$allComplaints' }
        }
      }
    ])

    return results[0] || null;
  };

  // Fetches a paginated list of transactions by type.
  public async getTransactions(type: 'RECHARGE' | 'WITHDRAWAL', page: number, limit: number): Promise<PaginatedResult<TransactionListResponse>> {
    const skip = (page - 1) * limit
    const items = await TransactionModel.aggregate<TransactionListResponse>([
      { $match: { type } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: '$_id' },
          user: {
            name: { $ifNull: ['$user.name', null] }
          },
          type: 1,
          amount: 1,
          status: 1,
          createdAt: 1
        }
      }
    ]);

    const total = await TransactionModel.countDocuments({ type })
    return { items, total }
  };

  // Fetches detailed information for a single transaction with user data
  public async getTransactionDetails(transactionId: string): Promise<TransactionDetailsResponse | null> {
    const results = await TransactionModel.aggregate<TransactionDetailsResponse>([
      { $match: { _id: new mongoose.Types.ObjectId(transactionId) } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: '$_id' },
          user: {
            _id: { $toString: '$user._id' },
            name: { $ifNull: ['$user.name', 'Unknown User'] },
            phone: '$user.phone',
            walletBalance: '$user.wallet.balance'
          },
          type: 1,
          amount: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,

          // RECHARGE fields
          coins: { $cond: { if: { $eq: ['$type', 'RECHARGE'] }, then: '$coins', else: '$$REMOVE' } },
          gatewayOrderId: { $cond: { if: { $eq: ['$type', 'RECHARGE'] }, then: '$gatewayOrderId', else: '$$REMOVE' } },
          gatewayPaymentId: { $cond: { if: { $eq: ['$type', 'RECHARGE'] }, then: '$gatewayPaymentId', else: '$$REMOVE' } },

          // WITHDRAWAL fields
          payoutId: { $cond: { if: { $eq: ['$type', 'WITHDRAWAL'] }, then: '$payoutId', else: '$$REMOVE' } },
          utr: { $cond: { if: { $eq: ['$type', 'WITHDRAWAL'] }, then: '$utr', else: '$$REMOVE' } }
        }
      }
    ])

    return results[0] || null
  };

  // Fetches a paginated list of all user-submitted reports.
  public async getAllReports(page: number, limit: number): Promise<PaginatedResult<ReportListResponse>> {
    const skip = (page - 1) * limit
    const items = await ReportModel.aggregate<ReportListResponse>([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'reportedBy', foreignField: '_id', as: 'reporter' } },
      { $lookup: { from: 'users', localField: 'reportedAgainst', foreignField: '_id', as: 'reported' } },
      { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$reported', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: '$_id' },
          reportedBy: { $toString: '$reportedBy' },
          reportedByName: { $ifNull: ['$reporter.name', 'Deleted User'] },
          reportedAgainst: { $toString: '$reportedAgainst' },
          reportedAgainstName: { $ifNull: ['$reported.name', 'Deleted User'] },
          description: 1,
          status: 1,
          createdAt: 1
        }
      }
    ]);

    const total = await ReportModel.countDocuments()
    return { items, total }
  };

  // ============================================
  // Data Mutation (Write Operations)
  // ============================================

  // Finds a telecaller by ID, used for state checks before updates.
  public async findTelecallerById(telecallerId: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ _id: telecallerId, role: 'TELECALLER' })
  };

  // Updates a telecaller's approval status. Returns the complete updated document.
  public async updateTelecallerStatus(telecallerId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      telecallerId,
      {
        $set: {
          'telecallerProfile.approvalStatus': status,
          ...(adminNotes && { 'telecallerProfile.verificationNotes': adminNotes })
        }
      },
      { new: true }
    )
  };

  // Fetches detailed information for a single report with call and user data
  public async getReportDetails(reportId: string): Promise<ReportDetailsResponse | null> {
    const results = await ReportModel.aggregate<ReportDetailsResponse>([
      { $match: { _id: new mongoose.Types.ObjectId(reportId) } },
      { $limit: 1 },

      // Lookup call details
      { $lookup: { from: 'calls', localField: 'callId', foreignField: '_id', as: 'call' } },
      { $unwind: { path: '$call', preserveNullAndEmptyArrays: true } },

      // Lookup reporter details
      { $lookup: { from: 'users', localField: 'reportedBy', foreignField: '_id', as: 'reporter' } },
      { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },

      // Lookup reported against user details  
      { $lookup: { from: 'users', localField: 'reportedAgainst', foreignField: '_id', as: 'reportedAgainst' } },
      { $unwind: { path: '$reportedAgainst', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: { $toString: '$_id' },
          description: 1,
          status: 1,
          adminNotes: 1,
          resolvedAt: 1,
          createdAt: 1,
          updatedAt: 1,

          // Reporter information
          reporter: {
            _id: { $toString: '$reporter._id' },
            name: { $ifNull: ['$reporter.name', 'Deleted User'] },
            phone: '$reporter.phone',
            role: '$reporter.role',
            accountStatus: '$reporter.accountStatus'
          },

          // Reported against user information
          reportedAgainst: {
            _id: { $toString: '$reportedAgainst._id' },
            name: { $ifNull: ['$reportedAgainst.name', 'Deleted User'] },
            phone: '$reportedAgainst.phone',
            role: '$reportedAgainst.role',
            accountStatus: '$reportedAgainst.accountStatus'
          },

          // Call details
          call: {
            _id: { $toString: '$call._id' },
            status: '$call.status',
            createdAt: '$call.createdAt',
            acceptedAt: '$call.acceptedAt',
            endedAt: '$call.endedAt',
            durationInSeconds: '$call.durationInSeconds',
            coinsSpent: '$call.coinsSpent',
            coinsEarned: '$call.coinsEarned',
            userFeedback: '$call.userFeedback',
            telecallerFeedback: '$call.telecallerFeedback'
          }
        }
      }
    ]);

    return results[0] || null;
  };

  // Updates report status, admin notes, and sets resolvedAt timestamp if resolved/dismissed
  public async updateReportStatus(reportId: string, status: string, adminNotes?: string): Promise<IReport | null> {
    const updateData: any = { status, ...(adminNotes && { adminNotes }) };

    if (status === 'RESOLVED' || status === 'DISMISSED') {
      updateData.resolvedAt = new Date()
    };

    return ReportModel.findByIdAndUpdate(
      reportId,
      { $set: updateData },
      { new: true }
    );
  };

  // Blocks a user by setting their account status to SUSPENDED
  public async blockUser(userId: string, isTelecaller: boolean = false): Promise<boolean> {
    const updateData: any = { accountStatus: 'SUSPENDED' };

    if (isTelecaller) {
      updateData['telecallerProfile.presence'] = 'OFFLINE';
    }

    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    return !!result
  };

  // Unblocks a user by setting their account status back to ACTIVE
  public async unblockUser(userId: string): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { accountStatus: 'ACTIVE' } },
      { new: true }
    );
    return !!result
  };

  // Gets complete user information by ID
  public async getUser(userId: string): Promise<IUserDocument | null> {
    return UserModel.findById(userId);
  };

  // ============================================
  // Dashboard operations
  // ============================================

  public async getDashboardStats(): Promise<DashboardStatsResponse> {

    // Revenue Stats (from Transactions)
    const revenueStats = await TransactionModel.aggregate([
      {
        $facet: {
          recharges: [
            { $match: { type: 'RECHARGE', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
          withdrawals: [
            { $match: { type: 'WITHDRAWAL', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]
        }
      }
    ]);

    const totalRecharges = revenueStats[0]?.recharges[0]?.total || 0;
    const totalWithdrawals = revenueStats[0]?.withdrawals[0]?.total || 0;
    const platformProfit = totalRecharges - totalWithdrawals;

    // User Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const userStats = await UserModel.aggregate([
      { $match: { role: 'USER' } },
      {
        $facet: {
          total: [
            { $count: 'count' }
          ],
          newThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: 'count' }
          ],
          incompleteProfiles: [
            {
              $match: {
                $or: [
                  { name: { $exists: false } },
                  { name: null },
                  { name: '' },
                  { gender: { $exists: false } },
                  { gender: null },
                  { dob: { $exists: false } },
                  { dob: null }
                ]
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const totalUsers = userStats[0]?.total[0]?.count || 0;
    const newUsersThisMonth = userStats[0]?.newThisMonth[0]?.count || 0;
    const incompleteProfiles = userStats[0]?.incompleteProfiles[0]?.count || 0;

    // Telecaller Stats
    const telecallerStats = await UserModel.aggregate([
      { $match: { role: 'TELECALLER' } },
      {
        $facet: {
          total: [
            { $count: 'count' }
          ],
          approved: [
            { $match: { 'telecallerProfile.approvalStatus': 'APPROVED' } },
            { $count: 'count' }
          ],
          pending: [
            { $match: { 'telecallerProfile.approvalStatus': 'PENDING' } },
            { $count: 'count' }
          ],
          rejected: [
            { $match: { 'telecallerProfile.approvalStatus': 'REJECTED' } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const totalTelecallers = telecallerStats[0]?.total[0]?.count || 0;
    const approvedTelecallers = telecallerStats[0]?.approved[0]?.count || 0;
    const pendingTelecallers = telecallerStats[0]?.pending[0]?.count || 0;
    const rejectedTelecallers = telecallerStats[0]?.rejected[0]?.count || 0;

    // Call Stats (Only COMPLETED calls)
    const callStats = await CallModel.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$durationInSeconds' }
        }
      }
    ]);

    const totalCalls = callStats[0]?.totalCalls || 0;
    const totalDurationSeconds = callStats[0]?.totalDuration || 0;
    const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);
    const averageDurationSeconds = totalCalls > 0 ? Math.floor(totalDurationSeconds / totalCalls) : 0;

    return {
      revenue: {
        totalRecharges,
        totalWithdrawals,
        platformProfit
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        incompleteProfiles
      },
      telecallers: {
        total: totalTelecallers,
        approved: approvedTelecallers,
        pending: pendingTelecallers,
        rejected: rejectedTelecallers
      },
      calls: {
        total: totalCalls,
        totalDurationMinutes,
        averageDurationSeconds
      }
    };
  };

  // ============================================
  // Plan Management
  // ============================================

  // Creates a new plan
  public async createPlan(data: CreatePlanInput): Promise<PlanDetailsResponse> {
    const plan = await PlanModel.create({
      amount: data.amount,
      coins: data.coins,
      discountPercentage: data.discountPercentage ?? 0
    })

    return {
      _id: plan._id.toString(),
      amount: plan.amount,
      coins: plan.coins,
      discountPercentage: plan.discountPercentage,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }
  };

  // Updates an existing plan
  public async updatePlan(planId: string, data: UpdatePlanInput): Promise<PlanDetailsResponse | null> {
    const plan = await PlanModel.findOneAndUpdate(
      { _id: planId, isDeleted: false },
      { $set: data },
      { new: true }
    )

    if (!plan) return null

    return {
      _id: plan._id.toString(),
      amount: plan.amount,
      coins: plan.coins,
      discountPercentage: plan.discountPercentage,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }
  };

  // Soft deletes a plan
  public async deletePlan(planId: string): Promise<boolean> {
    const result = await PlanModel.findOneAndUpdate(
      { _id: planId, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    )

    return !!result
  };

  // Config Management
  public async getConfig(): Promise<IAppConfigDocument | null> {
    return getConfigDocument();
  }

  public async updateConfig(data: UpdateConfigInput): Promise<IAppConfigDocument> {
    return updateConfig(data);
  }

};