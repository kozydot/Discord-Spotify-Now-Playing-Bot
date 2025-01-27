# Discord Spotify Now Playing Bot

A Discord bot that displays your current Spotify activity in real-time. The bot creates new messages for each song you play, showing the song title, artist, album, and artwork.

## Features

- 🎵 Real-time Spotify song updates
- 🎨 Beautiful embeds with album artwork
- 🔗 Direct links to songs on Spotify
- 👤 Shows who's listening
- ⚡ Slash command support
- 📊 Detailed CLI output with song information

## Prerequisites

- Node.js v16 or higher
- A Discord account and a server where you have admin permissions
- A Spotify Premium account

## Setup

### 1. Clone the Repository
```bash
git clone [your-repo-url]
cd discord-spotify-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name your bot
3. Go to the "Bot" section
4. Click "Reset Token" and copy the token
5. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent

### 4. Set Up Spotify API
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get your Client ID and Client Secret
4. Add `http://localhost:3000/callback` to your Redirect URIs
5. Save the changes

### 5. Get Spotify Refresh Token
1. Create a `.env` file in the project root:
```env
DISCORD_TOKEN=your_discord_bot_token
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

2. Run the token generator:
```bash
node get-refresh-token.js
```

3. Visit http://localhost:3000/login
4. Authorize the application
5. Copy the refresh token and add it to your `.env` file:
```env
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

### 6. Invite Bot to Your Server
1. Go to Discord Developer Portal > Your Application > OAuth2 > URL Generator
2. Select these scopes:
   - `bot`
   - `applications.commands`
3. Select these bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use External Emojis
   - Manage Messages
4. Copy and open the generated URL
5. Select your server and authorize the bot

## Usage

1. Start the bot:
```bash
node index.js
```

2. In your Discord server, use these commands:
   - `/setchannel` - Start displaying Spotify updates in the current channel
   - `/stop` - Stop displaying updates in the current channel

## Features in Detail

- **Real-time Updates**: The bot checks for new songs every 10 seconds
- **Rich Embeds**: Each song update includes:
  - Song title
  - Artist name(s)
  - Album name
  - Album artwork
  - Spotify link
  - Timestamp
- **User Attribution**: Shows which user is playing the music
- **CLI Output**: Detailed console logging with:
  - Current song information
  - Connection status
  - Error reporting
  - Color-coded output

## Troubleshooting

- **Bot Not Responding**: Make sure all tokens in `.env` are correct
- **No Spotify Updates**: Verify your Spotify Premium subscription is active
- **Permission Errors**: Check bot role permissions in your Discord server
- **Connection Issues**: Occasional "ENOTFOUND" errors in console are normal and won't affect functionality

## Contributing

Feel free to submit issues and enhancement requests!
