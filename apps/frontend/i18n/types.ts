/**
 * Configuration for a single language.
 * All properties are required except 'rtl' which defaults to false.
 */
export interface LanguageConfig {
  /** ISO 639-1 language code (e.g., 'en', 'fr', 'de') */
  code: string;
  /** English name of the language (for internal use) */
  name: string;
  /** Native name of the language (displayed in UI) */
  nativeName: string;
  /** Emoji flag for visual identification */
  flag: string;
  /** Whether the language is right-to-left (optional, defaults to false) */
  rtl?: boolean;
}
