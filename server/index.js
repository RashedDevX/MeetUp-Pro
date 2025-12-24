const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

// .env ফাইল লোড করার জন্য
dotenv.config();

const app = express();

// CORS কনফিগারেশন আপডেট: যাতে আপনার গিটহাব পেজ থেকে রিকোয়েস্ট আসলে ব্লক না হয়
app.use(cors({
    origin: '*', // নিরাপত্তার জন্য পরে এখানে আপনার গিটহাবের লিঙ্ক দিতে পারেন
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// সার্ভার ঠিক আছে কি না তা চেক করার জন্য একটি রুট
app.get('/', (req, res) => {
    res.send('MeetUp Pro Backend is running successfully! 🚀');
});

app.post('/api/get-token', (req, res) => {
    try {
        const { roomId, userId } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ error: 'roomId and userId are required' });
        }

        // টোকেনের মেয়াদ ১ ঘণ্টা (৩৬০০ সেকেন্ড)
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Agora RTC টোকেন তৈরি
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
            userId,
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
    console.log(`🔗 App ID status: ${APP_ID ? 'Loaded' : 'Missing!'}`);
});