export const LANGUAGES = [
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
] as const;

export type ILanguage = typeof LANGUAGES[number];