import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/lib/site-config';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url)
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
