/**
 * Тонка обгортка над `window.posthog` що завантажується інлайн-сніпетом
 * у `src/components/Analytics.astro`. Усе максимально no-op, якщо
 * PostHog не підключений (немає `PUBLIC_POSTHOG_KEY` або провайдер інший).
 *
 * Жодних PII у пропсах. Використовуй `EVENTS.*` константи замість
 * стрінгових літералів — щоб імена не розходились між місцями виклику.
 */
export const EVENTS = {
  // Year picker / hero
  yearSubmitted: "year_submitted",
  yearValidationFailed: "year_validation_failed",
  quickPickClicked: "quick_pick_clicked",
  randomYearPicked: "random_year_picked",
  presetClicked: "preset_clicked",

  // Era / subject navigation
  eraClicked: "era_clicked",
  subjectFilterChanged: "subject_filter_changed",
  subjectChipClicked: "subject_chip_clicked",

  // Fact engagement
  factCardClicked: "fact_card_clicked",
  factSourceClicked: "fact_source_clicked",

  // Sharing
  shareClicked: "share_clicked",
  shareSucceeded: "share_succeeded",

  // Saved facts (bookmarks)
  factSaved: "fact_saved",
  factUnsaved: "fact_unsaved",
  savedPageView: "saved_page_view",
  savedExported: "saved_exported",
  savedImported: "saved_imported",
  savedCleared: "saved_cleared",

  // Support
  supportClicked: "support_clicked",

  // Quiz funnel
  quizStarted: "quiz_started",
  quizQuestionAnswered: "quiz_question_answered",
  quizFinished: "quiz_finished",
  quizRestarted: "quiz_restarted",

  // Search
  searchOpened: "search_opened",
  searchQuery: "search_query",
  searchResultClicked: "search_result_clicked",

  // Misc
  themeToggled: "theme_toggled",
  backToTopClicked: "back_to_top_clicked",
  outboundLinkClicked: "outbound_link_clicked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Allowed prop value types — keeps payloads JSON-safe and PostHog-friendly. */
type PropValue = string | number | boolean | null | undefined;
export type EventProps = Record<string, PropValue>;

interface PostHogClient {
  capture(event: string, props?: EventProps): void;
  register(props: EventProps): void;
  register_once?(props: EventProps): void;
  identify?(id: string, props?: EventProps): void;
  reset?(): void;
  __loaded?: boolean;
}

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

function getClient(): PostHogClient | null {
  if (typeof window === "undefined") return null;
  const ph = window.posthog;
  if (!ph || typeof ph.capture !== "function") return null;
  return ph;
}

/**
 * Capture a custom event. No-op якщо PostHog не завантажений.
 * Безпечно викликати на SSR — там просто нічого не станеться.
 */
export function track(event: EventName, props?: EventProps): void {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture(event, props);
  } catch {
    // Аналітика ніколи не повинна падати UI.
  }
}

/**
 * Set super-properties — додаються до КОЖНОГО подальшого івенту в сесії.
 * Корисно для контекстних значень типу `year_filter` після того як юзер
 * обрав рік на головній.
 */
export function register(props: EventProps): void {
  const ph = getClient();
  if (!ph || typeof ph.register !== "function") return;
  try {
    ph.register(props);
  } catch {
    // ignore
  }
}

/** Same as register, але тільки якщо ключ ще не існує (не перезаписує). */
export function registerOnce(props: EventProps): void {
  const ph = getClient();
  if (!ph || typeof ph.register_once !== "function") return;
  try {
    ph.register_once(props);
  } catch {
    // ignore
  }
}
