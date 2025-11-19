import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip: move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "Welcome to BookIt": "Welcome to BookIt",
      "Search experiences": "Search experiences",
      "Book now": "Book now"
    }
  },
  es: {
    translation: {
      "Welcome to BookIt": "Bienvenido a BookIt",
      "Search experiences": "Buscar experiencias",
      "Book now": "Reservar ahora"
    }
  },
  fr: {
    translation: {
      "Welcome to BookIt": "Bienvenue sur BookIt",
      "Search experiences": "Rechercher des expériences",
      "Book now": "Réserver maintenant"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // language to use, more info here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already does escaping
    }
  });

export default i18n;