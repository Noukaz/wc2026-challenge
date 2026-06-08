// ============================================================
// SCORING ENGINE
// ============================================================

// INTERNATIONAL FANTASY: exact=4, correct winner=2, correct draw=4, else 0
export function scoreMatchPrediction(predH, predA, realH, realA) {
  if (realH === null || realA === null) return null;
  const exact = predH === realH && predA === realA;
  if (exact) return 4;
  const predDraw = predH === predA;
  const realDraw = realH === realA;
  if (predDraw && realDraw) return 4;
  if (predDraw !== realDraw) return 0;
  const predHomeWin = predH > predA;
  const realHomeWin = realH > realA;
  if (predHomeWin === realHomeWin) return 2;
  return 0;
}

// CHAMPIONS FANTASY
const ROUND_POINTS = { R32: 3, R16: 5, QF: 10, SF: 15, FINAL: 30 };

export function scoreChampions(payload, actual) {
  const breakdown = { groupRanks: 0, best3: 0, R32: 0, R16: 0, QF: 0, SF: 0, FINAL: 0 };
  if (!payload || !actual) return { points: 0, breakdown };

  if (payload.groups && actual.groups) {
    for (const g of Object.keys(actual.groups)) {
      const pred = payload.groups[g] || [];
      const real = actual.groups[g] || [];
      if (pred[0] && pred[0] === real[0]) breakdown.groupRanks += 3;
      if (pred[1] && pred[1] === real[1]) breakdown.groupRanks += 2;
      if (pred[2] && pred[2] === real[2]) breakdown.groupRanks += 1;
    }
  }
  if (Array.isArray(payload.best3) && Array.isArray(actual.best3)) {
    const realSet = new Set(actual.best3);
    payload.best3.forEach((c) => { if (realSet.has(c)) breakdown.best3 += 3; });
  }
  if (payload.bracket && actual.roundWinners) {
    ['R32', 'R16', 'QF', 'SF'].forEach((round) => {
      const real = actual.roundWinners[round] || {};
      Object.keys(real).forEach((mid) => {
        if (payload.bracket[mid] && payload.bracket[mid] === real[mid]) {
          breakdown[round] += ROUND_POINTS[round];
        }
      });
    });
    if (actual.roundWinners.FINAL && payload.bracket['final'] === actual.roundWinners.FINAL) {
      breakdown.FINAL += ROUND_POINTS.FINAL;
    }
  }
  const pts = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { points: pts, breakdown };
}
