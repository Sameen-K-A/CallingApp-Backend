import Joi from 'joi';

export const createOrderSchema = Joi.object({
  planId: Joi
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.empty': 'Plan ID is required.',
      'string.pattern.base': 'Invalid plan ID.',
      'any.required': 'Plan ID is required.',
    }),
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi
    .string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Razorpay order ID is required.',
      'any.required': 'Razorpay order ID is required.',
    }),
  razorpay_payment_id: Joi
    .string()
    .trim()
    .when('cancelled', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      'string.empty': 'Razorpay payment ID is required for verification.',
      'any.required': 'Razorpay payment ID is required for verification.',
    }),
  razorpay_signature: Joi
    .string()
    .trim()
    .when('cancelled', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      'string.empty': 'Razorpay signature is required for verification.',
      'any.required': 'Razorpay signature is required for verification.',
    }),
  cancelled: Joi
    .boolean()
    .optional()
    .messages({
      'boolean.base': 'Cancelled must be a boolean value.',
    }),
});