# 🎵 Discord Music Bot

Bot เล่นเพลง Discord ด้วย Node.js — รองรับ YouTube, ระบบคิว, และ Slash Commands

---

## 📁 โครงสร้างโปรเจกต์

```
discord-music-bot/
├── index.js                  # Entry point หลัก
├── deploy-commands.js        # Register slash commands
├── package.json
├── render.yaml               # Render deployment config
├── .env                      # Environment variables (ไม่ commit!)
├── .gitignore
├── commands/
│   ├── play.js               # /play <query>
│   ├── skip.js               # /skip
│   ├── stop.js               # /stop
│   ├── pause.js              # /pause
│   ├── resume.js             # /resume
│   └── queue.js              # /queue
├── music/
│   ├── player.js             # Core player logic
│   └── queue.js              # Queue & Song classes
└── events/
    ├── ready.js              # Bot ready event
    └── interactionCreate.js  # Slash command handler
```

---

## ⚙️ คำสั่งที่รองรับ

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `/play <url หรือชื่อเพลง>` | เล่นเพลงจาก YouTube หรือค้นหาจากชื่อ |
| `/skip` | ข้ามเพลงปัจจุบัน |
| `/stop` | หยุดเพลง ล้างคิว และ bot ออกจาก VC |
| `/pause` | หยุดเพลงชั่วคราว |
| `/resume` | เล่นเพลงต่อ |
| `/queue` | แสดงรายการเพลงในคิว |

---

## 🚀 ขั้นตอน Deploy บน Render

### ขั้นตอนที่ 1: สร้าง Discord Application

1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. คลิก **New Application** → ตั้งชื่อ bot
3. ไปที่ **Bot** (ซ้ายมือ) → คลิก **Add Bot**
4. คัดลอก **Token** (เก็บไว้ใช้ใน .env)
5. เปิด **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. ไปที่ **OAuth2 > URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`
7. คัดลอก URL ที่ได้ แล้วเปิดในเบราว์เซอร์ → เพิ่ม bot เข้า server

### ขั้นตอนที่ 2: เก็บ IDs

- **CLIENT_ID** (Application ID): General Information → Application ID
- **GUILD_ID** (Server ID): เปิด Discord → Settings → Advanced → เปิด Developer Mode → right-click server → Copy ID
- **TOKEN**: Bot → Reset Token → Copy

### ขั้นตอนที่ 3: รันในเครื่องก่อน (ทดสอบ)

```bash
# Clone/copy โปรเจกต์
cd discord-music-bot

# ติดตั้ง dependencies
npm install

# สร้าง .env แล้วใส่ค่าจริง
cp .env .env.local
# แก้ TOKEN, CLIENT_ID, GUILD_ID

# Register slash commands (ทำครั้งเดียว หรือเมื่อเพิ่ม command ใหม่)
node deploy-commands.js

# รัน bot
npm start
```

### ขั้นตอนที่ 4: Push โค้ดขึ้น GitHub

```bash
git init
git add .
git commit -m "Initial Discord Music Bot"
git remote add origin https://github.com/YOUR_USERNAME/discord-music-bot.git
git push -u origin main
```

> ⚠️ ตรวจสอบว่า `.gitignore` มี `.env` อยู่ด้วย — **ห้าม** push .env ขึ้น GitHub เด็ดขาด!

### ขั้นตอนที่ 5: Deploy บน Render

1. ไปที่ [render.com](https://render.com) → Sign up / Login
2. คลิก **New** → **Background Worker**
3. เลือก **Connect GitHub** → เลือก repo ที่ push ไว้
4. ตั้งค่า:
   - **Name**: `discord-music-bot`
   - **Region**: Singapore (ใกล้ไทย)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. เพิ่ม **Environment Variables** (คลิก "Add Environment Variable"):
   - `TOKEN` = your_bot_token
   - `CLIENT_ID` = your_application_id
   - `GUILD_ID` = your_guild_id
6. คลิก **Create Background Worker**

### ขั้นตอนที่ 6: Register Slash Commands บน Render

หลัง deploy เสร็จ ไปที่ **Shell** tab ใน Render dashboard แล้วรัน:

```bash
node deploy-commands.js
```

> คำสั่งจะปรากฏใน Discord ทันที (Guild Commands) หรือรอ ~1 ชม (Global Commands)

---

## 🔧 Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|--------|
| Bot ไม่ตอบสนอง | ตรวจสอบ TOKEN ใน Environment Variables |
| ไม่เห็น Slash Commands | รัน `node deploy-commands.js` อีกครั้ง |
| Bot เข้า VC ไม่ได้ | ตรวจสอบ Permission: Connect + Speak |
| เล่นเพลงไม่ออก | ตรวจสอบว่า `@discordjs/opus` ติดตั้งสำเร็จ |
| Free tier หยุดทำงาน | อัปเกรดเป็น Starter plan ($7/เดือน) เพื่อให้ทำงาน 24/7 |

---

## 📝 หมายเหตุสำคัญ

- **Free tier บน Render** จะ sleep หลังจากไม่มี HTTP request 15 นาที
  - Background Worker ไม่มีปัญหานี้ แต่อาจมี limit ชั่วโมงต่อเดือน
  - แนะนำใช้ **Starter plan** สำหรับ bot ที่ต้องรัน 24/7
- **play-dl** รองรับ YouTube โดยไม่ต้องใช้ API key แต่อาจโดน rate limit
- หาก YouTube block → ลองตั้งค่า cookies ใน play-dl
# discord-music-bot-main
# discord-music-bot-main
# discord-music-bot-main
# discord-music-bot-main
