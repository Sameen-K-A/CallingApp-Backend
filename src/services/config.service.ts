import redis, { REDIS_KEYS } from '../config/redis.config';
import ConfigModel from '../models/config.model';
import { IAppConfig, IAppConfigDocument } from '../types/config';

const DEFAULT_CONFIG: IAppConfig = {
  coinToInrRatio: 1,
  minWithdrawalCoins: 100,
  userVideoCallCoinPerSec: 3,
  userAudioCallCoinPerSec: 2,
  telecallerVideoCallCoinPerSec: 1,
  telecallerAudioCallCoinPerSec: 1,
};

// Cache config in Redis (no expiry)
const cacheConfig = async (config: IAppConfigDocument): Promise<void> => {
  const configData: IAppConfig = {
    coinToInrRatio: config.coinToInrRatio,
    minWithdrawalCoins: config.minWithdrawalCoins,
    userVideoCallCoinPerSec: config.userVideoCallCoinPerSec,
    userAudioCallCoinPerSec: config.userAudioCallCoinPerSec,
    telecallerVideoCallCoinPerSec: config.telecallerVideoCallCoinPerSec,
    telecallerAudioCallCoinPerSec: config.telecallerAudioCallCoinPerSec,
  };

  await redis.set(REDIS_KEYS.APP_CONFIG, JSON.stringify(configData));
};

// Initialize config on server start
// Create default config in MongoDB if not exists
// Load config into Redis
export const initializeConfig = async (): Promise<void> => {
  try {
    let config = await ConfigModel.findOne();

    if (!config) {
      console.log('📝 Creating default configuration...');
      config = await ConfigModel.create(DEFAULT_CONFIG);
      console.log('✅ Default configuration created');
    }

    await cacheConfig(config);
    console.log('✅ Configuration loaded into Redis');
  } catch (error) {
    console.error('❌ Failed to initialize configuration:', error);
    throw error;
  }
};

// Clear config from Redis on server shutdown
export const cleanupConfig = async (): Promise<void> => {
  try {
    await redis.del(REDIS_KEYS.APP_CONFIG);
    console.log('🧹 Configuration cleared from Redis');
  } catch (error) {
    console.error('❌ Failed to clear configuration from Redis:', error);
  }
};

// Get full config from Redis (fallback to MongoDB)
export const getConfig = async (): Promise<IAppConfig> => {
  try {
    const cached = await redis.get(REDIS_KEYS.APP_CONFIG);

    if (cached) {
      return JSON.parse(cached) as IAppConfig;
    }

    // Fallback to MongoDB if Redis cache miss
    const config = await ConfigModel.findOne();

    if (config) {
      await cacheConfig(config);
      return {
        coinToInrRatio: config.coinToInrRatio,
        minWithdrawalCoins: config.minWithdrawalCoins,
        userVideoCallCoinPerSec: config.userVideoCallCoinPerSec,
        userAudioCallCoinPerSec: config.userAudioCallCoinPerSec,
        telecallerVideoCallCoinPerSec: config.telecallerVideoCallCoinPerSec,
        telecallerAudioCallCoinPerSec: config.telecallerAudioCallCoinPerSec,
      };
    }

    // Return defaults if nothing found
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('❌ Failed to get configuration:', error);
    return DEFAULT_CONFIG;
  }
};

// Get single config value
export const getConfigValue = async <K extends keyof IAppConfig>(key: K): Promise<IAppConfig[K]> => {
  const config = await getConfig();
  return config[key];
};

// Get multiple config values
export const getConfigValues = async <K extends keyof IAppConfig>(keys: K[]): Promise<Pick<IAppConfig, K>> => {
  const config = await getConfig();
  const result = {} as Pick<IAppConfig, K>;

  for (const key of keys) {
    result[key] = config[key];
  }

  return result;
};

// Get config with document details (for admin)
export const getConfigDocument = async (): Promise<IAppConfigDocument | null> => {
  return ConfigModel.findOne().lean<IAppConfigDocument>();
};

// Update config (MongoDB + Redis)
export const updateConfig = async (data: Partial<IAppConfig>): Promise<IAppConfigDocument> => {
  const config = await ConfigModel.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true }
  );

  if (!config) {
    throw new Error('Failed to update configuration');
  }

  await cacheConfig(config);

  return config;
};