const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const express = require("express");
const app = express();

// --- KEEP ALIVE SERVER (RENDER REQUIREMENT) ---
app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(process.env.PORT || 3000);

// --- ENV VARIABLES ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// --- DISCORD CLIENT ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// --- SLASH COMMANDS ---
const commands = [
    new SlashCommandBuilder()
        .setName('box')
        .setDescription('Create multiple boxed embeds')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Use | to separate boxes (Title: Text | Title2: Text2)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code (e.g. #FFB280)')),

    new SlashCommandBuilder()
        .setName('divider')
        .setDescription('Send a divider image')
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('Direct image link')
                .setRequired(true))
].map(cmd => cmd.toJSON());

// --- REGISTER COMMANDS ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log("Refreshing slash commands...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("Slash commands registered.");
    } catch (err) {
        console.error(err);
    }
})();

// --- INTERACTIONS ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    // BOX COMMAND
    if (commandName === 'box') {
        const rawContent = options.getString('content');
        const color = options.getString('color') || '#B2EBF2';

        const sections = rawContent.split('|');

        const embeds = sections.map(section => {
            const [title, ...body] = section.split(':');

            return new EmbedBuilder()
                .setTitle(title.trim())
                .setDescription(body.join(':').trim() || '\u200B')
                .setColor(color);
        });

        if (embeds.length > 10) {
            return interaction.reply({
                content: "Max 10 boxes per message!",
                ephemeral: true
            });
        }

        await interaction.reply({ embeds });
    }

    // DIVIDER COMMAND
    if (commandName === 'divider') {
        const url = options.getString('image_url');

        const embed = new EmbedBuilder()
            .setImage(url)
            .setColor('#B2EBF2');

        await interaction.reply({ embeds: [embed] });
    }
});

// --- LOGIN ---
client.login(TOKEN);
