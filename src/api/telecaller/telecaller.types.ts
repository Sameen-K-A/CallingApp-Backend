import { ILanguage } from "../../constants/languages";
import { IBankDetails, IUserDocument } from "../../types/general";

// DTO for the edit-profile request body
export type EditProfileDto = {
  name?: string;
  language?: ILanguage;
  profile?: string | null;
  about?: string;
};

// DTO for the re-apply request body
export interface ReapplyDto {
  name: string;
  dob: string;
  language: ILanguage;
  about: string;
}

// DTO for bank details request body
export interface BankDetailsDto {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

// Response telecaller object sent to the frontend
export type TelecallerProfileResponse = {
  _id: string;
  phone: string;
  name: string;
  role: 'USER' | 'TELECALLER';
  dob: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  language: ILanguage;
  profile?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  wallet: { balance: number };
  createdAt: Date;
  telecallerProfile?: {
    verificationNotes: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    about: string;
  };
};

// Bank details response
export type BankDetailsResponse = IBankDetails | null;

// Update payload using MongoDB dot notation for nested fields
export type TelecallerUpdatePayload = {
  name?: string;
  language?: ILanguage;
  profile?: string | null;
  'telecallerProfile.about'?: string;
  'telecallerProfile.approvalStatus'?: 'PENDING' | 'APPROVED' | 'REJECTED';
  'telecallerProfile.presence'?: 'ONLINE' | 'OFFLINE' | 'ON_CALL';
  'telecallerProfile.verificationNotes'?: string;
  'telecallerProfile.bankDetails'?: IBankDetails;
};

// Update payload for re-apply
export type ReapplyUpdatePayload = {
  name: string;
  dob: Date;
  language: ILanguage;
  'telecallerProfile.about': string;
  'telecallerProfile.approvalStatus': 'PENDING';
};

// Repository return type for bank details check
export interface TelecallerForBankDetails {
  _id: string;
  role: 'USER' | 'TELECALLER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  telecallerProfile?: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    bankDetails?: IBankDetails;
  };
}

// ============================================
// Service & Repository Interfaces
// ============================================

export interface ITelecallerRepository {
  findUserById(userId: string): Promise<IUserDocument | null>;
  updateUser(userId: string, payload: TelecallerUpdatePayload | ReapplyUpdatePayload): Promise<IUserDocument | null>;
  findTelecallerForBankDetails(userId: string): Promise<TelecallerForBankDetails | null>;
  addBankDetails(userId: string, bankDetails: IBankDetails): Promise<boolean>;
  removeBankDetails(userId: string): Promise<boolean>;
  hasPendingWithdrawal(userId: string): Promise<boolean>;
};

export interface ITelecallerService {
  editUserProfile(userId: string, profileData: EditProfileDto): Promise<TelecallerProfileResponse>;
  reapplyApplication(userId: string, reapplyData: ReapplyDto): Promise<TelecallerProfileResponse>;
  getBankDetails(userId: string): Promise<BankDetailsResponse>;
  addBankDetails(userId: string, bankDetails: BankDetailsDto): Promise<BankDetailsResponse>;
  deleteBankDetails(userId: string): Promise<void>;
};