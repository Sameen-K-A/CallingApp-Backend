import { Schema, model, Model } from 'mongoose';
import { ICall } from '../types/general';

const callSchema = new Schema<ICall>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    telecallerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ['AUDIO', 'VIDEO'],
      required: true,
    },
    status: {
      type: String,
      enum: ['RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'COMPLETED'],
      required: true,
      default: 'RINGING',
      index: true,
    },
    durationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    userFeedback: {
      type: String,
      maxlength: 500,
    },
    telecallerFeedback: {
      type: String,
      maxlength: 500,
    },
    acceptedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ telecallerId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Unique partial indexes to prevent concurrent calls
callSchema.index(
  { telecallerId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['RINGING', 'ACCEPTED'] } },
    name: 'unique_active_telecaller_call'
  }
);

callSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['RINGING', 'ACCEPTED'] } },
    name: 'unique_active_user_call'
  }
);

const CallModel: Model<ICall> = model<ICall>('Call', callSchema);

export default CallModel;