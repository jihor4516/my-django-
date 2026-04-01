'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser, logoutUser } from '@/lib/client-api';
import { resolveBackendFileUrl } from '@/lib/backend-url';
import { useLanguage } from '@/components/i18n/language-provider';

const NAV_KEYS = [
  { href: '/', key: 'home' },
  { href: '/services', key: 'services' },
  { href: '/catalogue', key: 'products' },
];

export default function SiteHeader() {
  const [user, setUser] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const siteLogoUrl = resolveBackendFileUrl('/static/images/theatre/logo.png');

  useEffect(() => {
    getCurrentUser()
      .then((res) => setUser(res.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (_) {
      // ignore
    }
    window.location.href = '/';
  }

  function handleToggleNav() {
    setNavOpen((current) => !current);
  }

  function handleCloseNav() {
    setNavOpen(false);
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label={t('site.name', 'Grand Theatre')}>
        <img className="brand-mark" src={siteLogoUrl} alt={t('site.name', 'Grand Theatre')} />
      </Link>
      <button
        type="button"
        className={`mobile-nav-toggle ${navOpen ? 'active' : ''}`}
        aria-label={t('nav.menu', 'Menu')}
        aria-expanded={navOpen}
        onClick={handleToggleNav}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`site-nav ${navOpen ? 'open' : ''}`}>
        {NAV_KEYS.map((link) => (
          <Link key={link.href} href={link.href} onClick={handleCloseNav}>{t(`nav.${link.key}`, link.key)}</Link>
        ))}
        <div className="lang-control">
          <span className="lang-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C8.1 3 5 7.03 5 12s3.1 9 7 9 7-4.03 7-9-3.1-9-7-9Z" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M8.8 6.2C10.1 7.4 11 9.56 11 12s-.9 4.6-2.2 5.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M15.2 6.2C13.9 7.4 13 9.56 13 12s.9 4.6 2.2 5.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M6 9.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M6 14.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </span>
          <select
            id="lang-switch"
            className="lang-switch"
            aria-label={t('language.label', 'Language')}
            title={t('language.label', 'Language')}
            value={lang}
            onChange={(event) => {
              setLang(event.target.value);
              handleCloseNav();
            }}
          >
            <option value="ar">{t('language.ar', 'Arabic')}</option>
            <option value="fr">{t('language.fr', 'French')}</option>
            <option value="en">{t('language.en', 'English')}</option>
          </select>
        </div>
        {!user ? (
          <>
            <Link href="/login" onClick={handleCloseNav}>{t('nav.login', 'Login')}</Link>
            <Link href="/signup" className="nav-cta" onClick={handleCloseNav}>{t('nav.openAccount', 'Open Account')}</Link>
          </>
        ) : (
          <>
            {user.is_staff_user ? <Link href="/admin" onClick={handleCloseNav}>{t('nav.admin', 'Admin')}</Link> : null}
            {user.is_staff_user ? null : <Link href="/account" onClick={handleCloseNav}>{t('nav.account', 'My Account')}</Link>}
            {user.is_staff_user ? <Link href="/admin/documents" onClick={handleCloseNav}>{t('nav.workDocs', 'Work Documents')}</Link> : null}
            <Link href={user.is_staff_user ? '/admin' : '/tenant-dashboard'} onClick={handleCloseNav}>
              {user.is_staff_user ? t('nav.staffDashboard', 'Staff Dashboard') : t('nav.tenantDashboard', 'Client Dashboard')}
            </Link>
            <button type="button" className="nav-logout" onClick={handleLogout}>{t('nav.logout', 'Logout')}</button>
          </>
        )}
      </nav>
    </header>
  );
}
