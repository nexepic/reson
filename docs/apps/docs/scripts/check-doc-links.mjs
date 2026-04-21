#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const docsRoot = path.join(cwd, 'content', 'docs')
const siteConfigPath = path.join(cwd, 'nexdoc.config.ts')
const appRoot = path.join(cwd, 'app')
const componentsRoot = path.join(cwd, 'components')

function walkMdxFiles(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkMdxFiles(fullPath, results)
    } else if (entry.isFile() && fullPath.endsWith('.mdx')) {
      results.push(fullPath)
    }
  }

  return results
}

function walkCodeFiles(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkCodeFiles(fullPath, results)
      continue
    }

    if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }

  return results
}

function getLocales() {
  if (!fs.existsSync(docsRoot)) {
    return []
  }

  return fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function collectDocSlugs(locales) {
  const docsByLocale = new Map()

  for (const locale of locales) {
    const localeRoot = path.join(docsRoot, locale)
    const files = walkMdxFiles(localeRoot)
    const slugs = new Set()

    for (const file of files) {
      const rawSlug = path
        .relative(localeRoot, file)
        .replace(/\\/g, '/')
        .replace(/\.mdx$/, '')
      const normalized = normalizeDocSlug(rawSlug)

      slugs.add(normalized)

      const routeSlug = toRouteSlug(normalized)
      if (routeSlug) {
        slugs.add(routeSlug)
      }
    }

    docsByLocale.set(locale, slugs)
  }

  return docsByLocale
}

function toPosixPath(value) {
  return value.replace(/\\/g, '/')
}

function normalizePathname(href) {
  return href.split('#')[0].split('?')[0]
}

function normalizeDocSlug(slug) {
  if (!slug) {
    return ''
  }
  return slug
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/$/, '')
}

function toRouteSlug(slug) {
  if (!slug || slug === 'index') {
    return ''
  }
  if (slug.endsWith('/index')) {
    return slug.slice(0, -('/index'.length))
  }
  return slug
}

function hasFileExtension(value) {
  const lastSegment = value.split('/').filter(Boolean).pop()
  if (!lastSegment) {
    return false
  }
  return /\.[A-Za-z0-9]+$/.test(lastSegment)
}

function normalizeRelativeHref(href) {
  if (href.startsWith('./') || href.startsWith('../')) {
    return href
  }
  return `./${href}`
}

function resolveRelativeSlug(currentSlug, href) {
  const currentDir = path.posix.dirname(currentSlug)
  const resolved = path.posix.normalize(path.posix.join(currentDir, href))

  if (resolved.startsWith('../') || resolved === '..') {
    return null
  }

  return normalizeDocSlug(resolved)
}

function validateInternalHref({ href, file, line, locale, currentSlug, locales, docsByLocale, errors }) {
  const cleaned = normalizePathname(href)

  if (!cleaned || cleaned === '/' || cleaned.startsWith('#')) {
    return
  }

  // Allow placeholder examples like /en/docs/... in documentation text.
  if (cleaned.includes('...')) {
    return
  }

  if (/^(https?:|mailto:|tel:)/.test(cleaned) || cleaned.startsWith('//')) {
    return
  }

  if (cleaned.startsWith('/docs/')) {
    errors.push(`${file}:${line} -> ${href} (missing locale prefix, expected /{locale}/docs/...)`)
    return
  }

  if (cleaned.startsWith('/')) {
    const segments = cleaned.split('/').filter(Boolean)
    if (segments.length < 1) {
      return
    }

    const targetLocale = segments[0]
    if (!locales.includes(targetLocale)) {
      return
    }

    if (segments.length === 1) {
      return
    }

    if (segments[1] !== 'docs') {
      errors.push(`${file}:${line} -> ${href} (missing /docs segment, expected /{locale}/docs/...)`)
      return
    }

    const targetSlug = segments.slice(2).join('/')
    if (!targetSlug) {
      return
    }

    if (!docsByLocale.get(targetLocale)?.has(targetSlug)) {
      errors.push(`${file}:${line} -> ${href} (target doc not found)`)
    }

    return
  }

  if (hasFileExtension(cleaned)) {
    return
  }

  const relativeHref = normalizeRelativeHref(cleaned)
  const normalizedCurrentSlug = normalizeDocSlug(currentSlug)
  const targetSlug = resolveRelativeSlug(normalizedCurrentSlug, relativeHref)
  if (!targetSlug) {
    errors.push(`${file}:${line} -> ${href} (invalid relative doc path)`)
    return
  }

  if (!docsByLocale.get(locale)?.has(targetSlug)) {
    errors.push(`${file}:${line} -> ${href} (relative target doc not found)`)
  }
}

function isQuoted(value) {
  return (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
}

function parseSimpleYaml(yamlStr) {
  // Minimal YAML parser for flat key-value frontmatter.
  // Returns { data, errors } where errors lists parse problems.
  const result = {}
  const errors = []
  const lines = yamlStr.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const match = rawLine.match(/^(\s*)([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!match) {
      continue
    }

    const indent = match[1].length
    const key = match[2]
    let value = match[3].trim()

    // Skip multi-line block indicators
    if (!value || value === '|' || value === '>') {
      continue
    }

    // Detect unquoted values that YAML would misparse
    if (!isQuoted(value)) {
      // Trailing colon creates a nested mapping
      if (value.endsWith(':')) {
        errors.push({ line: i + 1, key, reason: 'ends with ":" which creates a nested mapping — quote the value' })
        continue
      }

      // Colon followed by space creates a nested mapping
      if (/:\s/.test(value)) {
        errors.push({ line: i + 1, key, reason: 'contains ":" followed by space which creates a nested mapping — quote the value' })
        continue
      }

      // List syntax
      if (/^- /.test(value)) {
        errors.push({ line: i + 1, key, reason: 'starts with "- " which creates a list — quote the value' })
        continue
      }

      // Flow collection syntax
      if (/^\[.*\]$/.test(value) || /^\{.*\}$/.test(value)) {
        // These are valid YAML, skip
      } else if (/^\[/.test(value) || /^\{/.test(value)) {
        errors.push({ line: i + 1, key, reason: 'starts with flow collection syntax — quote the value' })
        continue
      }
    }

    result[key] = value
  }

  return { data: result, errors }
}

function checkFrontmatterSanity({ locales, errors }) {
  const ccGeneratedPath = path.join(cwd, '.content-collections', 'generated', 'allDocs.js')
  let ccSlugs = null

  // Try to cross-reference with content-collections generated output
  if (fs.existsSync(ccGeneratedPath)) {
    const ccContent = fs.readFileSync(ccGeneratedPath, 'utf8')
    ccSlugs = new Set()
    for (const match of ccContent.matchAll(/"path":\s*"([^"]+)"/g)) {
      ccSlugs.add(match[1])
    }
  }

  for (const locale of locales) {
    const localeRoot = path.join(docsRoot, locale)
    const files = walkMdxFiles(localeRoot)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')

      if (lines[0]?.trim() !== '---') {
        errors.push(`${file}:1 -> missing frontmatter start delimiter "---"`)
        continue
      }

      const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
      if (frontmatterEnd === -1) {
        errors.push(`${file}:1 -> missing frontmatter end delimiter "---"`)
        continue
      }

      const yamlStr = lines.slice(1, frontmatterEnd).join('\n')
      const { errors: yamlErrors } = parseSimpleYaml(yamlStr)

      for (const ye of yamlErrors) {
        errors.push(`${file}:${ye.line} -> frontmatter "${ye.key}" ${ye.reason}`)
      }

      // Cross-reference with content-collections output
      if (ccSlugs) {
        const rawSlug = path
          .relative(localeRoot, file)
          .replace(/\\/g, '/')
          .replace(/\.mdx$/, '')
        const ccSlug = `${locale}/${rawSlug}`
        // content-collections strips /index suffix from paths
        const ccSlugNoIndex = ccSlug.endsWith('/index') ? ccSlug.slice(0, -('/index'.length)) : null
        if (!ccSlugs.has(ccSlug) && !(ccSlugNoIndex && ccSlugs.has(ccSlugNoIndex))) {
          errors.push(
            `${file} -> exists on disk but is NOT in content-collections output (likely frontmatter parse error causes it to be silently skipped)`
          )
        }
      }
    }
  }
}

function checkMdxLinks({ locales, docsByLocale, errors }) {
  const markdownLinkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  const jsxHrefPattern = /\bhref\s*=\s*["']([^"']+)["']/g
  const jsxExprHrefPattern = /\bhref\s*=\s*\{\s*["']([^"']+)["']\s*\}/g

  for (const locale of locales) {
    const localeRoot = path.join(docsRoot, locale)
    const files = walkMdxFiles(localeRoot)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const currentSlug = toPosixPath(path.relative(localeRoot, file)).replace(/\.mdx$/, '')
      const lines = content.split('\n')

      let inCodeFence = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        if (trimmed.startsWith('```')) {
          inCodeFence = !inCodeFence
          continue
        }

        if (inCodeFence) {
          continue
        }

        let match
        while ((match = markdownLinkPattern.exec(line))) {
          validateInternalHref({
            href: match[1],
            file,
            line: i + 1,
            locale,
            currentSlug,
            locales,
            docsByLocale,
            errors,
          })
        }
        markdownLinkPattern.lastIndex = 0

        while ((match = jsxHrefPattern.exec(line))) {
          validateInternalHref({
            href: match[1],
            file,
            line: i + 1,
            locale,
            currentSlug,
            locales,
            docsByLocale,
            errors,
          })
        }
        jsxHrefPattern.lastIndex = 0

        while ((match = jsxExprHrefPattern.exec(line))) {
          validateInternalHref({
            href: match[1],
            file,
            line: i + 1,
            locale,
            currentSlug,
            locales,
            docsByLocale,
            errors,
          })
        }
        jsxExprHrefPattern.lastIndex = 0
      }
    }
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function checkCodeLinks({ locales, docsByLocale, errors }) {
  const codeFiles = [...walkCodeFiles(appRoot), ...walkCodeFiles(componentsRoot)]
  if (codeFiles.length === 0) {
    return
  }

  const localePattern = locales.map((locale) => escapeRegex(locale)).join('|')
  if (!localePattern) {
    return
  }

  const hrefPattern = new RegExp(
    String.raw`["'\`](\/(?:docs|(?:${localePattern})\/docs)[^"'\`\s)]*)["'\`]`,
    'g'
  )

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let match

      while ((match = hrefPattern.exec(line))) {
        validateInternalHref({
          href: match[1],
          file,
          line: i + 1,
          locale: locales[0],
          currentSlug: '',
          locales,
          docsByLocale,
          errors,
        })
      }

      hrefPattern.lastIndex = 0
    }
  }
}

function getLineNumber(content, index) {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (content[i] === '\n') {
      line += 1
    }
  }
  return line
}

function checkNavHrefs({ locales, docsByLocale, errors }) {
  if (!fs.existsSync(siteConfigPath)) {
    return
  }

  const content = fs.readFileSync(siteConfigPath, 'utf8')
  const hrefPattern = /href:\s*'([^']+)'/g

  let match
  while ((match = hrefPattern.exec(content))) {
    const href = match[1]

    if (!href.startsWith('/docs/')) {
      continue
    }

    const slug = href.replace(/^\/docs\//, '')
    const line = getLineNumber(content, match.index)

    for (const locale of locales) {
      if (!docsByLocale.get(locale)?.has(slug)) {
        errors.push(
          `${siteConfigPath}:${line} -> ${href} (nav target missing for locale "${locale}")`
        )
      }
    }
  }
}

function main() {
  const locales = getLocales()
  if (locales.length === 0) {
    console.error('No locales found under content/docs')
    process.exit(1)
  }

  const docsByLocale = collectDocSlugs(locales)
  const errors = []

  checkFrontmatterSanity({ locales, errors })
  checkMdxLinks({ locales, docsByLocale, errors })
  checkCodeLinks({ locales, docsByLocale, errors })
  checkNavHrefs({ locales, docsByLocale, errors })

  if (errors.length > 0) {
    console.error(`\\n[check-doc-links] Found ${errors.length} link issue(s):`)
    for (const err of errors) {
      console.error(`- ${err}`)
    }
    process.exit(1)
  }

  console.log('[check-doc-links] All doc links are valid.')
}

main()
