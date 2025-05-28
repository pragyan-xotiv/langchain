import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Agent Support System",
  description: "Knowledge Layer for the Multi-Agent Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex flex-wrap items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Multi-Agent System
            </Link>
            <div className="flex gap-4">
              <Link href="/dashboard/knowledge" className="hover:text-blue-300">
                Knowledge
              </Link>
              <Link href="/dashboard/agents" className="hover:text-blue-300">
                Agents
              </Link>
            </div>
          </div>
        </nav>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
