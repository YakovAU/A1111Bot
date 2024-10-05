const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('../config');
const { generateImage } = require('../imageGenerator');

const commands = [
    new SlashCommandBuilder()
        .setName('image')
        .setDescription('Generate an image')
        .addStringOption(option => 
            option.setName('prompt')
                .setDescription('The prompt for image generation')
                .setRequired(true)),
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

module.exports = { commands, registerCommands };
