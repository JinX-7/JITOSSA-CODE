router.get('/', (req, res) => {
    let num = req.query.number;

    const XeonPair = () => {
        return new Promise(async (resolve, reject) => {
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
                        await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `_*هاذا الملف خاص باإنشاء بوت جيطوسة وبوبيزة بوت قم بلصق الملف في الخانة الخاصة به*_\n\n*_البوتات المدعومة_*\n
- _github.com/noureddineouafy/bobizaa_\n
- _JITOSSA_ _*قادم قريبا...*_\n_©OMARCHARAF1_
_©noureddineouafy_` }, { quoted: xeonses });
                        await delay(100);

                        // حذف الملفات بعد الرد بنجاح على الطلب
                        await removeFile('./session');
                        resolve();
                    } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                        await delay(10000);
                        XeonPair();
                    }
                });
            } catch (err) {
                console.log("service restated");
                await removeFile('./session');
                reject(err);
            }
        });
    };

    XeonPair()
        .then(() => {
            if (!res.headersSent) {
                res.send({ code: "Service Unavailable" });
            }
        })
        .catch((err) => {
            console.error("Error:", err);
            if (!res.headersSent) {
                res.status(500).send({ error: "Internal Server Error" });
            }
        });
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
