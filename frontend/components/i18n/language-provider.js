'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { getMessages, isRtlLanguage, normalizeLang, translate } from '@/lib/i18n';

const LanguageContext = createContext({
  lang: 'ar',
  isRtl: true,
  messages: getMessages('ar'),
  setLang: () => {},
  t: (key, fallback) => fallback || key,
});

function setLanguageCookie(nextLang) {
  document.cookie = `site_lang=${nextLang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageProvider({ initialLang = 'ar', children }) {
  const [lang, setLangState] = useState(normalizeLang(initialLang));

  function setLang(nextLang) {
    const normalized = normalizeLang(nextLang);
    setLangState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('site_lang', normalized);
      setLanguageCookie(normalized);
      window.location.reload();
    }
  }

  const value = useMemo(() => {
    const messages = getMessages(lang);
    return {
      lang,
      isRtl: isRtlLanguage(lang),
      messages,
      setLang,
      t: (key, fallback = '') => translate(messages, key, fallback),
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
