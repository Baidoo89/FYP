import type { ReactNode } from 'react';
import { Sora } from 'next/font/google';
import AppShell from '../components/AppShell';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>GCTU Promotion System</title>
        <meta name="description" content="Promotion analysis and decision support system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          {`
            :root {
              --lpads-bg: #eef4ff;
              --lpads-surface: #ffffff;
              --lpads-text: #0f172a;
              --lpads-muted: #475569;
              --lpads-ring: #1d4ed8;
              --lpads-brand: #1d4ed8;
              --lpads-brand-2: #0f172a;
              --lpads-accent: #d97706;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              min-height: 100%;
            }
            
            body {
              color: var(--lpads-text);
              background-color: var(--lpads-bg);
              background-image: radial-gradient(circle at 12% 20%, rgba(29, 78, 216, 0.16) 0, transparent 34%),
                radial-gradient(circle at 88% 8%, rgba(217, 119, 6, 0.14) 0, transparent 30%),
                linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
            }

            .lpads-surface {
              background: rgba(255, 255, 255, 0.88);
              backdrop-filter: blur(8px);
            }

            .lpads-fade-in {
              animation: lpadsFade 0.45s ease-out;
            }

            .lpads-slide-in {
              animation: lpadsSlide 0.35s ease-out;
            }

            @keyframes lpadsFade {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }

            @keyframes lpadsSlide {
              from { opacity: 0; transform: translateX(-12px); }
              to { opacity: 1; transform: translateX(0); }
            }

            ::selection {
              background: rgba(217, 119, 6, 0.22);
            }

            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
              outline: 2px solid var(--lpads-ring);
              outline-offset: 2px;
            }
          `}
        </style>
      </head>
      <body className={sora.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
