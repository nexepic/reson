import type { MermaidPluginConfig, MermaidPluginOptions } from './plugins/mermaid'

export interface NavEntry {
  label: string
  labelZh?: string
  href: string
  external?: boolean
  /**
   * Slug prefixes (without locale segment), used for active state and
   * contextual sidebar filtering. Example: "getting-started".
   */
  matchPrefixes?: string[]
}

export interface BrandConfig {
  /**
   * Brand mark icon shown in the header.
   * Example: "/assets/brand/icon.svg"
   */
  icon?: string
  /**
   * Optional light-theme icon variant.
   */
  iconLight?: string
  /**
   * Optional dark-theme icon variant.
   */
  iconDark?: string
  /**
   * Optional wordmark/logo shown beside nav in the header.
   * If omitted, site name text is used.
   * Example: "/assets/brand/logo.svg"
   */
  logo?: string
  /**
   * Browser favicon path used in metadata.
   * Example: "/assets/icons/favicon.svg"
   */
  favicon?: string
  /**
   * Accessible brand label for images.
   */
  alt?: string
}

export interface SiteAssetsConfig {
  /**
   * Brand assets used by header UI.
   */
  brand?: Omit<BrandConfig, 'favicon'>
  /**
   * Icon assets used in HTML metadata tags.
   */
  icons?: {
    /**
     * Main site icon.
     */
    icon?: string
    /**
     * Fallback favicon / shortcut icon path.
     */
    favicon?: string
    /**
     * Shortcut icon path.
     */
    shortcut?: string
    /**
     * Apple touch icon path.
     */
    apple?: string
  }
  /**
   * Social preview image assets.
   */
  social?: {
    /**
     * Open Graph image path.
     */
    ogImage?: string
    /**
     * Twitter card image path.
     */
    twitterImage?: string
  }
  /**
   * Web app manifest path.
   */
  manifest?: string
}

export interface HomeLocaleMetadataConfig {
  /**
   * Home page title used in browser tab / SEO metadata.
   */
  title?: string
  /**
   * Home page description used in metadata description.
   */
  description?: string
}

export interface HomeConfig {
  /**
   * Localized home page metadata.
   * Use locale keys like "en", "zh", and optional "default" fallback.
   */
  metadata?: Record<string, HomeLocaleMetadataConfig> & {
    default?: HomeLocaleMetadataConfig
  }
}

export interface NexDocBaseConfig {
  name: string
  title: string
  description: string
  keywords: string[]
  defaultLocale: string
  github: string
  docsEditEnabled: boolean
  docsEditBase: string
  nav: NavEntry[]
  home?: HomeConfig
  assets?: SiteAssetsConfig
  /**
   * @deprecated Use assets.brand and assets.icons.
   */
  brand?: BrandConfig
}

export interface NexDocUserConfig extends NexDocBaseConfig {
  mermaid?: MermaidPluginOptions | MermaidPluginConfig
}

export interface NexDocResolvedConfig extends NexDocBaseConfig {
  mermaid: MermaidPluginConfig
}

export function defineNexDocConfig(config: NexDocUserConfig): NexDocUserConfig {
  return config
}
