const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

let isMessageSent = false; // تتبع ما إذا تم إرسال الرسالة بالفعل

router.get('/', async (req, res) => {
    let num = req.query.number;
    try {
        if (!isMessageSent) { // التحقق من أن الرسالة لم ترسل بالفعل
            const {
                state,
                saveCreds
            } = await useMultiFileAuthState(`./session`);
            let XeonBotInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: [ "Ubuntu", "Chrome", "20.0.04" ], // استعادة المتصفح إلى القيمة الافتراضية
            });

            if (!XeonBotInc.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g,'');
                const code = await XeonBotInc.requestPairingCode(num);
                
                if (!res.headersSent) {
                    await res.send({
                        code,
                        message: "_*هذا الملف خاص باإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n- _github.com/noureddineouafy/bobizaa_\n- _JITOSSA_ _*قادم قريبا...*_\n_©OMARCHARAF1_\n_©noureddineouafy_"
                    });
                }
                
                // تعيين الرسالة كمرسلة بالفعل
                isMessageSent = true;
            }
        } else {
            // إذا تم إرسال الرسالة بالفعل، يمكن تقديم رسالة تنبيه أو استجابة مخصصة هنا
            res.send({ message: "Already sent a message" });
        }
    } catch (err) {
        console.log("Service restarted");
        if (!res.headersSent) {
            await res.send({code: "Service Unavailable"});
        }
    }
});

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    console.log('Caught exception: ', err);
});

module.exports = router;
