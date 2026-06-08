// music/player.js
// ระบบเล่นเพลงหลัก: ควบคุม AudioPlayer, VoiceConnection, และ Queue

import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice';
import play from 'play-dl';
import { EmbedBuilder, Colors } from 'discord.js';
import { getQueue, deleteQueue, Song } from './queue.js';

// ระยะเวลา (ms) ที่รอก่อน bot ออกจาก VC เมื่อไม่มีเพลงในคิว
const LEAVE_TIMEOUT_MS = 5 * 60 * 1000; // 5 นาที

/**
 * แปลงวินาทีเป็น mm:ss หรือ hh:mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * ค้นหาข้อมูลเพลงจาก URL หรือชื่อเพลง
 * @param {string} query
 * @returns {Promise<Song|null>}
 */
export async function searchSong(query, requestedBy) {
  try {
    let videoInfo;

    // ตรวจสอบว่าเป็น YouTube URL หรือไม่
    const isUrl = query.startsWith('http://') || query.startsWith('https://');

    if (isUrl) {
      // ดึงข้อมูลจาก URL โดยตรง
      const info = await play.video_info(query);
      videoInfo = info.video_details;
    } else {
      // ค้นหาจากชื่อเพลง
      const results = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
      if (!results || results.length === 0) return null;
      videoInfo = results[0];
    }

    return new Song({
      title: videoInfo.title || 'Unknown Title',
      url: videoInfo.url,
      duration: formatDuration(videoInfo.durationInSec),
      thumbnail: videoInfo.thumbnails?.[0]?.url || '',
      requestedBy,
    });
  } catch (err) {
    console.error('[searchSong] Error:', err.message);
    return null;
  }
}

/**
 * สร้าง Embed สำหรับ "กำลังเล่นเพลง"
 * @param {Song} song
 * @param {number} queueLength - จำนวนเพลงในคิวที่เหลือ
 */
export function createNowPlayingEmbed(song, queueLength = 0) {
  return new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle('🎵 กำลังเล่นเพลง')
    .setDescription(`**[${song.title}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: '⏱ ระยะเวลา', value: song.duration, inline: true },
      { name: '👤 ขอโดย', value: song.requestedBy, inline: true },
      { name: '📋 เพลงในคิว', value: `${queueLength} เพลง`, inline: true },
    )
    .setFooter({ text: 'Discord Music Bot' })
    .setTimestamp();
}

/**
 * เล่นเพลงถัดไปในคิว
 * @param {string} guildId
 */
export async function playNext(guildId) {
  const queue = getQueue(guildId);

  // ถ้าคิวว่าง ให้รอแล้วออก VC
  if (queue.isEmpty) {
    queue.currentSong = null;
    if (queue.textChannel) {
      await queue.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Grey)
            .setDescription('📭 คิวเพลงหมดแล้ว Bot จะออกจาก Voice Channel ใน 5 นาที'),
        ],
      });
    }
    // ตั้ง timeout ออก VC
    scheduleLeave(guildId);
    return;
  }

  // ดึงเพลงถัดไป
  const song = queue.nextSong();
  queue.currentSong = song;

  try {
    // สร้าง audio stream จาก play-dl
    const stream = await play.stream(song.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    // เริ่มเล่น
    queue.audioPlayer.play(resource);

    // ส่ง embed แจ้งเพลงที่กำลังเล่น
    if (queue.textChannel) {
      await queue.textChannel.send({
        embeds: [createNowPlayingEmbed(song, queue.songs.length)],
      });
    }
  } catch (err) {
    console.error(`[playNext] Error playing "${song.title}":`, err.message);
    if (queue.textChannel) {
      await queue.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`❌ เล่นเพลง **${song.title}** ไม่ได้ กำลังข้ามไปเพลงถัดไป...`),
        ],
      });
    }
    // ข้ามไปเพลงถัดไปอัตโนมัติ
    await playNext(guildId);
  }
}

/**
 * เชื่อมต่อ Bot กับ VoiceChannel และตั้งค่า AudioPlayer
 * @param {import('discord.js').VoiceChannel} voiceChannel
 * @param {import('discord.js').TextChannel} textChannel
 * @param {string} guildId
 */
export async function connectAndSetup(voiceChannel, textChannel, guildId) {
  const queue = getQueue(guildId);

  // เชื่อมต่อ VoiceChannel
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  queue.connection = connection;
  queue.textChannel = textChannel;
  queue.voiceChannel = voiceChannel;

  // รอให้ connection พร้อม
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch {
    connection.destroy();
    deleteQueue(guildId);
    throw new Error('ไม่สามารถเชื่อมต่อ Voice Channel ได้');
  }

  // สร้าง AudioPlayer (ถ้ายังไม่มี)
  if (!queue.audioPlayer) {
    const player = createAudioPlayer();
    queue.audioPlayer = player;
    connection.subscribe(player);

    // เมื่อเพลงจบ → เล่นเพลงถัดไป
    player.on(AudioPlayerStatus.Idle, async () => {
      if (queue.currentSong !== null) {
        await playNext(guildId);
      }
    });

    // จัดการ error ของ player
    player.on('error', async (err) => {
      console.error('[AudioPlayer] Error:', err.message);
      await playNext(guildId);
    });
  }

  // ตรวจจับเมื่อ connection ถูกตัด
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // พยายาม reconnect
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      // ถ้า reconnect ไม่ได้ ให้ destroy และลบ queue
      connection.destroy();
      deleteQueue(guildId);
    }
  });

  // ตรวจสอบเมื่อสมาชิกออกจาก VC ทั้งหมด
  setupVoiceStateWatcher(voiceChannel.guild, guildId);
}

/**
 * ตรวจสอบ VoiceChannel: ถ้าไม่มีคนอยู่ (นอกจาก bot) ให้ออก
 * @param {import('discord.js').Guild} guild
 * @param {string} guildId
 */
function setupVoiceStateWatcher(guild, guildId) {
  const handler = (oldState, newState) => {
    const queue = getQueue(guildId);
    if (!queue.voiceChannel) return;

    // ดูจำนวนสมาชิกใน VC (ไม่นับ bot)
    const members = queue.voiceChannel.members.filter((m) => !m.user.bot);
    if (members.size === 0) {
      scheduleLeave(guildId);
    } else {
      // มีคนกลับมา → ยกเลิก timeout
      clearLeaveTimeout(guildId);
    }
  };

  guild.client.on('voiceStateUpdate', handler);
}

/**
 * ตั้ง timeout ให้ bot ออกจาก VC หลังจาก LEAVE_TIMEOUT_MS
 * @param {string} guildId
 */
export function scheduleLeave(guildId) {
  const queue = getQueue(guildId);
  clearLeaveTimeout(guildId);

  queue.leaveTimeout = setTimeout(() => {
    const q = getQueue(guildId);
    if (q.connection) {
      q.connection.destroy();
    }
    deleteQueue(guildId);
    console.log(`[Leave] Disconnected from guild ${guildId} (inactive)`);
  }, LEAVE_TIMEOUT_MS);
}

/**
 * ยกเลิก timeout ออก VC
 * @param {string} guildId
 */
export function clearLeaveTimeout(guildId) {
  const queue = getQueue(guildId);
  if (queue.leaveTimeout) {
    clearTimeout(queue.leaveTimeout);
    queue.leaveTimeout = null;
  }
}

/**
 * หยุดเพลงและออกจาก VC ทันที
 * @param {string} guildId
 */
export function stopAndLeave(guildId) {
  const queue = getQueue(guildId);
  clearLeaveTimeout(guildId);
  queue.clear();
  queue.audioPlayer?.stop(true);
  queue.connection?.destroy();
  deleteQueue(guildId);
}
