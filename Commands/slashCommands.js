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
                .setDescription('Model name or number from /model list (leave empty for default)')
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
            // Try to parse as a number first
            const modelNumber = parseInt(modelOption);
            if (!isNaN(modelNumber) && modelNumber > 0 && modelNumber <= models.length) {
                selectedModel = models[modelNumber - 1];
                await interaction.editReply(`Using model #${modelNumber}: ${selectedModel.title}`);
            } else {
                // Try to match by name
                selectedModel = models.find(m => 
                    m.title.toLowerCase() === modelOption.toLowerCase() || 
                    m.model_name.toLowerCase() === modelOption.toLowerCase()
                );
                if (!selectedModel) {
                    await interaction.editReply(`Model "${modelOption}" not found. Using default model.`);
                    selectedModel = models[0];
                } else {
                    await interaction.editReply(`Using selected model: ${selectedModel.title}`);
                }
            }
        } else {
            selectedModel = models[0]; // Use the first model as default
            await interaction.editReply(`Using default model: ${selectedModel.title}`);
        }

        const progressMessage = await interaction.followUp(`Starting image generation...`);
        
        const updateProgress = async () => {
            const progress = await getProgress();
            const percent = Math.round(progress.progress * 100);
            let statusText = `Generating image... ${percent}%\n`;
            
            if (progress.textinfo) {
                statusText += `Status: ${progress.textinfo}\n`;
            }
            if (progress.eta_relative) {
                statusText += `ETA: ${Math.round(progress.eta_relative)} seconds`;
            }
            
            return progressMessage.edit(statusText);
        };

        const intervalId = setInterval(updateProgress, 1000);
        const imageBuffer = await generateImage(prompt, selectedModel.model_name);
        clearInterval(intervalId);

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'generated_image.png' });
        await interaction.editReply({ content: `Here's your generated image using model: ${selectedModel.title}`, files: [attachment] });
        await progressMessage.delete().catch(console.error);
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
        
        chunks.push("\nTo use a specific model, use either the number or name with the /image command."
            + "\nExamples:"
            + "\n• /image prompt:a beautiful landscape model:1"
            + "\n• /image prompt:a beautiful landscape model:v1-5-pruned-emaonly");
        
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
