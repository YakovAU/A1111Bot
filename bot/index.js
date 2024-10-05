const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config');
const { registerCommands, handleImageCommand, handleModelCommand } = require('../commands/slashCommands');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Channel],
});

client.once('ready', () => {
    console.log('Image Bot is ready!');
    registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'image') {
        await handleImageCommand(interaction);
    } else if (commandName === 'model') {
        await handleModelCommand(interaction);
    }
});

client.login(config.token);
