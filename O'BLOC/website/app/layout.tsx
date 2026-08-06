import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "O’BLOCK — Private Lounge",
  description: "O’BLOCK в Иваново, ул. Смирнова, д. 7 — авторские паровые коктейли, бар, музыка и приватная атмосфера. Забронируйте стол для вашего вечера.",
  keywords: ["O’BLOCK Иваново", "кальянная Иваново", "лаунж бар", "паровые коктейли", "коктейли", "музыка", "забронировать стол"],
  openGraph: {
    title: "O’BLOCK — Искусство замедлять время",
    description: "Private lounge в Иваново, ул. Смирнова, д. 7 · авторские вкусы, бар и камерная атмосфера.",
    images: [{ url: "/og-oblock.png", width: 1672, height: 941, alt: "O’BLOCK — private lounge" }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og-oblock.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><head><link rel="preload" as="image" href="/hero-hookah-obloc-v3.webp" fetchPriority="high" /></head><body>{children}</body></html>;
}
