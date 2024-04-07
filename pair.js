const express = require('express');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
};

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function XeonPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);

        try {
            let XeonBotInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
            });

            if (!XeonBotInc.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await XeonBotInc.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            XeonBotInc.ev.on('creds.update', saveCreds);
            XeonBotInc.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(10000);
                    const sessionXeon = fs.readFileSync('./session/creds.json');
                    XeonBotInc.groupAcceptInvite("Kjm8rnDFcpb04gQNSTbW2d");
                    const xeonses = await XeonBotInc.sendMessage(XeonBotInc.user.id, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
                    await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `_*هاذا الملف خاص باإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n- _github.com/noureddineouafy/bobizaa_\n- _JITOSSA_ _*قادم قريبا...*_\n_©OMARCHARAF1_\n_©noureddineouafy_` }, { quoted: xeonses });
                    await delay(100);
                    return await removeFile('./session');
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./session');
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    // تنفيذ الدالة الرئيسية
    await XeonPair();
});

// التعامل مع الأخطاء غير المعالجة
process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict") || e.includes("Socket connection timeout") || e.includes("not-authorized") || e.includes("rate-overlimit") || e.includes("Connection Closed") || e.includes("Timed Out") || e.includes("Value not found")) {
        // تجاهل بعض الأخطاء المعروفة
        return;
    }
    console.log('Caught exception: ', err);
});

module.exports = router;