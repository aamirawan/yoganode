import app from "./app.js";
import dotenv from "dotenv";
import './jobs/classReminderJob.js';
import './jobs/abandonedCartJob.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

