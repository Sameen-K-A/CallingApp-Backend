import { ILanguage } from "../../constants/languages";
import { IUserDocument } from "../../types/general";

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

// Update payload using MongoDB dot notation for nested fields
export type TelecallerUpdatePayload = {
  name?: string;
  language?: ILanguage;
  profile?: string | null;
  'telecallerProfile.about'?: string;
  'telecallerProfile.approvalStatus'?: 'PENDING' | 'APPROVED' | 'REJECTED';
  'telecallerProfile.presence'?: 'ONLINE' | 'OFFLINE' | 'ON_CALL';
  'telecallerProfile.verificationNotes'?: string;
};

// Update payload for re-apply
export type ReapplyUpdatePayload = {
  name: string;
  dob: Date;
  language: ILanguage;
  'telecallerProfile.about': string;
  'telecallerProfile.approvalStatus': 'PENDING';
};

// ============================================
// Service & Repository Interfaces
// ============================================

export interface ITelecallerRepository {
  findUserById(userId: string): Promise<IUserDocument | null>;
  updateUser(userId: string, payload: TelecallerUpdatePayload | ReapplyUpdatePayload): Promise<IUserDocument | null>;
};

export interface ITelecallerService {
  editUserProfile(userId: string, profileData: EditProfileDto): Promise<TelecallerProfileResponse>;
  reapplyApplication(userId: string, reapplyData: ReapplyDto): Promise<TelecallerProfileResponse>;
};