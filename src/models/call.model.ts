import { Schema, model, Model } from 'mongoose'
import { ICall } from '../types/general'

const callSchema = new Schema<ICall>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  telecallerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['INITIATED', 'RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'COMPLETED', 'CANCELLED'],
    required: true,
    default: 'INITIATED',
    index: true
  },
  initiatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  acceptedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  durationInSeconds: {
    type: Number,
    default: 0,
    min: 0
  },
  coinsSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  coinsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  endedBy: {
    type: String,
    enum: ['USER', 'TELECALLER', 'SYSTEM']
  },
  endReason: {
    type: String,
    enum: ['NORMAL', 'INSUFFICIENT_BALANCE', 'USER_HANGUP', 'TELECALLER_HANGUP', 'NETWORK_ISSUE', 'TIMEOUT', 'REJECTED', 'MISSED']
  },
  userFeedback: {
    type: String,
    maxlength: 500
  },
  telecallerFeedback: {
    type: String,
    maxlength: 500
  },
  sessionId: {
    type: String,
    index: true,
    sparse: true,
  }
}, {
  timestamps: true,
  versionKey: false
})

callSchema.index({ userId: 1, createdAt: -1 })
callSchema.index({ telecallerId: 1, createdAt: -1 })
callSchema.index({ status: 1, createdAt: -1 })

const CallModel: Model<ICall> = model<ICall>('Call', callSchema)
export default CallModel










// import { Schema, model, Model } from 'mongoose';
// import { ICall } from '../types/general';

// const callSchema = new Schema<ICall>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     telecallerId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     callType: {
//       type: String,
//       enum: ['AUDIO', 'VIDEO'],
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'COMPLETED'],
//       required: true,
//       default: 'RINGING',
//       index: true,
//     },
//     durationInSeconds: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     coinsSpent: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     coinsEarned: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     roomId: {
//       type: String,
//       index: true,
//       sparse: true,
//     },
//     userFeedback: {
//       type: String,
//       maxlength: 500,
//     },
//     telecallerFeedback: {
//       type: String,
//       maxlength: 500,
//     },
//     acceptedAt: {
//       type: Date,
//     },
//     endedAt: {
//       type: Date,
//     },
//   },
//   {
//     timestamps: true,
//     versionKey: false,
//   }
// );

// callSchema.index({ userId: 1, createdAt: -1 });
// callSchema.index({ telecallerId: 1, createdAt: -1 });
// callSchema.index({ status: 1, createdAt: -1 });

// const CallModel: Model<ICall> = model<ICall>('Call', callSchema);

// export default CallModel;