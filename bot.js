const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN;
const SNIPING_CHANNEL_ID = '1366480642459701368';
const SCOREBOARD_CHANNEL_ID = '1409997637192781864';

// File to store scores
const SCORES_FILE = path.join(__dirname, 'scores.json');

// Initialize scores
let scores = {};
try {
    if (fs.existsSync(SCORES_FILE)) {
        scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Error loading scores:', error);
    scores = {};
}

// Save scores to file
function saveScores() {
    try {
        fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
    } catch (error) {
        console.error('Error saving scores:', error);
    }
}

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Load slash commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Bot ready event
client.once('clientReady', () => {
    console.log(`${client.user.tag} is ready for sniping!`);
    updateScoreboard();
});

// Handle new messages
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message is in sniping channel and has attachments (photos)
    if (message.channel.id === SNIPING_CHANNEL_ID && message.attachments.size > 0) {
        // Check if any attachment is an image
        const hasImage = message.attachments.some(attachment => 
            attachment.contentType && attachment.contentType.startsWith('image/')
        );
        
        if (hasImage) {
            // Check if photo includes a user mention - if so, skip to confirmation
            if (message.mentions.users.size > 0) {
                const mentionedUser = message.mentions.users.first();
                
                if (mentionedUser && mentionedUser.id !== message.author.id) {
                    // Create thread and go straight to confirmation
                    try {
                        const thread = await message.startThread({
                            name: `Snipe by ${message.author.displayName}`,
                            autoArchiveDuration: 1440, // 24 hours
                            reason: 'New sniping attempt'
                        });
                        
                        const embed = new EmbedBuilder()
                            .setColor('#4CAF50')
                            .setTitle('✅ Confirm Snipe')
                            .setDescription(`<@${mentionedUser.id}>, you've been accused of being sniped by <@${message.author.id}>!\n\nReact with ✅ to confirm this snipe.`)
                            .setFooter({ text: 'Click the checkmark to confirm' })
                            .setTimestamp();
                        
                        const confirmMessage = await thread.send({ embeds: [embed] });
                        await confirmMessage.react('✅');
                        
                        // Store snipe data for reaction handling
                        confirmMessage.snipeData = {
                            sniper: message.author.id,
                            sniped: mentionedUser.id,
                            originalMessage: message
                        };
                        
                        return; // Skip the regular flow
                    } catch (error) {
                        console.error('Error creating thread for direct snipe:', error);
                    }
                }
            }
            
            // Regular flow: Create a thread for this snipe
            try {
                const thread = await message.startThread({
                    name: `Snipe by ${message.author.displayName}`,
                    autoArchiveDuration: 1440, // 24 hours
                    reason: 'New sniping attempt'
                });
                
                // Send the initial bot response in the thread
                const embed = new EmbedBuilder()
                    .setColor('#FF6B35')
                    .setTitle('🎯 New Snipe Detected!')
                    .setDescription('Who do you think you have sniped?\n\n**Instructions:**\n• Tag the person you sniped using @username\n• Or if you were sniped, you can confirm it yourself first!\n• The sniped person will need to confirm with a ✅ reaction')
                    .setFooter({ text: 'Motorcycle Club Sniping Game' })
                    .setTimestamp();
                
                const snipeMessage = await thread.send({ embeds: [embed] });
                await snipeMessage.react('✅');
                
                // Store data for self-confirmation
                snipeMessage.snipeData = {
                    sniper: message.author.id,
                    originalMessage: message,
                    isSelfConfirm: true
                };
                
            } catch (error) {
                console.error('Error creating thread:', error);
                // Fallback: send message in main channel
                const embed = new EmbedBuilder()
                    .setColor('#FF6B35')
                    .setTitle('🎯 New Snipe Detected!')
                    .setDescription('Who do you think you have sniped?\n\nTag the person you sniped using @username, or if you were sniped, confirm it yourself!')
                    .setFooter({ text: 'Reply to this message' });
                
                await message.reply({ embeds: [embed] });
            }
        }
    }
});

// Handle when someone mentions a user (potential snipe target)
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message is ONLY in a sniping thread (not main channel) and mentions users
    const isSnipingThread = message.channel.isThread() && message.channel.parent?.id === SNIPING_CHANNEL_ID;
    
    if (isSnipingThread && message.mentions.users.size > 0) {
        // Get the mentioned user (assuming only one for simplicity)
        const mentionedUser = message.mentions.users.first();
        
        if (mentionedUser && mentionedUser.id !== message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Confirm Snipe')
                .setDescription(`<@${mentionedUser.id}>, you've been accused of being sniped by <@${message.author.id}>!\n\nReact with ✅ to confirm this snipe.`)
                .setFooter({ text: 'Click the checkmark to confirm' })
                .setTimestamp();
            
            const confirmMessage = await message.reply({ embeds: [embed] });
            await confirmMessage.react('✅');
            
            // Store snipe data for reaction handling
            confirmMessage.snipeData = {
                sniper: message.author.id,
                sniped: mentionedUser.id,
                originalMessage: message
            };
        }
    }
});

// Handle reactions (for confirming snipes)
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions and partial reactions
    if (user.bot) return;
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    
    // Check if this is a confirmation reaction
    if (reaction.emoji.name === '✅' && reaction.message.snipeData) {
        const { sniper, sniped, originalMessage, isSelfConfirm } = reaction.message.snipeData;
        
        // Handle self-confirmation (reacting to initial snipe message)
        if (isSelfConfirm && user.id !== sniper) {
            // User is trying to self-confirm - ask for confirmation first
            const confirmEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Confirm Self-Snipe')
                .setDescription(`<@${user.id}>, are you confirming that you were sniped by <@${sniper}>?`)
                .setFooter({ text: 'Click Yes to confirm or No to cancel' });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_yes')
                        .setLabel('Yes, I was sniped')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('confirm_no')
                        .setLabel('No, cancel')
                        .setStyle(ButtonStyle.Danger)
                );

            const confirmMessage = await reaction.message.reply({ 
                embeds: [confirmEmbed], 
                components: [confirmRow] 
            });

            // Store confirmation data
            confirmMessage.confirmData = {
                sniper: sniper,
                sniped: user.id,
                originalSnipeMessage: reaction.message
            };
            
        } else if (!isSelfConfirm && user.id === sniped) {
            // Original behavior: only the sniped person can confirm
            // Update scores
            if (!scores[sniper]) scores[sniper] = 0;
            scores[sniper]++;
            saveScores();
            
            // Send confirmation message
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎯 SNIPE CONFIRMED!')
                .setDescription(`<@${sniper}> successfully sniped <@${sniped}>!\n\n**Score Update:**\n<@${sniper}> now has **${scores[sniper]}** point${scores[sniper] === 1 ? '' : 's'}!`)
                .setFooter({ text: 'Great shot!' })
                .setTimestamp();
            
            await reaction.message.edit({ embeds: [embed] });
            
            // Update scoreboard
            updateScoreboard();
            
            // Clean up snipe data
            delete reaction.message.snipeData;
        }
    }
});

// Function to update scoreboard
async function updateScoreboard() {
    try {
        const guilds = client.guilds.cache;
        
        for (const [guildId, guild] of guilds) {
            const scoreboardChannel = guild.channels.cache.get(SCOREBOARD_CHANNEL_ID);
            
            if (scoreboardChannel) {
                // Sort scores
                const sortedScores = Object.entries(scores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10); // Top 10
                
                let description = '';
                if (sortedScores.length === 0) {
                    description = 'No snipes recorded yet! Time to start hunting! 🏍️📸';
                } else {
                    description = sortedScores.map(([userId, score], index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏍️';
                        return `${medal} <@${userId}>: **${score}** point${score === 1 ? '' : 's'}`;
                    }).join('\n');
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎯 SNIPING LEADERBOARD 🎯')
                    .setDescription(description)
                    .setFooter({ text: `Last updated: ${new Date().toLocaleString()}` })
                    .setTimestamp();
                
                // Try to find existing scoreboard message and update it
                const messages = await scoreboardChannel.messages.fetch({ limit: 10 });
                const existingScoreboard = messages.find(msg => 
                    msg.author.id === client.user.id && 
                    msg.embeds[0]?.title?.includes('LEADERBOARD')
                );
                
                if (existingScoreboard) {
                    await existingScoreboard.edit({ embeds: [embed] });
                } else {
                    await scoreboardChannel.send({ embeds: [embed] });
                }
            }
        }
    } catch (error) {
        console.error('Error updating scoreboard:', error);
    }
}

// Handle all interactions
client.on('interactionCreate', async (interaction) => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
        // Self-confirmation buttons
        if (interaction.customId === 'confirm_yes' && interaction.message.confirmData) {
            const { sniper, sniped, originalSnipeMessage } = interaction.message.confirmData;
            
            // Only the person who reacted can confirm
            if (interaction.user.id === sniped) {
                // Update scores
                if (!scores[sniper]) scores[sniper] = 0;
                scores[sniper]++;
                saveScores();

                // Send confirmation message
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎯 SNIPE CONFIRMED!')
                    .setDescription(`<@${sniper}> successfully sniped <@${sniped}>!\n\n**Score Update:**\n<@${sniper}> now has **${scores[sniper]}** point${scores[sniper] === 1 ? '' : 's'}!`)
                    .setFooter({ text: 'Self-confirmed snipe!' })
                    .setTimestamp();

                await originalSnipeMessage.edit({ embeds: [embed] });
                await interaction.update({ content: '✅ Snipe confirmed!', embeds: [], components: [] });

                // Update scoreboard
                updateScoreboard();

                // Clean up data
                delete originalSnipeMessage.snipeData;
                delete interaction.message.confirmData;
            } else {
                await interaction.reply({ content: 'Only the person who reacted can confirm this.', ephemeral: true });
            }
        } else if (interaction.customId === 'confirm_no' && interaction.message.confirmData) {
            if (interaction.user.id === interaction.message.confirmData.sniped) {
                await interaction.update({ content: '❌ Self-confirmation cancelled.', embeds: [], components: [] });
                delete interaction.message.confirmData;
            } else {
                await interaction.reply({ content: 'Only the person who reacted can cancel this.', ephemeral: true });
            }
        }
        // Reset confirmation buttons
        else if (interaction.customId === 'reset_confirm') {
            // Check admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ You need administrator permissions to reset scores.', ephemeral: true });
            }

            // Reset scores
            scores = {};
            saveScores();

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗑️ Scoreboard Reset')
                .setDescription('All scores have been cleared!')
                .setFooter({ text: `Reset by ${interaction.user.displayName}` })
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
            updateScoreboard();
        } else if (interaction.customId === 'reset_cancel') {
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Reset Cancelled')
                .setDescription('Scoreboard reset has been cancelled.');

            await interaction.update({ embeds: [embed], components: [] });
        }
    }
});


// Handle errors
client.on('error', console.error);

// Login to Discord
client.login(BOT_TOKEN);

module.exports = { client, scores, updateScoreboard, saveScores };