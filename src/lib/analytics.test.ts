import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTS, register, registerOnce, track } from "./analytics";

interface CaptureCall {
  event: string;
  props?: Record<string, unknown>;
}

function setupStub(): {
  capture: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  register_once: ReturnType<typeof vi.fn>;
  calls: CaptureCall[];
} {
  const calls: CaptureCall[] = [];
  const capture = vi.fn((event: string, props?: Record<string, unknown>) => {
    calls.push({ event, props });
  });
  const reg = vi.fn();
  const regOnce = vi.fn();
  if (typeof globalThis.window === "undefined") {
    (globalThis as unknown as { window: Record<string, unknown> }).window = {};
  }
  globalThis.window.posthog = { capture, register: reg, register_once: regOnce };
  return { capture, register: reg, register_once: regOnce, calls };
}

describe("analytics", () => {
  afterEach(() => {
    if (typeof globalThis.window !== "undefined") {
      delete (globalThis.window as { posthog?: unknown }).posthog;
    }
  });

  describe("when posthog is not loaded", () => {
    beforeEach(() => {
      if (typeof globalThis.window !== "undefined") {
        delete (globalThis.window as { posthog?: unknown }).posthog;
      }
    });

    it("track() is a no-op and never throws", () => {
      expect(() => track(EVENTS.yearSubmitted, { year: 2012 })).not.toThrow();
    });

    it("register() is a no-op and never throws", () => {
      expect(() => register({ year_filter: 2012 })).not.toThrow();
    });

    it("registerOnce() is a no-op and never throws", () => {
      expect(() => registerOnce({ first_seen: 1 })).not.toThrow();
    });
  });

  describe("when posthog is loaded", () => {
    it("forwards events to posthog.capture with props", () => {
      const stub = setupStub();
      track(EVENTS.yearSubmitted, { year: 2012, source: "manual" });
      expect(stub.capture).toHaveBeenCalledWith("year_submitted", {
        year: 2012,
        source: "manual",
      });
    });

    it("forwards super-properties via register()", () => {
      const stub = setupStub();
      register({ year_filter: 2012 });
      expect(stub.register).toHaveBeenCalledWith({ year_filter: 2012 });
    });

    it("registerOnce delegates to posthog.register_once", () => {
      const stub = setupStub();
      registerOnce({ first_seen_year: 2012 });
      expect(stub.register_once).toHaveBeenCalledWith({ first_seen_year: 2012 });
    });

    it("swallows exceptions from posthog so analytics never breaks UI", () => {
      globalThis.window.posthog = {
        capture: () => {
          throw new Error("network down");
        },
        register: () => {},
      };
      expect(() => track(EVENTS.yearSubmitted, { year: 2012 })).not.toThrow();
    });
  });

  describe("EVENTS constants", () => {
    it("exposes stable event names (regression guard)", () => {
      expect(EVENTS.yearSubmitted).toBe("year_submitted");
      expect(EVENTS.quizFinished).toBe("quiz_finished");
      expect(EVENTS.shareClicked).toBe("share_clicked");
      expect(EVENTS.supportClicked).toBe("support_clicked");
      expect(EVENTS.outboundLinkClicked).toBe("outbound_link_clicked");
    });
  });
});
