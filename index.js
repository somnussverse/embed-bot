const express = require('express');
const app = express();

// Render needs a web server to stay alive
app.get('/', (req, res) => {
    res.send('Bot is awake and running!');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Web server is ready.');
});

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

// ---------------- ENV VARIABLES ----------------
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("Missing TOKEN or CLIENT_ID in environment variables.");
    process.exit(1);
}

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
                .setDescription('Use | to separate boxes (Example: Title: Text | Title2: Text2)')
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("Commands registered.");
    } catch (err) {
        console.error("Command registration failed:", err);
    }
});

// ---------------- INTERACTIONS ----------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'box') {
            const raw = interaction.options.getString('content');
            const color = interaction.options.getString('color') || '#B2EBF2';

            const sections = raw.split('|');

            // Discord limits 10 embeds per message
            const embeds = sections.slice(0, 10).map(s => {
                const [title, ...body] = s.split(':');

                return new EmbedBuilder()
                    .setTitle(title?.trim() || "No title")
                    .setDescription(body.join(':').trim() || '\u200B')
                    .setColor(color.startsWith('#') ? color : `#${color}`);
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
    } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({ content: "Error executing command. Make sure your color code is valid.", ephemeral: true });
        }
    }
});

client.login(TOKEN);
