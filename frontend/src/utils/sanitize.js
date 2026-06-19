/**
 * Browser-native utility to sanitize HTML content to prevent XSS.
 * Removes dangerous tags (script, iframe, embed, object, meta, link, form, etc.)
 * and strips inline event handlers (onload, onerror, onclick, etc.) and javascript: links.
 * 
 * @param {string} html - Raw HTML input from rich text editor.
 * @returns {string} Cleaned, safe HTML output.
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Remove dangerous tags
    const dangerousTags = ['script', 'iframe', 'embed', 'object', 'meta', 'link', 'style', 'form', 'base', 'applet'];
    dangerousTags.forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // 2. Remove inline event attributes & javascript: URLs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        const attrName = attr.name.toLowerCase();
        // Remove event listeners (onclick, onerror, onload, etc.)
        if (attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // Remove javascript:, data:text/html, or vbscript: links
        if (attrName === 'href' || attrName === 'src') {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('data:text/html') || val.startsWith('vbscript:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.error('HTML Sanitization Error:', error);
    // Simple fallback fallback if DOMParser fails
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
};
