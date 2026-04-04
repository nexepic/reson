import type { MermaidRuntimeOptions } from './plugins/mermaid'

const ADMONITION_TYPE_MAP: Record<string, 'info' | 'warning' | 'danger' | 'success'> = {
  info: 'info',
  note: 'info',
  tip: 'success',
  details: 'info',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
}

function escapeAttrValue(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function encodeBase64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function hasFileExtension(value: string): boolean {
  const segments = value.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  if (!lastSegment) {
    return false
  }
  return /\.[A-Za-z0-9]+$/.test(lastSegment)
}

function normalizeRelativeHref(href: string): string {
  if (href.startsWith('./') || href.startsWith('../')) {
    return href
  }
  return `./${href}`
}

function splitHrefPathAndSuffix(href: string): { pathPart: string; suffix: string } {
  const match = href.match(/^([^?#]*)([?#].*)?$/)
  return {
    pathPart: match?.[1] ?? href,
    suffix: match?.[2] ?? '',
  }
}

function resolveRelativeSlug(currentSlug: string, href: string): string | null {
  const baseSegments = currentSlug.split('/').filter(Boolean)
  const currentDirSegments =
    baseSegments.length > 0 ? baseSegments.slice(0, baseSegments.length - 1) : []
  const hrefSegments = href.split('/').filter((segment) => segment.length > 0)
  const resolvedSegments = [...currentDirSegments]

  for (const segment of hrefSegments) {
    if (segment === '.') {
      continue
    }

    if (segment === '..') {
      if (resolvedSegments.length === 0) {
        return null
      }
      resolvedSegments.pop()
      continue
    }

    resolvedSegments.push(segment)
  }

  return resolvedSegments.join('/')
}

/**
 * Doc pages already render title/description from frontmatter in the page header.
 * To avoid duplicated top headings, strip a leading markdown H1 if present.
 */
export function stripLeadingH1(source: string): string {
  const lines = source.split('\n')
  let index = 0

  while (index < lines.length && lines[index].trim() === '') {
    index += 1
  }

  if (index >= lines.length) {
    return source
  }

  if (!/^#\s+.+$/.test(lines[index].trim())) {
    return source
  }

  index += 1

  while (index < lines.length && lines[index].trim() === '') {
    index += 1
  }

  return lines.slice(index).join('\n')
}

export function transformAdmonitions(source: string): string {
  const lines = source.split('\n')
  const output: string[] = []

  let insideBlock = false
  let blockFenceLength = 3
  let blockRawType = ''
  let blockType = ''
  let blockTitle = ''
  let blockContent: string[] = []

  for (const line of lines) {
    if (!insideBlock) {
      const openMatch = line.match(/^(:{3,})\s*(\w+)(?:\s+(.*))?\s*$/)
      if (openMatch) {
        const fenceLength = openMatch[1].length
        const candidateType = openMatch[2].toLowerCase()
        const mappedType = ADMONITION_TYPE_MAP[candidateType]
        if (mappedType) {
          insideBlock = true
          blockFenceLength = fenceLength
          blockRawType = candidateType
          blockType = mappedType
          blockTitle = (openMatch[3] || '').trim()
          blockContent = []
          continue
        }
      }

      output.push(line)
      continue
    }

    const closeMatch = line.match(/^(:{3,})\s*$/)
    if (closeMatch && closeMatch[1].length >= blockFenceLength) {
      const titleAttr = blockTitle
        ? ` title=\"${escapeAttrValue(blockTitle)}\"`
        : ''

      output.push(`<Callout type=\"${blockType}\"${titleAttr}>`)
      output.push('')
      output.push(...blockContent)
      output.push('')
      output.push('</Callout>')

      insideBlock = false
      blockFenceLength = 3
      blockRawType = ''
      blockType = ''
      blockTitle = ''
      blockContent = []
      continue
    }

    blockContent.push(line)
  }

  if (insideBlock) {
    const fallbackOpen = `${':'.repeat(blockFenceLength)}${blockRawType}${blockTitle ? ` ${blockTitle}` : ''}`
    output.push(fallbackOpen)
    output.push(...blockContent)
  }

  return output.join('\n')
}

export function transformMermaidFences(source: string, config: MermaidRuntimeOptions): string {
  const lines = source.split('\n')
  const output: string[] = []
  let inNonMermaidFence = false
  let fenceMarker = ''
  let fenceLength = 0
  let fenceDepth = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (inNonMermaidFence) {
      const maybeFence = trimmed.match(/^([`~]{3,})(.*)$/)
      if (maybeFence && maybeFence[1][0] === fenceMarker && maybeFence[1].length >= fenceLength) {
        const suffix = maybeFence[2].trim()
        if (suffix.length === 0) {
          fenceDepth -= 1
        } else {
          fenceDepth += 1
        }

        if (fenceDepth <= 0) {
          inNonMermaidFence = false
          fenceMarker = ''
          fenceLength = 0
          fenceDepth = 0
        }
      }

      output.push(line)
      continue
    }

    const openMatch = trimmed.match(/^([`~]{3,})\s*mermaid(?:\s+.*)?$/)
    if (!openMatch) {
      const genericFenceOpen = trimmed.match(/^([`~]{3,})(.*)$/)
      if (genericFenceOpen) {
        inNonMermaidFence = true
        fenceMarker = genericFenceOpen[1][0]
        fenceLength = genericFenceOpen[1].length
        fenceDepth = 1
      }

      output.push(line)
      continue
    }

    const fence = openMatch[1]
    const marker = fence[0]
    const minLength = fence.length
    const diagramLines: string[] = []

    let cursor = index + 1
    let closed = false

    while (cursor < lines.length) {
      const maybeClose = lines[cursor].trim().match(/^([`~]{3,})\s*$/)
      if (maybeClose && maybeClose[1][0] === marker && maybeClose[1].length >= minLength) {
        closed = true
        break
      }
      diagramLines.push(lines[cursor])
      cursor += 1
    }

    if (!closed) {
      output.push(line, ...diagramLines)
      index = cursor - 1
      continue
    }

    const chartText = diagramLines.join('\n').trim()
    const chartBase64 = encodeBase64(chartText)
    const configBase64 = encodeBase64(JSON.stringify(config))
    output.push(`<Mermaid chartBase64="${chartBase64}" configBase64="${configBase64}" />`)
    index = cursor
  }

  return output.join('\n')
}

export function rewriteIndexRelativeDocLinks(
  source: string,
  options: {
    locale: string
    docSlug: string
    isIndexDoc: boolean
  }
): string {
  if (!options.isIndexDoc) {
    return source
  }

  const markdownLinkPattern = /\[([^\]]*)\]\(([^)\s]+)(\s+["'][^"']*["'])?\)/g
  const jsxHrefPattern = /\bhref\s*=\s*["']([^"']+)["']/g
  const jsxExprHrefPattern = /\bhref\s*=\s*\{\s*["']([^"']+)["']\s*\}/g

  const rewriteHref = (href: string): string => {
    const { pathPart, suffix } = splitHrefPathAndSuffix(href)
    if (!pathPart || pathPart.startsWith('#')) {
      return href
    }

    if (
      /^(https?:|mailto:|tel:)/.test(pathPart) ||
      pathPart.startsWith('//') ||
      pathPart.startsWith('/')
    ) {
      return href
    }

    if (hasFileExtension(pathPart)) {
      return href
    }

    const relativeHref = normalizeRelativeHref(pathPart)
    const currentFileSlug = `${options.docSlug}/index`
    const targetSlug = resolveRelativeSlug(currentFileSlug, relativeHref)
    if (!targetSlug) {
      return href
    }

    const absoluteDocHref = `/${options.locale}/docs/${targetSlug}`
    return `${absoluteDocHref}${suffix}`
  }

  const lines = source.split('\n')
  const output: string[] = []
  let inCodeFence = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence
      output.push(line)
      continue
    }

    if (inCodeFence) {
      output.push(line)
      continue
    }

    let nextLine = line

    nextLine = nextLine.replace(
      markdownLinkPattern,
      (fullMatch, text: string, href: string, title: string | undefined) => {
        const rewritten = rewriteHref(href)
        if (rewritten === href) {
          return fullMatch
        }
        return `[${text}](${rewritten}${title || ''})`
      }
    )

    nextLine = nextLine.replace(jsxHrefPattern, (fullMatch, href: string) => {
      const rewritten = rewriteHref(href)
      if (rewritten === href) {
        return fullMatch
      }
      return fullMatch.replace(href, rewritten)
    })

    nextLine = nextLine.replace(jsxExprHrefPattern, (fullMatch, href: string) => {
      const rewritten = rewriteHref(href)
      if (rewritten === href) {
        return fullMatch
      }
      return fullMatch.replace(href, rewritten)
    })

    output.push(nextLine)
  }

  return output.join('\n')
}

export function stripMdxSyntax(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/[#*_~|>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractExcerpt(source: string, query: string, maxLength = 180): string {
  const normalized = stripMdxSyntax(source)
  if (!normalized) {
    return ''
  }

  if (!query.trim()) {
    return normalized.slice(0, maxLength)
  }

  const lower = normalized.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()
  const index = lower.indexOf(lowerQuery)

  if (index === -1) {
    return normalized.slice(0, maxLength)
  }

  const padding = Math.floor((maxLength - lowerQuery.length) / 2)
  const start = Math.max(0, index - padding)
  const end = Math.min(normalized.length, start + maxLength)
  const excerpt = normalized.slice(start, end).trim()

  if (start > 0 && end < normalized.length) {
    return `...${excerpt}...`
  }
  if (start > 0) {
    return `...${excerpt}`
  }
  if (end < normalized.length) {
    return `${excerpt}...`
  }

  return excerpt
}
