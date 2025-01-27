import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';

const app = express();
const port = 3000;

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `http://localhost:${port}/callback`
});

// Scopes required for the bot
const scopes = ['user-read-playback-state', 'user-read-currently-playing'];

// Route to start the auth process
app.get('/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

// Callback route after Spotify auth
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    // Display the refresh token
    res.send(`
      <h1>Success!</h1>
      <p>Here's your refresh token (add this to your .env file):</p>
      <pre>${refresh_token}</pre>
    `);

    console.log('Refresh token:', refresh_token);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.send('Error getting tokens. Check console for details.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`
Server is running on http://localhost:${port}
To get your refresh token:

1. Make sure you've added your Spotify client ID and secret to .env
2. Visit http://localhost:${port}/login
3. Log in to Spotify when prompted
4. Copy the refresh token and add it to your .env file
`);
});