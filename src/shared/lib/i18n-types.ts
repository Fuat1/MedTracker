/**
 * TypeScript type definitions for i18n
 * Auto-generated types based on English locale structure
 * This provides type safety and IntelliSense for translation keys
 */

import 'i18next';
import type common from '../config/locales/en/common.json';
import type validation from '../config/locales/en/validation.json';
import type medical from '../config/locales/en/medical.json';
import type pages from '../config/locales/en/pages.json';
import type widgets from '../config/locales/en/widgets.json';

export interface TranslationResources {
  common: typeof common;
  validation: typeof validation;
  medical: typeof medical;
  pages: typeof pages;
  widgets: typeof widgets;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}
