const express = require('express');
const app = express();
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");

app.get('/', (req, res) => {
    res.send(`
        <body style="background:#111; color:white; text-align:center; font-family:sans-serif; padding-top:50px;">
            <h2>AHMAD-MD PAIRING SYSTEM</h2>
            <input type="text" id="num" placeholder="923xxxxxxxxx" style="padding:10px; border-radius:5px;">
            <button onclick="getCode()" style="padding:10px; background:blue; color:white; border:none; border-radius:5px;">Get Code</button>
            <h3 id="display" style="margin-top:20px; color:yellow;"></h3>
            <script>
                async function getCode() {
                    let n = document.getElementById('num').value;
                    document.getElementById('display').innerText = "Generating...";
                    let res = await fetch('/pair?number=' + n);
                    let data = await res.json();
                    document.getElementById('display').innerText = "YOUR CODE: " + data.code;
                }
            </script>
        </body>
    `);
});

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    const { state } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), browser: Browsers.macOS("Chrome") });
    if (!sock.authState.creds.registered) {
        let code = await sock.requestPairingCode(num);
        res.json({ code: code });
    }
});

app.listen(3000, () => console.log("Site is live!"));
  
