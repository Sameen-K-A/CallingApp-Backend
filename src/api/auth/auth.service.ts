import bcrypt from 'bcrypt';
import { IAuthRepository, IAuthService, VerifyOtpResponse, UserAuthResponse } from './auth.types';
import { generateOtp } from '../../utils/generator';
import { createToken } from '../../utils/jwt';
import { ApiError } from '../../middleware/errors/ApiError';

export class AuthService implements IAuthService {
  constructor(private authRepository: IAuthRepository) { }

  // Private method to handle OTP generation logic
  private async sendOtpToPhone(phone: string, isResend: boolean = false): Promise<string> {
    // Find or create user
    const user = await (isResend
      ? this.authRepository.findUserByPhone(phone)
      : this.authRepository.findOrCreateUser(phone)
    );

    // Check if user exists (for resend)
    if (!user && isResend) {
      throw new ApiError(404, 'No account found with this phone number.');
    }

    // Check if account is suspended (ONLY blocking condition)
    if (user && user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // Generate and save OTP
    const otp = generateOtp(5);
    await this.authRepository.upsertOtp(phone, otp);

    // TODO: Integrate real SMS service here
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    return otp;
  }

  // Generates and sends an OTP to a user. Creates the user if they don't exist.
  public async generateOtp(phone: string): Promise<string> {
    return this.sendOtpToPhone(phone, false);
  }

  // Resends an OTP to an existing user.
  public async resendOtp(phone: string): Promise<string> {
    return this.sendOtpToPhone(phone, true);
  }

  // Verifies an OTP, issues a JWT, and returns user data.
  public async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    // 1. Find OTP document by phone.
    const otpDoc = await this.authRepository.findOtpByPhone(phone);

    if (!otpDoc) {
      throw new ApiError(400, 'OTP not found or expired. Please request a new OTP.');
    }

    // 2. Check if max attempts exceeded
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await this.authRepository.deleteOtp(phone);
      throw new ApiError(400, 'Too many failed attempts. Please request a new OTP.');
    }

    // 3. Verify OTP (compare with hashed value)
    const isValidOtp = await bcrypt.compare(otp, otpDoc.otp);

    if (!isValidOtp) {
      // Increment attempts on failure
      await this.authRepository.incrementOtpAttempts(phone);
      const remainingAttempts = otpDoc.maxAttempts - (otpDoc.attempts + 1);
      throw new ApiError(400, `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
    }

    // 4. OTP is valid - fetch user
    const user = await this.authRepository.findUserByPhone(phone);

    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    // 5. Check if account is suspended (ONLY blocking condition)
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // 6. Delete OTP after successful verification
    await this.authRepository.deleteOtp(phone);

    // 7. Generate JWT token
    const token = createToken(
      user._id.toString(),
      user.phone,
      user.role as 'TELECALLER' | undefined
    );

    // 8. Prepare user response data
    const userData: UserAuthResponse = {
      _id: user._id,
      phone: user.phone,
      name: user.name || undefined,
      dob: user.dob || undefined,
      language: user.language || undefined,
      gender: user.gender || undefined,
      profile: user.profile || undefined,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      ...(user.role === 'TELECALLER' && { role: 'TELECALLER' }),
      ...(user.role === 'TELECALLER' && user.telecallerProfile && {
        telecallerProfile: {
          verificationNotes: user.telecallerProfile.verificationNotes,
          approvalStatus: user.telecallerProfile.approvalStatus,
          about: user.telecallerProfile.about
        }
      })
    };

    return { token, user: userData };
  }
}