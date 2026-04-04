# Reson Docs (NexDoc)

This directory contains the Reson documentation site migrated to **NexDoc**.

## Install

```bash
cd docs
npm install
```

## Local Development

```bash
npm run dev
```

Open:

- `http://localhost:3000/en`
- `http://localhost:3000/zh`

## Build

```bash
npm run build
npm run start
```

## GitHub Pages Build

```bash
cd apps/docs
npm run build:gh-pages
```

Static output will be generated in `apps/docs/out` with `BASE_PATH=/reson`.

## Content Paths

- English: `apps/docs/content/docs/en/reson/*.mdx`
- Chinese: `apps/docs/content/docs/zh/reson/*.mdx`

## Homepage Entry

- `apps/docs/home/custom-home.tsx`

## Upgrade NexDoc Skeleton

Use the official upgrader:

```bash
cd docs
node /Users/yuhong/Documents/oss/nexdoc/packages/create-nexdoc/index.js --upgrade
```

The upgrader writes `.nexdoc/manifest.json` for future safe upgrades.
