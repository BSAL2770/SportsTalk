const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id/comments', async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Invalid id' });

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } },
  });

  res.json(
    comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      authorId: c.authorId,
      authorUsername: c.author?.username || null,
    }))
  );
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Invalid id' });

  const body = (req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'body is required' });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = await prisma.comment.create({
    data: { body, postId, authorId: req.user.id },
    include: { author: { select: { username: true } } },
  });

  res.status(201).json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    authorId: comment.authorId,
    authorUsername: comment.author?.username || null,
  });
});

module.exports = router;
