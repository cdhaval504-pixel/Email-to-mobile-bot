const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Telegram Bot Configuration - YOUR TOKENS
const TELEGRAM_BOT_TOKEN = '8186859054:AAFaM1ba38VZoZfeuHkaFMb-_WuMyd8wx1c';
const TELEGRAM_CHAT_ID = '6418731655';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { 
    polling: true,
    filepath: false
});

// In-memory database
const userDatabase = {
    'user@gmail.com': {
        mobile: '+919876543210',
        name: 'John Doe',
        whatsapp: 'https://wa.me/919876543210',
        telegram: 'https://t.me/919876543210'
    },
    'test@gmail.com': {
        mobile: '+919876543211',
        name: 'Test User',
        whatsapp: 'https://wa.me/919876543211',
        telegram: 'https://t.me/919876543211'
    },
    'demo@gmail.com': {
        mobile: '+919876543212',
        name: 'Demo User',
        whatsapp: 'https://wa.me/919876543212',
        telegram: 'https://t.me/919876543212'
    },
    'admin@gmail.com': {
        mobile: '+919876543213',
        name: 'Admin User',
        whatsapp: 'https://wa.me/919876543213',
        telegram: 'https://t.me/919876543213'
    }
};

// API Routes
app.post('/api/find-mobile', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const userData = userDatabase[email.toLowerCase()];
        
        if (userData) {
            // Send notification to Telegram
            const message = `🔍 नया Mobile Link Request\n📧 Email: ${email}\n👤 Name: ${userData.name}\n📱 Mobile: ${userData.mobile}\n🔗 WhatsApp: ${userData.whatsapp}\n⏰ Time: ${new Date().toLocaleString()}`;
            
            await bot.sendMessage(TELEGRAM_CHAT_ID, message);
            
            res.json({
                success: true,
                mobile: userData.mobile,
                name: userData.name,
                whatsapp: userData.whatsapp,
                telegram: userData.telegram,
                directLink: `tel:${userData.mobile}`
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No mobile link found for this email'
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Telegram Bot Handlers
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🤖 <b>Email To Mobile Bot</b>

Welcome! I can help you find mobile links from email addresses.

<b>Commands:</b>
/start - Start the bot
/search <email> - Search mobile by email
/help - Get help

<b>Example:</b>
<code>/search user@gmail.com</code>

<i>Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...</i>
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim().toLowerCase();
    
    try {
        const userData = userDatabase[email];
        
        if (userData) {
            const response = `
✅ <b>Mobile Link Found!</b>

📧 <b>Email:</b> ${email}
👤 <b>Name:</b> ${userData.name}
📱 <b>Mobile:</b> <code>${userData.mobile}</code>
🔗 <b>WhatsApp:</b> ${userData.whatsapp}
📲 <b>Telegram:</b> ${userData.telegram}
📞 <b>Direct Call:</b> <code>${userData.mobile}</code>

⏰ <i>${new Date().toLocaleString()}</i>
            `;
            
            await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
            
            // Send notification to admin
            const adminMsg = `🔍 Bot Search\nUser: ${msg.from.first_name}\nEmail: ${email}\nMobile: ${userData.mobile}`;
            await bot.sendMessage(TELEGRAM_CHAT_ID, adminMsg);
            
        } else {
            await bot.sendMessage(chatId, `❌ No mobile link found for: ${email}\n\nTry: /search user@gmail.com`);
        }
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Error processing your request');
        console.error('Bot error:', error);
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    
    // Ignore commands
    if (text.startsWith('/')) return;
    
    // Check if it looks like an email
    if (text.includes('@') && text.includes('.')) {
        const email = text.toLowerCase();
        const userData = userDatabase[email];
        
        try {
            if (userData) {
                const response = `
✅ <b>Mobile Link Found!</b>

📧 <b>Email:</b> ${email}
👤 <b>Name:</b> ${userData.name}
📱 <b>Mobile:</b> <code>${userData.mobile}</code>
🔗 <b>WhatsApp:</b> ${userData.whatsapp}

💡 <i>Tip: Use /search email for faster results</i>
                `;
                
                await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
                
                // Log this search
                const logMsg = `🔍 Direct Search\nUser: ${msg.from.first_name}\nEmail: ${email}\nMobile: ${userData.mobile}`;
                await bot.sendMessage(TELEGRAM_CHAT_ID, logMsg);
                
            } else {
                await bot.sendMessage(chatId, 
                    `❌ No mobile link found for: ${email}\n\n` +
                    `💡 Try these examples:\n` +
                    `• user@gmail.com\n` +
                    `• test@gmail.com\n` +
                    `• demo@gmail.com\n\n` +
                    `Or use: /search email@gmail.com`
                );
            }
        } catch (error) {
            console.error('Message handler error:', error);
        }
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email To Mobile App: http://localhost:${PORT}`);
    console.log(`🤖 Telegram Bot started with token: ${TELEGRAM_BOT_TOKEN.substring(0, 15)}...`);
});