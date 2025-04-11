// controllers/admin/staticPageController.js
import db from '../../config/db.js';

export const createOrUpdatePage = async (req, res) => {
  try {
    const { title, slug, content, metaTitle, metaDescription } = req.body;

    const [existing] = await db.query('SELECT * FROM StaticPages WHERE slug = ?', [slug]);

    if (existing.length) {
      await db.query(
        'UPDATE StaticPages SET title=?, content=?, metaTitle=?, metaDescription=?, lastUpdated=NOW() WHERE slug=?',
        [title, content, metaTitle, metaDescription, slug]
      );
      return res.json({ message: 'Page updated successfully' });
    }

    await db.query(
      'INSERT INTO StaticPages (title, slug, content, metaTitle, metaDescription) VALUES (?, ?, ?, ?, ?)',
      [title, slug, content, metaTitle, metaDescription]
    );
    res.json({ message: 'Page created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating/updating page', error: err.message });
  }
};

export const getAllPages = async (req, res) => {
  try {
    const [pages] = await db.query('SELECT * FROM StaticPages');
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pages', error: err.message });
  }
};

export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [page] = await db.query('SELECT * FROM StaticPages WHERE slug = ?', [slug]);

    if (!page.length) return res.status(404).json({ message: 'Page not found' });

    res.json(page[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching page', error: err.message });
  }
};
