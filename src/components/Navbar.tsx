'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, LogOut, Coins } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/app', label: 'Uygulama' },
    { href: '/pricing', label: 'Fiyatlandırma' },
    { href: '/history', label: 'Geçmiş' },
  ];

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--accent-orange)] via-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold">
              Wheel<span className="gradient-text">Vision</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[var(--accent-orange)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <Coins className="w-4 h-4 text-[var(--accent-orange)]" />
                  <span className="text-sm font-medium">{user.credits}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:block">{user.full_name}</span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl">
                      <Link
                        href="/settings"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white"
                      >
                        <Settings className="w-4 h-4" />
                        Ayarlar
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary text-sm">Giriş Yap</Link>
                <Link href="/register" className="btn-primary text-sm">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
