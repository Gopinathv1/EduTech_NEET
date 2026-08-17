import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * "Platform Rank": a student's standing by best FULL_TEST score among all
 * students. The leaderboard is expensive to compute, so it is cached for a few
 * minutes (unstable_cache) and the per-student rank is derived from that cached
 * array — the ranking maths itself is pure and unit-tested.
 */

export type LeaderboardEntry = { studentId: string; score: number };
export type PlatformRank = { rank: number | null; total: number; bestScore: number | null };

/** Standard competition ranking: 1 + the number of students strictly ahead. */
export function computeRank(board: LeaderboardEntry[], studentId: string): PlatformRank {
  const total = board.length;
  const me = board.find((e) => e.studentId === studentId);
  if (!me) return { rank: null, total, bestScore: null };
  const ahead = board.filter((e) => e.score > me.score).length;
  return { rank: ahead + 1, total, bestScore: me.score };
}

/** Cached best-FULL_TEST-score leaderboard (revalidates every 5 minutes). */
const getLeaderboard = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => {
    const rows = await prisma.testAttempt.findMany({
      where: { test: { testType: 'FULL_TEST' }, status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] }, result: { isNot: null } },
      select: { studentId: true, result: { select: { score: true } } },
    });
    const best = new Map<string, number>();
    for (const r of rows) {
      const score = r.result?.score;
      if (score === undefined || score === null) continue;
      const cur = best.get(r.studentId);
      if (cur === undefined || score > cur) best.set(r.studentId, score);
    }
    return [...best.entries()]
      .map(([studentId, score]) => ({ studentId, score }))
      .sort((a, b) => b.score - a.score);
  },
  ['full-test-leaderboard'],
  { revalidate: 300, tags: ['leaderboard'] },
);

export async function getPlatformRank(studentId: string): Promise<PlatformRank> {
  const board = await getLeaderboard();
  return computeRank(board, studentId);
}
