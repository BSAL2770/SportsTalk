import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import SinglePost from '../components/SinglePost.jsx';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/posts');
        if (!cancelled) setPosts(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  const handleDeleted = (id) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {loading && <p className="text-sm text-gray-500">Loading feed…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      )}
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-600">
          <p>No posts yet.</p>
          <Link
            to="/newPost"
            className="inline-block mt-3 text-blue-600 hover:underline"
          >
            Create the first one →
          </Link>
        </div>
      )}
      {posts.map((p) => (
        <SinglePost
          key={p.id}
          post={p}
          onChange={handleChange}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
