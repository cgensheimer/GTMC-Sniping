const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.BOT_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Get CLIENT_ID from environment or prompt user to add it
        const clientId = process.env.CLIENT_ID;
        if (!clientId) {
            console.error('CLIENT_ID not found in .env file. Please add your bot\'s client ID to the .env file.');
            console.log('You can find your CLIENT_ID in the Discord Developer Portal under your bot\'s "General Information" page.');
            process.exit(1);
        }

        // Check if GUILD_ID is set for guild-specific deployment (testing)
        const guildId = process.env.GUILD_ID;
        
        let data;
        if (guildId) {
            // Deploy to specific guild (for testing)
            console.log(`Deploying to guild ${guildId}...`);
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
        } else {
            // Deploy globally
            console.log('Deploying globally...');
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
        }

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        
        if (guildId) {
            console.log('Commands deployed to guild. Remove GUILD_ID from .env to deploy globally.');
        } else {
            console.log('Commands deployed globally. It may take up to 1 hour for global commands to appear in all servers.');
        }
        
    } catch (error) {
        console.error(error);
    }
})();