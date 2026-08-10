import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake Financial Firm | Client Portal",
  description: "The future client portal for Fake Financial Firm.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
