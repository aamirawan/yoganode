export const getEmailTemplate = (type, data) => {
    switch (type) {
        case 'class_booking':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Class Booking Confirmation</h2>
                    <p>Hello ${data.userName},</p>
                    <p>Your booking has been confirmed for the following class:</p>
                    <p><strong>Class:</strong> ${data.title}</p>
                    <p><strong>Date & Time:</strong> ${data.startTime}</p>
                    <p><strong>Duration:</strong> ${data.duration} minutes</p>
                    <p><strong>Instructor:</strong> ${data.instructorName}</p>
                    <p>We look forward to seeing you there!</p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        case 'class_cancellation':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Class Booking Cancelled</h2>
                    <p>Hello ${data.userName},</p>
                    <p>Your booking for the following class has been cancelled:</p>
                    <p><strong>Class:</strong> ${data.title}</p>
                    <p><strong>Date & Time:</strong> ${data.startTime}</p>
                    <p><strong>Instructor:</strong> ${data.instructorName}</p>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        case 'class_reminder':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Upcoming Class Reminder</h2>
                    <p>Hello ${data.userName},</p>
                    <p>This is a reminder that your class "${data.title}" is scheduled for:</p>
                    <p><strong>Date:</strong> ${data.startTime}</p>
                    <p><strong>Duration:</strong> ${data.duration} minutes</p>
                    <p><strong>Instructor:</strong> ${data.instructorName}</p>
                    <p>We look forward to seeing you there!</p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        case 'order_confirmation':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Order Confirmation</h2>
                    <p>Hello ${data.userName},</p>
                    <p>Thank you for your order! Here are the details:</p>
                    <p><strong>Order Number:</strong> ${data.orderId}</p>
                    <p><strong>Package:</strong> ${data.packageName}</p>
                    <p><strong>Amount:</strong> $${data.amount}</p>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        case 'abandoned_cart':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Complete Your Purchase</h2>
                    <p>Hello ${data.userName},</p>
                    <p>We noticed you have items in your cart waiting to be purchased:</p>
                    <ul>
                        ${data.items.map(item => `
                            <li>${item.name} - $${item.price}</li>
                        `).join('')}
                    </ul>
                    <p>Total: $${data.total}</p>
                    <p>Don't miss out! Complete your purchase now.</p>
                    <p><a href="${data.cartUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Purchase</a></p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        case 'issue_confirmation':
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Issue Report Confirmation</h2>
                    <p>Hello ${data.userName},</p>
                    <p>Thank you for reporting your issue. Here are the details:</p>
                    <p><strong>Issue ID:</strong> #${data.issueId}</p>
                    <p><strong>Title:</strong> ${data.title}</p>
                    <p><strong>Description:</strong> ${data.description}</p>
                    <p><strong>Priority:</strong> ${data.priority}</p>
                    <p>Our team has received your report and will get back to you as soon as possible.</p>
                    <p>Best regards,<br>Your Yoga Studio Team</p>
                </div>
            `;

        default:
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>${data.message}</p>
                </div>
            `;
    }
}; 