import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Link2 } from 'lucide-react'
import { Callout } from '@/components/mdx/Callout'
import { CodeBlock } from '@/components/mdx/CodeBlock'
import { Mermaid } from '@/components/mdx/Mermaid'

function toText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((item) => toText(item)).join(' ')
  }

  if (node && typeof node === 'object' && 'props' in node) {
    const props = node.props as { children?: ReactNode }
    return toText(props.children)
  }

  return ''
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=<[\]{}|\\:;"'.,?/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function AnchorHeading({
  level,
  children,
  ...props
}: {
  level: 2 | 3
  children: ReactNode
  id?: string
  className?: string
}) {
  const text = toText(children)
  const id = props.id || slugifyHeading(text)
  const className = `group scroll-mt-24 ${props.className || ''}`.trim()
  const anchorLabel = text ? `Link to section: ${text}` : 'Link to section'

  if (level === 2) {
    return (
      <h2 {...props} id={id} className={className}>
        <a
          href={`#${id}`}
          className="heading-anchor"
          aria-label={anchorLabel}
          title={anchorLabel}
        >
          <Link2 className="heading-anchor-icon h-[18px] w-[18px]" />
        </a>
        {children}
      </h2>
    )
  }

  return (
    <h3 {...props} id={id} className={className}>
      <a
        href={`#${id}`}
        className="heading-anchor"
        aria-label={anchorLabel}
        title={anchorLabel}
      >
        <Link2 className="heading-anchor-icon h-4 w-4" />
      </a>
      {children}
    </h3>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Callout,
    Mermaid,
    a: ({ href, children, ...props }: any) => {
      if (typeof href !== 'string' || href.length === 0) {
        return (
          <a {...props}>
            {children}
          </a>
        )
      }

      const isHashLink = href.startsWith('#')
      const isInternalLink =
        (href.startsWith('/') && !href.startsWith('//')) ||
        href.startsWith('./') ||
        href.startsWith('../')

      if (isHashLink) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        )
      }

      if (isInternalLink) {
        return (
          <Link href={href as any} {...props}>
            {children}
          </Link>
        )
      }

      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
    figure: (props: any) => {
      if (props['data-rehype-pretty-code-figure'] !== undefined) {
        // Check if this is a block code figure (contains a <pre>) or inline code.
        // Block code: figure > pre[data-language] > code[data-language] > span[data-line]
        // Inline code: figure > code[data-language] > span (no nested code with data-language)
        // We detect block code by checking if any direct child wraps a nested element
        // with data-language (i.e. pre > code), rather than being the code element itself.
        const children = Array.isArray(props.children) ? props.children : [props.children]
        const hasPre = children.some((child: any) => {
          if (child?.type === 'pre') return true
          // For MDX custom components, check if child wraps a nested code with data-language
          const inner = child?.props?.children
          if (!inner) return false
          const innerArr = Array.isArray(inner) ? inner : [inner]
          return innerArr.some((c: any) => c?.props?.['data-language'])
        })
        if (!hasPre) {
          // Inline code — render children directly without block wrapper
          return <>{props.children}</>
        }
        return <CodeBlock {...props}>{props.children}</CodeBlock>
      }
      return <figure {...props} />
    },
    figcaption: (props: any) => {
      if (props['data-rehype-pretty-code-title'] !== undefined) {
        return <figcaption className="code-block-figcaption" {...props} />
      }
      return <figcaption {...props} />
    },
    pre: (props: any) => {
      // If inside a rehype-pretty-code figure, render raw pre
      if (props['data-language']) {
        return <pre {...props} />
      }
      return <CodeBlock>{props.children}</CodeBlock>
    },
    code: ({ className, children, style, ...props }: any) => {
      // For inline code (not inside a pre/figure from rehype-pretty-code),
      // strip any style that rehype-pretty-code may inject (e.g. display:grid)
      const isInline = !props['data-language']
      return (
        <code
          className={className}
          style={isInline ? undefined : style}
          {...props}
        >
          {children}
        </code>
      )
    },
    h2: ({ children, ...props }) => (
      <AnchorHeading {...props} level={2}>
        {children}
      </AnchorHeading>
    ),
    h3: ({ children, ...props }) => (
      <AnchorHeading {...props} level={3}>
        {children}
      </AnchorHeading>
    ),
  }
}
