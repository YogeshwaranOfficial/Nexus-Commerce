import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
  keywords?: string;
}

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Nexus Commerce';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://nexus.com';
const DEFAULT_DESCRIPTION = 'Premium shopping experience — discover thousands of products from verified sellers.';
const DEFAULT_IMAGE = `${APP_URL}/og-image.png`;

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  keywords,
}: SEOProps = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} — ${APP_NAME}` : APP_NAME;
    const pageUrl = url ? `${APP_URL}${url}` : APP_URL;

    // Document title
    document.title = pageTitle;

    // Basic meta
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    if (noIndex) setMeta('robots', 'noindex, nofollow');
    else setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:title', pageTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', pageUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', APP_NAME, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    // Cleanup — reset to defaults when component unmounts
    return () => {
      document.title = APP_NAME;
    };
  }, [title, description, image, url, type, noIndex, keywords]);
}
