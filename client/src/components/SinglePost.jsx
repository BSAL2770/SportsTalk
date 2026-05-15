import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartIcon as HeartOutline,
  ChatBubbleBottomCenterTextIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
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

export default function SinglePost({ post, onDeleted, onChange, disableNav }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user && user.id === post.authorId;

  const goToPost = () => {
    if (disableNav) return;
    navigate(`/posts/${post.id}`);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      onChange?.({
        ...post,
        likedByMe: data.liked,
        totalLikes: data.totalLikes,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!isAuthor) return;
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      onDeleted?.(post.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      onClick={goToPost}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
        disableNav ? '' : 'cursor-pointer hover:shadow-md transition-shadow'
      }`}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              @{post.authorUsername || 'unknown'}
            </div>
            <div className="text-xs text-gray-500">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete post"
            className="text-gray-400 hover:text-red-500 disabled:opacity-40"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </header>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full max-h-[600px] object-cover bg-gray-100"
        />
      )}

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-red-500 disabled:opacity-50"
          >
            {post.likedByMe ? (
              <HeartSolid className="w-6 h-6 text-red-500" />
            ) : (
              <HeartOutline className="w-6 h-6" />
            )}
            <span>{post.totalLikes}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/posts/${post.id}`);
            }}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-500"
          >
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            <span>{post.totalComments}</span>
          </button>
        </div>

        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {post.caption}
        </p>
      </div>
    </article>
  );
}
