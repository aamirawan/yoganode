import pool from "../config/db.js";

// Save user questionnaire responses
export const saveQuestionnaireResponses = async (req, res) => {
  const { focus, healthConcerns, sessionType } = req.body;
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Convert arrays to JSON strings for storage
    const focusData = focus ? JSON.stringify(focus) : null;
    const healthConcernsData = healthConcerns ? JSON.stringify(healthConcerns) : null;
    const sessionTypeData = sessionType ? JSON.stringify(sessionType) : null;

    // Update user preferences in the database
    await pool.query(
      "UPDATE users SET focus = ?, health_concerns = ?, session_type = ?, questionnaire_completed = TRUE WHERE id = ?",
      [focusData, healthConcernsData, sessionTypeData, userId]
    );

    return res.status(200).json({ 
      success: true, 
      message: "Questionnaire responses saved successfully" 
    });
  } catch (error) {
    console.error("Error saving questionnaire responses:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Check if user has completed questionnaire
export const checkQuestionnaireStatus = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const [users] = await pool.query(
      "SELECT questionnaire_completed FROM users WHERE id = ?", 
      [userId]
    );
    
    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ 
      completed: users[0].questionnaire_completed === 1 
    });
  } catch (error) {
    console.error("Error checking questionnaire status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};
