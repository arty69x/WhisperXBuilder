import Link from 'next/link';
import type { NavigationItem } from '@/types/navigation';

const navigation: NavigationItem[] = [
  { label: 'Platform', href: '#platform' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Docs', href: '/docs' }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link className="text-base font-bold tracking-tight" href="/">
          WPX Studio OS
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm text-slate-300 sm:flex">
          {navigation.map((item) => (
            <a className="transition hover:text-white" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
