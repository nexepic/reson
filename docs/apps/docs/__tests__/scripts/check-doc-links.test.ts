/** @jest-environment node */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function writeFile(root: string, relativePath: string, content: string): void {
  const filePath = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'check-doc-links-'))
}

function runChecker(workspaceRoot: string) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'check-doc-links.mjs')
  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  })
}

describe('check-doc-links script', () => {
  const workspaces: string[] = []

  afterAll(() => {
    for (const workspace of workspaces) {
      fs.rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('fails when an internal doc link target does not exist', () => {
    const workspace = createWorkspace()
    workspaces.push(workspace)

    writeFile(
      workspace,
      'nexdoc.config.ts',
      "export const siteConfig = { nav: [{ href: '/docs/getting-started/introduction' }] }\n"
    )

    writeFile(
      workspace,
      'content/docs/en/getting-started/introduction.mdx',
      `---
title: Introduction
description: Intro page
category: Setup
order: 1
---

# Introduction

See [Missing Page](/en/docs/getting-started/missing-page)
`
    )

    const result = runChecker(workspace)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status).toBe(1)
    expect(output).toContain('target doc not found')
  })

  it('passes when all internal doc links resolve', () => {
    const workspace = createWorkspace()
    workspaces.push(workspace)

    writeFile(
      workspace,
      'nexdoc.config.ts',
      "export const siteConfig = { nav: [{ href: '/docs/getting-started/introduction' }] }\n"
    )

    writeFile(
      workspace,
      'content/docs/en/getting-started/introduction.mdx',
      `---
title: Introduction
description: Intro page
category: Setup
order: 1
---

# Introduction

See [Installation](/en/docs/getting-started/installation)
`
    )

    writeFile(
      workspace,
      'content/docs/en/getting-started/installation.mdx',
      `---
title: Installation
description: Install page
category: Setup
order: 2
---

# Installation
`
    )

    const result = runChecker(workspace)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status).toBe(0)
    expect(output).toContain('[check-doc-links] All doc links are valid.')
  })

  it('fails when a bare relative doc link target does not exist', () => {
    const workspace = createWorkspace()
    workspaces.push(workspace)

    writeFile(
      workspace,
      'nexdoc.config.ts',
      "export const siteConfig = { nav: [{ href: '/docs/getting-started/introduction' }] }\n"
    )

    writeFile(
      workspace,
      'content/docs/en/getting-started/introduction.mdx',
      `---
title: Introduction
description: Intro page
category: Setup
order: 1
---

# Introduction

See [Missing Page](missing-page)
`
    )

    const result = runChecker(workspace)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status).toBe(1)
    expect(output).toContain('relative target doc not found')
  })

  it('fails when JSX href expression points to a missing doc', () => {
    const workspace = createWorkspace()
    workspaces.push(workspace)

    writeFile(
      workspace,
      'nexdoc.config.ts',
      "export const siteConfig = { nav: [{ href: '/docs/getting-started/introduction' }] }\n"
    )

    writeFile(
      workspace,
      'content/docs/en/getting-started/introduction.mdx',
      `---
title: Introduction
description: Intro page
category: Setup
order: 1
---

# Introduction

<a href={'/en/docs/getting-started/missing-page'}>Missing</a>
`
    )

    const result = runChecker(workspace)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status).toBe(1)
    expect(output).toContain('target doc not found')
  })

  it('passes when index.mdx uses relative links to docs in the same directory', () => {
    const workspace = createWorkspace()
    workspaces.push(workspace)

    writeFile(
      workspace,
      'nexdoc.config.ts',
      "export const siteConfig = { nav: [{ href: '/docs/guide' }] }\n"
    )

    writeFile(
      workspace,
      'content/docs/en/guide/index.mdx',
      `---
title: Guide
description: Guide index
category: Guide
order: 1
---

# Guide

- [Overview](overview)
`
    )

    writeFile(
      workspace,
      'content/docs/en/guide/overview.mdx',
      `---
title: Overview
description: Guide overview
category: Guide
order: 2
---

# Overview
`
    )

    const result = runChecker(workspace)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status).toBe(0)
    expect(output).toContain('[check-doc-links] All doc links are valid.')
  })
})
