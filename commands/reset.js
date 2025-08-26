const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '..', 'scores.json');
const SCOREBOARD_CHANNEL_ID = '1409997637192781864';

// Save scores
function saveScores(scores) {
    try {
        fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
    } catch (error) {
        console.error('Error saving scores:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset all sniping scores (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Check if command is used in scoreboard channel
        if (interaction.channel.id !== SCOREBOARD_CHANNEL_ID) {
            return interaction.reply({ 
                content: '❌ This command can only be used in the sniping scoreboard channel.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ You need administrator permissions to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('⚠️ Reset Scoreboard?')
            .setDescription('This will permanently delete all scores. Click Confirm to proceed or Cancel to abort.')
            .setFooter({ text: 'This action cannot be undone!' });

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('reset_confirm')
                    .setLabel('Confirm Reset')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('reset_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [confirmRow] });
    },
};