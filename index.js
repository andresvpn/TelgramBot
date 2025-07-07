const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');
const app = express();

// 🔒 Configuración directa
const BOT_TOKEN = '7757149510:AAF836vmxzIzFi56jAef6_tlrP8EuHPcYLU';
const ADMIN_ID = 5653464056;
const BASE_URL = 'https://TUBOT.vercel.app'; // Reemplázalo con tu dominio real de Vercel

const bot = new Telegraf(BOT_TOKEN);

// 🎥 Escucha solo videos de Andrés
bot.on('video', async (ctx) => {
  try {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.reply('❌ No estás autorizado para usar este bot.');
    }

    const video = ctx.message.video;
    const fileId = video.file_id;
    const fileInfo = await ctx.telegram.getFile(fileId);
    const filePath = fileInfo.file_path;

    const extension = video.mime_type?.split('/')[1] || 'mp4';
    const encoded = Buffer.from(filePath).toString('base64url');
    const streamUrl = `${BASE_URL}/file/${encoded}.${extension}`;

    ctx.reply(`🎬 Tu video está listo para streaming:\n${streamUrl}`);
  } catch (err) {
    console.error('❌ Error al procesar el video:', err.message);
    ctx.reply('❌ Ocurrió un error al procesar el video.');
  }
});

// 📽️ Streaming sin guardar archivo local
app.get('/file/:id', async (req, res) => {
  try {
    const [encoded, ext] = req.params.id.split('.');
    const filePath = Buffer.from(encoded, 'base64url').toString();
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    res.setHeader('Content-Type', `video/${ext}`);
    res.setHeader('Accept-Ranges', 'bytes');
    response.data.pipe(res);
  } catch (err) {
    console.error('❌ Error en streaming:', err.message);
    res.status(500).send('❌ Error al procesar el archivo.');
  }
});

// 🟢 Webhook & raíz
app.get('/', (_, res) => {
  res.send('✅ Bot de streaming activo By: @ANDRES_VPN');
});

bot.telegram.setWebhook(`${BASE_URL}/api/bot`);
app.use('/api/bot', bot.webhookCallback('/api/bot'));

module.exports = app;
