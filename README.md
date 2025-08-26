# 🏍️ Motorcycle Club Sniping Bot

A Discord bot for running a motorcycle club "sniping" game where members try to photograph each other riding without being noticed.

## Features

- 📸 **Photo Detection**: Automatically detects images posted in the sniping channel
- 🧵 **Thread Creation**: Creates organized threads for each snipe attempt  
- ⚡ **Streamlined Flow**: Post photo + @mention to skip straight to confirmation
- 🔒 **Self-Confirmation Safety**: Prevents accidental confirmations with button prompts
- 🏆 **Live Leaderboard**: Real-time scoreboard with rankings and medals
- ⚙️ **Admin Commands**: Modern slash commands for score management
- 🛡️ **Secure**: Environment variables for token storage

## Setup

### 1. Prerequisites
- Node.js 18+ installed
- Discord bot created in [Discord Developer Portal](https://discord.com/developers/applications)
- Bot invited to server with proper permissions

### 2. Installation

```bash
npm install
```

### 3. Configuration

Copy `.env.example` to `.env` and fill in your bot details:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_guild_id_here_for_testing
```

**Note**: Remove `GUILD_ID` or leave blank to deploy commands globally.

### 4. Deploy Slash Commands

```bash
npm run deploy
```

### 5. Start the Bot

```bash
npm start
```

## How It Works

### For Members
1. **Take a snipe photo** of a club member riding without them noticing
2. **Post in sniping channel** with optional @mention for instant confirmation
3. **Tag the person** in the thread if no mention was included
4. **Wait for confirmation** from the sniped member
5. **Earn points** when confirmed!

### Self-Confirmation
If you were sniped, you can confirm it yourself:
1. React ✅ to the "New Snipe Detected" message
2. Click "Yes, I was sniped" in the confirmation prompt
3. Points are awarded to the sniper

## Admin Commands

All commands use modern Discord slash commands:

- `/adjust @user points` - Add or subtract points from a user
- `/reset` - Reset all scores (requires confirmation)  
- `/help` - Show help and usage information

## Channel Setup

Create these channels in your Discord server:
- `#sniping` or similar (for posting snipe photos)
- `#sniping-scoreboard` or similar (for the leaderboard)

Update the channel IDs in `bot.js`:
```javascript
const SNIPING_CHANNEL_ID = 'your_sniping_channel_id';
const SCOREBOARD_CHANNEL_ID = 'your_scoreboard_channel_id';
```

## Bot Permissions

When inviting the bot, ensure it has these permissions:
- View Channels
- Send Messages
- Create Public Threads  
- Use External Emojis
- Add Reactions
- Read Message History
- Use Slash Commands

**Permissions Integer**: `75792`

## Development

```bash
# Start with auto-reload
npm run dev

# Deploy commands to test server only
# (Set GUILD_ID in .env first)
npm run deploy
```

## Security

- Bot token is stored securely in environment variables
- `.env` files are automatically ignored by git
- No secrets are committed to the repository

## License

MIT License - Feel free to modify for your club!

---

*Built with Discord.js v14 and modern interaction patterns* 🤖
