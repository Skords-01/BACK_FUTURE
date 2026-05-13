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
 *
 * Використовує сучасний query-based API PostHog (InsightVizNode →
 * TrendsQuery/FunnelsQuery). Legacy `filters` shape більше не підтримується
 * для нових юзерів — лише query.
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
  short_id?: string;
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
  query: Record<string, unknown>;
}

async function upsertInsight(spec: InsightSpec, dashboardId: number): Promise<Insight> {
  const existing = await findByName<Insight>("insights", spec.name);
  if (existing) {
    const updated = await ph<Insight>(`/insights/${existing.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        name: spec.name,
        description: spec.description,
        query: spec.query,
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
      query: spec.query,
      tags: [TAG],
      dashboards: [dashboardId],
      saved: true,
    }),
  });
  console.log(`[insight] created #${created.id} "${created.name}"`);
  return created;
}

// ── Query helpers (PostHog InsightVizNode schema) ──────────────────────────

interface EventsNode {
  kind: "EventsNode";
  event: string;
  name?: string;
  math?: "total";
  properties?: Array<Record<string, unknown>>;
}

function ev(event: string, properties?: Array<Record<string, unknown>>): EventsNode {
  const node: EventsNode = { kind: "EventsNode", event, name: event };
  if (properties && properties.length > 0) node.properties = properties;
  return node;
}

function pageview(pathname?: string): EventsNode {
  const props: Array<Record<string, unknown>> = [];
  if (pathname) {
    const isRegex = pathname.startsWith("^") || pathname.includes("\\");
    props.push({
      key: "$pathname",
      value: pathname,
      operator: isRegex ? "regex" : "exact",
      type: "event",
    });
  }
  return ev("$pageview", props);
}

function trendsQuery(opts: {
  series: EventsNode[];
  display?: string;
  interval?: "day" | "week" | "month";
  breakdown?: { property: string; type?: "event" };
  dateFrom?: string;
}): Record<string, unknown> {
  const source: Record<string, unknown> = {
    kind: "TrendsQuery",
    series: opts.series.map((s) => ({ ...s, math: s.math ?? "total" })),
    interval: opts.interval ?? "day",
    dateRange: { date_from: opts.dateFrom ?? "-30d" },
    trendsFilter: { display: opts.display ?? "ActionsLineGraph" },
  };
  if (opts.breakdown) {
    source.breakdownFilter = {
      breakdown: opts.breakdown.property,
      breakdown_type: opts.breakdown.type ?? "event",
    };
  }
  return { kind: "InsightVizNode", source };
}

function funnelsQuery(opts: {
  series: EventsNode[];
  windowInterval?: number;
  windowUnit?: "minute" | "hour" | "day" | "week" | "month";
  dateFrom?: string;
}): Record<string, unknown> {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "FunnelsQuery",
      series: opts.series,
      dateRange: { date_from: opts.dateFrom ?? "-30d" },
      funnelsFilter: {
        funnelVizType: "steps",
        funnelWindowInterval: opts.windowInterval ?? 1,
        funnelWindowIntervalUnit: opts.windowUnit ?? "day",
      },
    },
  };
}

// ── Specs ──────────────────────────────────────────────────────────────────

const INSIGHTS: InsightSpec[] = [
  // 1. Conversion funnel: home pageview → year submit → year-page pageview
  {
    name: "Funnel · Visitor → Year submitted → Year page",
    description: "Чи доходять відвідувачі до сабміту року й завантаження /<year>/.",
    query: funnelsQuery({
      series: [pageview("/"), ev("year_submitted"), pageview("^/\\d{4}/$")],
    }),
  },

  // 2. Engagement funnel: year submit → fact card click → share
  {
    name: "Funnel · Year → Fact click → Share",
    description: "Чи перетворюються рік-сесії на engagement (клік факту → шер).",
    query: funnelsQuery({
      series: [ev("year_submitted"), ev("fact_card_clicked"), ev("share_clicked")],
      windowInterval: 7,
    }),
  },

  // 3. Quiz funnel
  {
    name: "Funnel · Quiz started → answered → finished",
    description: "Скільки юзерів проходять квіз до кінця.",
    query: funnelsQuery({
      series: [ev("quiz_started"), ev("quiz_question_answered"), ev("quiz_finished")],
    }),
  },

  // 4. Support funnel
  {
    name: "Funnel · Year page → Support clicked",
    description: "Конверсія в support (Monobank / BMC) з рік-сторінок.",
    query: funnelsQuery({
      series: [pageview("^/\\d{4}/$"), ev("support_clicked")],
      windowInterval: 7,
    }),
  },

  // 5. Top years submitted (bar by `year` property)
  {
    name: "Trend · Top years submitted",
    description: "Розподіл років, які юзери вводять на головній.",
    query: trendsQuery({
      series: [ev("year_submitted")],
      display: "ActionsBarValue",
      breakdown: { property: "year" },
    }),
  },

  // 6. Top subjects clicked
  {
    name: "Trend · Top subjects clicked",
    description: "Які предмети юзери відкривають частіше.",
    query: trendsQuery({
      series: [ev("fact_card_clicked")],
      display: "ActionsBarValue",
      breakdown: { property: "subject" },
    }),
  },

  // 7. Quiz score distribution
  {
    name: "Trend · Quiz final score distribution",
    description: "Гістограма фінального скору квізу.",
    query: trendsQuery({
      series: [ev("quiz_finished")],
      display: "ActionsBarValue",
      breakdown: { property: "score" },
    }),
  },

  // 8. Top outbound hosts
  {
    name: "Trend · Top outbound hosts",
    description: "Куди юзери йдуть з сайту (першоджерела + соцмережі).",
    query: trendsQuery({
      series: [ev("outbound_link_clicked"), ev("fact_source_clicked")],
      display: "ActionsTable",
      breakdown: { property: "host" },
    }),
  },

  // 9. Share targets breakdown
  {
    name: "Trend · Share targets",
    description: "Який канал шерингу найпопулярніший.",
    query: trendsQuery({
      series: [ev("share_clicked")],
      display: "ActionsPie",
      breakdown: { property: "target" },
    }),
  },

  // 10. Daily pageviews
  {
    name: "Trend · Daily pageviews",
    description: "Базова метрика трафіку — pageviews per day.",
    query: trendsQuery({
      series: [ev("$pageview")],
      display: "ActionsLineGraph",
      interval: "day",
    }),
  },

  // 11. Year validation failure breakdown (debug)
  {
    name: "Trend · Year validation failures",
    description: "Чи багато юзерів вводять некоректний рік (UX issue?).",
    query: trendsQuery({
      series: [ev("year_validation_failed")],
      display: "ActionsBarValue",
      breakdown: { property: "reason" },
    }),
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
