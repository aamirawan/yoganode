// controllers/admin/packageController.js
import db from '../../config/db.js';

export const createOrUpdatePackage = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      durationDays,
      price,
      freeTrialClasses,
      groupClasses,
      oneOnOneSessions,
      features,
      isActive,
    } = req.body;

    if (id) {
      await db.query(
        `UPDATE SubscriptionPackages SET 
         name=?, description=?, durationDays=?, price=?, freeTrialClasses=?, 
         groupClasses=?, oneOnOneSessions=?, features=?, isActive=? 
         WHERE id=?`,
        [
          name,
          description,
          durationDays,
          price,
          freeTrialClasses,
          groupClasses,
          oneOnOneSessions,
          JSON.stringify(features),
          isActive,
          id,
        ]
      );
      return res.json({ message: 'Package updated successfully' });
    }

    await db.query(
      `INSERT INTO SubscriptionPackages 
        (name, description, durationDays, price, freeTrialClasses, groupClasses, oneOnOneSessions, features, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        durationDays,
        price,
        freeTrialClasses,
        groupClasses,
        oneOnOneSessions,
        JSON.stringify(features),
        isActive,
      ]
    );
    res.json({ message: 'Package created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating/updating package', error: err.message });
  }
};

export const getAllPackages = async (req, res) => {
  try {
    const [packages] = await db.query('SELECT * FROM SubscriptionPackages WHERE isActive = true');
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching packages', error: err.message });
  }
};

export const deactivatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE SubscriptionPackages SET isActive = false WHERE id = ?', [id]);
    res.json({ message: 'Package deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deactivating package', error: err.message });
  }
};
