import { Document, Types } from 'mongoose'
import { ILanguage } from '../constants/languages';
import { IUser } from './user';
import { ITelecaller } from './telecaller';

export interface IOTP extends Document {
  _id: Types.ObjectId;
  phone: string;
  otp: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface IBankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface IUserBase extends Document {
  _id: Types.ObjectId
  phone: string
  name?: string
  role?: 'USER' | 'TELECALLER'
  dob?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  profile?: string;
  language?: ILanguage
  wallet: { balance: number }
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  createdAt: Date
  updatedAt: Date
};

export type IUserDocument = IUser | ITelecaller;

export interface ITransaction extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: 'RECHARGE' | 'WITHDRAWAL'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED'
  createdAt: Date
  updatedAt: Date

  // For RECHARGE
  coins?: number
  gatewayOrderId?: string
  gatewayPaymentId?: string
  gatewaySignature?: string

  // For WITHDRAWAL
  bankDetails?: IBankDetails
  transferReference?: string
  processedAt?: Date
};

export interface IReport extends Document {
  _id: Types.ObjectId
  callId: Types.ObjectId
  reportedBy: Types.ObjectId
  reportedAgainst: Types.ObjectId
  description: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  adminNotes?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
};

export interface IPlan extends Document {
  _id: Types.ObjectId
  amount: number
  coins: number
  discountPercentage: number
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type CallType = 'AUDIO' | 'VIDEO';

export type CallStatus = 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'MISSED' | 'COMPLETED';

export interface ICall extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  telecallerId: Types.ObjectId;
  callType: CallType;
  status: CallStatus;
  durationInSeconds: number;
  coinsSpent: number;
  coinsEarned: number;
  userFeedback?: string;
  telecallerFeedback?: string;
  acceptedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}