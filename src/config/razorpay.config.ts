import Razorpay from 'razorpay';

const getRazorpayConfig = (): { keyId: string; keySecret: string } => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in environment');
  }

  return { keyId, keySecret };
};

const config = getRazorpayConfig();

export const razorpayInstance = new Razorpay({
  key_id: config.keyId,
  key_secret: config.keySecret,
});

export const razorpayKeyId: string = config.keyId;