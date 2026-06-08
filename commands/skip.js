// commands/skip.js
// คำสั่ง /skip - ข้ามเพลงปัจจุบัน

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getQueue } from '../music/queue.js';
import { playNext } from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('ข้ามเพลงปัจจุบัน');

export async function execute(interaction) {
  // ตรวจสอบว่าอยู่ใน Voice Channel
  if (!interaction.member?.voice?.channel) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription('❌ คุณต้องเข้า Voice Channel ก่อนใช้คำสั่งนี้'),
      ],
      ephemeral: true,
    });
  }

  const queue = getQueue(interaction.guildId);

  // ตรวจสอบว่ามีเพลงเล่นอยู่
  if (!queue.currentSong) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription('❌ ไม่มีเพลงที่กำลังเล่นอยู่'),
      ],
      ephemeral: true,
    });
  }

  const skipped = queue.currentSong;

  // หยุดเพลงปัจจุบัน → AudioPlayer จะ emit Idle → playNext อัตโนมัติ
  // แต่เราต้อง set currentSong = null ก่อนเพื่อป้องกัน playNext วนซ้ำ
  queue.currentSong = null;
  queue.audioPlayer?.stop();

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Blue)
        .setDescription(`⏭ ข้ามเพลง **${skipped.title}** แล้ว`),
    ],
  });
}
