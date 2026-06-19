const sanitizeHtml = require('sanitize-html');

/**
 * Sanitizes rich text content to keep Quill-safe tags and prevent XSS.
 */
const sanitizeRichText = (dirty) => {
  if (!dirty) return '';
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'span'
    ],
    allowedAttributes: {
      'a': ['href', 'name', 'target', 'rel'],
      'span': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  });
};

/**
 * Strips all HTML from a string (plain text only).
 */
const stripAllHtml = (dirty) => {
  if (!dirty) return '';
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

module.exports = {
  sanitizeRichText,
  stripAllHtml,
};
