const axios = require('axios')
const config = require('./config')
const GroupEvents = require('./lib/groupevents');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
    delay
} = require(config.BAILEYS)

const l = console.log
const { getBuffer, getGroupAdmins, sleep } = require('./lib/functions')
const { saveMessage, AntiDelete } = require('./lib')
const fs = require('fs')
const P = require('pino')
const path = require('path')
const express = require("express");
const { File } = require('megajs')
const app = express();
const port = process.env.PORT || 9090;

// ============ 1. STYLISH PAIRING WEBSITE (FRONTEND) ============
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AHMAD-MD PAIRING</title>
            <style>
                body { background: radial-gradient(circle, #1a1a2e, #16213e); color: white; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .container { background: rgba(255, 255, 255, 0.05); padding: 40px; border-radius: 20px; border: 2px solid #9d4edd; box-shadow: 0 0 30px #9d4edd; text-align: center; width: 90%; max-width: 400px; }
                h1 { color: #9d4edd; text-shadow: 0 0 10px #9d4edd; margin-bottom: 10px; }
                p { font-size: 14px; color: #ccc; }
                input { width: 100%; padding: 12px; margin: 20px 0; border-radius: 10px; border: 1px solid #9d4edd; background: #0f3460; color: white; font-size: 16px; box-sizing: border-box; }
                button { background: #9d4edd; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s; }
                button:hover { background: #7b2cbf; box-shadow: 0 0 15px #9d4edd; }
                #displayCode { margin-top: 25px; font-size: 24px; font-weight: bold; color: #00fff2; letter-spacing: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✨ AHMAD-MD ✨</h1>
                <p>Enter number with Country Code (923...)</p>
                <input type="text" id="number" placeholder="923123456789">
                <button onclick="getCode()">GENERATE CODE</button>
                <div id="displayCode"></div>
            </div>
            <script>
                async function getCode() {
                    const num = document.getElementById('number').value;
                    const display = document.getElementById('displayCode');
                    if(!num) return alert("Please enter number!");
                    display.innerText = "Connecting...";
                    try {
                        const res = await fetch('/pair?number=' + num);
                        const data = await res.json();
                        display.innerText = data.code || "Error: Try Again";
                    } catch (err) { display.innerText = "Server Error"; }
                }
            </script>
        </body>
        </html>
    `);
});

// ============ 2. PAIRING LOGIC (API ROUTE) ============
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number required" });
    const { state } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
    try {
        const tempConn = makeWASocket({
            auth: state,
            logger: P({ level: 'silent' }),
            browser: Browsers.macOS("Firefox")
        });
        if (!tempConn.authState.creds.registered) {
            await delay(3000);
            let code = await tempConn.requestPairingCode(num);
            if (!res.headersSent) res.json({ code: code });
        }
    } catch (err) { res.status(500).json({ error: "Fail" }); }
});

// ============ 3. MEGA SESSION LOADER ============
async function loadSession() {
    try {
        if (!config.SESSION_ID) return null;
        const credsPath = path.join(__dirname, 'sessions', 'creds.json');
        if (!fs.existsSync(path.dirname(credsPath))) fs.mkdirSync(path.dirname(credsPath), { recursive: true });
        
        const megaFileId = config.SESSION_ID.replace("IK~", "");
        const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
        const data = await new Promise((resolve, reject) => {
            filer.download((err, data) => { err ? reject(err) : resolve(data); });
        });
        fs.writeFileSync(credsPath, data);
        return JSON.parse(data.toString());
    } catch (e) { return null; }
}

// ============ 4. MAIN WHATSAPP CONNECTION ============
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
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut ? setTimeout(connectToWA, 5000) : console.log("Session Expired");
        } else if (connection === 'open') {
            console.log('AHMAD-MD Connected ✅');
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            await conn.sendMessage(botJid, { text: "🚀 *AHMAD-MD IS ACTIVE* \n\nYour bot is successfully connected!" });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    // Auto Status Seen & Auto React Logic
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        if (!mek.message) return;
        const from = mek.key.remoteJid;

        // Auto Status Seen
        if (from === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
            await conn.readMessages([mek.key]);
        }

        // Auto React (Public)
        if (config.AUTO_REACT === "true" && !mek.key.fromMe) {
            const emojis = ['❤️', '🔥', '✨', '⚡', '🙌'];
            await conn.sendMessage(from, { react: { text: emojis[Math.floor(Math.random()*emojis.length)], key: mek.key } });
        }
    });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    connectToWA();
});
