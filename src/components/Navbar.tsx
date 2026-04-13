'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { User, Settings, LogOut, Coins, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const t = useTranslations('nav');

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/app', label: t('app') },
    { href: '/pricing', label: t('pricing') },
    { href: '/history', label: t('history') },
  ];

  const closeMobile = () => setShowMobileMenu(false);

  // Strip locale prefix for active check (localePrefix: always → /en/app, /tr/app)
  const rawPath = pathname.replace(/^\/(en|tr)/, '') || '/';

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image src="/logo.png" alt="WheelVision" width={44} height={44} priority className="h-11 w-11 object-contain" />
            <span className="font-bold text-xl tracking-tight gradient-text hidden sm:block">WheelVision</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  rawPath === link.href
                    ? 'text-[var(--accent-orange)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <Coins className="w-4 h-4 text-[var(--accent-orange)]" />
                  <span className="text-sm font-medium">{user.credits}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.full_name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl">
                      <Link href="/settings" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white">
                        <Settings className="w-4 h-4" /> {t('settings')}
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full">
                        <LogOut className="w-4 h-4" /> {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary text-sm">{t('login')}</Link>
                <Link href="/register" className="btn-primary text-sm">{t('register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            {user && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]">
                <Coins className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span className="text-xs font-medium">{user.credits}</span>
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  rawPath === link.href
                    ? 'text-[var(--accent-orange)] bg-[var(--accent-orange)]/10'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-[var(--border-color)] pt-2 mt-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">{user.full_name}</div>
                  <Link href="/settings" onClick={closeMobile}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5">
                    <Settings className="w-4 h-4" /> {t('settings')}
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 w-full hover:bg-white/5">
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/login" onClick={closeMobile} className="btn-secondary text-sm text-center">{t('login')}</Link>
                  <Link href="/register" onClick={closeMobile} className="btn-primary text-sm text-center">{t('register')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
