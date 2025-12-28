export interface IAppConfig {
  coinToInrRatio: number;
  minWithdrawalCoins: number;
  userVideoCallCoinPerSec: number;
  userAudioCallCoinPerSec: number;
  telecallerVideoCallCoinPerSec: number;
  telecallerAudioCallCoinPerSec: number;
}

export interface IAppConfigDocument extends IAppConfig {
  _id: string;
  updatedAt: Date;
}

export interface ConfigDisplayField {
  value: number;
  label: string;
  description: string;
}

export interface ConfigGroupedResponse {
  withdrawal: {
    coinToInrRatio: ConfigDisplayField;
    minWithdrawalCoins: ConfigDisplayField;
  };
  videoCall: {
    userCoinPerSec: ConfigDisplayField;
    telecallerCoinPerSec: ConfigDisplayField;
  };
  audioCall: {
    userCoinPerSec: ConfigDisplayField;
    telecallerCoinPerSec: ConfigDisplayField;
  };
  updatedAt: Date;
}