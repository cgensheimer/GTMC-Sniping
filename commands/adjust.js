const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '..', 'scores.json');
const SCOREBOARD_CHANNEL_ID = '1409997637192781864';

// Load scores
function loadScores() {
    try {
        if (fs.existsSync(SCORES_FILE)) {
            return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading scores:', error);
    }
    return {};
}

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
        .setName('adjust')
        .setDescription('Adjust a user\'s sniping score (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to adjust score for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Points to add (use negative numbers to subtract)')
                .setRequired(true))
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

        const user = interaction.options.getUser('user');
        const adjustment = interaction.options.getInteger('points');

        // Load current scores
        let scores = loadScores();
        
        // Initialize user score if doesn't exist
        if (!scores[user.id]) scores[user.id] = 0;
        
        // Apply adjustment
        scores[user.id] += adjustment;
        
        // Don't allow negative scores
        if (scores[user.id] < 0) scores[user.id] = 0;
        
        // Save scores
        saveScores(scores);

        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('📊 Score Adjusted')
            .setDescription(`<@${user.id}>'s score has been adjusted by **${adjustment > 0 ? '+' : ''}${adjustment}**\n\nNew score: **${scores[user.id]}** point${scores[user.id] === 1 ? '' : 's'}`)
            .setFooter({ text: `Adjusted by ${interaction.user.displayName}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Update scoreboard
        const { updateScoreboard } = require('../bot.js');
        updateScoreboard();
    },
};