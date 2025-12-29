import { Schema, model, Model } from 'mongoose';
import { IAppConfigDocument } from '../types/config';

const configSchema = new Schema<IAppConfigDocument>({
  inrToCoinRatio: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
  },
  minWithdrawalCoins: {
    type: Number,
    required: true,
    default: 100,
    min: 1,
  },
  userVideoCallCoinPerSec: {
    type: Number,
    required: true,
    default: 3,
    min: 1,
  },
  userAudioCallCoinPerSec: {
    type: Number,
    required: true,
    default: 2,
    min: 1,
  },
  telecallerVideoCallCoinPerSec: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  telecallerAudioCallCoinPerSec: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
}, {
  timestamps: true,
  versionKey: false,
});

const ConfigModel: Model<IAppConfigDocument> = model<IAppConfigDocument>('Config', configSchema);

export default ConfigModel;