// index.js
// Entry point หลักของ Discord Music Bot

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// โหลด environment variables จาก .env
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const { TOKEN } = process.env;
if (!TOKEN) {
  console.error('❌ ไม่พบ TOKEN ใน environment variables');
  process.exit(1);
}

// ========== สร้าง Discord Client ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // ข้อมูล server
    GatewayIntentBits.GuildVoiceStates, // ตรวจจับ voice state (join/leave VC)
    GatewayIntentBits.GuildMessages,    // รับ message events (optional แต่ดีไว้)
  ],
});

// Collection สำหรับเก็บ commands
client.commands = new Collection();

// ========== โหลด Commands ==========
const commandDir = join(__dirname, 'commands');
const commandFiles = await readdir(commandDir);

for (const file of commandFiles.filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(commandDir, file)).href);
  if (mod.data && mod.execute) {
    client.commands.set(mod.data.name, mod);
    console.log(`📦 Loaded command: /${mod.data.name}`);
  } else {
    console.warn(`⚠️  ${file} ไม่มี data หรือ execute`);
  }
}

// ========== โหลด Events ==========
const eventDir = join(__dirname, 'events');
const eventFiles = await readdir(eventDir);

for (const file of eventFiles.filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(eventDir, file)).href);
  if (mod.once) {
    client.once(mod.name, (...args) => mod.execute(...args));
  } else {
    client.on(mod.name, (...args) => mod.execute(...args));
  }
  console.log(`📡 Loaded event: ${mod.name}`);
}

// ========== Global Error Handling ==========
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  // ไม่ต้อง exit เพราะ Discord bot ต้องรันต่อเนื่อง
});

// ========== Login ==========
console.log('🔐 กำลัง login...');
await client.login(TOKEN);
