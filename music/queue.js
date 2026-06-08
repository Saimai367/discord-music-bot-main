// music/queue.js
// ระบบจัดการคิวเพลงของแต่ละ Server (Guild)

export class Song {
  /**
   * @param {Object} opts
   * @param {string} opts.title      - ชื่อเพลง
   * @param {string} opts.url        - YouTube URL
   * @param {string} opts.duration   - ระยะเวลา (mm:ss)
   * @param {string} opts.thumbnail  - URL รูปภาพ
   * @param {string} opts.requestedBy - ผู้ขอเพลง (username)
   */
  constructor({ title, url, duration, thumbnail, requestedBy }) {
    this.title = title;
    this.url = url;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.requestedBy = requestedBy;
  }
}

export class GuildQueue {
  constructor(guildId) {
    this.guildId = guildId;

    /** @type {Song[]} รายการเพลงที่รอเล่น */
    this.songs = [];

    /** @type {Song|null} เพลงที่กำลังเล่นอยู่ */
    this.currentSong = null;

    /** @type {import('@discordjs/voice').VoiceConnection|null} */
    this.connection = null;

    /** @type {import('@discordjs/voice').AudioPlayer|null} */
    this.audioPlayer = null;

    /** สถานะ pause */
    this.paused = false;

    /** TextChannel สำหรับส่ง embed */
    this.textChannel = null;

    /** VoiceChannel ปัจจุบัน */
    this.voiceChannel = null;

    /** Timeout สำหรับออกจาก VC เมื่อไม่มีคน */
    this.leaveTimeout = null;
  }

  /** เพิ่มเพลงเข้าคิว */
  addSong(song) {
    this.songs.push(song);
  }

  /** ดึงเพลงถัดไปออกจากคิว */
  nextSong() {
    return this.songs.shift() || null;
  }

  /** เคลียร์คิวทั้งหมด */
  clear() {
    this.songs = [];
    this.currentSong = null;
  }

  /** ตรวจสอบว่าคิวว่างเปล่า */
  get isEmpty() {
    return this.songs.length === 0;
  }
}

// เก็บ GuildQueue แยกตาม guildId
const queues = new Map();

/**
 * ดึง GuildQueue ของ guild นั้น (สร้างใหม่ถ้ายังไม่มี)
 * @param {string} guildId
 * @returns {GuildQueue}
 */
export function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new GuildQueue(guildId));
  }
  return queues.get(guildId);
}

/**
 * ลบ GuildQueue ของ guild นั้นทิ้ง
 * @param {string} guildId
 */
export function deleteQueue(guildId) {
  queues.delete(guildId);
}
