// deploy-commands.js
// Script สำหรับ register Slash Commands กับ Discord API
// รัน: node deploy-commands.js

import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config(); // โหลด .env

const __dirname = dirname(fileURLToPath(import.meta.url));

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ ขาด environment variables: TOKEN, CLIENT_ID, หรือ GUILD_ID');
  process.exit(1);
}

const commands = [];

// โหลด command data จากทุกไฟล์ใน commands/
const commandFiles = await readdir(join(__dirname, 'commands'));
for (const file of commandFiles.filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(__dirname, 'commands', file)).href);
  if (mod.data) {
    commands.push(mod.data.toJSON());
    console.log(`✅ โหลด command: /${mod.data.name}`);
  }
}

const rest = new REST().setToken(TOKEN);

console.log(`\n🚀 กำลัง register ${commands.length} slash commands...`);

try {
  // deploy เฉพาะ guild เดียว (เร็ว ~ทันที) ใช้ตอน dev
  // ถ้าต้องการ global commands ให้เปลี่ยนเป็น Routes.applicationCommands(CLIENT_ID)
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });

  console.log(`✅ Register สำเร็จ! คำสั่งจะปรากฏใน Discord ทันที`);
} catch (err) {
  console.error('❌ Register ล้มเหลว:', err);
}
