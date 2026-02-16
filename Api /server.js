const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- FIREBASE SETUP (Using Environment Variable) ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

// --- BOT SETUP ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const DASHBOARD_URL = "https://backend-reffer-seven.vercel.app/"; 

bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const userName = ctx.from.first_name;
    const startPayload = ctx.startPayload;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        let userData = {
            id: userId, name: userName, coins: 10, reffer: 0,
            refferBy: null, createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (startPayload && startPayload !== userId) {
            const referrerRef = db.collection('users').doc(startPayload);
            const referrerDoc = await referrerRef.get();
            if (referrerDoc.exists) {
                userData.refferBy = startPayload;
                await referrerRef.update({
                    coins: admin.firestore.FieldValue.increment(50),
                    reffer: admin.firestore.FieldValue.increment(1)
                });
                bot.telegram.sendMessage(startPayload, `🎊 Naya Referral! Aapko 50 coins mile hain.`);
            }
        }
        await userRef.set(userData);
    }

    ctx.reply(`नमस्ते ${userName}! 🙏`, Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Open Dashboard', DASHBOARD_URL)],
        [Markup.button.url('📢 Join Channel', 'https://t.me/Trendmansun')]
    ]));
});

// --- VERCEL ADAPTATION ---
app.post('/api/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
});

app.get('/', (req, res) => {
    res.send('TrendBot Backend is Live! 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running"));

module.exports = app;
