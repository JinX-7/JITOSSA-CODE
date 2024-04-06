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

let notificationSent = false; // تعيين قيمة افتراضية

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
};

router.get('/', async (req, res) => {
    let num = req.query.number;
    
    async function XeonPair() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(`./session`)
        
        try {
            let XeonBotInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: [ "Ubuntu", "Chrome", "20.0.04" ],
            });

            if(!XeonBotInc.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g,'');
                const code = await XeonBotInc.requestPairingCode(num);

                if(!res.headersSent && !notificationSent){
                    await res.send({code});
                    notificationSent = true; // تحديث حالة الإشعار المرسل
                }
            }

            XeonBotInc.ev.on('creds.update', saveCreds);
            XeonBotInc.ev.on("connection.update", async (s) => {
                const {
                    connection,
                    lastDisconnect
                } = s;

                if (connection == "open") {
                    await delay(10000);
                    const sessionXeon = fs.readFileSync('./session/creds.json');
                    XeonBotInc.groupAcceptInvite("Kjm8rnDFcpb04gQNSTbW2d");

                    const xeonses = await XeonBotInc.sendMessage(XeonBotInc.user.id, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });

                    XeonBotInc.sendMessage(XeonBotInc.user.id, {
                        audio: audioxeon, // قم بتعريف المتغير audioxeon بناءً على احتياجاتك
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, {
                        quoted: xeonses
                    });

                    await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `_*هاذا الملف خاص باإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n- _github.com/noureddineouafy/bobizaa_\n- _JITOSSA_ _*قادم قريبا...*_\n\n_©OMARCHARAF1_\n_©noureddineouafy_` }, {quoted: xeonses});

                    await delay(100);
                    return await removeFile('./session');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./session');
            if(!res.headersSent && !notificationSent){
                await res.send({code:"Service Unavailable"});
                notificationSent = true; // تحديث حالة الإشعار المرسل
            }
        }
    }

    return await XeonPair();
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