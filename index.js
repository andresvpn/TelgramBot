const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN = '7757149510:AAF836vmxzIzFi56jAef6_tlrP8EuHPcYLU';
const BASE_URL = 'https://myfilestream.vercel.app'; // ✅ Ya configurado

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Comando /start
bot.start((ctx) => {
  ctx.reply(`👋 Hola ${ctx.from.first_name}!\nEnvía un video y recibirás un link de streaming.\n\nby: @ANDRES_VPN`);
});

// Procesar videos
bot.on('video', async (ctx) => {
  try {
    const video = ctx.message.video;
    const fileInfo = await ctx.telegram.getFile(video.file_id);
    const filePath = fileInfo.file_path;
    const extension = video.mime_type?.split('/')[1] || 'mp4';
    const encoded = Buffer.from(filePath).toString('base64url');
    const streamUrl = `${BASE_URL}/file/${encoded}.${extension}`;

    ctx.reply(`🎬 Tu enlace de streaming:\n${streamUrl}\n\nby: @ANDRES_VPN`);
  } catch (err) {
    console.error('❌ Error al procesar el video:', err);
    ctx.reply('❌ Hubo un error procesando tu video.');
  }
});

// Endpoint para transmitir sin guardar local
app.get('/file/:id', async (req, res) => {
  try {
    const [encoded, ext] = req.params.id.split('.');
    const filePath = Buffer.from(encoded, 'base64url').toString();
    const tgUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const response = await axios.get(tgUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', `video/${ext}`);
    res.setHeader('Accept-Ranges', 'bytes');
    response.data.pipe(res);
  } catch (err) {
    console.error('❌ Error en streaming:', err);
    res.status(500).send('❌ Error al transmitir el archivo.');
  }
});

// Página base
app.get('/', (req, res) => {
  res.send('✅ Bot activo - by @ANDRES_VPN');
});

// Webhook
bot.telegram.setWebhook(`${BASE_URL}/api/bot`);
app.use('/api/bot', bot.webhookCallback('/api/bot'));

module.exports = app;
