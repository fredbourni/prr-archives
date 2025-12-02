import type { Show } from '@types';
import { getShowImage } from '@utils/image';

/**
 * Updates or creates a meta tag with the given property and content
 */
const updateMetaTag = (property: string, content: string): void => {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

/**
 * Updates Open Graph meta tags and document title for a show
 */
export const updateMetaTags = (show: Show | null): void => {
  if (show) {
    document.title = `${show.name} - Archives PunkRockRadio.ca`;
    updateMetaTag('og:title', show.name);
    updateMetaTag('og:description', `Écoutez ${show.name} sur les archives de PunkRockRadio.ca`);
    updateMetaTag('og:image', getShowImage(show.picture_key));
    updateMetaTag('og:url', window.location.href);
  } else {
    document.title = 'Archives PunkRockRadio.ca';
    updateMetaTag('og:title', 'Archives PunkRockRadio.ca');
    updateMetaTag('og:description', 'Archives des shows de PunkRockRadio.ca');
    updateMetaTag('og:image', '/vite.svg');
    updateMetaTag('og:url', window.location.origin);
  }
};
