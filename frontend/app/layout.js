// ==============================================================================
// Root Layout (frontend/app/layout.js)
// ==============================================================================
// Sets the HTML structure, global CSS, and page metadata for Next.js.
// ==============================================================================

import './globals.css';

export const metadata = {
  title: 'PulseWatch — Uptime & Health Monitor',
  description: 'Simple, modern full-stack website uptime monitoring application.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
