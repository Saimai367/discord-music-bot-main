// commands/pause.js
// คำสั่ง /pause - หยุดเพลงชั่วคราว

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { getQueue } from '../music/queue.js';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('หยุดเพลงชั่วคราว');

export async function execute(interaction) {
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

  if (!queue.currentSong || !queue.audioPlayer) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription('❌ ไม่มีเพลงที่กำลังเล่นอยู่'),
      ],
      ephemeral: true,
    });
  }

  // ตรวจสอบว่าเล่นอยู่จริง ๆ
  if (queue.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setDescription('⚠️ เพลงถูก pause อยู่แล้ว'),
      ],
      ephemeral: true,
    });
  }

  queue.audioPlayer.pause();
  queue.paused = true;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setDescription(`⏸ Pause เพลง **${queue.currentSong.title}** แล้ว\nพิมพ์ /resume เพื่อเล่นต่อ`),
    ],
  });
}
