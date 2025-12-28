import { Router } from 'express';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../utils/jwt';
import { validateBody } from '../../middleware/validation.middleware';
import { createOrderSchema, verifyPaymentSchema, withdrawSchema } from '../../middleware/validation/payment.validation';
import { rateLimitCreateOrder, rateLimitVerifyPayment, rateLimitWithdraw } from '../../middleware/rateLimiter';

const router = Router();

const repository = new PaymentRepository();
const service = new PaymentService(repository);
const controller = new PaymentController(service);

// Recharge endpoints (USER)
router.post('/create-order', authenticate(), rateLimitCreateOrder, validateBody(createOrderSchema), controller.createOrder);
router.post('/verify', authenticate(), rateLimitVerifyPayment, validateBody(verifyPaymentSchema), controller.verifyPayment);

// Withdrawal endpoint (TELECALLER)
router.post('/withdraw', authenticate('TELECALLER'), rateLimitWithdraw, validateBody(withdrawSchema), controller.withdraw);

export { router as paymentRouter };