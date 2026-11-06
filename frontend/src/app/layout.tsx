import type { Metadata } from 'next';
import NavBar from "@/components/navbar/NavBar";
import './globals.css';

export const metadata: Metadata = {
  title: 'Chronos Equatorial',
  description: 'Planetary Time Conduit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#030712]">
        <NavBar />
        {children}</body>
    </html>
  );
}