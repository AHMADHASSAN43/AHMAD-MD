const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AHMAD-MD PAIRING</title>
            <style>
                body { background: #0d1117; color: #9d4edd; font-family: sans-serif; text-align: center; padding-top: 50px; }
                .box { border: 2px solid #9d4edd; padding: 20px; display: inline-block; border-radius: 10px; box-shadow: 0 0 15px #9d4edd; }
                input { padding: 10px; border-radius: 5px; border: none; width: 250px; }
                button { padding: 10px 20px; background: #9d4edd; color: white; border: none; cursor: pointer; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>✨ AHMAD-MD ✨</h1>
                <p>Enter your number with country code (e.g. 923...)</p>
                <input type="text" id="number" placeholder="923123456789">
                <br><br>
                <button onclick="getCode()">GET PAIRING CODE</button>
                <h2 id="displayCode" style="color: white; margin-top: 20px;"></h2>
            </div>
            <script>
                async function getCode() {
                    const num = document.getElementById('number').value;
                    const display = document.getElementById('displayCode');
                    display.innerText = "Generating...";
                    const res = await fetch('/pair?number=' + num);
                    const data = await res.json();
                    display.innerText = data.code || "Error! Try again.";
                }
            </script>
        </body>
        </html>
    `);
});
<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&height=230&color=0:6a0dad,100:ab47bc&text=AHMAD%20MD&fontColor=ffffff&fontSize=85&fontAlignY=40&animation=twinkling&desc=Powered%20By%20AHMAD%20HASAN&descSize=20&descAlignY=65&stroke=ffffff&strokeWidth=1.2" width="100%"/>

<div style="margin-top: -60px; text-align: center; font-size: 32px; font-weight: 1000; letter-spacing: 3px; background: linear-gradient(90deg, #6a0dad, #ab47bc, #d896ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 12px #6a0dad, 0 0 24px #ab47bc; padding: 12px 0;"> 
Built on Baileys • Designed for Speed • Powered by AHMAD MD
</div>

<p align="center">
<a href="https://heroku.com/deploy?template=https://github.com/AHMADHASSAN43/AHMAD-MD">
<img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku">
</a>
</p>

<h2 align="center" style="color:#9D00FF;">🧾 PROJECT STATS</h2>
<div align="center">
<a href="https://github.com/AHMADHASSAN43">
<img src="https://github-readme-stats-fast.vercel.app/api?username=AHMADHASSAN43&show_icons=true&theme=tokyonight&border_color=9D00FF&title_color=00ffff&icon_color=00ffff&text_color=ffffff" width="420"/>
</a>
</div>

<hr>
<p align="center"><strong>Creator:</strong> AHMAD HASAN | <strong>License:</strong> Apache 2.0</p>
</div>
