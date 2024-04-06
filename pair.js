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

let isProcessing = false; // متغير لتتبع حالة العملية

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
};

router.get('/', async (req, res) => {
    let num = req.query.number;
    // التحقق من أن العملية غير قيد التنفيذ حالياً
    if (isProcessing) {
        return res.status(400).send({ error: "Request in progress, please try again later." });
    }
    
    isProcessing = true; // تعيين حالة العملية إلى true

    async function XeonPair() {
        try {
            const {
                state,
                saveCreds
            } = await useMultiFileAuthState(`./session`);

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
                num = num.replace(/[^0-9]/g,'');
                const code = await XeonBotInc.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            // إجراءات الإرسال
            // ...

            // إعادة تعيين حالة العملية بعد الانتهاء
            isProcessing = false;
        } catch (err) {
            console.log("Service restarted");
            await removeFile('./session');
            if (!res.headersSent) {
                await res.status(503).send({ error: "Service Unavailable" });
            }
            // إعادة تعيين حالة العملية في حالة الخطأ
            isProcessing = false;
        }
    }

    // إجراء العملية
    await XeonPair();

    // رسالة الرد
    res.send(`_*هذا الملف خاص بإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n
- _github.com/noureddineouafy/bobizaa_\n
- _JITOSSA_ _*قادم قريبا...*_\n_©OMARCHARAF1_\n_©noureddineouafy_`);
});

process.on('uncaughtException', function (err) {
    let e = String(err)
    if (e.includes("conflict")) return
    if (e.includes("Socket connection timeout")) return
    if (e.includes("not-authorized")) return
    if (e.includes("rate-overlimit")) return
    if (e.includes("Connection Closed")) return
    if (e.includes("Timed Out")) return
    if (e.includes("Value not found")) return
    console.log('Caught exception: ', err)
});

module.exports = router;
