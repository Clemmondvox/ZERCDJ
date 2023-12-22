// Import necessary modules from Discord.js and related libraries
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');

// Create a new Discord client with specified intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Event handler when the bot is ready
client.once('ready', () => {
  console.log('Bot is ready!');
});

// Event handler for incoming messages
client.on('messageCreate', async (message) => {
  // Check if the message author is a bot
  if (message.author.bot) return;

  // Check if the message starts with the command prefix
  if (!message.content.startsWith('!play')) return;

  // Get the voice channel of the author
  const voiceChannel = message.guild.channels.cache.get(message.member.voice.channelId);

  // Check if the author is in a voice channel
  if (!voiceChannel) {
    return message.channel.send('You need to be in a voice channel to use this command!');
  }

  console.log('Voice channel:', voiceChannel.name);

  // Get the YouTube link from the message content
  const url = message.content.slice('!play'.length).trim();

  try {
    // Join the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // Create an audio player with specific behavior for when there are no subscribers
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    // Set the FFmpeg path explicitly
    process.env.FFMPEG_PATH = ffmpegPath;

    // Create an audio resource using ytdl to get the audio stream from YouTube
    const resource = createAudioResource(ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25, opusEncoded: true }), {
      inputType: 'opus',
      inlineVolume: true,
    });

    // Subscribe to the audio player with the connection
    const subscription = connection.subscribe(player);

    // Play the audio resource
    player.play(resource);

    // Listen for the 'finish' event to know when the playback ends and then destroy the connection
    subscription.on('finish', () => {
      connection.destroy();
    });
  } catch (error) {
    console.error('Error joining or playing in voice channel:', error);
  }
});

// Log in to Discord with the bot token
client.login('YOUR_BOT_TOKEN');
