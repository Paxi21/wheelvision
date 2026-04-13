'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Derive locale from URL path — works without next-intl context
  const currentLocale = pathname.startsWith('/tr') ? 'tr' : 'en';
  const current = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (locale: string) => {
    setOpen(false);
    if (locale === currentLocale) return;
    const newPath = pathname.replace(/^\/(en|tr)/, `/${locale}`);
    window.location.href = newPath.startsWith(`/${locale}`) ? newPath : `/${locale}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-white/30 transition-colors text-sm font-medium"
        aria-label="Switch language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-white">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                currentLocale === lang.code
                  ? 'text-[var(--accent-orange)] font-medium'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
