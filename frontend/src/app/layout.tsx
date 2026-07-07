import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/app/globals.css';
import Header from '@/components/Header';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-serif', // Using Outfit for serif headers style
});

export const metadata: Metadata = {
  title: 'Chakravyuha — Daily DSA Challenge Platform',
  description: 'Topic-wise problem sheet, attendance tracking, and admin oversight for Chakravyuha club members.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <footer className="w-full py-6 text-center border-t border-[#8c7030]/15 bg-black/40 text-xs text-zinc-500 font-medium">
          <p>© 2026 Chakravyuha Club. All Rights Reserved. Prepared for Battle.</p>
        </footer>
      </body>
    </html>
  );
}
