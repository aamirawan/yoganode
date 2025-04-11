import db from '../../config/db.js';

// View all bookings
export const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT b.*, u.first_name, u.last_name, t.user_id AS teacher_user_id
      FROM Bookings b
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN teachers t ON b.teacherId = t.id
    `);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const [result] = await db.execute(`
      UPDATE Bookings SET bookingStatus = 'cancelled' WHERE id = ?
    `, [bookingId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err });
  }
};
