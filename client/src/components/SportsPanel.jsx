import { useEffect, useState } from 'react';
import api from '../api/client.js';

const TABS = [
  { key: 'nba', label: 'NBA' },
  { key: 'nfl', label: 'NFL' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nhl', label: 'NHL' },
  { key: 'mls', label: 'MLS' },
];

export default function SportsPanel() {
  const [active, setActive] = useState('nba');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/sports/${active}`);
        if (!cancelled) setData(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              active === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && data && data.type === 'standings' && (
          <StandingsTable rows={data.rows} season={data.season} />
        )}
        {!loading && !error && data && data.type === 'results' && (
          <ResultsTable rows={data.rows} />
        )}
        {!loading && !error && data && data.rows.length === 0 && (
          <p className="text-sm text-gray-500">No data available right now.</p>
        )}
      </div>
    </div>
  );
}

function StandingsTable({ rows, season }) {
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-2">Season {season}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Team</th>
            <th className="py-2 pr-2">GP</th>
            <th className="py-2 pr-2">W</th>
            <th className="py-2 pr-2">L</th>
            <th className="py-2 pr-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.team}-${i}`} className="border-b last:border-0">
              <td className="py-2 pr-2 text-gray-500">{r.rank ?? i + 1}</td>
              <td className="py-2 pr-2 flex items-center gap-2">
                {r.badge && (
                  <img src={r.badge} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="font-medium">{r.team}</span>
              </td>
              <td className="py-2 pr-2">{r.played}</td>
              <td className="py-2 pr-2">{r.wins}</td>
              <td className="py-2 pr-2">{r.losses}</td>
              <td className="py-2 pr-2 font-semibold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-2">Recent results</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-2">Date</th>
            <th className="py-2 pr-2">Matchup</th>
            <th className="py-2 pr-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-2 text-gray-500">{r.date}</td>
              <td className="py-2 pr-2">
                {r.awayTeam} @ {r.homeTeam}
              </td>
              <td className="py-2 pr-2 font-medium">
                {r.awayScore ?? '-'} – {r.homeScore ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
