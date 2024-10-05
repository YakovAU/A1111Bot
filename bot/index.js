const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('../config');
const { registerCommands } = require('../commands/slashCommands');
const { generateImage } = require('./imageGenerator');

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
        const prompt = interaction.options.getString('prompt');
        await interaction.deferReply();

        try {
            const imageBuffer = await generateImage(prompt);
            await interaction.editReply({
                content: `Here's your generated image (Prompt: ${prompt}):`,
                files: [{ attachment: imageBuffer, name: 'generated_image.png' }]
            });
        } catch (error) {
            console.error(`Error in image generation: ${error.message}`);
            await interaction.editReply(`An error occurred while generating the image: ${error.message}`);
        }
    }
});

client.login(config.token);
const { Client, GatewayIntentBits } = require('discord.js');
const { commands, registerCommands, handleImageCommand, handleModelCommand } = require('./Commands/slashCommands');
const config = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log('Bot is ready!');
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
