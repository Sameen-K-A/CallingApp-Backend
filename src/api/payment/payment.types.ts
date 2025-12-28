import { Types, ClientSession } from 'mongoose';
import { IBankDetails, ITransaction } from '../../types/general';

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

export interface CreateOrderDto {
  planId: string;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cancelled?: boolean;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
  coins: number;
  razorpayKeyId: string;
}

export interface VerifyPaymentSuccessResponse {
  transactionId: string;
  coins: number;
  newBalance: number;
  amount: number;
}

// ============================================
// Withdrawal Types
// ============================================

export interface WithdrawDto {
  coins: number;
}

export interface WithdrawResponse {
  transactionId: string;
  coins: number;
  amount: number;
  status: 'PENDING';
  currentBalance: number;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

export interface TelecallerForWithdrawal {
  _id: Types.ObjectId;
  role: 'USER' | 'TELECALLER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  wallet: {
    balance: number;
  };
  telecallerProfile?: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    bankDetails?: IBankDetails;
  };
}

export interface CreateWithdrawalTransactionData {
  userId: Types.ObjectId;
  type: 'WITHDRAWAL';
  coins: number;
  amount: number;
  status: 'PENDING';
  bankDetails: IBankDetails;
}

// ============================================
// Repository Return Types
// ============================================

export interface UserForPayment {
  _id: Types.ObjectId;
  role: 'USER' | 'TELECALLER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
}

export interface PlanForPayment {
  _id: Types.ObjectId;
  amount: number;
  coins: number;
}

export interface TransactionForVerification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'RECHARGE' | 'WITHDRAWAL';
  amount: number;
  coins?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  gatewayOrderId?: string;
}

// ============================================
// Repository Input Types
// ============================================

export interface CreateTransactionData {
  userId: Types.ObjectId;
  type: 'RECHARGE';
  amount: number;
  coins: number;
  status: 'PENDING';
  gatewayOrderId: string;
}

export interface UpdateTransactionData {
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  gatewayPaymentId?: string;
  gatewaySignature?: string;
}

// ============================================
// Repository Interface
// ============================================

export interface IPaymentRepository {
  findUserById(userId: string): Promise<UserForPayment | null>;
  findPlanById(planId: string): Promise<PlanForPayment | null>;
  createTransaction(data: CreateTransactionData): Promise<ITransaction>;
  findTransactionByOrderId(orderId: string): Promise<TransactionForVerification | null>;
  updateTransaction(transactionId: string, data: UpdateTransactionData, session?: ClientSession): Promise<ITransaction | null>;
  updateUserWalletBalance(userId: string, coinsToAdd: number, session?: ClientSession): Promise<number | null>;

  // withdrawal methods
  findTelecallerForWithdrawal(userId: string): Promise<TelecallerForWithdrawal | null>;
  hasPendingWithdrawal(userId: string): Promise<boolean>;
  createWithdrawalTransaction(data: CreateWithdrawalTransactionData): Promise<ITransaction>;
}

// ============================================
// Service Interface
// ============================================

export interface IPaymentService {
  createOrder(userId: string, dto: CreateOrderDto): Promise<CreateOrderResponse>;
  verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<VerifyPaymentSuccessResponse | null>;
  withdraw(userId: string, dto: WithdrawDto): Promise<WithdrawResponse>;
}