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
                // تحديث قيمة browser هنا
                browser: ["Debian", "Chrome", "20.0.04"],
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
                    XeonBotInc.sendMessage(XeonBotInc.user.id, { audio: audioxeon, mimetype: 'audio/mp4', ptt: true }, { quoted: xeonses });
                    await XeonBotInc.sendMessage(XeonBotInc.user.id, { text: `_*انت قريب من أن تصنع البوت الخاص بك*_\n_قم بنسخ محتوى الملف  cards.json قوم بلصقه في الfork الخاص بيك في github/JitossaSession_\n\n instagram\n instagram.com/ovmar_1\n telegram\n @Jinkx7\n whatsapp\n+212670941551\n\n ©JITOSSA-OMAR` }, { quoted: xeonses });
                    await delay(100);

                    // تنفيذ الأوامر الإضافية هنا

                    return await removeFile('./session');
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair(); // إعادة المحاولة في حالة الاستثناء
                }
            });
        } catch (err) {
            console.log("service restated");
            if (!res.headersSent) {
                await res.status(503).send({ error: "Service Unavailable" }); // إرسال استجابة 503
            }
            await removeFile('./session');
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