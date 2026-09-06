import * as Localization from 'expo-localization';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from './config';

export function detectDeviceLanguage(): LanguageCode {
  for (const locale of Localization.getLocales()) {
    if (locale.languageCode && isSupportedLanguage(locale.languageCode)) {
      return locale.languageCode;
    }
  }
  return DEFAULT_LANGUAGE;
}
