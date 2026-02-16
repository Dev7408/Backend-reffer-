const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
require('dotenv').config();

// --- FIREBASE SETUP ---
const serviceAccount = require("./firebase-key.json"); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// --- BOT SETUP ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const DASHBOARD_URL = "https://your-github-username.github.io/your-repo-name/"; // Apna HTML link yahan dalein

// --- START COMMAND (WITH REFERRAL LOGIC) ---
bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const userName = ctx.from.first_name;
    const startPayload = ctx.startPayload; // Yeh referral ID hoti hai (e.g., /start 12345)

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        // Naya User Data
        let userData = {
            id: userId,
            name: userName,
            coins: 10, // Joining Bonus
            reffer: 0,
            refferBy: null,
            tasksCompleted: 0,
            totalWithdrawals: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Agar user kisi ke link se aaya hai
        if (startPayload && startPayload !== userId) {
            const referrerRef = db.collection('users').doc(startPayload);
            const referrerDoc = await referrerRef.get();

            if (referrerDoc.exists) {
                userData.refferBy = startPayload;
                // Referrer ko 50 coins bonus
                await referrerRef.update({
                    coins: admin.firestore.FieldValue.increment(50),
                    reffer: admin.firestore.FieldValue.increment(1)
                });
                // Referrer ko notify karein
                bot.telegram.sendMessage(startPayload, `🎊 Naya Referral! Aapko 50 coins mile hain.`);
            }
        }

        await userRef.set(userData);
        ctx.reply(`नमस्ते ${userName}! 🙏\nTrendBot mein joining bonus 10 coins mil gaye hain.`);
    }

    ctx.reply('💰 Apna balance dekhne ya withdrawal ke liye dashboard kholein:', 
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Open Dashboard', DASHBOARD_URL)],
            [Markup.button.url('📢 Join Channel', 'https://t.me/Trendmansun')]
        ])
    );
});

bot.launch();
console.log("✅ TrendBot Backend is Running...");
