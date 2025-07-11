import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Reson',
  tagline: 'A high-performance code duplication detector based on Abstract Syntax Tree (AST)',
  favicon: 'img/icon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  // future: {
  //   v4: true, // Improve compatibility with the upcoming Docusaurus v4
  // },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Nexepic', // Usually your GitHub org/user name.
  projectName: 'Reson', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          routeBasePath: 'articles',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [[require.resolve("docusaurus-lunr-search"), {
    enableHighlight: true
  }]],

  themeConfig: {
    metadata: [
      {
        name: 'description',
        content: 'Reson is a high-performance code duplication detector based on Abstract Syntax Tree (AST) analysis. Detect duplicate code across multiple programming languages with precision and accuracy.'
      },
      {
        name: 'keywords',
        content: 'code duplication detection, AST analysis, abstract syntax tree, static code analysis, code quality tools, duplicate code finder, code similarity detection, programming language analysis, source code analysis, reson tool, code clone detection, software engineering tools, cross-language detection, syntax tree parsing'
      },
      {
        name: 'author',
        content: 'Nexepic'
      },
      {
        name: 'robots',
        content: 'index, follow'
      },
      {
        property: 'og:type',
        content: 'website'
      },
      {
        property: 'og:title',
        content: 'Reson - High-Performance Code Duplication Detector'
      },
      {
        property: 'og:description',
        content: 'Advanced AST-based code duplication detection tool for multiple programming languages. Improve code quality with precise duplicate code analysis.'
      },
      {
        property: 'og:site_name',
        content: 'Reson'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: 'Reson - AST-based Code Duplication Detector'
      },
      {
        name: 'twitter:description',
        content: 'Detect duplicate code across programming languages with AST-based analysis. High-performance code quality tool for developers.'
      }
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Reson',
      logo: {
        alt: 'Reson Logo',
        src: 'img/icon.svg',
        srcDark: 'img/icon-light.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/articles', label: 'Articles', position: 'left'},
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/nexepic/reson',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      // style: 'dark',
      // links: [
      //   {
      //     title: 'Docs',
      //     items: [
      //       {
      //         label: 'Tutorial',
      //         to: '/docs/intro',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Community',
      //     items: [
      //       {
      //         label: 'Stack Overflow',
      //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
      //       },
      //       {
      //         label: 'Discord',
      //         href: 'https://discordapp.com/invite/docusaurus',
      //       },
      //       {
      //         label: 'X',
      //         href: 'https://x.com/docusaurus',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'More',
      //     items: [
      //       {
      //         label: 'Blog',
      //         to: '/blog',
      //       },
      //       {
      //         label: 'GitHub',
      //         href: 'https://github.com/facebook/docusaurus',
      //       },
      //     ],
      //   },
      // ],
      // logo: {
      //   alt: 'Meta Open Source Logo',
      //   src: 'img/docusaurus.png',
      //   href: 'https://opensource.fb.com',
      //   width: 160,
      //   height: 51,
      // },
      copyright: `Copyright © ${new Date().getFullYear()} Nexepic`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
