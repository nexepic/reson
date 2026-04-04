import { defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'

const docs = defineCollection({
  name: 'docs',
  directory: 'content/docs',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    order: z.number().optional(),
    project: z.string().optional(),
    projectLabel: z.string().optional(),
    projectDescription: z.string().optional(),
    projectOrder: z.number().optional(),
    content: z.string(),
  }),
  transform: (doc) => ({
    ...doc,
    slug: doc._meta.path, // Use the path as slug (e.g., 'en/introduction', 'zh/components')
  }),
})

export default defineConfig({
  content: [docs],
})
