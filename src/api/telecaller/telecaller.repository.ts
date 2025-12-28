import UserModel from '../../models/user.model';
import TransactionModel from '../../models/transaction.model';
import { IBankDetails, IUserDocument } from '../../types/general';
import {
  ITelecallerRepository,
  ReapplyUpdatePayload,
  TelecallerUpdatePayload,
  TelecallerForBankDetails
} from './telecaller.types';

export class TelecallerRepository implements ITelecallerRepository {

  public async findUserById(userId: string): Promise<IUserDocument | null> {
    return UserModel.findById(userId);
  };

  public async updateUser(userId: string, payload: TelecallerUpdatePayload | ReapplyUpdatePayload): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(userId, { $set: payload }, { new: true });
  };

  public async findTelecallerForBankDetails(userId: string): Promise<TelecallerForBankDetails | null> {
    return UserModel
      .findById(userId)
      .select('_id role accountStatus telecallerProfile.approvalStatus telecallerProfile.bankDetails')
      .lean<TelecallerForBankDetails>();
  };

  public async addBankDetails(userId: string, bankDetails: IBankDetails): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { 'telecallerProfile.bankDetails': bankDetails } },
      { new: true }
    );
    return result !== null;
  };

  public async removeBankDetails(userId: string): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $unset: { 'telecallerProfile.bankDetails': 1 } },
      { new: true }
    );
    return result !== null;
  };

  public async hasPendingWithdrawal(userId: string): Promise<boolean> {
    const pendingWithdrawal = await TransactionModel
      .findOne({ userId: userId, type: 'WITHDRAWAL', status: 'PENDING' })
      .lean();
    return pendingWithdrawal !== null;
  };

};