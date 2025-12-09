import Joi from 'joi'

export const generateOtpSchema = Joi.object({
  phone: Joi
    .string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must be between 10 and 15 digits.',
      'any.required': 'Phone number is required.'
    })
})

export const verifyOtpSchema = Joi.object({
  phone: Joi
    .string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must be between 10 and 15 digits.',
      'any.required': 'Phone number is required.'
    }),
  otp: Joi
    .string()
    .trim()
    .length(5)
    .pattern(/^[0-9]{5}$/)
    .required()
    .messages({
      'string.empty': 'OTP is required.',
      'string.length': 'OTP must be exactly 5 digits.',
      'string.pattern.base': 'OTP must contain only numbers.',
      'any.required': 'OTP is required.'
    })
})