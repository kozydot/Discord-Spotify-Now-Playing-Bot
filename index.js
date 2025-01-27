import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { Client as GeniusClient } from 'genius-lyrics';
import 'dotenv/config';

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Initialize Genius client
const genius = new GeniusClient(process.env.GENIUS_API_KEY);

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN
});

// Store the channel ID for updates
let updateChannelId = null;
let lastTrackId = null;
let spotifyUsername = null;

// Function to log song info to console
function logSongInfo(track) {
  if (!track) {
    console.log('\n' + colors.yellow + '🎵 No track currently playing' + colors.reset + '\n');
    return;
  }

  const artists = track.artists.map(artist => artist.name).join(', ');
  const albumName = track.album.name;
  const duration = Math.floor(track.duration_ms / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  console.log('\n' + '='.repeat(50));
  console.log(colors.bright + colors.green + '🎵 Now Playing on Spotify' + colors.reset);
  console.log('='.repeat(50));
  console.log(colors.cyan + 'Track:   ' + colors.reset + colors.bright + track.name + colors.reset);
  console.log(colors.cyan + 'Artist:  ' + colors.reset + artists);
  console.log(colors.cyan + 'Album:   ' + colors.reset + albumName);
  console.log(colors.cyan + 'Length:  ' + colors.reset + `${minutes}:${seconds.toString().padStart(2, '0')}`);
  console.log(colors.cyan + 'URL:     ' + colors.reset + colors.blue + track.external_urls.spotify + colors.reset);
  console.log(colors.magenta + `Playing for ${spotifyUsername}` + colors.reset);
  console.log('='.repeat(50) + '\n');
}

// Function to split lyrics into chunks (Discord has 2000 char limit)
function splitLyrics(lyrics) {
  const chunks = [];
  const maxLength = 1800;
  let currentChunk = '';

  lyrics.split('\n').forEach(line => {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Function to get current song info
async function getCurrentSong() {
  try {
    const data = await spotifyApi.getMyCurrentPlaybackState();
    if (!data.body || !data.body.item || !data.body.is_playing) {
      return null;
    }
    return data.body.item;
  } catch (error) {
    console.error(colors.red + 'Error getting current song:', error + colors.reset);
    return null;
  }
}

// Function to fetch lyrics from Genius
async function fetchLyrics(title, artist) {
  try {
    console.log(colors.cyan + `Searching lyrics for "${title}" by ${artist}...` + colors.reset);
    
    // Search for the song
    const searches = await genius.songs.search(`${title} ${artist}`);
    
    // Get the first result
    const song = searches[0];
    if (!song) {
      throw new Error('No song found');
    }

    // Fetch lyrics
    const lyrics = await song.lyrics();
    if (!lyrics) {
      throw new Error('No lyrics found');
    }

    console.log(colors.green + 'Successfully found lyrics!' + colors.reset);
    return {
      lyrics,
      title: song.title,
      artist: song.artist.name,
      url: song.url,
      thumbnail: song.thumbnail
    };
  } catch (error) {
    console.error(colors.red + 'Error fetching lyrics:', error + colors.reset);
    throw error;
  }
}

// Function to refresh Spotify access token
async function refreshSpotifyToken() {
  try {
    console.log(colors.yellow + 'Refreshing Spotify token...' + colors.reset);
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log(colors.green + 'Successfully refreshed Spotify token' + colors.reset);
    return true;
  } catch (error) {
    console.error(colors.red + 'Error refreshing Spotify token:', error + colors.reset);
    return false;
  }
}

// Function to check Spotify credentials and get username
async function checkSpotifyCredentials() {
  try {
    const me = await spotifyApi.getMe();
    spotifyUsername = me.body.display_name;
    console.log(colors.green + 'Successfully connected to Spotify as: ' + colors.bright + spotifyUsername + colors.reset);
    return true;
  } catch (error) {
    if (error.statusCode === 401) {
      return await refreshSpotifyToken();
    }
    return false;
  }
}

// Function to update Discord channel with Spotify activity
async function updateStatus() {
  if (!updateChannelId) return;

  try {
    const data = await spotifyApi.getMyCurrentPlaybackState();
    const channel = await client.channels.fetch(updateChannelId);
    
    if (!data.body || !data.body.item || !data.body.is_playing) {
      if (lastTrackId !== null) {
        logSongInfo(null);
        lastTrackId = null;
      }
      await client.user.setActivity();
      return;
    }

    const track = data.body.item;
    
    if (track.id !== lastTrackId) {
      const artists = track.artists.map(artist => artist.name).join(', ');
      const albumName = track.album.name;
      const albumImage = track.album.images[0]?.url;
      
      // Log to console
      logSongInfo(track);
      
      const messageContent = {
        embeds: [{
          author: {
            name: `${spotifyUsername} is listening to`,
            icon_url: 'https://cdn.discordapp.com/emojis/1003409128425304134.webp?size=96&quality=lossless'
          },
          title: track.name,
          description: `by ${artists}\nfrom ${albumName}`,
          color: 0x1DB954,
          thumbnail: albumImage ? { url: albumImage } : null,
          url: track.external_urls.spotify,
          timestamp: new Date(),
          footer: {
            text: '🎵 via Spotify'
          }
        }]
      };

      await channel.send(messageContent);
      lastTrackId = track.id;
      await client.user.setActivity(track.name, { type: ActivityType.Listening });
    }
  } catch (error) {
    if (error.statusCode === 401) {
      const success = await refreshSpotifyToken();
      if (success) {
        setTimeout(updateStatus, 1000);
      }
    }
  }
}

// Command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  try {
    if (interaction.commandName === 'setchannel') {
      updateChannelId = interaction.channelId;
      lastTrackId = null;
      await interaction.reply('✅ I will now send Spotify updates to this channel! Use `/stop` to stop updates.');
      console.log(colors.green + `Updates set to channel: ${interaction.channel.name}` + colors.reset);
      
      const credentialsValid = await checkSpotifyCredentials();
      if (credentialsValid) {
        await updateStatus();
      } else {
        await interaction.followUp('⚠️ Warning: Could not connect to Spotify. Please check your credentials.');
      }
    } else if (interaction.commandName === 'stop') {
      if (interaction.channelId === updateChannelId) {
        updateChannelId = null;
        lastTrackId = null;
        await interaction.reply('❌ Stopped sending Spotify updates to this channel.');
        console.log(colors.yellow + 'Stopped sending updates' + colors.reset);
      } else {
        await interaction.reply('❌ Updates are not active in this channel.');
      }
    } else if (interaction.commandName === 'givelyrics') {
      await interaction.deferReply();
      
      try {
        const currentSong = await getCurrentSong();
        if (!currentSong) {
          await interaction.editReply('❌ No song is currently playing!');
          return;
        }

        const title = currentSong.name;
        const artist = currentSong.artists[0].name;

        await interaction.editReply(`🔍 Searching lyrics for "${title}" by ${artist}...`);

        const songData = await fetchLyrics(title, artist);
        const chunks = splitLyrics(songData.lyrics);

        // Send first chunk as a reply
        await interaction.editReply({
          embeds: [{
            author: {
              name: 'Genius Lyrics',
              icon_url: 'https://assets.genius.com/images/apple-touch-icon.png'
            },
            title: songData.title,
            url: songData.url,
            thumbnail: songData.thumbnail ? { url: songData.thumbnail } : null,
            description: chunks[0],
            color: 0xFFFF64,
            fields: [{
              name: 'Artist',
              value: songData.artist,
              inline: true
            }],
            footer: {
              text: `Page 1/${chunks.length} • Requested by ${interaction.user.tag}`
            }
          }]
        });

        // Send remaining chunks as follow-up messages
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp({
            embeds: [{
              description: chunks[i],
              color: 0xFFFF64,
              footer: {
                text: `Page ${i + 1}/${chunks.length}`
              }
            }]
          });
        }
      } catch (error) {
        console.error(colors.red + 'Lyrics fetch error:', error + colors.reset);
        await interaction.editReply('❌ Sorry, I couldn\'t find lyrics for this song.');
      }
    }
  } catch (error) {
    console.error(colors.red + 'Error handling command:', error + colors.reset);
    const reply = interaction.deferred ? interaction.editReply : interaction.reply;
    await reply('An error occurred while processing the command.');
  }
});

// When Discord bot is ready
client.once('ready', async () => {
  console.log('\n' + '='.repeat(50));
  console.log(colors.bright + colors.green + `Discord Bot Online: ${client.user.tag}` + colors.reset);
  console.log('='.repeat(50) + '\n');
  
  // Register slash commands
  const commands = [
    {
      name: 'setchannel',
      description: 'Set the current channel for Spotify updates'
    },
    {
      name: 'stop',
      description: 'Stop sending Spotify updates to this channel'
    },
    {
      name: 'givelyrics',
      description: 'Get lyrics for the currently playing song'
    }
  ];

  try {
    console.log(colors.yellow + 'Started refreshing application (/) commands.' + colors.reset);
    await client.application.commands.set(commands);
    console.log(colors.green + 'Successfully reloaded application (/) commands.' + colors.reset);

    const credentialsValid = await checkSpotifyCredentials();
    if (!credentialsValid) {
      console.error(colors.red + 'Failed to validate Spotify credentials. Please check your .env file.' + colors.reset);
    }
  } catch (error) {
    console.error(colors.red + 'Error during setup:', error + colors.reset);
  }
  
  // Set up periodic updates
  setInterval(updateStatus, 10000); // Check for new songs every 10 seconds
  setInterval(refreshSpotifyToken, 3000000); // Refresh token every 50 minutes
});

// Error handling
client.on('error', error => {
  console.error(colors.red + 'Discord client error:', error + colors.reset);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error(colors.red + 'Failed to login to Discord:', error + colors.reset);
});
