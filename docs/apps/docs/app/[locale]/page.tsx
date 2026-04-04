import { redirect } from "next/navigation";
import { buildHomeJsonLd, generateSiteMetadata } from "@/lib/metadata";
import { defaultLocale, locales } from "@/lib/i18n";
import { getFirstDocHref, getProjectGroups } from "@/lib/docs";
import { siteConfig } from "@/lib/site";
import { CustomHomePage } from "@/home/custom-home";

const defaultHomeMetadata = {
  en: {
    title: "Reson Documentation",
    description: "AST-based code duplication detection guides and references.",
  },
  zh: {
    title: "Reson 文档",
    description: "AST 代码重复检测的指南与参考文档。",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;
  const localeKey = (normalizedLocale === "zh" ? "zh" : "en") as keyof typeof defaultHomeMetadata;
  const defaults = defaultHomeMetadata[localeKey];
  const configuredHomeMetadata = siteConfig.home?.metadata;
  const fallbackMetadata = configuredHomeMetadata?.default;
  const localizedMetadata = configuredHomeMetadata?.[normalizedLocale];
  const title = localizedMetadata?.title || fallbackMetadata?.title || defaults.title;
  const description =
    localizedMetadata?.description || fallbackMetadata?.description || defaults.description;

  return generateSiteMetadata({
    title,
    description,
    pathname: `/${normalizedLocale}`,
    locale: normalizedLocale,
  });
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    redirect(`/${defaultLocale}`);
  }

  const firstDocHref = getFirstDocHref(locale) || `/${locale}/docs`;
  const projects = getProjectGroups(locale);
  const jsonLd = buildHomeJsonLd(locale);

  return (
    <CustomHomePage
      locale={locale}
      firstDocHref={firstDocHref}
      projects={projects}
      jsonLd={jsonLd}
    />
  );
}
