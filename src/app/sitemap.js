const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kabareriders.com";

export default function sitemap() {
  const pages = ["", "/realisations", "/services", "/evenements", "/equipe", "/contact"];
  const now = new Date();
  return pages.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.8,
  }));
}
