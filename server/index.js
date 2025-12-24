const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

dotenv.config();

const app = express();

// CORS কনফিগারেশন সব অরিজিন এলাও করার জন্য আপডেট করা হয়েছে
app.use(cors()); 
app.use(express.json());

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

app.get('/', (req, res) => {
    res.send('MeetUp Pro Backend is running successfully! 🚀');
});

app.post('/api/get-token', (req, res) => {
    try {
        const { roomId, userId } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ error: 'roomId and userId are required' });
        }

        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // userId কে ইন্টিজারে কনভার্ট করে টোকেন তৈরি করা হচ্ছে
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            roomId,
            parseInt(userId),
            RtcRole.PUBLISHER,
            privilegeExpiredTs
        );

        console.log(`✅ Token generated for Room: ${roomId}`);

        return res.json({ 
            token, 
            roomId, 
            userId: parseInt(userId),
            appId: APP_ID 
        });
    } catch (error) {
        console.error('❌ Error generating token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is live on port ${PORT}`);
});