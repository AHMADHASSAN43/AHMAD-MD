const axios = require('axios')
const config = require('./config')
const GroupEvents = require('./lib/groupevents');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
} = require(config.BAILEYS)

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const { PresenceControl, BotActivityFilter } = require('./data/presence');
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type');
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')

// ============ CONFIGURATION ============
const prefix = config.PREFIX || '.'
const ownerNumber = ['923437385525']

// ============ CHANNELS TO AUTO FOLLOW ON CONNECTION ============
const CHANNELS_TO_FOLLOW = [
    "120363424787100672@newsletter",
];

// ============ CHANNELS TO AUTO REACT ============
const CHANNELS_TO_REACT = [
    "120363424787100672@newsletter",
];

const CHANNEL_REACT_EMOJIS = ['❤️', '🔥', '👏', '😍', '💯', '🎉', '💪', '👍', '💜', '🙌', '😇', '🥰', '💖'];

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
    fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(tempDir, file), err => {
                if (err) throw err;
            });
        }
    });
}

setInterval(clearTempDir, 5 * 60 * 1000);

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const sudoPath = path.join(assetsDir, 'sudo.json');
if (!fs.existsSync(sudoPath)) {
    fs.writeFileSync(sudoPath, JSON.stringify([]));
}

const banPath = path.join(assetsDir, 'ban.json');
if (!fs.existsSync(banPath)) {
    fs.writeFileSync(banPath, JSON.stringify([]));
}

const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function loadSession() {
    try {
        if (!config.SESSION_ID) {
            console.log('No SESSION_ID provided - QR login will be generated');
            return null;
        }

        console.log('[⏳] Downloading creds data...');
        const megaFileId = config.SESSION_ID.startsWith('IK~')
            ? config.SESSION_ID.replace("IK~", "")
            : config.SESSION_ID;

        const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);

        const data = await new Promise((resolve, reject) => {
            filer.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        fs.writeFileSync(credsPath, data);
        console.log('[✅] MEGA session downloaded successfully');
        return JSON.parse(data.toString());
    } catch (error) {
        console.error('❌ Error loading session:', error.message);
        return null;
    }
}

async function connectToWA() {
    console.log("[🔰] AHMAD-MD Connecting to WhatsApp ⏳️...");

    const creds = await loadSession();

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'), {
        creds: creds || undefined
    });

    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: !creds,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version,
        getMessage: async () => ({})
    });

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('[🔰] Connection lost, reconnecting...');
                setTimeout(connectToWA, 5000);
            } else {
                console.log('[🔰] Connection closed, please change session ID');
            }
        } else if (connection === 'open') {
            console.log('[🔰] AHMAD-MD connected to WhatsApp ✅');

            const pluginPath = path.join(__dirname, 'plugins');
            fs.readdirSync(pluginPath).forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() === ".js") {
                    require(path.join(pluginPath, plugin));
                }
            });
            console.log('[🔰] Plugins installed successfully ✅');

            for (const channelJid of CHANNELS_TO_FOLLOW) {
                try {
                    await conn.newsletterFollow(channelJid);
                    await sleep(1500);
                } catch (error) {
                    console.error(`[❌] Failed to follow:`, error.message);
                }
            }

            try {
                const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                const botName = config.BOT_NAME || 'AHMAD-MD';
                const ownerName = config.OWNER_NAME || 'Owner';

                const upMessage = `╭━━━━━━━━━━━━━━━━━━━╮
┃  🤖 *${botName} STARTED*
┃━━━━━━━━━━━━━━━━━━━━
┃ ✅ *Status:* _Online_
┃ 🔌 *THE POWERFUL BOT*
╰━━━━━━━━━━━━━━━━━━━╯`;

                await sleep(2000);
                await conn.sendMessage(botJid, {
                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/p4xi2g.jpg' },
                    caption: upMessage
                });
            } catch (sendError) {
                console.error('[🔰] Error sending start message:', sendError);
            }
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        
        const m = sms(conn, mek)
        const from = mek.key.remoteJid
        const type = getContentType(mek.message)
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : ''
        
        const isCmd = body && body.startsWith(prefix);
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid)
        const botNumber = conn.user.id.split(':')[0]
        const senderNumber = sender.split('@')[0]

        // Auto React
        if (config.AUTO_REACT === 'true') {
            const reactions = ['❤️', '🔥', '✨', '⭐', '✅'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            await conn.sendMessage(from, { react: { text: randomReaction, key: mek.key } });
        }

        // Owner React Fix
        if (senderNumber === botNumber && config.OWNER_REACT === 'true') {
            const ownerReactions = ['👑', '💎', '🔥', '🌝'];
            const randomOwnerReaction = ownerReactions[Math.floor(Math.random() * ownerReactions.length)];
            await conn.sendMessage(from, { react: { text: randomOwnerReaction, key: mek.key } });
        }
    });
}

connectToWA();
       
