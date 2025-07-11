import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const { colorMode } = useColorMode();
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const updateFooterHeight = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        setFooterHeight(footer.offsetHeight);
      }
    };

    // Initial calculation
    updateFooterHeight();

    // Recalculate on window resize
    window.addEventListener('resize', updateFooterHeight);
    
    // Use MutationObserver to detect footer changes
    const observer = new MutationObserver(updateFooterHeight);
    const targetNode = document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateFooterHeight);
      observer.disconnect();
    };
  }, []);

  // Theme-based configurations
  const themeConfig = {
    light: {
      icon: 'img/icon.svg',
      gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #42a5f5 75%, #1976d2 100%)',
      overlay: 'rgba(255, 255, 255, 0.1)'
    },
    dark: {
      icon: 'img/icon-light.svg',
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #533483 100%)',
      overlay: 'rgba(0, 0, 0, 0.2)'
    }
  };

  const currentTheme = themeConfig[colorMode] || themeConfig.light;

  return (
    <header className={clsx('hero', styles.heroBanner)} style={{ 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: `calc(100vh - var(--ifm-navbar-height) - ${footerHeight}px)`,
      width: '100%',
      background: currentTheme.gradient,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Theme-aware overlay for better text contrast */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: currentTheme.overlay,
        zIndex: 1
      }} />
      
      <div className="container text--center" style={{ position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <img
          src={currentTheme.icon}
          alt={`${siteConfig.title} logo`}
          style={{ width: 120, marginBottom: '1rem' }}
        />

        {/* Title + Version */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: '1rem' }}>
          <Heading as="h1" style={{ margin: 0, textAlign: 'center' }}>
            {siteConfig.title}
          </Heading>
          {/* <small style={{ 
            fontSize: '0.8em', 
            fontWeight: 'normal',
            marginLeft: '0.3em',
            verticalAlign: 'sub',
            opacity: 0.7
          }}>
            v1.3.3
          </small> */}
        </div>

        {/* Tagline from siteConfig */}
        <p style={{ 
          fontSize: '1.4rem',
          fontWeight: '650',
          color: 'var(--ifm-color-primary)',
          marginTop: '1rem',
          marginBottom: '2rem',
          lineHeight: 1.4,
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {siteConfig.tagline}
        </p>

        {/* Feature List */}
        <ul
          style={{
            textAlign: 'left',
            maxWidth: 650,
            margin: '2rem auto',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          <li>
            <strong>AST-based Analysis</strong>: Ensures precise duplication detection by analyzing the code structure rather than plain text.
          </li>
          <li>
            <strong>Blazing Fast Speed</strong>: Detects code duplication with exceptional performance.
          </li>
          <li>
            <strong>Flexible Output Options</strong>: Generate detailed reports in JSON and other formats.
          </li>
          <li>
            <strong>Open Source</strong>: MIT License.
          </li>
        </ul>

        {/* Buttons */}
        <div style={{ marginTop: '2rem' }}>
          <a
            className="button button--primary button--lg"
            href="https://github.com/nexepic/reson.git"
            style={{ marginRight: '1rem' }}
          >
            Community
          </a>
          <a className="button button--secondary button--lg" href="docs/introduction">
            Getting Started
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Reson"
      description="A high-performance code duplication detector based on Abstract Syntax Tree (AST)"
      // noFooter
    >
      <HomepageHeader />
    </Layout>
  );
}