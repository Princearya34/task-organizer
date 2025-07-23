import './globals.css';

export const metadata = {
  title: 'TaskFlow',
  description: 'Next.js ToDo with .NET Backend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body>{children}</body>
    </html>
  );
}
