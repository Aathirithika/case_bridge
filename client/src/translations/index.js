import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';

export const translations = {
  en,
  hi,
  ta,
};

export const getTranslation = (lang = 'en') => {
  return translations[lang] || translations.en;
};

export default translations;