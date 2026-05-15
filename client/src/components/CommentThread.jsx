import { useEffect, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CommentThread({ postId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/posts/${postId}/comments`);
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { body });
      const next = [data, ...comments];
      setComments(next);
      onCountChange?.(next.length);
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="px-4 py-3 border-b font-semibold text-gray-800">Comments</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="p-4 border-b space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Add a comment…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-sm px-4 py-1.5 rounded"
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="px-4 py-3 text-sm text-gray-500 border-b">
          Sign in to leave a comment.
        </p>
      )}

      {loading && <p className="p-4 text-sm text-gray-500">Loading comments…</p>}
      {error && <p className="p-4 text-sm text-red-600">{error}</p>}

      <ul className="divide-y">
        {!loading && comments.length === 0 && (
          <li className="p-4 text-sm text-gray-500">No comments yet.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-semibold">
                  @{c.authorUsername || 'unknown'}
                </span>
                <span className="text-gray-500 ml-2 text-xs">
                  {timeAgo(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
                {c.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
