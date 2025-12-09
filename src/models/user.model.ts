import { Schema, model, Model } from 'mongoose'
import { IUser } from '../types/user';
import { ITelecaller } from '../types/telecaller';
import { LANGUAGES } from '../constants/languages';

export type IUserDocument = IUser | ITelecaller

const userSchema = new Schema<IUserDocument>({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  profile: {
    type: String,
    default: null
  },
  language: {
    type: String,
    enum: LANGUAGES
  },
  role: {
    type: String,
    enum: ['USER', 'TELECALLER'],
    default: 'USER'
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
    }
  },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  favorites: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: undefined
  },
  telecallerProfile: {
    about: {
      type: String,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED']
    },
    verificationNotes: {
      type: String,
    },
    presence: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'ON_CALL']
    }
  }
}, {
  timestamps: true,
  versionKey: false
})

const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema)
export default UserModel;