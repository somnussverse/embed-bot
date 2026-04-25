const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    SlashCommandBuilder, 
    REST, 
    Routes 
} = require('discord.js');

const TOKEN = 'MTQ5NzM0MTE1NTg0NTczNDYxMA.Gy-lWt.iIGFnkWJCgWI2WMvFGKBM40MBScZkA6s643ZJg';
const CLIENT_ID = '1497341155845734610';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Define the commands
const commands = [
    new SlashCommandBuilder()
        .setName('box')
        .setDescription('Create multiple boxed embeds')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Use | to separate boxes (e.g. Title: Text | Title2: Text2)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code (e.g. #FFB280)')),
    
    new SlashCommandBuilder()
        .setName('divider')
        .setDescription('Send a box containing a divider image')
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('The direct link to the divider image')
                .setRequired(true))
].map(command => command.toJSON());

// Register Slash Commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'box') {
        const rawContent = options.getString('content');
        const color = options.getString('color') || '#B2EBF2'; // Default light blue
        
        // Split content by "|" to create multiple embeds
        const sections = rawContent.split('|');
        const embeds = sections.map(section => {
            // Split by ":" to separate Title from Body
            const [title, ...body] = section.split(':');
            
            return new EmbedBuilder()
                .setTitle(title.trim())
                .setDescription(body.join(':').trim() || '\u200B') // Empty char if no body
                .setColor(color);
        });

        if (embeds.length > 10) return interaction.reply({ content: "Max 10 boxes per message!", ephemeral: true });

        await interaction.reply({ embeds: embeds });
    }

    if (commandName === 'divider') {
        const url = options.getString('image_url');
        
        const dividerEmbed = new EmbedBuilder()
            .setImage(url)
            .setColor('#B2EBF2'); // Match your theme color

        await interaction.reply({ embeds: [dividerEmbed] });

        const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(process.env.PORT);
    }
});

client.login(TOKEN);
