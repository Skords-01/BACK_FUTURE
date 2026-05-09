#!/usr/bin/env tsx
/**
 * Ідемпотентний setup для PostHog: створює (або оновлює) дешборд
 * "BACK_FUTURE — Core Metrics" з фунелами та інсайтами як код.
 *
 * Запуск (локально або в CI):
 *
 *   POSTHOG_PERSONAL_API_KEY=phx_xxx \
 *   POSTHOG_PROJECT_ID=12345 \
 *   POSTHOG_HOST=https://eu.posthog.com \
 *   npx tsx scripts/posthog-setup.ts
 *
 * - Personal API key створюй у Settings → User → Personal API keys.
 *   Достатньо scope `insight:write` + `dashboard:write` (або `*`).
 * - Project ID видно у URL дешборда / в Settings → Project Details.
 * - PostHog HOST: для EU cloud — https://eu.posthog.com, для US —
 *   https://us.posthog.com, для self-hosted — твій інстанс.
 *
 * Скрипт ідемпотентний: повторні запуски НЕ створюють дублікати — він шукає
 * існуючі сутності за `name` і оновлює їх. Якщо хочеш скинути все —
 * видали дешборд і tiles вручну в UI.
 */

const HOST = (process.env.POSTHOG_HOST ?? "https://eu.posthog.com").replace(/\/+$/, "");
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

const DASHBOARD_NAME = "BACK_FUTURE — Core Metrics";
const TAG = "back-future-managed";

if (!API_KEY || !PROJECT_ID) {
  console.error(
    "[posthog-setup] Потрібно задати POSTHOG_PERSONAL_API_KEY і POSTHOG_PROJECT_ID. " +
      "Опційно — POSTHOG_HOST (default: https://eu.posthog.com).",
  );
  process.exit(1);
}

interface PostHogListResponse<T> {
  results: T[];
  next: string | null;
}

interface Insight {
  id: number;
  name: string;
  description?: string | null;
  tags?: string[];
}

interface Dashboard {
  id: number;
  name: string;
  description?: string | null;
  tags?: string[];
}

async function ph<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${HOST}/api/projects/${PROJECT_ID}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostHog ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

async function findByName<T extends { name: string }>(
  endpoint: "insights" | "dashboards",
  name: string,
): Promise<T | null> {
  // PostHog supports `?search=` on both endpoints.
  const data = await ph<PostHogListResponse<T>>(
    `/${endpoint}/?search=${encodeURIComponent(name)}&limit=50`,
  );
  return data.results.find((r) => r.name === name) ?? null;
}

async function ensureDashboard(): Promise<Dashboard> {
  const existing = await findByName<Dashboard>("dashboards", DASHBOARD_NAME);
  if (existing) {
    console.log(`[dashboard] reusing #${existing.id} "${existing.name}"`);
    return existing;
  }
  const created = await ph<Dashboard>(`/dashboards/`, {
    method: "POST",
    body: JSON.stringify({
      name: DASHBOARD_NAME,
      description:
        "Конверсія, engagement, quiz funnel, support — як код. " +
        "Автогенерований через scripts/posthog-setup.ts.",
      tags: [TAG],
      pinned: true,
    }),
  });
  console.log(`[dashboard] created #${created.id}`);
  return created;
}

interface InsightSpec {
  name: string;
  description: string;
  filters: Record<string, unknown>;
}

async function upsertInsight(spec: InsightSpec, dashboardId: number): Promise<Insight> {
  const existing = await findByName<Insight>("insights", spec.name);
  if (existing) {
    const updated = await ph<Insight>(`/insights/${existing.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        name: spec.name,
        description: spec.description,
        filters: spec.filters,
        tags: [TAG],
        dashboards: [dashboardId],
      }),
    });
    console.log(`[insight] updated #${updated.id} "${updated.name}"`);
    return updated;
  }
  const created = await ph<Insight>(`/insights/`, {
    method: "POST",
    body: JSON.stringify({
      name: spec.name,
      description: spec.description,
      filters: spec.filters,
      tags: [TAG],
      dashboards: [dashboardId],
      saved: true,
    }),
  });
  console.log(`[insight] created #${created.id} "${created.name}"`);
  return created;
}

// ── Specs ──────────────────────────────────────────────────────────────────

const SUPPORTED_FUNNEL_INTERVAL_UNIT = "day";

function pageviewStep(order: number, pathname?: string): Record<string, unknown> {
  const props: Array<Record<string, unknown>> = [];
  if (pathname) {
    props.push({
      key: "$pathname",
      value: pathname,
      operator: pathname.includes("\\") || pathname.startsWith("^") ? "regex" : "exact",
      type: "event",
    });
  }
  return {
    id: "$pageview",
    name: "$pageview",
    type: "events",
    order,
    properties: props,
  };
}

function eventStep(name: string, order: number): Record<string, unknown> {
  return { id: name, name, type: "events", order };
}

const INSIGHTS: InsightSpec[] = [
  // 1. Conversion funnel: home pageview → year submit → year-page pageview
  {
    name: "Funnel · Visitor → Year submitted → Year page",
    description: "Чи доходять відвідувачі до сабміту року й завантаження /<year>/.",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      funnel_window_interval: 1,
      funnel_window_interval_unit: SUPPORTED_FUNNEL_INTERVAL_UNIT,
      events: [pageviewStep(0, "/"), eventStep("year_submitted", 1), pageviewStep(2, "^/\\d{4}/$")],
      date_from: "-30d",
    },
  },

  // 2. Engagement funnel: year submit → fact card click → share
  {
    name: "Funnel · Year → Fact click → Share",
    description: "Чи перетворюються рік-сесії на engagement (клік факту → шер).",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      funnel_window_interval: 7,
      funnel_window_interval_unit: SUPPORTED_FUNNEL_INTERVAL_UNIT,
      events: [
        eventStep("year_submitted", 0),
        eventStep("fact_card_clicked", 1),
        eventStep("share_clicked", 2),
      ],
      date_from: "-30d",
    },
  },

  // 3. Quiz funnel
  {
    name: "Funnel · Quiz started → answered → finished",
    description: "Скільки юзерів проходять квіз до кінця.",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      funnel_window_interval: 1,
      funnel_window_interval_unit: SUPPORTED_FUNNEL_INTERVAL_UNIT,
      events: [
        eventStep("quiz_started", 0),
        eventStep("quiz_question_answered", 1),
        eventStep("quiz_finished", 2),
      ],
      date_from: "-30d",
    },
  },

  // 4. Support funnel
  {
    name: "Funnel · Year page → Support clicked",
    description: "Конверсія в support (Monobank / BMC) з рік-сторінок.",
    filters: {
      insight: "FUNNELS",
      funnel_viz_type: "steps",
      funnel_window_interval: 7,
      funnel_window_interval_unit: SUPPORTED_FUNNEL_INTERVAL_UNIT,
      events: [pageviewStep(0, "^/\\d{4}/$"), eventStep("support_clicked", 1)],
      date_from: "-30d",
    },
  },

  // 5. Top years submitted (bar by `year` property)
  {
    name: "Trend · Top years submitted",
    description: "Розподіл років, які юзери вводять на головній.",
    filters: {
      insight: "TRENDS",
      display: "ActionsBarValue",
      breakdown: "year",
      breakdown_type: "event",
      events: [
        {
          id: "year_submitted",
          name: "year_submitted",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 6. Top subjects clicked
  {
    name: "Trend · Top subjects clicked",
    description: "Які предмети юзери відкривають частіше.",
    filters: {
      insight: "TRENDS",
      display: "ActionsBarValue",
      breakdown: "subject",
      breakdown_type: "event",
      events: [
        {
          id: "fact_card_clicked",
          name: "fact_card_clicked",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 7. Quiz score distribution
  {
    name: "Trend · Quiz final score distribution",
    description: "Гістограма фінального скору квізу.",
    filters: {
      insight: "TRENDS",
      display: "ActionsBarValue",
      breakdown: "score",
      breakdown_type: "event",
      events: [
        {
          id: "quiz_finished",
          name: "quiz_finished",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 8. Top outbound hosts
  {
    name: "Trend · Top outbound hosts",
    description: "Куди юзери йдуть з сайту (першоджерела + соцмережі).",
    filters: {
      insight: "TRENDS",
      display: "ActionsTable",
      breakdown: "host",
      breakdown_type: "event",
      events: [
        {
          id: "outbound_link_clicked",
          name: "outbound_link_clicked",
          type: "events",
          math: "total",
        },
        {
          id: "fact_source_clicked",
          name: "fact_source_clicked",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 9. Share targets breakdown
  {
    name: "Trend · Share targets",
    description: "Який канал шерингу найпопулярніший.",
    filters: {
      insight: "TRENDS",
      display: "ActionsPie",
      breakdown: "target",
      breakdown_type: "event",
      events: [
        {
          id: "share_clicked",
          name: "share_clicked",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 10. Daily active sessions (pageviews)
  {
    name: "Trend · Daily pageviews",
    description: "Базова метрика трафіку — pageviews per day.",
    filters: {
      insight: "TRENDS",
      display: "ActionsLineGraph",
      interval: "day",
      events: [
        {
          id: "$pageview",
          name: "$pageview",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },

  // 11. Year validation failure rate (debug)
  {
    name: "Trend · Year validation failures",
    description: "Чи багато юзерів вводять некоректний рік (UX issue?).",
    filters: {
      insight: "TRENDS",
      display: "ActionsBarValue",
      breakdown: "reason",
      breakdown_type: "event",
      events: [
        {
          id: "year_validation_failed",
          name: "year_validation_failed",
          type: "events",
          math: "total",
        },
      ],
      date_from: "-30d",
    },
  },
];

async function main(): Promise<void> {
  console.log(`[posthog-setup] HOST=${HOST} PROJECT=${PROJECT_ID}`);
  const dashboard = await ensureDashboard();
  for (const spec of INSIGHTS) {
    await upsertInsight(spec, dashboard.id);
  }
  const dashboardUrl = `${HOST}/project/${PROJECT_ID}/dashboard/${dashboard.id}`;
  console.log(`\n✓ Done. Dashboard: ${dashboardUrl}`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[posthog-setup] FAILED: ${msg}`);
  process.exit(1);
});
