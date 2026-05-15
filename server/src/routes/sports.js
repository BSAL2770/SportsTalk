const express = require('express');

const router = express.Router();

// TheSportsDB uses test key "3" for free public access.
// League IDs reference: https://www.thesportsdb.com/api.php
const LEAGUES = {
  nba: { id: '4387', name: 'NBA' },
  nfl: { id: '4391', name: 'NFL' },
  mlb: { id: '4424', name: 'MLB' },
  nhl: { id: '4380', name: 'NHL' },
  mls: { id: '4346', name: 'MLS' },
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  return res.json();
}

router.get('/:league', async (req, res) => {
  const key = (req.params.league || '').toLowerCase();
  const league = LEAGUES[key];
  if (!league) {
    return res.status(400).json({
      error: 'Unsupported league',
      supported: Object.keys(LEAGUES),
    });
  }

  try {
    // Try current-season standings first.
    const seasonYear = new Date().getFullYear();
    // TheSportsDB seasons format varies; try the obvious "YYYY-YYYY" pattern
    // and fall back to recent past events if standings are empty.
    const seasonStr = `${seasonYear - 1}-${seasonYear}`;

    const standingsUrl = `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${league.id}&s=${seasonStr}`;
    const standingsData = await fetchJson(standingsUrl);
    const standings = standingsData?.table || [];

    if (standings.length > 0) {
      return res.json({
        league: league.name,
        type: 'standings',
        season: seasonStr,
        rows: standings.map((r) => ({
          rank: Number(r.intRank) || null,
          team: r.strTeam,
          played: Number(r.intPlayed) || 0,
          wins: Number(r.intWin) || 0,
          draws: Number(r.intDraw) || 0,
          losses: Number(r.intLoss) || 0,
          points: Number(r.intPoints) || 0,
          badge: r.strBadge || null,
        })),
      });
    }

    // Fallback: recent results
    const pastUrl = `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${league.id}`;
    const pastData = await fetchJson(pastUrl);
    const events = pastData?.events || [];

    return res.json({
      league: league.name,
      type: 'results',
      rows: events.slice(0, 20).map((e) => ({
        id: e.idEvent,
        date: e.dateEvent,
        homeTeam: e.strHomeTeam,
        awayTeam: e.strAwayTeam,
        homeScore: e.intHomeScore,
        awayScore: e.intAwayScore,
      })),
    });
  } catch (err) {
    console.error('Sports proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch sports data' });
  }
});

module.exports = router;
