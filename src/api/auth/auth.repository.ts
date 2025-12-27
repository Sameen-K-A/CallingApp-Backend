import bcrypt from 'bcrypt';
import { IAuthRepository } from './auth.types';
import OtpModel from '../../models/otp.model';
import UserModel from '../../models/user.model';
import { IUserDocument, IOTP } from '../../types/general';

export class AuthRepository implements IAuthRepository {
  // Finds a user by their phone number.
  public async findUserByPhone(phone: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ phone }).lean<IUserDocument>();
  };

  // Finds a user by phone, or creates a new one if they don't exist.
  public async findOrCreateUser(phone: string): Promise<IUserDocument> {
    const user = await UserModel.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<IUserDocument>();

    if (!user) {
      throw new Error('Failed to find or create user');
    }

    return user;
  };

  // Creates a new OTP or updates an existing one for a given phone number.
  public async upsertOtp(phone: string, otp: string): Promise<IOTP> {
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpDoc = await OtpModel.findOneAndUpdate(
      { phone },
      {
        otp: hashedOtp,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    if (!otpDoc) {
      throw new Error('Failed to create or update OTP');
    }

    return otpDoc;
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