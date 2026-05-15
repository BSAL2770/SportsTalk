const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:id/like', requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) return res.status(400).json({ error: 'Invalid id' });
  const userId = req.user.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  let liked;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { userId, postId } });
    liked = true;
  }

  const totalLikes = await prisma.like.count({ where: { postId } });
  res.json({ liked, totalLikes });
});

module.exports = router;
