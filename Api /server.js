
const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- FIREBASE SETUP ---
if (!admin.apps.length) {
    admin.initializeApp({
        // Vercel par FIREBASE_SERVICE_ACCOUNT variable mein JSON hona chahiye
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

// --- BOT SETUP ---
const bot = new Telegraf("7928266949:AAHqGiztgRNNGJ7u1jznA2ZuS98hshx8hXU");
const DASHBOARD_URL = "https://backend-reffer-seven.vercel.app/"; 

// Webhook connection
app.use(bot.webhookCallback('/api/webhook'));

// Static files for dashboard
app.use(express.static(path.join(__dirname, 'public')));

bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const userName = ctx.from.first_name;
    const startPayload = ctx.startPayload;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        let userData = {
            id: userId,
            name: userName,
            coins: 10, // Joining Bonus
            reffer: 0,
            refferBy: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
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

    ctx.reply(`नमस्ते ${userName}! 🙏\nTrendBot Dashboard niche button se kholein:`, 
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Open Dashboard', DASHBOARD_URL)],
            [Markup.button.url('📢 Join Channel', 'https://t.me/Trendmansun')]
        ])
    );
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("TrendBot is Running..."));

module.exports = app;
