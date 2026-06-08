// commands/stop.js
// คำสั่ง /stop - หยุดเพลงและล้างคิว bot ออกจาก VC

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getQueue } from '../music/queue.js';
import { stopAndLeave } from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('หยุดเพลง ล้างคิว และให้ Bot ออกจาก Voice Channel');

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

  if (!queue.currentSong && queue.isEmpty) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription('❌ ไม่มีเพลงที่กำลังเล่นอยู่'),
      ],
      ephemeral: true,
    });
  }

  stopAndLeave(interaction.guildId);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription('⏹ หยุดเพลง ล้างคิว และ Bot ออกจาก Voice Channel แล้ว'),
    ],
  });
}
