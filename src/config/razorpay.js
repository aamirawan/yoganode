import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Log the key to debug
console.log('Initializing Razorpay with key ID:', process.env.RAZORPAY_KEY_ID);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay API keys are missing in environment variables!');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default razorpay;
