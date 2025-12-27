import { Schema, model, Model } from 'mongoose';
import { IOTP } from '../types/general';

const otpSchema = new Schema<IOTP>({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 5,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000)
  }
}, {
  versionKey: false
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpModel: Model<IOTP> = model<IOTP>('Otp', otpSchema);
export default OtpModel;