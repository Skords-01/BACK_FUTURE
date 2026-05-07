import { describe, expect, it } from "vitest";
import { pageUrl, yearUrl } from "./url";

describe("pageUrl", () => {
  it("returns root for empty slug", () => {
    expect(pageUrl("")).toBe("/");
  });

  it("returns root for explicit '/'", () => {
    expect(pageUrl("/")).toBe("/");
  });

  it("emits a trailing-slash URL for a plain slug", () => {
    expect(pageUrl("about")).toBe("/about/");
  });

  it("trims leading slashes", () => {
    expect(pageUrl("/about")).toBe("/about/");
    expect(pageUrl("///about")).toBe("/about/");
  });

  it("collapses trailing slashes to a single one", () => {
    expect(pageUrl("about/")).toBe("/about/");
    expect(pageUrl("about///")).toBe("/about/");
  });

  it("trims both ends", () => {
    expect(pageUrl("/about/")).toBe("/about/");
  });

  it("preserves nested paths", () => {
    expect(pageUrl("subject/biology")).toBe("/subject/biology/");
  });
});

describe("yearUrl", () => {
  it("formats a year as /<year>/", () => {
    expect(yearUrl(2003)).toBe("/2003/");
    expect(yearUrl(1991)).toBe("/1991/");
  });

  it("handles edge years inside the supported range", () => {
    expect(yearUrl(2026)).toBe("/2026/");
  });
});
