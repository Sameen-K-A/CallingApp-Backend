import bcrypt from 'bcrypt';
import { IAuthRepository } from './auth.types';
import OtpModel from '../../models/otp.model';
import UserModel, { IUserDocument } from '../../models/user.model';
import { IOTP } from '../../types/general';

export class AuthRepository implements IAuthRepository {
  // Finds a user by their phone number.
  public async findUserByPhone(phone: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ phone });
  };

  // Finds a user by phone, or creates a new one if they don't exist.
  public async findOrCreateUser(phone: string): Promise<IUserDocument> {
    return UserModel.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ) as Promise<IUserDocument>;
  };

  // Creates a new OTP or updates an existing one for a given phone number.
  public async upsertOtp(phone: string, otp: string): Promise<IOTP> {
    const hashedOtp = await bcrypt.hash(otp, 10);
    return OtpModel.findOneAndUpdate(
      { phone },
      {
        otp: hashedOtp,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      },
      { upsert: true, new: true }
    ) as Promise<IOTP>;
  };

  // Finds an OTP document by phone number only
  public async findOtpByPhone(phone: string): Promise<IOTP | null> {
    return OtpModel.findOne({ phone });
  };

  // Increments the attempt counter for a phone number's OTP
  public async incrementOtpAttempts(phone: string): Promise<void> {
    await OtpModel.updateOne({ phone }, { $inc: { attempts: 1 } });
  };

  // Deletes an OTP document for a given phone number after successful verification.
  public async deleteOtp(phone: string): Promise<void> {
    await OtpModel.deleteOne({ phone });
  };
};