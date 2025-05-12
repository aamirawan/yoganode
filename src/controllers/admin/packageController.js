// controllers/admin/packageController.js
import db from '../../config/db.js';

// Helper function to validate package data
const validatePackageData = (data) => {
  const { type, groupClasses, oneOnOneSessions } = data;
  
  // For group packages, ensure groupClasses is set to 0 for unlimited access
  if (type === 'group' && groupClasses > 0) {
    return { isValid: false, message: 'Group packages should have unlimited (0) group classes' };
  }
  
  // For one-on-one packages, ensure oneOnOneSessions is greater than 0
  if (type === 'one-on-one' && oneOnOneSessions <= 0) {
    return { isValid: false, message: 'One-on-one packages must have at least 1 session' };
  }
  
  return { isValid: true };
};

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
      type,
      features,
      isActive,
    } = req.body;

    // Validate package data based on type
    const validation = validatePackageData({
      type,
      groupClasses,
      oneOnOneSessions
    });

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    if (id) {
      await db.query(
        `UPDATE SubscriptionPackages SET 
         name=?, description=?, durationDays=?, price=?, freeTrialClasses=?, 
         groupClasses=?, oneOnOneSessions=?, type=?, features=?, isActive=? 
         WHERE id=?`,
        [
          name,
          description,
          durationDays,
          price,
          freeTrialClasses,
          groupClasses,
          oneOnOneSessions,
          type,
          JSON.stringify(features),
          isActive,
          id,
        ]
      );
      return res.json({ message: 'Package updated successfully' });
    }

    await db.query(
      `INSERT INTO SubscriptionPackages 
        (name, description, durationDays, price, freeTrialClasses, groupClasses, oneOnOneSessions, type, features, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        durationDays,
        price,
        freeTrialClasses,
        groupClasses,
        oneOnOneSessions,
        type,
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
    const [packages] = await db.query('SELECT * FROM SubscriptionPackages');
    
    // Process packages to ensure proper formatting
    const processedPackages = packages.map(pkg => ({
      ...pkg,
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      // Ensure groupClasses is properly interpreted (0 means unlimited)
      groupClasses: pkg.groupClasses,
      // Convert numeric booleans to actual booleans
      isActive: !!pkg.isActive
    }));
    
    res.json(processedPackages);
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
