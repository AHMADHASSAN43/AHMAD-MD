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

const CHANNELS_TO_FOLLOW = ["120363424787100672@newsletter"];
const CHANNELS_TO_REACT = ["120363424787100672@newsletter"];
const CHANNEL_REACT_EMOJIS = ['❤️', '🔥', '👏', '😍', '💯'];

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir) }

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;

async function loadSession() {
    try {
        if (!config.SESSION_ID) return null;
        const megaFileId = config.SESSION_ID.startsWith('IK~') ? config.SESSION_ID.replace("IK~", "") : config.SESSION_ID;
        const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
        const data = await new Promise((resolve, reject) => {
            filer.download((err, data) => { err ? reject(err) : resolve(data); });
        });
        fs.writeFileSync(path.join(__dirname, 'sessions', 'creds.json'), data);
        return JSON.parse(data.toString());
    } catch (error) { return null; }
}

async function connectToWA() {
    const creds = await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'), { creds: creds || undefined });
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: !creds,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version
    });

    conn.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('[🔰] AHMAD-MD connected ✅');
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const upMessage = "*AHMAD-MD IS LIVE NOW!*";
            await conn.sendMessage(botJid, { text: upMessage });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        if (!mek.message) return;
        const from = mek.key.remoteJid;
        if (config.AUTO_REACT === 'true') {
            await conn.sendMessage(from, { react: { text: '❤️', key: mek.key } });
        }
    });
}

connectToWA();
