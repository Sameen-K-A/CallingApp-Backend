import { IUserDocument } from '../../models/user.model'
import { IUserBase } from '../../types/general'

// DTO for the complete-profile request body
export type CompleteProfileDto = Pick<IUserBase, | 'name' | 'dob' | 'gender' | 'role' | 'language'> & {
  about?: string
}

// DTO for the edit-profile request body (all fields optional, but at least one required)
export type EditProfileDto = Partial<Pick<IUserBase, | 'name' | 'language' | 'profile'>>

// Response user object sent to the frontend
export type UserProfileResponse =
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
      approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
      about: string
    }
  }

// Update user details
export type UserUpdatePayload = Partial<IUserBase> & {
  telecallerProfile?: {
    about: string
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL'
  }
}

// Plan response
export type PlanResponse = {
  _id: string
  amount: number
  coins: number
  discountPercentage: number
  createdAt: Date
}

// ============================================
// Favorite Telecaller DTOs
// ============================================

export type FavoriteTelecallerResponse = {
  _id: string
  name: string
  profile: string | null
  language: string
  about: string
  presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL'
}

export type PaginatedFavoritesResponse = {
  favorites: FavoriteTelecallerResponse[]
  hasMore: boolean
}

export type FavoriteActionResponse = {
  success: boolean
  message: string
}

// ============================================
// Home page listing Telecaller DTOs
// ============================================
export type TelecallerResponse = FavoriteTelecallerResponse & {
  isFavorite: boolean
}

export type PaginatedTelecallersResponse = {
  telecallers: TelecallerResponse[]
  hasMore: boolean
}

// ============================================
// Service & Repository Interfaces
// ============================================

export interface IUserRepository {
  findUserById(userId: string): Promise<IUserDocument | null>
  updateUser(userId: string, payload: UserUpdatePayload): Promise<IUserDocument | null>
  findActivePlans(): Promise<PlanResponse[]>
  findFavoritesByUserId(userId: string, page: number, limit: number): Promise<{ favorites: FavoriteTelecallerResponse[], total: number }>
  findTelecallerById(telecallerId: string): Promise<IUserDocument | null>
  addToFavorites(userId: string, telecallerId: string): Promise<boolean>
  removeFromFavorites(userId: string, telecallerId: string): Promise<boolean>
  findApprovedTelecallers(userId: string, page: number, limit: number): Promise<{ telecallers: TelecallerResponse[], total: number }>
}

export interface IUserService {
  getProfile(userId: string): Promise<UserProfileResponse>
  completeUserProfile(userId: string, profileData: CompleteProfileDto): Promise<UserProfileResponse>
  editUserProfile(userId: string, profileData: EditProfileDto): Promise<UserProfileResponse>
  getActivePlans(): Promise<PlanResponse[]>
  getFavorites(userId: string, page: number, limit: number): Promise<PaginatedFavoritesResponse>
  addToFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse>
  removeFromFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse>
  getTelecallers(userId: string, page: number, limit: number): Promise<PaginatedTelecallersResponse>
}