import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client.js';
import SinglePost from '../components/SinglePost.jsx';
import CommentThread from '../components/CommentThread.jsx';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        if (!cancelled) setPost(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {loading && <p className="text-sm text-gray-500">Loading post…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      )}
      {post && (
        <>
          <SinglePost
            post={post}
            disableNav
            onChange={(updated) => setPost(updated)}
            onDeleted={() => navigate('/')}
          />
          <CommentThread
            postId={post.id}
            onCountChange={(n) =>
              setPost((p) => (p ? { ...p, totalComments: n } : p))
            }
          />
        </>
      )}
    </div>
  );
}
