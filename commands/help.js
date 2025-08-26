const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const SCOREBOARD_CHANNEL_ID = '1409997637192781864';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show sniping bot commands and usage information'),
    
    async execute(interaction) {
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isScoreboardChannel = interaction.channel.id === SCOREBOARD_CHANNEL_ID;

        let description = `**🎯 How the Sniping Game Works:**
• Post photos in the sniping channel to start a snipe
• If you include @username with your photo, it skips straight to confirmation
• Otherwise, tag someone in the thread or self-confirm by reacting ✅
• The sniped person confirms with ✅ to award points
• Check the leaderboard in the scoreboard channel

**📸 Photo Requirements:**
• Must be an actual image attachment
• Posted in the designated sniping channel
• Should show a club member riding without acknowledging the camera`;

        if (isAdmin && isScoreboardChannel) {
            description += `\n\n**🛠️ Admin Commands:**
\`/adjust @user points\` - Add or subtract points from a user
\`/reset\` - Clear all scores (requires confirmation)
\`/help\` - Show this help message`;
        } else if (isAdmin) {
            description += `\n\n**ℹ️ Admin Note:**
Use admin commands in the scoreboard channel for score management.`;
        }

        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('🏍️ Motorcycle Club Sniping Bot Help')
            .setDescription(description)
            .setFooter({ text: 'Good luck hunting! 📸' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};