import { transformMermaidFences } from '@/lib/mdx'

describe('transformMermaidFences', () => {
  function decodeBase64(value: string): string {
    return Buffer.from(value, 'base64').toString('utf8')
  }

  function readAttr(line: string, name: 'chartBase64' | 'configBase64'): string {
    const pattern = new RegExp(`${name}="([^"]+)"`)
    const match = line.match(pattern)
    return match?.[1] || ''
  }

  const config = {
    theme: {
      light: 'default',
      dark: 'dark',
    },
    securityLevel: 'loose' as const,
  }

  it('transforms a top-level mermaid fence into Mermaid component', () => {
    const source = [
      '# Diagram',
      '',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '',
    ].join('\n')

    const transformed = transformMermaidFences(source, config)

    const mermaidLine = transformed.split('\n').find((line) => line.includes('<Mermaid '))
    expect(mermaidLine).toBeTruthy()

    const chartBase64 = readAttr(mermaidLine!, 'chartBase64')
    const configBase64 = readAttr(mermaidLine!, 'configBase64')

    expect(decodeBase64(chartBase64)).toBe('graph TD\n  A --> B')
    expect(decodeBase64(configBase64)).toContain('"securityLevel":"loose"')
  })

  it('does not transform mermaid fences inside another fenced code block', () => {
    const source = [
      '# Mermaid Example',
      '',
      '```markdown',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '```',
      '',
    ].join('\n')

    const transformed = transformMermaidFences(source, config)

    expect(transformed).toContain('```markdown')
    expect(transformed).toContain('```mermaid')
    expect(transformed).not.toContain('<Mermaid chartBase64=')
  })

  it('still transforms real mermaid fences after an example code block', () => {
    const source = [
      '```markdown',
      '```mermaid',
      'graph TD',
      '  X --> Y',
      '```',
      '```',
      '',
      '```mermaid',
      'graph LR',
      '  A --> B',
      '```',
      '',
    ].join('\n')

    const transformed = transformMermaidFences(source, config)

    expect(transformed).toContain('```markdown')
    const mermaidLine = transformed
      .split('\n')
      .find((line) => line.includes('<Mermaid ') && line.includes('chartBase64='))
    expect(mermaidLine).toBeTruthy()

    const chartBase64 = readAttr(mermaidLine!, 'chartBase64')
    expect(decodeBase64(chartBase64)).toBe('graph LR\n  A --> B')
  })
})
