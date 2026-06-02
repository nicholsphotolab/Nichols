import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import SmoothScroll from "./components/SmoothScroll";
import Brand from "./components/Brand";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Nichols Photo Lab",
  description:
    "Salt Lake City film lab. Develop, scan, and print. Prints, video transfer, and passport photos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <SmoothScroll />
        <Brand />
        {children}
        <Footer />
      </body>
    </html>
  );
}
