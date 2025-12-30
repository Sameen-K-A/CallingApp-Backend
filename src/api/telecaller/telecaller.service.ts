import { ApiError } from '../../middleware/errors/ApiError';
import { IBankDetails, IUserDocument } from '../../types/general';
import { isTelecaller } from '../../utils/guards';
import {
  EditProfileDto,
  ITelecallerRepository,
  ITelecallerService,
  ReapplyDto,
  ReapplyUpdatePayload,
  TelecallerProfileResponse,
  TelecallerUpdatePayload,
  BankDetailsDto,
  BankDetailsResponse,
  TelecallerForBankDetails,
  PaginatedTransactionHistoryResponse,
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

  private validateTelecaller(telecaller: TelecallerForBankDetails | null, requireApproved: boolean = true): asserts telecaller is TelecallerForBankDetails {
    if (!telecaller) {
      throw new ApiError(404, 'Account not found.');
    }
    if (telecaller.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }
    if (telecaller.role !== 'TELECALLER') {
      throw new ApiError(403, 'Only telecallers can access this feature.');
    }
    if (requireApproved && telecaller.telecallerProfile?.approvalStatus !== 'APPROVED') {
      throw new ApiError(403, 'Your application must be approved to access this feature.');
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

  public async getBankDetails(userId: string): Promise<BankDetailsResponse> {
    const telecaller = await this.telecallerRepository.findTelecallerForBankDetails(userId);
    this.validateTelecaller(telecaller);

    const bankDetails = telecaller.telecallerProfile?.bankDetails;

    if (!bankDetails || !bankDetails.accountNumber) {
      return null;
    }

    return {
      accountNumber: bankDetails.accountNumber,
      ifscCode: bankDetails.ifscCode,
      accountHolderName: bankDetails.accountHolderName,
    };
  };

  public async addBankDetails(userId: string, bankDetailsDto: BankDetailsDto): Promise<BankDetailsResponse> {
    const telecaller = await this.telecallerRepository.findTelecallerForBankDetails(userId);
    this.validateTelecaller(telecaller);

    const existingBankDetails = telecaller.telecallerProfile?.bankDetails;
    if (existingBankDetails && existingBankDetails.accountNumber) {
      throw new ApiError(400, 'Bank details already added.');
    }

    const bankDetails: IBankDetails = {
      accountNumber: bankDetailsDto.accountNumber,
      ifscCode: bankDetailsDto.ifscCode.toUpperCase(),
      accountHolderName: bankDetailsDto.accountHolderName,
    };

    const success = await this.telecallerRepository.addBankDetails(userId, bankDetails);

    if (!success) {
      throw new ApiError(500, 'Failed to add bank details.');
    }

    return bankDetails;
  };

  public async deleteBankDetails(userId: string): Promise<void> {
    const telecaller = await this.telecallerRepository.findTelecallerForBankDetails(userId);
    this.validateTelecaller(telecaller);

    const existingBankDetails = telecaller.telecallerProfile?.bankDetails;
    if (!existingBankDetails || !existingBankDetails.accountNumber) {
      throw new ApiError(404, 'No bank details found.');
    }

    const hasPending = await this.telecallerRepository.hasPendingWithdrawal(userId);
    if (hasPending) {
      throw new ApiError(400, 'Cannot delete bank details. You have a pending withdrawal request.');
    }

    const success = await this.telecallerRepository.removeBankDetails(userId);

    if (!success) {
      throw new ApiError(500, 'Failed to remove bank details.');
    }
  };

  public async getTransactionHistory(userId: string, page: number, limit: number): Promise<PaginatedTransactionHistoryResponse> {
    const telecaller = await this.telecallerRepository.findTelecallerForBankDetails(userId);
    this.validateTelecaller(telecaller);

    const { transactions, total } = await this.telecallerRepository.findTransactionHistory(userId, page, limit);

    return {
      transactions,
      hasMore: page * limit < total
    };
  };

};