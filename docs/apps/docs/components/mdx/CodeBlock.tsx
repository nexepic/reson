'use client'

import React, { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  'data-rehype-pretty-code-figure'?: string
  'data-language'?: string
  'data-rehype-pretty-code-title'?: string
}

function toCodeString(value: React.ReactNode): string {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCodeString(item)).join('')
  }

  if (React.isValidElement(value)) {
    const node = value as React.ReactElement<any>;
    if (node.type === 'figcaption' || node.props?.['data-rehype-pretty-code-title'] !== undefined) {
      return ''
    }
    return toCodeString(node.props?.children)
  }

  return ''
}

function extractLanguage(children: React.ReactNode): string | undefined {
  let lang: string | undefined;
  React.Children.forEach(children, (child) => {
    if (lang) return;
    if (React.isValidElement(child)) {
      const node = child as React.ReactElement<any>;
      if (node.props?.['data-language']) {
        lang = node.props['data-language'];
      } else {
        lang = extractLanguage(node.props?.children);
      }
    }
  });
  return lang;
}

function extractTitle(children: React.ReactNode): string | undefined {
  let title: string | undefined;
  React.Children.forEach(children, (child) => {
    if (title) return;
    if (React.isValidElement(child)) {
      const node = child as React.ReactElement<any>;
      if (node.type === 'figcaption' || node.props?.['data-rehype-pretty-code-title'] !== undefined) {
        title = typeof node.props?.children === 'string' ? node.props.children : undefined;
      } else {
        title = extractTitle(node.props?.children);
      }
    }
  });
  return title;
}

function filterChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const node = child as React.ReactElement<any>;
      if (node.type === 'figcaption' || node.props?.['data-rehype-pretty-code-title'] !== undefined) {
        return null;
      }
      if (node.props?.children) {
        return React.cloneElement(node, {
          ...node.props,
          children: filterChildren(node.props.children)
        });
      }
    }
    return child;
  });
}

export function CodeBlock({ children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const code = useMemo(() => toCodeString(children).trimEnd(), [children])
  
  // rehype-pretty-code can put data attributes on the figure itself (props) or its children
  const language = props['data-language'] || extractLanguage(children)
  const title = props['data-rehype-pretty-code-title'] || extractTitle(children)
  
  const filteredChildren = filterChildren(children)

  const handleCopy = async () => {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="code-block group relative" {...props}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-code-toolbar)] text-[var(--text-tertiary)] opacity-0 backdrop-blur-sm transition-all hover:bg-[var(--bg-code-toolbar-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <Check className="h-4 w-4 text-[var(--callout-success)]" /> : <Copy className="h-4 w-4" />}
      </button>
      <div className="code-block-content relative">
        {props['data-rehype-pretty-code-figure'] !== undefined ? (
          filteredChildren
        ) : (
          <pre>{filteredChildren}</pre>
        )}
      </div>
    </div>
  )
}
