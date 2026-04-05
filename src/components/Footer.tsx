import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col items-center gap-3">
        <Link href="/">
          <Image src="/logo.png" alt="WheelVision" width={120} height={30} className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        <p className="text-xs text-[var(--text-secondary)]">
          © 2025 WheelVision. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
