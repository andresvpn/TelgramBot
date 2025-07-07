const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN = '7757149510:AAF836vmxzIzFi56jAef6_tlrP8EuHPcYLU';
const BASE_URL = 'https://myfilestream.vercel.app';
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Comando /start
bot.start((ctx) => {
  ctx.reply(`👋 Hola ${ctx.from.first_name}!\nEnvía un video y recibirás un link de streaming.\n\nby: @ANDRES_VPN`);
});

// Procesar cualquier video
bot.on('video', async (ctx) => {
  try {
    const video = ctx.message.video;
    const fileInfo = await ctx.telegram.getFile(video.file_id);
    const filePath = fileInfo.file_path;
    const ext = video.mime_type?.split('/')[1] || 'mp4';
    const encoded = Buffer.from(filePath).toString('base64url');
    const url = `${BASE_URL}/file/${encoded}.${ext}`;
    ctx.reply(`🎬 Tu link de streaming:\n${url}\n\nby: @ANDRES_VPN`);
  } catch (e) {
    console.error('Error procesando video:', e);
    ctx.reply('❌ Hubo un error con tu video. Intenta nuevamente.');
  }
});

// Serve streaming endpoint
app.get('/file/:id', async (req, res) => {
  try {
    const [enc, ext] = req.params.id.split('.');
    const path = Buffer.from(enc, 'base64url').toString();
    const tgUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`;
    const resp = await axios.get(tgUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', `video/${ext}`);
    res.setHeader('Accept-Ranges', 'bytes');
    resp.data.pipe(res);
  } catch (e) {
    console.error('Error en streaming:', e);
    res.status(500).send('❌ No se pudo transmitir el video.');
  }
});

// Root web response
app.get('/', (_, res) => res.send('✅ Bot funcionando por polling y streaming listo 🚀'));

// Monta express y bot
app.use(bot.webhookCallback ? bot.webhookCallback('/bot') : (req, res, next) => next());

// Inicia express server
app.listen(PORT, () => {
  console.log(`Server escuchando en puerto ${PORT}`);
});

// Lanzar bot con polling
bot.launch().then(() =>
  console.log('🤖 Bot lanzado con polling. En Telegram ya está activo.')
);

// Manejo de cierre limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
