import { describe, expect, it } from "vitest";
import { sanitizePostContent } from "./sanitize";

const parseFirstLink = (html: string) => {
  const sanitized = sanitizePostContent(html);
  const doc = new window.DOMParser().parseFromString(sanitized, "text/html");
  return doc.querySelector("a");
};

describe("sanitizePostContent external link handling", () => {
  it("adds target/rel for absolute http/https links", () => {
    const link = parseFirstLink(`<a href="https://Example.com/path">link</a>`);

    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("adds target/rel for protocol-relative links", () => {
    const link = parseFirstLink(`<a href="//example.com">link</a>`);

    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps internal, anchor, and relative paths without target/rel", () => {
    const hrefs = ["/about", "posts/item", "#section"];

    hrefs.forEach((href) => {
      const link = parseFirstLink(`<a href="${href}">link</a>`);

      expect(link?.getAttribute("target")).toBeNull();
      expect(link?.getAttribute("rel")).toBeNull();
    });
  });
});







