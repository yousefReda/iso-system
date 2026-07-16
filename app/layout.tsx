import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ISO CERT INTERNATIONAL — Certification Management System',
  description: 'ISO Certification Management System — نظام إدارة شهادات الأيزو',
  icons: { icon: '/logo.jpg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${cairo.variable} ${inter.variable} font-cairo`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
if(localStorage.theme==='dark')document.documentElement.classList.add('dark');
var l=localStorage.getItem('lang')||'en';
document.documentElement.lang=l;
document.documentElement.dir=l==='ar'?'rtl':'ltr';
}catch(e){}`,
          }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
