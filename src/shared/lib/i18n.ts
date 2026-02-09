import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import English translations
import commonEN from '../config/locales/en/common.json';
import validationEN from '../config/locales/en/validation.json';
import medicalEN from '../config/locales/en/medical.json';
import pagesEN from '../config/locales/en/pages.json';
import widgetsEN from '../config/locales/en/widgets.json';

// Import Indonesian translations
import commonID from '../config/locales/id/common.json';
import validationID from '../config/locales/id/validation.json';
import medicalID from '../config/locales/id/medical.json';
import pagesID from '../config/locales/id/pages.json';
import widgetsID from '../config/locales/id/widgets.json';

// Import Serbian translations
import commonSR from '../config/locales/sr/common.json';
import validationSR from '../config/locales/sr/validation.json';
import medicalSR from '../config/locales/sr/medical.json';
import pagesSR from '../config/locales/sr/pages.json';
import widgetsSR from '../config/locales/sr/widgets.json';

// Import Turkish translations
import commonTR from '../config/locales/tr/common.json';
import validationTR from '../config/locales/tr/validation.json';
import medicalTR from '../config/locales/tr/medical.json';
import pagesTR from '../config/locales/tr/pages.json';
import widgetsTR from '../config/locales/tr/widgets.json';

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3', // Use v3 format for better compatibility
    resources: {
      en: {
        common: commonEN,
        validation: validationEN,
        medical: medicalEN,
        pages: pagesEN,
        widgets: widgetsEN,
      },
      id: {
        common: commonID,
        validation: validationID,
        medical: medicalID,
        pages: pagesID,
        widgets: widgetsID,
      },
      sr: {
        common: commonSR,
        validation: validationSR,
        medical: medicalSR,
        pages: pagesSR,
        widgets: widgetsSR,
      },
      tr: {
        common: commonTR,
        validation: validationTR,
        medical: medicalTR,
        pages: pagesTR,
        widgets: widgetsTR,
      },
    },
    lng: 'en', // Default language - will be synced with settings store
    fallbackLng: 'en', // Fallback to English if translation is missing
    defaultNS: 'common', // Default namespace
    ns: ['common', 'validation', 'medical', 'pages', 'widgets'], // Available namespaces
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;
