import Joi from "joi";

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
      'string.pattern.base': 'Name can only contain letters and spaces.',
    }),
  language: Joi
    .string()
    .valid(...VALID_LANGUAGES)
    .messages({
      'any.only': 'Please select a valid language.',
    }),
  profile: Joi
    .string()
    .valid(...VALID_AVATARS)
    .allow(null)
    .messages({
      'any.only': 'Please select a valid avatar.',
    }),
  about: Joi
    .string()
    .trim()
    .min(50)
    .max(500)
    .messages({
      'string.empty': 'About cannot be empty.',
      'string.min': 'About must be at least 50 characters.',
      'string.max': 'About cannot exceed 500 characters.',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update.',
});

// Re-apply Schema
export const reapplySchema = Joi.object({
  name: Joi
    .string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.empty': 'Name is required.',
      'string.min': 'Name must be at least 3 characters.',
      'string.max': 'Name cannot exceed 50 characters.',
      'string.pattern.base': 'Name can only contain letters and spaces.',
      'any.required': 'Name is required.',
    }),
  dob: Joi
    .date()
    .iso()
    .max('now')
    .required()
    .custom((value, helpers) => {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return helpers.error('date.minAge');
      }

      return value;
    })
    .messages({
      'date.base': 'Please provide a valid date.',
      'date.format': 'Date must be in ISO format.',
      'date.max': 'Date of birth cannot be in the future.',
      'any.required': 'Date of birth is required.',
      'date.minAge': 'You must be at least 18 years old.',
    }),
  language: Joi
    .string()
    .valid(...VALID_LANGUAGES)
    .required()
    .messages({
      'string.empty': 'Language is required.',
      'any.only': 'Please select a valid language.',
      'any.required': 'Language is required.',
    }),
  about: Joi
    .string()
    .trim()
    .min(50)
    .max(500)
    .required()
    .messages({
      'string.empty': 'About section is required.',
      'string.min': 'About section must be at least 50 characters.',
      'string.max': 'About section cannot exceed 500 characters.',
      'any.required': 'About section is required.',
    }),
});