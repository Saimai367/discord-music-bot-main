// commands/queue.js
// คำสั่ง /queue - แสดงรายการเพลงในคิว

import { SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';
import { getQueue } from '../music/queue.js';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('แสดงรายการเพลงในคิว');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);

  // ไม่มีเพลงเล่นและคิวว่าง
  if (!queue.currentSong && queue.isEmpty) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Grey)
          .setDescription('📭 ไม่มีเพลงในคิว ใช้ /play เพื่อเพิ่มเพลง'),
      ],
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Purple)
    .setTitle('📋 คิวเพลง');

  // แสดงเพลงที่กำลังเล่นอยู่
  if (queue.currentSong) {
    const statusEmoji = queue.paused ? '⏸' : '▶️';
    embed.addFields({
      name: `${statusEmoji} กำลังเล่นอยู่`,
      value: `**[${queue.currentSong.title}](${queue.currentSong.url})**\n⏱ ${queue.currentSong.duration} | 👤 ${queue.currentSong.requestedBy}`,
    });
  }

  // แสดงเพลงในคิว (แสดงสูงสุด 10 เพลง)
  if (!queue.isEmpty) {
    const MAX_DISPLAY = 10;
    const displaySongs = queue.songs.slice(0, MAX_DISPLAY);
    const remaining = queue.songs.length - MAX_DISPLAY;

    const queueList = displaySongs
      .map((song, i) => `\`${i + 1}.\` **[${song.title}](${song.url})**\n⏱ ${song.duration} | 👤 ${song.requestedBy}`)
      .join('\n\n');

    embed.addFields({
      name: `📋 คิวถัดไป (${queue.songs.length} เพลง)`,
      value: queueList + (remaining > 0 ? `\n\n...และอีก **${remaining}** เพลง` : ''),
    });
  } else {
    embed.addFields({
      name: '📋 คิวถัดไป',
      value: 'ไม่มีเพลงในคิว',
    });
  }

  embed.setFooter({ text: `รวม ${queue.songs.length} เพลงในคิว` });

  await interaction.reply({ embeds: [embed] });
}
