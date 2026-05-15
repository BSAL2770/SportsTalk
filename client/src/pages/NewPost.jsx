import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export default function NewPost() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select an image.');
      return;
    }
    if (!caption.trim()) {
      setError('Caption is required.');
      return;
    }

    const form = new FormData();
    form.append('caption', caption.trim());
    form.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/posts/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-4">New post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm"
              required
            />
            {preview && (
              <img
                src={preview}
                alt=""
                className="mt-3 max-h-80 rounded border"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What's the take?"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-medium py-2 rounded"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
