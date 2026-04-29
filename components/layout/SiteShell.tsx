'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

const HIDDEN_PREFIXES = ['/admin', '/login', '/register'];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const hideShell = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
