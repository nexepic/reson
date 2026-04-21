import { allDocs } from '../.content-collections/generated'
import { defaultLocale, locales, type Locale } from '@/lib/i18n'
import { stripMdxSyntax } from '@/lib/mdx'
import { siteConfig } from '@/lib/site'

interface RawDoc {
  title: string
  description?: string
  category?: string
  order?: number
  categoryOrder?: number
  project?: string
  projectLabel?: string
  projectDescription?: string
  projectOrder?: number
  content: string
  slug: string
  _meta: {
    filePath: string
    fileName: string
    directory: string
    extension: string
    path: string
  }
}

export interface DocRecord {
  id: string
  locale: Locale
  slug: string
  href: string
  title: string
  description?: string
  category: string
  order: number
  categoryOrder: number
  project: string
  projectLabel: string
  projectDescription?: string
  projectOrder: number
  content: string
  plainText: string
  readingMinutes: number
  filePath: string
}

export interface NavGroup {
  title: string
  items: Array<{
    title: string
    href: string
    slug: string
    order: number
    description?: string
  }>
}

interface NavGroupFilterOptions {
  prefixes?: string[]
}

export interface ProjectGroup {
  key: string
  title: string
  description?: string
  order: number
  itemCount: number
  categories: NavGroup[]
}

export interface DocHeading {
  id: string
  text: string
  level: 2 | 3
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

function buildCategoryPriorityMap(records: DocRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const doc of records) {
    const key = `${doc.project}::${doc.category}`
    const current = map.get(key) ?? 9999
    map.set(key, Math.min(current, doc.categoryOrder))
  }
  return map
}

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

function normalizeLocale(locale: string): Locale {
  if (isLocale(locale)) {
    return locale
  }
  return defaultLocale
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=<[\]{}|\\:;"'.,?/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function normalizeProjectKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePrefix(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function matchesSlugPrefix(slug: string, prefix: string): boolean {
  const normalizedPrefix = normalizePrefix(prefix)
  if (!normalizedPrefix) {
    return false
  }
  return slug === normalizedPrefix || slug.startsWith(`${normalizedPrefix}/`)
}

function toProjectLabel(projectKey: string): string {
  return projectKey
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function computeReadingMinutes(content: string): number {
  const wordCount = stripMdxSyntax(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 220))
}

function resolveProject(raw: RawDoc, slug: string): {
  key: string
  label: string
  description?: string
  order: number
} {
  const slugSegments = slug.split('/').filter(Boolean)
  const nestedProject = slugSegments.length > 1 ? slugSegments[0] : ''

  const projectCandidate = raw.project || nestedProject || 'core'
  const normalizedKey = normalizeProjectKey(projectCandidate) || 'core'

  return {
    key: normalizedKey,
    label: raw.projectLabel || toProjectLabel(normalizedKey),
    description: raw.projectDescription,
    order: raw.projectOrder ?? 999,
  }
}

function toDocRecord(raw: RawDoc): DocRecord | null {
  const slugSegments = raw.slug.split('/').filter(Boolean)
  if (slugSegments.length < 2) {
    return null
  }

  const localeSegment = slugSegments[0]
  if (!isLocale(localeSegment)) {
    return null
  }

  const locale = localeSegment
  const slug = slugSegments.slice(1).join('/')
  const href = `/${locale}/docs/${slug}`
  const project = resolveProject(raw, slug)

  return {
    id: raw.slug,
    locale,
    slug,
    href,
    title: raw.title,
    description: raw.description,
    category: raw.category || 'General',
    order: raw.order ?? 9999,
    categoryOrder: raw.categoryOrder ?? 9999,
    project: project.key,
    projectLabel: project.label,
    projectDescription: project.description,
    projectOrder: project.order,
    content: raw.content,
    plainText: stripMdxSyntax(raw.content),
    readingMinutes: computeReadingMinutes(raw.content),
    filePath: raw._meta.filePath,
  }
}

const docs: DocRecord[] = (allDocs as RawDoc[])
  .map(toDocRecord)
  .filter((item): item is DocRecord => item !== null)

const categoryPriorityMap = buildCategoryPriorityMap(docs)

function getCategoryPriority(project: string, category: string): number {
  return categoryPriorityMap.get(`${project}::${category}`) ?? 9999
}

function compareDocs(a: DocRecord, b: DocRecord): number {
  if (a.projectOrder !== b.projectOrder) {
    return a.projectOrder - b.projectOrder
  }

  if (a.project !== b.project) {
    return collator.compare(a.project, b.project)
  }

  const categoryOrderDiff = getCategoryPriority(a.project, a.category) - getCategoryPriority(b.project, b.category)
  if (categoryOrderDiff !== 0) {
    return categoryOrderDiff
  }

  if (a.category !== b.category) {
    return collator.compare(a.category, b.category)
  }

  if (a.order !== b.order) {
    return a.order - b.order
  }

  return collator.compare(a.title, b.title)
}

function sortNavItems(items: NavGroup['items']): NavGroup['items'] {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order
    }
    return collator.compare(a.title, b.title)
  })
}

export function getAllDocs(): DocRecord[] {
  return [...docs].sort((a, b) => {
    if (a.locale !== b.locale) {
      return collator.compare(a.locale, b.locale)
    }

    return compareDocs(a, b)
  })
}

export function getLocaleDocs(localeInput: string): DocRecord[] {
  const locale = normalizeLocale(localeInput)
  return docs
    .filter((doc) => doc.locale === locale)
    .sort(compareDocs)
}

export function getDocBySlug(localeInput: string, slugSegments: string[]): DocRecord | undefined {
  const locale = normalizeLocale(localeInput)
  const slug = slugSegments.join('/')
  return docs.find((doc) => doc.locale === locale && doc.slug === slug)
}

export function getDocByHref(href: string): DocRecord | undefined {
  return docs.find((doc) => doc.href === href)
}

export function getFirstDocHref(localeInput: string): string | undefined {
  const locale = normalizeLocale(localeInput)

  for (const navEntry of siteConfig.nav) {
    if (navEntry.external) {
      continue
    }
    const preferredHref = `/${locale}${navEntry.href}`
    if (docs.some((doc) => doc.locale === locale && doc.href === preferredHref)) {
      return preferredHref
    }
  }

  const localeDocs = getLocaleDocs(localeInput)
  return localeDocs[0]?.href
}

export function hasLocalizedDoc(localeInput: string, slug: string): boolean {
  const locale = normalizeLocale(localeInput)
  return docs.some((doc) => doc.locale === locale && doc.slug === slug)
}

export function getProjectGroups(localeInput: string): ProjectGroup[] {
  const locale = normalizeLocale(localeInput)
  const localeDocs = getLocaleDocs(locale)
  const projectMap = new Map<string, ProjectGroup>()

  for (const doc of localeDocs) {
    const existingProject = projectMap.get(doc.project)
    if (!existingProject) {
      projectMap.set(doc.project, {
        key: doc.project,
        title: doc.projectLabel,
        description: doc.projectDescription,
        order: doc.projectOrder,
        itemCount: 0,
        categories: [],
      })
    }

    const projectGroup = projectMap.get(doc.project)!
    projectGroup.itemCount += 1

    let category = projectGroup.categories.find((group) => group.title === doc.category)
    if (!category) {
      category = {
        title: doc.category,
        items: [],
      }
      projectGroup.categories.push(category)
    }

    category.items.push({
      title: doc.title,
      href: doc.href,
      slug: doc.slug,
      order: doc.order,
      description: doc.description,
    })
  }

  return [...projectMap.values()]
    .map((project) => ({
      ...project,
      categories: project.categories
        .map((category) => ({
          ...category,
          items: sortNavItems(category.items),
        }))
        .sort((a, b) => {
          const categoryOrderDiff = getCategoryPriority(project.key, a.title) - getCategoryPriority(project.key, b.title)
          if (categoryOrderDiff !== 0) {
            return categoryOrderDiff
          }
          return collator.compare(a.title, b.title)
        }),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return collator.compare(a.title, b.title)
    })
}

export function getNavGroups(localeInput: string, options?: NavGroupFilterOptions): NavGroup[] {
  const groups = getProjectGroups(localeInput).flatMap((project) => project.categories)
  const normalizedPrefixes = (options?.prefixes || [])
    .map((prefix) => normalizePrefix(prefix))
    .filter(Boolean)

  if (normalizedPrefixes.length > 0) {
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          normalizedPrefixes.some((prefix) => matchesSlugPrefix(item.slug, prefix))
        ),
      }))
      .filter((group) => group.items.length > 0)
  }

  return groups
}

export function getPrevNext(localeInput: string, currentSlug: string): {
  prev?: DocRecord
  next?: DocRecord
} {
  const localeDocs = getLocaleDocs(localeInput)
  const index = localeDocs.findIndex((doc) => doc.slug === currentSlug)

  if (index === -1) {
    return {}
  }

  return {
    prev: index > 0 ? localeDocs[index - 1] : undefined,
    next: index < localeDocs.length - 1 ? localeDocs[index + 1] : undefined,
  }
}

export function extractDocHeadings(content: string): DocHeading[] {
  const lines = content.split('\n')
  const headings: DocHeading[] = []
  const headingCounts = new Map<string, number>()

  let inCodeBlock = false

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const match = line.match(/^(##|###)\s+(.+)$/)
    if (!match) {
      continue
    }

    const level = match[1].length as 2 | 3
    const text = match[2].trim()

    let baseId = slugifyHeading(text)
    if (!baseId) {
      baseId = `section-${headings.length + 1}`
    }

    const count = headingCounts.get(baseId) || 0
    headingCounts.set(baseId, count + 1)

    const id = count === 0 ? baseId : `${baseId}-${count}`

    headings.push({ id, text, level })
  }

  return headings
}

export function buildEditUrl(doc: DocRecord): string {
  const normalizedBase = siteConfig.docsEditBase.replace(/\/$/, '')
  return `${normalizedBase}/${doc.filePath}`
}
