import type { SupportedLanguage } from '../../types/analysis.ts'
import { isSupportedLanguage } from '../../types/analysis.ts'

export const LANGUAGE_STORAGE_KEY = 'setting_language'

export function getSelectedLanguage(): SupportedLanguage {
  try {
    const stored =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isSupportedLanguage(stored) ? stored : 'sq'
  } catch {
    return 'sq'
  }
}

export function setSelectedLanguage(language: SupportedLanguage): void {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}
