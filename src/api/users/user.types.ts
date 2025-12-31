import { IUserDocument } from '../../types/general'
import { ILanguage } from '../../constants/languages'

// DTO for the complete-profile request body
export type CompleteProfileDto = {
  name: string
  dob: Date
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  role: 'USER' | 'TELECALLER'
  language: ILanguage
  about?: string
}

// DTO for the edit-profile request body (all fields optional, but at least one required)
export type EditProfileDto = {
  name?: string
  language?: ILanguage
  profile?: string | null
}

// Response user object sent to the frontend
export type UserProfileResponse = {
  _id: string
  phone: string
  name: string
  role: 'USER' | 'TELECALLER'
  dob: Date
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  language: ILanguage
  profile?: string
  accountStatus: 'ACTIVE' | 'SUSPENDED'
  wallet: { balance: number }
  createdAt: Date
  telecallerProfile?: {
    verificationNotes: string
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    about?: string
  }
}

// Update user details
export type UserUpdatePayload = {
  name?: string
  dob?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  language?: ILanguage
  profile?: string | null
  role?: 'USER' | 'TELECALLER'
  wallet?: { balance: number }
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

// Plans with first-time recharge indicator
export type PlansWithFirstRechargeResponse = {
  plans: PlanResponse[]
  isFirstRecharge: boolean
}

// ============================================
// Favorite Telecaller DTOs
// ============================================

export type FavoriteTelecallerResponse = {
  _id: string
  name: string
  profile: string | undefined
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
// Recharge Transaction History DTOs
// ============================================

export type RechargeTransactionHistoryItem = {
  _id: string
  type: 'RECHARGE'
  amount: number
  coins: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  gatewayOrderId?: string
  gatewayPaymentId?: string
  createdAt: Date
}

export type PaginatedRechargeTransactionResponse = {
  transactions: RechargeTransactionHistoryItem[]
  hasMore: boolean
}

// ============================================
// Service & Repository Interfaces
// ============================================

export interface IUserRepository {
  findUserById(userId: string): Promise<IUserDocument | null>
  updateUser(userId: string, payload: UserUpdatePayload): Promise<IUserDocument | null>
  findActivePlans(): Promise<PlanResponse[]>
  hasSuccessfulRecharge(userId: string): Promise<boolean>
  findFavoritesByUserId(userId: string, page: number, limit: number): Promise<{ favorites: FavoriteTelecallerResponse[], total: number }>
  findTelecallerById(telecallerId: string): Promise<IUserDocument | null>
  addToFavorites(userId: string, telecallerId: string): Promise<{ success: boolean; alreadyExists: boolean }>
  removeFromFavorites(userId: string, telecallerId: string): Promise<boolean>
  findApprovedTelecallers(userId: string, page: number, limit: number): Promise<{ telecallers: TelecallerResponse[], total: number }>
  isInFavorites(userId: string, telecallerId: string): Promise<boolean>
  getFavoritesCount(userId: string): Promise<number>
  findRechargeTransactionHistory(userId: string, page: number, limit: number): Promise<{ transactions: RechargeTransactionHistoryItem[], total: number }>
}

export interface IUserService {
  getProfile(userId: string): Promise<UserProfileResponse>
  completeUserProfile(userId: string, profileData: CompleteProfileDto): Promise<UserProfileResponse>
  editUserProfile(userId: string, profileData: EditProfileDto): Promise<UserProfileResponse>
  getPlansWithFirstRechargeStatus(userId: string): Promise<PlansWithFirstRechargeResponse>
  getFavorites(userId: string, page: number, limit: number): Promise<PaginatedFavoritesResponse>
  addToFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse>
  removeFromFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse>
  getTelecallers(userId: string, page: number, limit: number): Promise<PaginatedTelecallersResponse & { audioCallCharge: number; videoCallCharge: number }>
  getRechargeTransactionHistory(userId: string, page: number, limit: number): Promise<PaginatedRechargeTransactionResponse>
}