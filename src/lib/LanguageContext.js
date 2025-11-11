import React, { createContext, useState, useContext, useEffect } from 'react';
import { languages, getLanguageWithoutRegion, isValidLanguage, getValidLanguages } from './languages';

const LanguageContext = createContext();

/**
 * Get the browser's preferred language
 * @returns {string} the preferred base language among the valid languages that are supported
 */
function getBrowserLanguage() {
  // Check navigator.languages array if available
  if (navigator.languages && navigator.languages.length > 0) {
    // Determine whether fr or en is a preferred language
    for (const lang of navigator.languages) {
      const baseLanguage = getLanguageWithoutRegion(lang);

      if (isValidLanguage(baseLanguage)) {
        return baseLanguage;
      }
    }
  }

  // Fall back to navigator.language
  const baseLanguage = getLanguageWithoutRegion(navigator.language);
  if (isValidLanguage(baseLanguage)) {
    return baseLanguage;
  }

  return 'en';
}

/**
 * Get the initial language from localStorage or browser preference
 * @returns {string} the preferred base language among the valid languages that are supported
 */
function getInitialLanguage() {
  // First, check if user has a saved preference
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (isValidLanguage(savedLanguage)) {
    return savedLanguage;
  }

  // Fall back to browser language
  return getBrowserLanguage();
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);
  const [bundleLanguage, setCurrentBundleLanguage] = useState('en');
  const t = (key, fallback) => {
    const translation = languages[currentLanguage][key];

    if (!translation) {
      console.warn(`Missing translation for key "${key}" in language "${currentLanguage}"`);
    }

    return translation || fallback || key;
  }

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);

  const toggleLanguage = () => {
    const validLanguages = getValidLanguages();
    const currentLanguageIndex = validLanguages.indexOf(currentLanguage);
    const nextLanguageIndex = (currentLanguageIndex + 1) % validLanguages.length;
    setCurrentLanguage(validLanguages[nextLanguageIndex]);
  };

  const setLanguage = (language) => {
    if (isValidLanguage(language)) {
      setCurrentLanguage(language);
    }
  };

  const setBundleLanguage = (language) => {
    if (isValidLanguage(language)) {
      setCurrentBundleLanguage(language);
    }
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, t, toggleLanguage, setLanguage, bundleLanguage, setBundleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
