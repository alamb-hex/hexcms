import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "heXcms - Git-based Headless CMS",
  description: "A Git-based Headless CMS with database sync for blazing-fast builds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
