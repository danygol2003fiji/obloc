import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "O’BLOCK — Private Lounge",
    short_name: "O’BLOCK",
    description: "Авторские паровые коктейли, бар, музыка и приватная атмосфера O’BLOCK.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b100c",
    theme_color: "#1b100c",
    lang: "ru",
  };
}
