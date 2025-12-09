import {
  IUserRepository,
  IUserService,
  CompleteProfileDto,
  EditProfileDto,
  UserProfileResponse,
  UserUpdatePayload,
  PlanResponse,
  PaginatedFavoritesResponse,
  FavoriteActionResponse,
  PaginatedTelecallersResponse
} from './user.types'
import { ApiError } from '../../middleware/errors/ApiError'
import { IUserDocument } from '../../models/user.model'
import { ITelecaller } from '../../types/telecaller'

function isTelecaller(user: IUserDocument): user is ITelecaller {
  return user.role === 'TELECALLER' && !!user.telecallerProfile
}

function buildUserProfileResponse(user: IUserDocument): UserProfileResponse {
  const response: UserProfileResponse = {
    _id: user._id,
    phone: user.phone,
    name: user.name!,
    role: user.role!,
    dob: user.dob!,
    gender: user.gender!,
    language: user.language!,
    profile: user.profile,
    accountStatus: user.accountStatus,
    wallet: { balance: user.wallet.balance },
    createdAt: user.createdAt,
  }

  if (isTelecaller(user)) {
    response.telecallerProfile = {
      verificationNotes: user.telecallerProfile.verificationNotes || "",
      approvalStatus: user.telecallerProfile.approvalStatus,
      about: user.telecallerProfile.about
    }
  }

  return response
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) { }

  private checkUserAndAccountStatus(user: IUserDocument | null): asserts user is IUserDocument {
    if (!user) {
      throw new ApiError(404, 'User not found.')
    }
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.')
    }
  };

  public async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    return buildUserProfileResponse(user)
  };

  public async completeUserProfile(userId: string, profileData: CompleteProfileDto): Promise<UserProfileResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    if (user.name) throw new ApiError(400, 'Profile has already been completed.')

    const { name, dob, gender, language, role, about } = profileData
    const updatePayload: UserUpdatePayload = { name, dob, gender, language, role }

    if (role === 'TELECALLER') {
      updatePayload.wallet = { balance: 0 }
      updatePayload.telecallerProfile = {
        about: about || '',
        approvalStatus: 'PENDING',
        presence: 'ONLINE'
      }
    }

    const updatedUser = await this.userRepository.updateUser(userId, updatePayload)
    if (!updatedUser) throw new ApiError(500, 'Failed to update user profile.')

    return buildUserProfileResponse(updatedUser)
  };

  public async editUserProfile(userId: string, profileData: EditProfileDto): Promise<UserProfileResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    if (!user!.name) throw new ApiError(400, 'Please complete your profile first.')

    const updatePayload: UserUpdatePayload = {}

    if (profileData.name !== undefined) {
      updatePayload.name = profileData.name
    }

    if (profileData.language !== undefined) {
      updatePayload.language = profileData.language
    }

    if (profileData.profile !== undefined) {
      updatePayload.profile = profileData.profile
    }

    const updatedUser = await this.userRepository.updateUser(userId, updatePayload)
    if (!updatedUser) throw new ApiError(500, 'Failed to update user profile.')

    return buildUserProfileResponse(updatedUser)
  };

  public async getActivePlans(): Promise<PlanResponse[]> {
    const plans = await this.userRepository.findActivePlans()

    if (!plans || plans.length === 0) {
      return []
    }
    return plans
  };

  public async getFavorites(userId: string, page: number, limit: number): Promise<PaginatedFavoritesResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    const { favorites, total } = await this.userRepository.findFavoritesByUserId(userId, page, limit)
    return { favorites, hasMore: page * limit < total }
  };

  public async addToFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    const telecaller = await this.userRepository.findTelecallerById(telecallerId)
    if (!telecaller) {
      throw new ApiError(404, 'Telecaller not found.')
    }

    if (telecaller.accountStatus === 'SUSPENDED') {
      throw new ApiError(400, 'This telecaller is no longer available.')
    }

    if (!telecaller.telecallerProfile || telecaller.telecallerProfile.approvalStatus !== 'APPROVED') {
      throw new ApiError(400, 'This telecaller is not available.')
    }

    const added = await this.userRepository.addToFavorites(userId, telecallerId)
    if (!added) {
      throw new ApiError(400, 'You have reached the maximum limit of 50 favorites.')
    }

    return { success: true, message: 'Added to favorites successfully.' }
  };

  public async removeFromFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    await this.userRepository.removeFromFavorites(userId, telecallerId)

    return { success: true, message: 'Removed from favorites successfully.' }
  };

  public async getTelecallers(userId: string, page: number, limit: number): Promise<PaginatedTelecallersResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    const { telecallers, total } = await this.userRepository.findApprovedTelecallers(userId, page, limit)
    return { telecallers, hasMore: page * limit < total }
  };

};