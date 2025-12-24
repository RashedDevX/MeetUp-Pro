const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

// .env ফাইল থেকে ভেরিয়েবল লোড করার জন্য
dotenv.config();

const app = express();

// CORS কনফিগারেশন: সব অরিজিন থেকে রিকোয়েস্ট এলাও করার জন্য আপডেট করা হয়েছে
app.use(cors()); 
app.use(express.json());

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// সার্ভার লাইভ আছে কি না চেক করার রুট
app.get('/', (req, res) => {
    res.send('MeetUp Pro Backend is running successfully! 🚀');
});

// টোকেন জেনারেশন রুট
app.post('/api/get-token', (req, res) => {
    try {
        const { roomId, userId } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ error: 'roomId and userId are required' });
        }

        // টোকেনের মেয়াদ ১ ঘণ্টা সেট করা হয়েছে
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Agora RTC টোকেন তৈরি (userId কে অবশ্যই Integer হতে হবে)
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
    console.log(`🔗 App ID status: ${APP_ID ? 'Loaded' : 'Missing!'}`);
});