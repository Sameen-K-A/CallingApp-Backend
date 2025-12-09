import { IUserDocument } from "../../models/user.model";
import { IUserBase } from "../../types/general";

// DTO for the edit-profile request body
export type EditProfileDto = Partial<Pick<IUserBase, 'name' | 'language' | 'profile'>> & {
  about?: string;
};

// Response telecaller object sent to the frontend
export type TelecallerProfileResponse =
  & Pick<IUserBase,
    | '_id'
    | 'phone'
    | 'name'
    | 'role'
    | 'dob'
    | 'gender'
    | 'language'
    | 'profile'
    | 'accountStatus'
    | 'wallet'
    | 'createdAt'
  >
  & {
    telecallerProfile?: {
      verificationNotes: string;
      approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      about: string;
    };
  };

// Update payload using MongoDB dot notation for nested fields
export type TelecallerUpdatePayload = Partial<Pick<IUserBase, 'name' | 'language' | 'profile'>> & {
  'telecallerProfile.about'?: string;
  'telecallerProfile.approvalStatus'?: 'PENDING' | 'APPROVED' | 'REJECTED';
  'telecallerProfile.presence'?: 'ONLINE' | 'OFFLINE' | 'ON_CALL';
  'telecallerProfile.verificationNotes'?: string;
};

// ============================================
// Service & Repository Interfaces
// ============================================

export interface ITelecallerRepository {
  findUserById(userId: string): Promise<IUserDocument | null>;
  updateUser(userId: string, payload: TelecallerUpdatePayload): Promise<IUserDocument | null>;
};

export interface ITelecallerService {
  editUserProfile(userId: string, profileData: EditProfileDto): Promise<TelecallerProfileResponse>;
};