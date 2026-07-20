import type { ReactNode } from 'react';
import AppShell from '../components/AppShell';
import { getAppBaseUrl } from '../lib/app-url';
import './globals.css';

// Use system font stack to avoid fetching Google Fonts at build time

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const appUrl = getAppBaseUrl();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('gctu-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
        <title>GCTU Digital Staff Promotion Support System</title>
        <meta name="description" content="Official GCTU digital staff promotion request, evidence verification, and decision support system." />
        <link rel="canonical" href={appUrl} />
        <meta property="og:title" content="GCTU Digital Staff Promotion Support System" />
        <meta property="og:description" content="Official GCTU digital staff promotion request, evidence verification, and decision support system." />
        <meta property="og:url" content={appUrl} />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          {`
            :root {
              --lpads-bg: #f6f8fb;
              --lpads-surface: #ffffff;
              --lpads-text: #0f172a;
              --lpads-muted: #475569;
              --lpads-ring: #0b2d5b;
              --lpads-brand: #0b2d5b;
              --lpads-brand-2: #0f172a;
              --lpads-accent: #c99700;
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
              background-image: radial-gradient(circle at 12% 18%, rgba(11, 45, 91, 0.10) 0, transparent 32%),
                radial-gradient(circle at 88% 8%, rgba(201, 151, 0, 0.10) 0, transparent 28%),
                linear-gradient(180deg, #fbfcff 0%, #f6f8fb 100%);
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
              background: rgba(201, 151, 0, 0.24);
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
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
