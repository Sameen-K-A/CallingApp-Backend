import { IUserDocument } from '../../types/general';
import { IOTP } from '../../types/general';

// ============================================
// DTOs (Data Transfer Objects) for API Responses
// ============================================

export interface UserAuthResponseBase {
  _id: string;
  phone: string;
  name?: string;
  dob?: Date;
  language?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profile?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  role: 'USER' | 'TELECALLER';
  wallet: {
    balance: number;
  };
  createdAt: Date;
};

export interface UserAuthResponseUser extends UserAuthResponseBase {
  role: 'USER';
};

export interface UserAuthResponseTelecaller extends UserAuthResponseBase {
  role: 'TELECALLER';
  telecallerProfile: {
    about?: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verificationNotes?: string;
  };
};

export type UserAuthResponse = UserAuthResponseUser | UserAuthResponseTelecaller;

export interface VerifyOtpResponse {
  token: string;
  user: UserAuthResponse;
};

// ============================================
// Service & Repository Interfaces
// ============================================

export interface IAuthRepository {
  findUserByPhone(phone: string): Promise<IUserDocument | null>;
  findOrCreateUser(phone: string): Promise<IUserDocument>;
  upsertOtp(phone: string, otp: string): Promise<IOTP>;
  findOtpByPhone(phone: string): Promise<IOTP | null>;
  incrementOtpAttempts(phone: string): Promise<void>;
  deleteOtp(phone: string): Promise<void>;
}

export interface IAuthService {
  generateOtp(phone: string): Promise<string>;
  resendOtp(phone: string): Promise<string>;
  verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse>;
}