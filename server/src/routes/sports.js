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

// One-time runtime check: native fetch ships in Node 18+. Log loudly if missing.
if (typeof fetch !== 'function') {
  console.error(
    '[sports] global fetch is NOT available. Node version:',
    process.version,
    '— install node-fetch or upgrade Node to 18+.'
  );
}

async function fetchJson(url) {
  console.error('[sports] FETCH →', url);
  const res = await fetch(url);
  const rawBody = await res.text();
  console.error(
    '[sports] FETCH ←',
    url,
    'status=',
    res.status,
    res.statusText,
    'content-type=',
    res.headers.get('content-type'),
    'body-length=',
    rawBody.length
  );
  console.error('[sports] RAW BODY (first 1000 chars):', rawBody.slice(0, 1000));

  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status}: ${rawBody.slice(0, 200)}`);
  }

  try {
    return JSON.parse(rawBody);
  } catch (parseErr) {
    console.error('[sports] JSON parse failed:', parseErr);
    throw new Error(`Upstream returned non-JSON: ${rawBody.slice(0, 200)}`);
  }
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

    let standingsData = null;
    try {
      standingsData = await fetchJson(standingsUrl);
    } catch (err) {
      console.error(
        '[sports] standings fetch failed for league=',
        key,
        'url=',
        standingsUrl,
        'error=',
        err
      );
      // Don't bail — fall through to results fallback below.
    }

    const standings = standingsData?.table || [];
    console.error(
      '[sports] standings parsed: league=',
      key,
      'rowCount=',
      standings.length
    );

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

    let pastData = null;
    try {
      pastData = await fetchJson(pastUrl);
    } catch (err) {
      console.error(
        '[sports] past-events fetch failed for league=',
        key,
        'url=',
        pastUrl,
        'error=',
        err
      );
      throw err;
    }

    const events = pastData?.events || [];
    console.error(
      '[sports] past events parsed: league=',
      key,
      'eventCount=',
      events.length
    );

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
    console.error(
      '[sports] handler failed: league=',
      key,
      'message=',
      err?.message,
      'stack=',
      err?.stack
    );
    res.status(502).json({ error: 'Failed to fetch sports data' });
  }
});

module.exports = router;
