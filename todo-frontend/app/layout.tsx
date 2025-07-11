import './globals.css';

export const metadata = {
  title: 'ToDo App',
  description: 'Next.js ToDo with .NET Backend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
