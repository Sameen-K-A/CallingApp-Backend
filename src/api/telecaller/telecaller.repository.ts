import UserModel, { IUserDocument } from '../../models/user.model';
import { ITelecallerRepository, ReapplyUpdatePayload, TelecallerUpdatePayload } from './telecaller.types';

export class TelecallerRepository implements ITelecallerRepository {

  public async findUserById(userId: string): Promise<IUserDocument | null> {
    return UserModel.findById(userId);
  };

  public async updateUser(userId: string, payload: TelecallerUpdatePayload | ReapplyUpdatePayload): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(userId, { $set: payload }, { new: true });
  };

};