import { describe, expect, it } from "vitest";
import { pageUrl, yearUrl } from "./url";

describe("pageUrl", () => {
  it("returns root for empty slug", () => {
    expect(pageUrl("")).toBe("/");
  });

  it("returns root for explicit '/'", () => {
    expect(pageUrl("/")).toBe("/");
  });

  it("appends .html to a plain slug", () => {
    expect(pageUrl("about")).toBe("/about.html");
  });

  it("trims leading slashes", () => {
    expect(pageUrl("/about")).toBe("/about.html");
    expect(pageUrl("///about")).toBe("/about.html");
  });

  it("trims trailing slashes", () => {
    expect(pageUrl("about/")).toBe("/about.html");
    expect(pageUrl("about///")).toBe("/about.html");
  });

  it("trims both ends", () => {
    expect(pageUrl("/about/")).toBe("/about.html");
  });

  it("preserves nested paths", () => {
    expect(pageUrl("subject/biology")).toBe("/subject/biology.html");
  });
});

describe("yearUrl", () => {
  it("formats a year as /<year>.html", () => {
    expect(yearUrl(2003)).toBe("/2003.html");
    expect(yearUrl(1991)).toBe("/1991.html");
  });

  it("handles edge years inside the supported range", () => {
    expect(yearUrl(2026)).toBe("/2026.html");
  });
});
