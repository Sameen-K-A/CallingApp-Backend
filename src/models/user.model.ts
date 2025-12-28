import { Schema, model, Model } from 'mongoose'
import { IUserDocument } from '../types/general';
import { LANGUAGES } from '../constants/languages';

const userSchema = new Schema<IUserDocument>({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: undefined
  },
  dob: {
    type: Date,
    default: undefined
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    default: undefined
  },
  profile: {
    type: String,
    default: undefined
  },
  language: {
    type: String,
    enum: LANGUAGES,
    default: undefined
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
    },
    bankDetails: {
      accountNumber: {
        type: String
      },
      ifscCode: {
        type: String
      },
      accountHolderName: {
        type: String
      }
    }
  }
}, {
  timestamps: true,
  versionKey: false
})

const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema)
export default UserModel;