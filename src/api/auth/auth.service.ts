import bcrypt from 'bcrypt';
import { IAuthRepository, IAuthService, VerifyOtpResponse, UserAuthResponse } from './auth.types';
import { generateOtp } from '../../utils/generator';
import { createToken } from '../../utils/jwt';
import { ApiError } from '../../middleware/errors/ApiError';
import { isTelecaller } from '../../utils/guards';

// OTP cooldown period in milliseconds (60 seconds)
const OTP_COOLDOWN_MS = 60 * 1000;

export class AuthService implements IAuthService {
  constructor(private authRepository: IAuthRepository) { }

  // Private method to check OTP cooldown
  private async checkOtpCooldown(phone: string): Promise<void> {
    const existingOtp = await this.authRepository.findOtpByPhone(phone);

    if (existingOtp && existingOtp.createdAt > new Date(Date.now() - OTP_COOLDOWN_MS)) {
      const remainingSeconds = Math.ceil(
        (existingOtp.createdAt.getTime() + OTP_COOLDOWN_MS - Date.now()) / 1000
      );
      throw new ApiError(429, `Please wait ${remainingSeconds} seconds, before requesting another OTP.`);
    }
  }

  // Private method to handle OTP generation logic
  private async sendOtpToPhone(phone: string, isResend: boolean = false): Promise<string> {

    await this.checkOtpCooldown(phone);

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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

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

    // 2. Check if OTP has expired
    if (otpDoc.expiresAt < new Date()) {
      await this.authRepository.deleteOtp(phone);
      throw new ApiError(400, 'OTP has expired. Please request a new OTP.');
    }

    // 3. Check if max attempts exceeded
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      await this.authRepository.deleteOtp(phone);
      throw new ApiError(400, 'Too many failed attempts. Please request a new OTP.');
    }

    // 4. Verify OTP (compare with hashed value)
    const isValidOtp = await bcrypt.compare(otp, otpDoc.otp);

    if (!isValidOtp) {
      // Increment attempts on failure
      await this.authRepository.incrementOtpAttempts(phone);
      const remainingAttempts = otpDoc.maxAttempts - (otpDoc.attempts + 1);
      throw new ApiError(400, `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
    }

    // 5. OTP is valid - fetch user
    const user = await this.authRepository.findUserByPhone(phone);

    if (!user) {
      throw new ApiError(400, 'Unable to verify OTP. Please try again.');
    }

    // 6. Check if account is suspended
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // 7. Delete OTP after successful verification
    await this.authRepository.deleteOtp(phone);

    // 8. Generate JWT token
    const token = createToken(
      user._id.toString(),
      user.phone,
      user.role
    );

    // 9. Prepare user response data using type guard
    let userData: UserAuthResponse;

    if (isTelecaller(user)) {
      userData = {
        _id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        dob: user.dob,
        language: user.language,
        gender: user.gender,
        profile: user.profile,
        accountStatus: user.accountStatus,
        role: 'TELECALLER',
        wallet: {
          balance: user.wallet.balance
        },
        createdAt: user.createdAt,
        telecallerProfile: {
          about: user.telecallerProfile.about,
          approvalStatus: user.telecallerProfile.approvalStatus,
          verificationNotes: user.telecallerProfile.verificationNotes
        }
      };
    } else {
      userData = {
        _id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        dob: user.dob,
        language: user.language,
        gender: user.gender,
        profile: user.profile,
        accountStatus: user.accountStatus,
        role: 'USER',
        wallet: {
          balance: user.wallet.balance
        },
        createdAt: user.createdAt
      };
    }

    return { token, user: userData };
  }
}