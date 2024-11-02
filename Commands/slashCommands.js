const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config');
const { generateImage, getModels, getProgress } = require('../bot/imageGenerator.js');
const { containsRestrictedContent } = require('../bot/contentFilter');

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
                .setDescription('The model to use for generation (leave empty for default)')
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
    const modelOption = interaction.options.getString('model');

    // Check for restricted content
    if (containsRestrictedContent(prompt)) {
        await interaction.editReply('Sorry, your prompt contains restricted content. Please modify your request.');
        return;
    }

    try {
        const models = await getModels();
        let selectedModel;

        if (modelOption) {
            selectedModel = models.find(m => m.title.toLowerCase() === modelOption.toLowerCase() || m.model_name.toLowerCase() === modelOption.toLowerCase());
            if (!selectedModel) {
                await interaction.editReply(`Model "${modelOption}" not found. Using default model.`);
                selectedModel = models[0]; // Use the first model as default
            } else {
                await interaction.editReply(`Using selected model: ${selectedModel.title}`);
            }
        } else {
            selectedModel = models[0]; // Use the first model as default
            await interaction.editReply(`Using default model: ${selectedModel.title}`);
        }

        const message = await interaction.followUp(`Generating image...`);
        const imageBuffer = await generateImage(prompt, selectedModel.model_name);
        
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
        await interaction.editReply({ content: `Here's your generated image using model: ${selectedModel.title}`, files: [attachment] });
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
        const modelList = models.map((model, index) => `${index + 1}. ${model.title} (${model.model_name})`);
        
        const chunks = ['Available models:'];
        let currentChunk = chunks[0];
        
        for (const model of modelList) {
            if (currentChunk.length + model.length + 1 > 1900) { // Leave some buffer
                chunks.push(model);
                currentChunk = model;
            } else {
                currentChunk += '\n' + model;
                chunks[chunks.length - 1] = currentChunk;
            }
        }
        
        chunks.push("\nTo use a specific model, add the model name or number to the /image command. For example: /image prompt:a beautiful landscape model:1");
        
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
            await interaction.followUp(chunks[i]);
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        await interaction.editReply('An error occurred while fetching the model list.');
    }
}

module.exports = { commands, registerCommands, handleImageCommand, handleModelCommand };
