// commands/resume.js
// คำสั่ง /resume - เล่นเพลงต่อจาก pause

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { getQueue } from '../music/queue.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('เล่นเพลงต่อจากที่ pause ไว้');

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

  // ตรวจสอบว่า pause อยู่จริง
  if (queue.audioPlayer.state.status !== AudioPlayerStatus.Paused) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setDescription('⚠️ เพลงไม่ได้ถูก pause อยู่'),
      ],
      ephemeral: true,
    });
  }

  queue.audioPlayer.unpause();
  queue.paused = false;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Green)
        .setDescription(`▶️ เล่นเพลง **${queue.currentSong.title}** ต่อแล้ว`),
    ],
  });
}
