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
import { isTelecaller } from '../../utils/guards'
import { IUserDocument } from '../../types/general';

const MAX_FAVORITES_LIMIT = 50;

function buildUserProfileResponse(user: IUserDocument): UserProfileResponse {
  const response: UserProfileResponse = {
    _id: user._id.toString(),
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
      verificationNotes: user.telecallerProfile.verificationNotes || '',
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

  private checkIsRegularUser(user: IUserDocument): void {
    if (user.role === 'TELECALLER') {
      throw new ApiError(403, 'This feature is only available for users.')
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
        presence: 'OFFLINE'
      }
    }

    const updatedUser = await this.userRepository.updateUser(userId, updatePayload)
    if (!updatedUser) throw new ApiError(500, 'Failed to update user profile.')

    return buildUserProfileResponse(updatedUser)
  };

  public async editUserProfile(userId: string, profileData: EditProfileDto): Promise<UserProfileResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)

    if (!user.name) throw new ApiError(400, 'Please complete your profile first.')

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
    this.checkIsRegularUser(user)

    const { favorites, total } = await this.userRepository.findFavoritesByUserId(userId, page, limit)
    return { favorites, hasMore: page * limit < total }
  };

  public async addToFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)
    this.checkIsRegularUser(user)

    // Prevent user from adding themselves (edge case if userId somehow matches a telecaller)
    if (userId === telecallerId) {
      throw new ApiError(400, 'You cannot add yourself to favorites.')
    }

    const telecaller = await this.userRepository.findTelecallerById(telecallerId)
    if (!telecaller) {
      throw new ApiError(404, 'Telecaller not found.')
    }

    if (telecaller.accountStatus === 'SUSPENDED') {
      throw new ApiError(400, 'This telecaller is no longer available.')
    }

    // Use type guard for proper type narrowing
    if (!isTelecaller(telecaller) || telecaller.telecallerProfile.approvalStatus !== 'APPROVED') {
      throw new ApiError(400, 'This telecaller is not available.')
    }

    // Check if already in favorites first
    const isAlreadyFavorite = await this.userRepository.isInFavorites(userId, telecallerId)
    if (isAlreadyFavorite) {
      return { success: true, message: 'Telecaller is already in your favorites.' }
    }

    // Check favorites count before adding
    const currentCount = await this.userRepository.getFavoritesCount(userId)
    if (currentCount >= MAX_FAVORITES_LIMIT) {
      throw new ApiError(400, `You have reached the maximum limit of ${MAX_FAVORITES_LIMIT} favorites.`)
    }

    const result = await this.userRepository.addToFavorites(userId, telecallerId)
    if (!result.success) {
      throw new ApiError(500, 'Failed to add to favorites. Please try again.')
    }

    return { success: true, message: 'Added to favorites successfully.' }
  };

  public async removeFromFavorites(userId: string, telecallerId: string): Promise<FavoriteActionResponse> {
    const user = await this.userRepository.findUserById(userId)
    this.checkUserAndAccountStatus(user)
    this.checkIsRegularUser(user)

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