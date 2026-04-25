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

// ---------------- KEEP ALIVE SERVER ----------------
app.get("/", (req, res) => {
    res.send("Bot is alive");
});

// IMPORTANT: use Render PORT, NOT token or anything else
app.listen(process.env.PORT || 3000);

// ---------------- ENV VARIABLES ----------------
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ---------------- DISCORD CLIENT ----------------
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ---------------- SLASH COMMANDS ----------------
const commands = [
    new SlashCommandBuilder()
        .setName('box')
        .setDescription('Create multiple boxed embeds')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Use | to separate boxes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color (optional)')),

    new SlashCommandBuilder()
        .setName('divider')
        .setDescription('Send a divider image')
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('Image URL')
                .setRequired(true))
].map(cmd => cmd.toJSON());

// ---------------- REGISTER COMMANDS ----------------
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("Commands registered.");
    } catch (err) {
        console.error(err);
    }
})();

// ---------------- INTERACTIONS ----------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'box') {
        const raw = interaction.options.getString('content');
        const color = interaction.options.getString('color') || '#B2EBF2';

        const sections = raw.split('|');

        const embeds = sections.map(s => {
            const [title, ...body] = s.split(':');

            return new EmbedBuilder()
                .setTitle(title?.trim() || "No title")
                .setDescription(body.join(':').trim() || '\u200B')
                .setColor(color);
        });

        return interaction.reply({ embeds });
    }

    if (interaction.commandName === 'divider') {
        const url = interaction.options.getString('image_url');

        const embed = new EmbedBuilder()
            .setImage(url)
            .setColor('#B2EBF2');

        return interaction.reply({ embeds: [embed] });
    }
});

// ---------------- LOGIN ----------------
client.login(TOKEN);
