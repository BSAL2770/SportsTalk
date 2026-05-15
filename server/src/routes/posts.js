const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  publicIdFromUrl,
} = require('../cloudinary');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

function shapePost(post, currentUserId) {
  return {
    id: post.id,
    caption: post.caption,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    authorId: post.authorId,
    authorUsername: post.author?.username || null,
    totalLikes: post._count?.likes ?? 0,
    totalComments: post._count?.comments ?? 0,
    likedByMe: currentUserId
      ? (post.likes || []).some((l) => l.userId === currentUserId)
      : false,
  };
}

router.get('/', async (req, res) => {
  const currentUserId = req.user?.id;
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { username: true } },
      _count: { select: { likes: true, comments: true } },
      likes: currentUserId
        ? { where: { userId: currentUserId }, select: { userId: true } }
        : false,
    },
  });
  res.json(posts.map((p) => shapePost(p, currentUserId)));
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const currentUserId = req.user?.id;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { username: true } },
      _count: { select: { likes: true, comments: true } },
      likes: currentUserId
        ? { where: { userId: currentUserId }, select: { userId: true } }
        : false,
    },
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(shapePost(post, currentUserId));
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const caption = (req.body?.caption || '').trim();
  if (!caption) return res.status(400).json({ error: 'caption is required' });
  if (!req.file) return res.status(400).json({ error: 'image file is required' });

  let uploadResult;
  try {
    uploadResult = await uploadBufferToCloudinary(req.file.buffer);
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return res.status(502).json({ error: 'Image upload failed' });
  }

  const post = await prisma.post.create({
    data: {
      caption,
      imageUrl: uploadResult.secure_url,
      authorId: req.user.id,
    },
    include: {
      author: { select: { username: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  res.status(201).json(shapePost(post, req.user.id));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Only the author can delete this post' });
  }

  const publicId = publicIdFromUrl(post.imageUrl);
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (err) {
      console.error('Cloudinary delete failed (continuing):', err);
    }
  }

  await prisma.post.delete({ where: { id } });
  res.json({ ok: true });
});

module.exports = router;
