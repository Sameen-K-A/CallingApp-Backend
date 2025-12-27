import { Router } from 'express';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { generateOtpSchema, verifyOtpSchema } from '../../middleware/validation/auth.validation';
import { rateLimitOtpRequest, rateLimitOtpVerify } from '../../middleware/rateLimiter';

const router = Router();

const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

router.post('/send', rateLimitOtpRequest, validateBody(generateOtpSchema), controller.generateOtp);
router.post('/resend', rateLimitOtpRequest, validateBody(generateOtpSchema), controller.resendOtp);
router.post('/verify', rateLimitOtpVerify, validateBody(verifyOtpSchema), controller.verifyOtp);

export { router as authRouter };