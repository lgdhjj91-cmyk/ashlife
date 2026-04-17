import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../locales/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('ashlife_lang') || 'en';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('ashlife_lang', next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key) => translations[language]?.[key] ?? translations['en'][key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
