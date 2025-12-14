import sanitizeHtml from "sanitize-html";
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "img",
  "strong", "b", "em", "i", "u", "s", "strike",
  "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
  "div", "span",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "width", "height", "loading"],
  "*": ["class", "id"],
};

const ALLOWED_URL_SCHEMES = ["https", "mailto"];

const ALLOWED_IMAGE_DOMAINS = [
  "blob.vercel-storage.com",
  "localhost",
];

export function sanitizePostContent(html: string): string {
  // Stage 1: sanitize-html
  let clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_URL_SCHEMES,
    allowedSchemesByTag: {
      img: ["https", "http"], // Allow http for localhost development
    },
    transformTags: {
      a: (tagName, attribs) => {
        // Add rel attribute to external links
        if (attribs.href && !attribs.href.startsWith("/")) {
          return {
            tagName,
            attribs: {
              ...attribs,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          };
        }
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        // Check image domain
        if (attribs.src) {
          try {
            const url = new URL(attribs.src);
            const isAllowed = ALLOWED_IMAGE_DOMAINS.some((d) =>
              url.hostname.endsWith(d) || url.hostname === d
            );
            if (!isAllowed) {
              return { tagName: "", attribs: {} }; // Remove disallowed domains
            }
          } catch {
            // Allow relative URLs
            if (!attribs.src.startsWith("/")) {
              return { tagName: "", attribs: {} }; // Remove invalid URLs
            }
          }
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: "lazy",
          },
        };
      },
    },
  });

  // Stage 2: DOMPurify
  clean = DOMPurify.sanitize(clean, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      "href", "src", "alt", "class", "id", "target", "rel",
      "width", "height", "loading", "title",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

  return clean;
}

// Check for XSS payloads (for testing)
export function containsXSSPayload(html: string): boolean {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
  ];

  return patterns.some((pattern) => pattern.test(html));
}

// Generate excerpt from HTML content
export function generateExcerpt(html: string, maxLength: number = 200): string {
  // Remove all HTML tags
  const textOnly = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Trim and truncate
  const trimmed = textOnly.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  // Find last space before maxLength
  const lastSpace = trimmed.lastIndexOf(" ", maxLength);
  const cutoff = lastSpace > 0 ? lastSpace : maxLength;

  return trimmed.slice(0, cutoff) + "...";
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, "") // Trim - from end
    .slice(0, 100); // Max length 100
}
