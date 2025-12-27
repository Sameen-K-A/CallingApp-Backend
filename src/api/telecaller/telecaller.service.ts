import { ApiError } from '../../middleware/errors/ApiError';
import { IUserDocument } from '../../types/general';
import { isTelecaller } from '../../utils/guards';
import {
  EditProfileDto,
  ITelecallerRepository,
  ITelecallerService,
  ReapplyDto,
  ReapplyUpdatePayload,
  TelecallerProfileResponse,
  TelecallerUpdatePayload,
} from './telecaller.types';

function buildUserProfileResponse(user: IUserDocument): TelecallerProfileResponse {
  const response: TelecallerProfileResponse = {
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
  };

  if (isTelecaller(user)) {
    response.telecallerProfile = {
      verificationNotes: user.telecallerProfile.verificationNotes || "",
      approvalStatus: user.telecallerProfile.approvalStatus,
      about: user.telecallerProfile.about || "",
    };
  }

  return response;
};

export class TelecallerService implements ITelecallerService {
  constructor(private telecallerRepository: ITelecallerRepository) { }

  private checkUserAndAccountStatus(user: IUserDocument | null): asserts user is IUserDocument {
    if (!user) {
      throw new ApiError(404, 'Account not found.');
    }
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }
  };

  public async editUserProfile(userId: string, profileData: EditProfileDto): Promise<TelecallerProfileResponse> {
    const user = await this.telecallerRepository.findUserById(userId);
    this.checkUserAndAccountStatus(user);

    if (!user.name) {
      throw new ApiError(400, 'Please complete your profile first.');
    }

    if (!isTelecaller(user)) {
      throw new ApiError(400, 'Only telecallers can access this feature.');
    }

    if (user.telecallerProfile.approvalStatus !== 'APPROVED') {
      throw new ApiError(403, 'You can only edit your profile after your application is approved.');
    }

    const updatePayload: TelecallerUpdatePayload = {};

    if (profileData.name !== undefined) {
      updatePayload.name = profileData.name;
    };

    if (profileData.language !== undefined) {
      updatePayload.language = profileData.language;
    };

    if (profileData.profile !== undefined) {
      updatePayload.profile = profileData.profile;
    };

    if (profileData.about !== undefined) {
      updatePayload['telecallerProfile.about'] = profileData.about;
    };

    const updatedUser = await this.telecallerRepository.updateUser(userId, updatePayload);

    if (!updatedUser) {
      throw new ApiError(500, 'Failed to update user profile.');
    }

    return buildUserProfileResponse(updatedUser);
  };

  public async reapplyApplication(userId: string, reapplyData: ReapplyDto): Promise<TelecallerProfileResponse> {
    const user = await this.telecallerRepository.findUserById(userId);
    this.checkUserAndAccountStatus(user);

    if (!isTelecaller(user)) {
      throw new ApiError(400, 'Only telecallers can re-apply.');
    }

    if (user.telecallerProfile.approvalStatus !== 'REJECTED') {
      throw new ApiError(400, 'You can only re-apply if your application was rejected.');
    }

    const updatePayload: ReapplyUpdatePayload = {
      name: reapplyData.name,
      dob: new Date(reapplyData.dob),
      language: reapplyData.language,
      'telecallerProfile.about': reapplyData.about,
      'telecallerProfile.approvalStatus': 'PENDING',
    };

    const updatedUser = await this.telecallerRepository.updateUser(userId, updatePayload);

    if (!updatedUser) {
      throw new ApiError(500, 'Failed to submit re-application.');
    }

    return buildUserProfileResponse(updatedUser);
  };

};