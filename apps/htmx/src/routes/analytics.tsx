import type { FastifyInstance } from 'fastify';
import { authedGql } from '../lib/auth.js';
import { Layout } from '../views/layout.js';
import { STATUS_COLORS, ALL_STATUSES } from '../views/statusBadge.js';
import { isoWeek } from '../lib/format.js';

const QUERY = `query {
  applications {
    id status createdAt starred
  }
}`;

type App = { id: string; status: string; createdAt: string; starred: boolean };

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div class="flex items-center gap-2">
      <span class="text-xs text-gray-600 w-24 shrink-0 capitalize" safe>
        {label}
      </span>
      <div class="flex-1 bg-gray-100 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all"
          style={`width:${pct}%;background-color:${color}`}
        ></div>
      </div>
      <span class="text-xs text-gray-700 w-8 text-right">{count}</span>
    </div>
  );
}

export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/analytics', async (request, reply) => {
    let apps: App[] = [];
    try {
      const data = await authedGql<{ applications: App[] }>(request, reply, QUERY);
      apps = data.applications;
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }

    const total = apps.length;

    // Status counts
    const byStat = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
    for (const a of apps) byStat[a.status] = (byStat[a.status] ?? 0) + 1;

    // Applications per week (last 12 weeks)
    const weekCounts: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weekCounts[isoWeek(d)] = 0;
    }
    for (const a of apps) {
      const w = isoWeek(new Date(a.createdAt));
      if (w in weekCounts) weekCounts[w] = (weekCounts[w] ?? 0) + 1;
    }
    const weeks = Object.entries(weekCounts);
    const maxWeek = Math.max(...weeks.map(([, v]) => v), 1);

    // Star rate
    const starRate =
      total > 0 ? Math.round((apps.filter((a) => a.starred).length / total) * 100) : 0;

    // Conversion: applied → interviewing → offered
    const applied =
      (byStat['applied'] ?? 0) +
      (byStat['interviewing'] ?? 0) +
      (byStat['offered'] ?? 0) +
      (byStat['accepted'] ?? 0) +
      (byStat['rejected'] ?? 0);
    const interviewing =
      (byStat['interviewing'] ?? 0) + (byStat['offered'] ?? 0) + (byStat['accepted'] ?? 0);
    const offered = (byStat['offered'] ?? 0) + (byStat['accepted'] ?? 0);

    const convRate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

    return reply.type('text/html').send(
      <Layout title="Analytics" activeNav="analytics">
        <div class="p-4 sm:p-8 max-w-4xl mx-auto">
          <h1 class="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>

          {total === 0 ? (
            <p class="text-gray-400 text-center py-16">No applications to analyse yet.</p>
          ) : (
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status breakdown */}
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <h2 class="text-base font-semibold text-gray-900 mb-4">By status</h2>
                <div class="space-y-2">
                  {ALL_STATUSES.map((s) => (
                    <Bar label={s} count={byStat[s] ?? 0} total={total} color={STATUS_COLORS[s] ?? '#9ca3af'} />
                  ))}
                </div>
                <p class="mt-3 text-xs text-gray-400 text-right">{total} total</p>
              </div>

              {/* Weekly activity */}
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <h2 class="text-base font-semibold text-gray-900 mb-4">
                  Applications per week (last 12 weeks)
                </h2>
                <div class="flex items-end gap-1 h-32">
                  {weeks.map(([week, count]) => {
                    const h = maxWeek > 0 ? Math.max(4, Math.round((count / maxWeek) * 112)) : 4;
                    const label = week.split('-W')[1] ? `W${week.split('-W')[1]}` : week;
                    return (
                      <div class="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          class="w-full rounded-t bg-blue-400 hover:bg-blue-500 transition-colors cursor-default"
                          style={`height:${h}px`}
                          title={`${week}: ${count}`}
                        ></div>
                        <span class="text-xs text-gray-400" style="font-size:9px" safe>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion funnel */}
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <h2 class="text-base font-semibold text-gray-900 mb-4">Conversion funnel</h2>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Applied</span>
                    <span class="font-semibold">{applied}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Interviewing</span>
                    <span class="font-semibold">
                      {interviewing}{' '}
                      <span class="text-xs text-gray-400">({convRate(interviewing, applied)}%)</span>
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Offered</span>
                    <span class="font-semibold">
                      {offered} <span class="text-xs text-gray-400">({convRate(offered, applied)}%)</span>
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Accepted</span>
                    <span class="font-semibold">
                      {byStat['accepted'] ?? 0}{' '}
                      <span class="text-xs text-gray-400">
                        ({convRate(byStat['accepted'] ?? 0, applied)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <h2 class="text-base font-semibold text-gray-900 mb-4">Summary</h2>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Total applications</span>
                    <span class="font-semibold">{total}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Starred</span>
                    <span class="font-semibold">
                      {apps.filter((a) => a.starred).length} ({starRate}%)
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Rejected</span>
                    <span class="font-semibold">{byStat['rejected'] ?? 0}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Withdrawn</span>
                    <span class="font-semibold">{byStat['withdrawn'] ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>,
    );
  });
}
