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

// دالة لحذف ملف
function removeFile(filePath) {
    try {
        fs.unlinkSync(filePath);
        return true; // تم الحذف بنجاح
    } catch (err) {
        console.error("Error deleting file:", err);
        return false; // فشل الحذف
    }
}

// إنشاء روتر للطلب GET
router.get('/', async (req, res) => {
    let num = req.query.number;

    // دالة لإقامة الاتصال وإرسال الملف
    async function XeonPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        
        try {
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
                    await res.send({ code });
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
                    XeonBotInc.sendMessage(XeonBotInc.user.id, {
                        audio: audioxeon,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, {
                        quoted: xeonses
                    });
                    await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `*ثم تسجيل رقمك بنجاح* \n \n *هاذا هو ملف تشغيل البوتات المدعومة كا JITOSSA &BOBIZA*\n\n\n 🄹🄸🅃🄾🅂🅂🄰\n🄱🄾🄱🄸🅉🄰` }, { quoted: xeonses });
                    await delay(100);
                    await removeFile('./session'); // حذف الملف بعد الانتهاء
                    process.exit(0); // إنهاء عملية السيرفر
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair(); // إعادة المحاولة في حالة الفشل
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./session'); // حذف الملف في حالة الخطأ
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    // تنفيذ دالة XeonPair
    return await XeonPair();
});

// معالجة الأخطاء غير المعالجة
process.on('uncaughtException', function (err) {
    let e = String(err);
    // تجاهل بعض الأخطاء المعروفة
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
