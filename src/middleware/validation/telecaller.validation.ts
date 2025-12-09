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