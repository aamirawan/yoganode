// controllers/admin/blogController.js
import db from '../../config/db.js';

export const createOrUpdatePost = async (req, res) => {
  try {
    const { title, slug, content, author, coverImage, tags, type, videoUrl } = req.body;

    const [existing] = await db.query('SELECT * FROM BlogPosts WHERE slug = ?', [slug]);

    if (existing.length) {
      await db.query(
        'UPDATE BlogPosts SET title=?, content=?, author=?, coverImage=?, tags=?, type=?, videoUrl=? WHERE slug=?',
        [title, content, author, coverImage, JSON.stringify(tags), type, videoUrl, slug]
      );
      return res.json({ message: 'Post updated successfully' });
    }

    await db.query(
      'INSERT INTO BlogPosts (title, slug, content, author, coverImage, tags, type, videoUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, slug, content, author, coverImage, JSON.stringify(tags), type, videoUrl]
    );
    res.json({ message: 'Post created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating/updating post', error: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM BlogPosts ORDER BY createdAt DESC');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM BlogPosts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
};
