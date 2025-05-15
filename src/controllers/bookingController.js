import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';

// Book a group class
export const bookGroupClass = async (req, res) => {
  const { class_id, instance_date } = req.body;
  const student_id = req.user.id;

  try {
    // Check if user has an active subscription with available credits
   /* const [subscriptions] = await db.execute(`
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
    } */

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

    // Use instance_date if provided, otherwise use the class's default date
    let classDate = instance_date || classInfo.class_date;
    
    // Ensure classDate is not undefined
    if (!classDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class date. Please provide a valid date.' 
      });
    }
    
    console.log('Using class date:', classDate);

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
    
    let bookingQuery = `
      INSERT INTO Bookings (userId, classId, teacherId, bookingType, bookingStatus, creditUsed, scheduledAt)
      VALUES (?, ?, ?, 'group_class', 'booked', 1, ?)
    `;
    let bookingParams = [student_id, class_id, classInfo.teacher_id, scheduledDateTime];
    
    const [result] = await db.execute(bookingQuery, bookingParams);

    // Try to send notification, but don't fail if it's not possible
    try {
      // Get user details for notification
      const [userDetails] = await db.execute('SELECT * FROM users WHERE id = ?', [student_id]);
      const [teacherDetails] = await db.execute('SELECT * FROM users WHERE id = ?', [classInfo.user_id]);

      // Send booking confirmation notification if the notification service is available
      if (notificationService && typeof notificationService.sendClassBookingConfirmation === 'function') {
        const user = {
          id: student_id,
          email: userDetails[0].email,
          phone: userDetails[0].phone_no || userDetails[0].phone // Handle different field names
        };

        const bookingDetails = {
          userName: `${userDetails[0].first_name} ${userDetails[0].last_name}`,
          bookingId: result.insertId,
          className: classInfo.title,
          teacherName: `${teacherDetails[0].first_name} ${teacherDetails[0].last_name}`,
          classDate: classDate,
          classTime: classInfo.start_time
        };

        await notificationService.sendClassBookingConfirmation(user, bookingDetails);
        console.log('Booking notification sent successfully');
      } else {
        console.log('Notification service not available, skipping notification');
      }
    } catch (notificationError) {
      // Log the error but don't fail the booking process
      console.error('Failed to send notification:', notificationError);
      // Continue with the booking process
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Class booked successfully', 
      bookingId: result.insertId,
      classDate: classDate,
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
    // Updated query to include scheduledAt and classId explicitly
    const [bookings] = await db.execute(`
      SELECT * FROM Bookings WHERE userId = ? AND bookingStatus = 'booked' AND bookingType = 'group_class';
    `, [userId]);

    console.log('User bookings:', bookings);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
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
