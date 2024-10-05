const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config');
const { generateImage, getModels, getProgress } = require('../bot/imageGenerator.js');

const commands = [
    new SlashCommandBuilder()
        .setName('image')
        .setDescription('Generate an image')
        .addStringOption(option => 
            option.setName('prompt')
                .setDescription('The prompt for image generation')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('model')
                .setDescription('The model to use for generation')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('model')
        .setDescription('List available models'),
    // Add more slash commands here as needed
];

const rest = new REST({ version: '9' }).setToken(config.token);

async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
        if (error.code === 50001) {
            console.error('Make sure the bot has the "applications.commands" scope approved in OAuth2.');
        } else if (error.code === 50035) {
            console.error('Invalid command data. Please check your command definitions.');
        } else {
            console.error('An unexpected error occurred. Please check your bot token and client ID.');
        }
    }
}

async function handleImageCommand(interaction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt');
    const model = interaction.options.getString('model') || "juggernautXL_juggXIByRundiffusion.safetensors";

    try {
        const message = await interaction.editReply('Generating image...');
        const imageBuffer = await generateImage(prompt, model);
        
        // Update progress
        const intervalId = setInterval(async () => {
            const progress = await getProgress();
            if (progress.progress < 1) {
                await message.edit(`Generating image... ${Math.round(progress.progress * 100)}% complete`);
            } else {
                clearInterval(intervalId);
            }
        }, 1000);

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'generated_image.png' });
        await interaction.editReply({ content: 'Here\'s your generated image:', files: [attachment] });
        clearInterval(intervalId);
    } catch (error) {
        console.error('Error generating image:', error);
        await interaction.editReply('An error occurred while generating the image.');
    }
}

async function handleModelCommand(interaction) {
    await interaction.deferReply();
    try {
        const models = await getModels();
        const modelList = models.map(model => model.title).join('\n');
        await interaction.editReply(`Available models:\n${modelList}`);
    } catch (error) {
        console.error('Error fetching models:', error);
        await interaction.editReply('An error occurred while fetching the model list.');
    }
}

module.exports = { commands, registerCommands, handleImageCommand, handleModelCommand };
