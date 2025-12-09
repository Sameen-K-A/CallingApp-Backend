import { IUserDocument } from '../../models/user.model';
import { IOTP } from '../../types/general';
import { ITelecaller } from '../../types/telecaller';
import { IUser } from '../../types/user';

// ============================================
// DTOs (Data Transfer Objects) for API Responses
// ============================================

export type UserAuthResponse =
  | Pick<IUser,
    | '_id'
    | 'phone'
    | 'name'
    | 'dob'
    | 'language'
    | 'gender'
    | "profile"
    | 'accountStatus'
    | 'createdAt'
  >
  | Pick<ITelecaller,
    | '_id'
    | 'phone'
    | 'name'
    | 'dob'
    | 'gender'
    | "profile"
    | 'language'
    | 'accountStatus'
    | 'role'
    | 'createdAt'
  > & {
    telecallerProfile?: {
      verificationNotes: string;
      approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
      about: string
    }
  };

export interface VerifyOtpResponse {
  token: string;
  user: UserAuthResponse;
}

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