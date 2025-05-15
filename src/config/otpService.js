import dotenv from "dotenv";

dotenv.config();

// Wati API configuration
const WATI_API_URL = process.env.WATI_API_URL;
const WATI_API_KEY = process.env.WATI_API_KEY;
const WATI_TEMPLATE_NAME = process.env.WATI_OTP_TEMPLATE_NAME || "otp_verification";

// Debug configuration values
console.log('WATI Configuration:');
console.log('WATI_API_URL:', WATI_API_URL);
console.log('WATI_TEMPLATE_NAME:', WATI_TEMPLATE_NAME);

export const sendOTP = async (phoneNumber, otp) => {
  try {
    // Validate inputs
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!otp) {
      throw new Error('OTP code is required');
    }
    
    // Check if API credentials are configured
    if (!WATI_API_URL || !WATI_API_KEY) {
      throw new Error('Wati API credentials are not configured');
    }
    
    // Format phone number for Wati (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    
    // Format phone number according to Wati requirements
    // Remove any spaces, dashes, or parentheses and the + sign
    const cleanedPhone = formattedPhone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    
    // Log the request details for debugging
    const requestBody = {
      parameters: [
        {
          name: "1",
          value: otp.toString()
        }
      ],
      template_name: WATI_TEMPLATE_NAME,
      broadcast_name: "otp_broadcast"
    };
      
    // Prepare the request to Wati API
    const response = await fetch(`${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${cleanedPhone}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Parse response data
    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      throw new Error(`Wati API error: ${response.status} - ${data.message || JSON.stringify(data)}`);
    }
    console.log("OTP", otp.toString());
    return true;
  } catch (error) {
    // Log detailed error information
    console.error("Error sending OTP via Wati:");     
    // Return false to indicate failure
    return false;
  }
};
