import { Router } from 'express';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../utils/jwt';
import { validateBody } from '../../middleware/validation.middleware';
import { createOrderSchema, verifyPaymentSchema } from '../../middleware/validation/payment.validation';
import { rateLimitCreateOrder, rateLimitVerifyPayment } from '../../middleware/rateLimiter';

const router = Router();

const repository = new PaymentRepository();
const service = new PaymentService(repository);
const controller = new PaymentController(service);

router.post('/create-order', authenticate(), rateLimitCreateOrder, validateBody(createOrderSchema), controller.createOrder);
router.post('/verify', authenticate(), rateLimitVerifyPayment, validateBody(verifyPaymentSchema), controller.verifyPayment);

export { router as paymentRouter };