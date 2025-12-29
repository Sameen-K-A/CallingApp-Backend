import Joi from 'joi'

export const googleLoginSchema = Joi.object({
  googleToken: Joi
    .string()
    .required()
    .messages({
      'string.empty': 'Google token is required.',
      'any.required': 'Google token is required.'
    })
})

export const paginationSchema = Joi.object({
  page: Joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number.',
      'number.min': 'Page must be at least 1.'
    }),
  limit: Joi
    .number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 100.'
    })
})

export const telecallerFilterSchema = Joi.object({
  status: Joi
    .string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Status must be one of: PENDING, APPROVED, REJECTED.',
      'any.required': 'Status is required.'
    }),
  page: Joi
    .number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi
    .number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

export const telecallerIdParamSchema = Joi.object({
  id: Joi
    .string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Invalid telecaller ID format.',
      'string.length': 'Invalid telecaller ID format.',
      'any.required': 'Telecaller ID is required.'
    })
})

export const rejectTelecallerSchema = Joi.object({
  reason: Joi
    .string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Rejection reason is required.',
      'string.min': 'Reason must be at least 10 characters long.',
      'string.max': 'Reason cannot exceed 500 characters.',
      'any.required': 'Rejection reason is required.'
    })
})

export const transactionFilterSchema = Joi.object({
  type: Joi
    .string()
    .valid('RECHARGE', 'WITHDRAWAL')
    .required()
    .messages({
      'any.only': 'Type must be either RECHARGE or WITHDRAWAL.',
      'any.required': 'Type is required.'
    }),
  page: Joi
    .number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi
    .number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

export const transactionIdParamSchema = Joi.object({
  id: Joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid Transaction ID.',
      'any.required': 'Transaction ID is required.'
    })
});

export const reportIdParamSchema = Joi.object({
  id: Joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid Report ID.',
      'any.required': 'Report ID is required.'
    })
});

export const userIdParamSchema = Joi.object({
  id: Joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid User ID.',
      'any.required': 'User ID is required.'
    })
});

// Report status update body validation
export const updateReportStatusSchema = Joi.object({
  status: Joi
    .string()
    .valid('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')
    .required()
    .messages({
      'any.only': 'Status must be one of: PENDING, UNDER_REVIEW, RESOLVED, DISMISSED.',
      'any.required': 'Status is required.'
    }),
  adminNotes: Joi
    .string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Admin notes cannot exceed 2000 characters.'
    })
});

// plan management validation

export const planIdParamSchema = Joi.object({
  id: Joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid Plan ID.',
      'any.required': 'Plan ID is required.'
    })
});

export const createPlanSchema = Joi.object({
  amount: Joi
    .number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number.',
      'number.positive': 'Amount must be a positive number.',
      'any.required': 'Amount is required.'
    }),
  coins: Joi
    .number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Coins must be a number.',
      'number.integer': 'Coins must be an integer.',
      'number.positive': 'Coins must be a positive number.',
      'any.required': 'Coins is required.'
    }),
  discountPercentage: Joi
    .number()
    .min(0)
    .max(99)
    .default(0)
    .messages({
      'number.base': 'Discount percentage must be a number.',
      'number.min': 'Discount percentage cannot be negative.',
      'number.max': 'Discount percentage cannot exceed 99.'
    })
});

export const updatePlanSchema = Joi.object({
  amount: Joi
    .number()
    .positive()
    .messages({
      'number.base': 'Amount must be a number.',
      'number.positive': 'Amount must be a positive number.'
    }),
  coins: Joi
    .number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Coins must be a number.',
      'number.integer': 'Coins must be an integer.',
      'number.positive': 'Coins must be a positive number.'
    }),
  discountPercentage: Joi
    .number()
    .min(0)
    .max(99)
    .messages({
      'number.base': 'Discount percentage must be a number.',
      'number.min': 'Discount percentage cannot be negative.',
      'number.max': 'Discount percentage cannot exceed 99.'
    }),
  isActive: Joi
    .boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean.'
    })
}).min(1).messages({
  'object.min': 'At least one field is required to update.'
})

export const updateConfigSchema = Joi.object({
  inrToCoinRatio: Joi
    .number()
    .min(0.01)
    .messages({
      'number.base': 'INR to Coin ratio must be a number.',
      'number.min': 'INR to Coin ratio must be at least 0.01.',
    }),
  minWithdrawalCoins: Joi
    .number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Minimum withdrawal coins must be a number.',
      'number.integer': 'Minimum withdrawal coins must be a whole number.',
      'number.min': 'Minimum withdrawal coins must be at least 1.',
    }),
  userVideoCallCoinPerSec: Joi
    .number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'User video call coins must be a number.',
      'number.integer': 'User video call coins must be a whole number.',
      'number.min': 'User video call coins must be at least 1.',
    }),
  userAudioCallCoinPerSec: Joi
    .number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'User audio call coins must be a number.',
      'number.integer': 'User audio call coins must be a whole number.',
      'number.min': 'User audio call coins must be at least 1.',
    }),
  telecallerVideoCallCoinPerSec: Joi
    .number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Telecaller video call coins must be a number.',
      'number.integer': 'Telecaller video call coins must be a whole number.',
      'number.min': 'Telecaller video call coins must be at least 1.',
    }),
  telecallerAudioCallCoinPerSec: Joi
    .number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Telecaller audio call coins must be a number.',
      'number.integer': 'Telecaller audio call coins must be a whole number.',
      'number.min': 'Telecaller audio call coins must be at least 1.',
    }),
}).min(1).messages({
  'object.min': 'At least one configuration field is required.',
});

// Withdrawal management validation
export const withdrawalIdParamSchema = Joi.object({
  id: Joi
    .string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid Withdrawal ID.',
      'any.required': 'Withdrawal ID is required.'
    })
});

export const completeWithdrawalSchema = Joi.object({
  transferReference: Joi
    .string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Transfer reference is required.',
      'string.min': 'Transfer reference must be at least 5 characters.',
      'string.max': 'Transfer reference cannot exceed 100 characters.',
      'any.required': 'Transfer reference is required.'
    })
});