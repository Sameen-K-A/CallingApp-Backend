import Joi from 'joi'

const VALID_LANGUAGES = [
  'english',
  'hindi',
  'tamil',
  'telugu',
  'kannada',
  'malayalam',
  'bengali',
  'marathi',
  'gujarati',
  'punjabi',
  'urdu',
  'odia',
];

const VALID_AVATARS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
];

export const completeProfileSchema = Joi.object({
  name: Joi
    .string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required.',
      'string.min': 'Name must be at least 3 characters.',
      'string.max': 'Name cannot exceed 50 characters.'
    }),
  dob: Joi
    .date()
    .iso()
    .max(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000))
    .required()
    .messages({
      'date.max': 'You must be at least 18 years old.',
      'any.required': 'Date of birth is required.'
    }),
  gender: Joi
    .string()
    .valid('MALE', 'FEMALE', 'OTHER')
    .required(),
  language: Joi.string()
    .valid(...VALID_LANGUAGES)
    .required()
    .messages({
      'any.only': 'Please select a valid language',
      'any.required': 'Language is required'
    }),
  role: Joi
    .string()
    .valid('USER', 'TELECALLER')
    .required(),
  about: Joi
    .string()
    .trim()
    .min(50)
    .max(500)
    .when('role', {
      is: 'TELECALLER',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }).messages({
      'string.min': 'About section must be at least 50 characters.',
      'string.max': 'About section cannot exceed 500 characters.',
      'any.required': 'About section is required for telecallers.'
    })
}).custom((value, helpers) => {
  if (value.role === 'TELECALLER' && value.gender !== 'FEMALE') {
    return helpers.message({
      custom: 'Sorry, only female users can register as a telecaller.'
    });
  }
  return value;
});


export const editProfileSchema = Joi.object({
  name: Joi
    .string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.empty': 'Name cannot be empty.',
      'string.min': 'Name must be at least 3 characters.',
      'string.max': 'Name cannot exceed 50 characters.',
      'string.pattern.base': 'Name can only contain letters and spaces.'
    }),
  language: Joi
    .string()
    .valid(...VALID_LANGUAGES)
    .messages({
      'any.only': 'Please select a valid language.'
    }),
  profile: Joi
    .string()
    .valid(...VALID_AVATARS)
    .allow(null)
    .messages({
      'any.only': 'Please select a valid avatar.'
    })
}).min(1).messages({
  'object.min': 'At least one field is required to update.'
});


export const paginationSchema = Joi.object({
  page: Joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number.',
      'number.integer': 'Page must be an integer.',
      'number.min': 'Page must be at least 1.'
    }),
  limit: Joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(15)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.integer': 'Limit must be an integer.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 50.'
    })
});


export const telecallerIdParamSchema = Joi.object({
  telecallerId: Joi
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Telecaller ID is required.',
      'string.pattern.base': 'Invalid telecaller ID format.'
    })
});