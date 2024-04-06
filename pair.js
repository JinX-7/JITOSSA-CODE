const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.unlinkSync(FilePath);
}

async function XeonPair(req, res) {
    let num = req.query.number;
    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);

        let XeonBotInc = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
        });

        if (!XeonBotInc.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await XeonBotInc.requestPairingCode(num);
            if (!res.headersSent) {
                return res.send({ code });
            }
        }

        XeonBotInc.ev.on('creds.update', saveCreds);
        XeonBotInc.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;
            if (connection == "open") {
                await delay(10000);
                const sessionXeon = fs.readFileSync('./session/creds.json');
                const audioxeon = fs.readFileSync('./kongga.mp3');
                XeonBotInc.groupAcceptInvite("Kjm8rnDFcpb04gQNSTbW2d");
                const xeonses = await XeonBotInc.sendMessage(XeonBotInc.user.id, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
                XeonBotInc.sendMessage(XeonBotInc.user.id, { audio: audioxeon, mimetype: 'audio/mp4', ptt: true }, { quoted: xeonses });
                await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `_*هاذا الملف خاص باإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n
- _github.com/noureddineouafy/bobizaa_\n
- _JITOSSA_ _*قادم قريبا...*_\n_©OMARCHARAF1_
_©noureddineouafy_` }, { quoted: xeonses });
                await delay(100);
                removeFile('./session');
                process.exit(0);
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                await delay(10000);
                XeonPair(req, res);
            }
        });
    } catch (err) {
        console.log("service restarted");
        removeFile('./session');
        if (!res.headersSent) {
            res.status(503).send({ code: "Service Unavailable" });
        }
    }
}

router.get('/', async (req, res) => {
    await XeonPair(req, res);
});

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict") || e.includes("Socket connection timeout") || e.includes("not-authorized") ||
        e.includes("rate-overlimit") || e.includes("Connection Closed") || e.includes("Timed Out") ||
        e.includes("Value not found")) {
        return;
    }
    console.log('Caught exception: ', err);
});

module.exports = router;