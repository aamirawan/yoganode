import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';

// Book a group class
export const bookGroupClass = async (req, res) => {
  const { class_id, instance_date } = req.body;
  const student_id = req.user.id;

  try {
    // Check if user has an active subscription with available credits
    const [subscriptions] = await db.execute(`
      SELECT o.*, p.groupClasses, p.durationDays
      FROM Orders o
      JOIN SubscriptionPackages p ON o.subscriptionPackageId = p.id
      WHERE o.userId = ? AND o.paymentStatus = 'paid'
      ORDER BY o.createdAt DESC LIMIT 1
    `, [student_id]);

    if (!subscriptions.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active subscription found. Please purchase a subscription to book classes.' 
      });
    }

    const subscription = subscriptions[0];
    
    // Check if subscription is still valid (not expired)
    const subscriptionDate = new Date(subscription.createdAt);
    const expiryDate = new Date(subscriptionDate);
    expiryDate.setDate(expiryDate.getDate() + subscription.durationDays);
    
    if (expiryDate < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your subscription has expired. Please renew to book classes.' 
      });
    }

    // Check if user has available credits for group classes
    const [usedCredits] = await db.execute(`
      SELECT COUNT(*) as count
      FROM Bookings
      WHERE userId = ? AND bookingType = 'group_class' AND bookingStatus = 'booked'
    `, [student_id]);

    const availableCredits = subscription.groupClasses - usedCredits[0].count;
    
    if (availableCredits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have used all your group class credits. Please upgrade your subscription.' 
      });
    }

    // Check if class exists and has available spots
    const [classDetails] = await db.execute(`
      SELECT c.*, t.id as teacher_id,
             (SELECT COUNT(*) FROM Bookings WHERE classId = ? AND bookingStatus = 'booked') as bookedSpots
      FROM classes c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE c.id = ?
    `, [class_id, class_id]);

    if (!classDetails.length) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const classInfo = classDetails[0];
    const availableSpots = classInfo.max_participants - classInfo.bookedSpots;

    if (availableSpots <= 0) {
      return res.status(400).json({ success: false, message: 'No spots available for this class' });
    }

    // Handle recurring class instances
    let classDate = classInfo.class_date;
    
    // If this is a recurring class instance, use the provided instance date
    if (classInfo.is_recurring && instance_date) {
      // Parse the recurring days information from the recurring_days JSON field
      let recurringInfo;
      try {
        // Parse the recurring_days field which now contains both days and until date
        recurringInfo = JSON.parse(classInfo.recurring_days || '[]');
      } catch (e) {
        console.error('Error parsing recurring_days JSON:', e);
        // Default to empty array if parsing fails
        recurringInfo = { days: [] };
      }
      
      // Handle different possible formats of recurring_days
      let recurringDays = [];
      if (Array.isArray(recurringInfo)) {
        // If it's already an array, use it directly
        recurringDays = recurringInfo;
      } else if (recurringInfo && recurringInfo.days && Array.isArray(recurringInfo.days)) {
        // If it's an object with a days array property
        recurringDays = recurringInfo.days;
      } else if (typeof recurringInfo === 'string') {
        // If it's a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(recurringInfo);
          recurringDays = Array.isArray(parsed) ? parsed : (parsed.days || []);
        } catch (e) {
          console.error('Failed to parse recurring days string:', e);
        }
      }
      
      // Ensure recurringDays is always an array
      if (!Array.isArray(recurringDays)) {
        recurringDays = [];
      }
      const instanceDateObj = new Date(instance_date);
      const dayOfWeek = instanceDateObj.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if the instance date is within the recurring range
      const startDate = new Date(classInfo.class_date);
      
      // Get the end date from the recurring_days JSON if available, otherwise default to 3 months
      let endDate;
      if (recurringInfo.until) {
        endDate = new Date(recurringInfo.until);
      } else {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months if no end date
      }
      
      // Verify that the instance date is valid for this recurring class
      if (!recurringDays.includes(dayOfWeek) || instanceDateObj < startDate || instanceDateObj > endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date for this recurring class' 
        });
      }
      
      classDate = instance_date;
    }

    // Check if user already booked this class on this date
    const [existingBooking] = await db.execute(`
      SELECT * FROM Bookings
      WHERE userId = ? AND classId = ? AND DATE(scheduledAt) = ? AND bookingStatus = 'booked'
    `, [student_id, class_id, classDate]);

    if (existingBooking.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already booked this class for this date' });
    }

    // Create booking with scheduled time
    const scheduledDateTime = `${classDate} ${classInfo.start_time}`;
    
    // Make sure we have a valid teacher ID
    if (!classInfo.teacher_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot book class: teacher information not found' 
      });
    }
    
    // Check if the instanceDate column exists in the Bookings table
    let bookingQuery = `
      INSERT INTO Bookings (userId, classId, teacherId, bookingType, bookingStatus, creditUsed, scheduledAt)
      VALUES (?, ?, ?, 'group_class', 'booked', 1, ?)
    `;
    let bookingParams = [student_id, class_id, classInfo.teacher_id, scheduledDateTime];
    
    // Try to add the instanceDate if it's a recurring class
    if (classInfo.is_recurring && instance_date) {
      try {
        // First check if the instanceDate column exists
        const [columns] = await db.execute("SHOW COLUMNS FROM Bookings LIKE 'instanceDate'");
        if (columns.length > 0) {
          // If the column exists, use it
          bookingQuery = `
            INSERT INTO Bookings (userId, classId, teacherId, bookingType, bookingStatus, creditUsed, scheduledAt, instanceDate)
            VALUES (?, ?, ?, 'group_class', 'booked', 1, ?, ?)
          `;
          bookingParams.push(classDate);
        }
      } catch (err) {
        console.log('instanceDate column check failed, proceeding without it:', err.message);
        // Continue without the instanceDate column
      }
    }
    
    const [result] = await db.execute(bookingQuery, bookingParams);

    // Get user details for notification
    const [userDetails] = await db.execute('SELECT * FROM users WHERE id = ?', [student_id]);
    const [teacherDetails] = await db.execute('SELECT * FROM users WHERE id = ?', [classInfo.user_id]);

    // Send booking confirmation notification
    const user = {
      id: student_id,
      email: userDetails[0].email,
      phone: userDetails[0].phone
    };

    const bookingDetails = {
      userName: `${userDetails[0].first_name} ${userDetails[0].last_name}`,
      bookingId: result.insertId,
      className: classInfo.title,
      teacherName: `${teacherDetails[0].first_name} ${teacherDetails[0].last_name}`,
      classDate: classDate,
      classTime: classInfo.start_time,
      isRecurring: classInfo.is_recurring ? true : false
    };

    await notificationService.sendClassBookingConfirmation(user, bookingDetails);

    return res.status(201).json({ 
      success: true, 
      message: 'Class booked successfully', 
      bookingId: result.insertId,
      remainingCredits: availableCredits - 1,
      classDate: classDate,
      isRecurring: classInfo.is_recurring ? true : false
    });
  } catch (err) {
    console.error('Error booking class:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to book class', 
      error: err.message 
    });
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const [bookings] = await db.execute(`
      SELECT b.*, c.title as className, c.created_at as classDate,
             u.first_name as teacherFirstName, u.last_name as teacherLastName,
             c.duration
      FROM Bookings b
      JOIN classes c ON b.classId = c.id
      JOIN users u ON c.user_id = u.id
      WHERE b.userId = ? AND b.bookingStatus = 'booked'
      ORDER BY c.created_at DESC
    `, [userId]);

    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err });
  }
};

// Cancel a booking
export const cancelUserBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    // Check if booking exists and belongs to the user
    const [booking] = await db.execute(`
      SELECT * FROM Bookings WHERE id = ? AND userId = ?
    `, [bookingId, userId]);

    if (!booking.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update booking status
    await db.execute(`
      UPDATE Bookings SET bookingStatus = 'cancelled' WHERE id = ?
    `, [bookingId]);

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err });
  }
};
