export type MermaidSecurityLevel = 'strict' | 'loose' | 'antiscript' | 'sandbox'

export interface MermaidRuntimeOptions {
  theme: {
    light: string
    dark: string
  }
  securityLevel: MermaidSecurityLevel
}

export interface MermaidPluginOptions {
  enabled?: boolean
  theme?: Partial<MermaidRuntimeOptions['theme']>
  securityLevel?: MermaidSecurityLevel
}

export interface MermaidPluginConfig extends MermaidRuntimeOptions {
  enabled: boolean
}

const defaultMermaidConfig: MermaidPluginConfig = {
  enabled: false,
  theme: {
    light: 'default',
    dark: 'dark',
  },
  securityLevel: 'loose',
}

export function resolveMermaidConfig(options?: MermaidPluginOptions): MermaidPluginConfig {
  return {
    enabled: options?.enabled ?? defaultMermaidConfig.enabled,
    theme: {
      light: options?.theme?.light ?? defaultMermaidConfig.theme.light,
      dark: options?.theme?.dark ?? defaultMermaidConfig.theme.dark,
    },
    securityLevel: options?.securityLevel ?? defaultMermaidConfig.securityLevel,
  }
}

export function withMermaid<T extends object>(
  siteConfig: T,
  options?: MermaidPluginOptions
): T & { mermaid: MermaidPluginConfig } {
  return {
    ...siteConfig,
    mermaid: resolveMermaidConfig(options),
  }
}

