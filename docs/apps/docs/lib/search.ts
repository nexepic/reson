import { Document } from 'flexsearch'
import { getLocaleDocs } from '@/lib/docs'
import { extractExcerpt } from '@/lib/mdx'

export interface SearchResult {
  id: string
  title: string
  href: string
  project: string
  category: string
  description?: string
  excerpt: string
  score: number
}

interface IndexedDoc {
  [key: string]: string
  id: string
  title: string
  titleLower: string
  content: string
  contentLower: string
  href: string
  project: string
  category: string
  description: string
}

interface LocaleSearchIndex {
  index: Document<IndexedDoc>
  docsById: Map<string, IndexedDoc>
}

const localeCache = new Map<string, LocaleSearchIndex>()

function createIndex(docs: IndexedDoc[]): LocaleSearchIndex {
  const index = new Document<IndexedDoc>({
    tokenize: 'forward',
    resolution: 9,
    context: {
      resolution: 7,
      depth: 2,
      bidirectional: true,
    },
    document: {
      id: 'id',
      index: [
        {
          field: 'title',
          tokenize: 'forward',
          resolution: 9,
        },
        {
          field: 'content',
          tokenize: 'full',
          resolution: 7,
          context: {
            resolution: 7,
            depth: 2,
            bidirectional: true,
          },
        },
        {
          field: 'category',
          tokenize: 'forward',
          resolution: 7,
        },
        {
          field: 'project',
          tokenize: 'forward',
          resolution: 7,
        },
      ],
      store: true,
    },
  })

  docs.forEach((doc) => {
    index.add(doc)
  })

  return {
    index,
    docsById: new Map(docs.map((doc) => [doc.id, doc])),
  }
}

function buildLocaleCache(locale: string): LocaleSearchIndex {
  const cached = localeCache.get(locale)
  if (cached) {
    return cached
  }

  const docs = getLocaleDocs(locale).map((doc) => ({
    id: doc.id,
    title: doc.title,
    titleLower: doc.title.toLowerCase(),
    content: doc.plainText,
    contentLower: doc.plainText.toLowerCase(),
    href: doc.href,
    project: doc.projectLabel,
    category: doc.category,
    description: doc.description || '',
  }))

  const created = createIndex(docs)
  localeCache.set(locale, created)
  return created
}

function fieldWeight(field?: string): number {
  if (field === 'title') {
    return 135
  }
  if (field === 'category' || field === 'project') {
    return 48
  }
  return 72
}

export function searchDocs(query: string, locale: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const { index, docsById } = buildLocaleCache(locale)
  const raw = index.search(normalizedQuery, {
    limit: 24,
    enrich: true,
  }) as Array<{
    field?: string
    result: Array<{ id: string; doc: IndexedDoc | null }>
  }>

  const scores = new Map<string, number>()
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  for (const bucket of raw) {
    const weight = fieldWeight(bucket.field)
    bucket.result.forEach((entry, rank) => {
      const base = weight - rank * 6
      const current = scores.get(entry.id) || 0
      scores.set(entry.id, current + Math.max(8, base))
    })
  }

  const results: SearchResult[] = []

  for (const [id, score] of scores.entries()) {
    const doc = docsById.get(id)
    if (!doc) {
      continue
    }

    let refinedScore = score
    if (doc.titleLower.includes(normalizedQuery)) {
      refinedScore += 65
    }
    if (doc.contentLower.includes(normalizedQuery)) {
      refinedScore += 24
    }

    terms.forEach((term) => {
      if (doc.titleLower.includes(term)) {
        refinedScore += 16
      }
      if (doc.contentLower.includes(term)) {
        refinedScore += 5
      }
    })

    results.push({
      id: doc.id,
      title: doc.title,
      href: doc.href,
      project: doc.project,
      category: doc.category,
      description: doc.description || undefined,
      excerpt: extractExcerpt(doc.content, normalizedQuery),
      score: refinedScore,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10)
}
