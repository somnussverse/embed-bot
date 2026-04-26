const express = require('express');
const app = express();
const https = require('https');

// ---------------- WEB SERVER & SELF-PING ----------------
app.get('/', (req, res) => {
    res.send('Embed Bot is awake and running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server is ready on port ${PORT}.`);
    
    // This visits your bot's own URL every 10 minutes to stay awake
    setInterval(() => {
        // Render provides the RENDER_EXTERNAL_HOSTNAME automatically
        const hostname = process.env.RENDER_EXTERNAL_HOSTNAME;
        if (hostname) {
            const url = `https://${hostname}.onrender.com`; 
            https.get(url, (res) => {
                console.log('Self-ping successful: Status', res.statusCode);
            }).on('error', (e) => {
                console.error('Self-ping failed:', e.message);
            });
        }
    }, 600000); // 10 minutes
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
            interaction.reply({ content: "Error executing command.", ephemeral: true });
        }
    }
});

client.login(TOKEN);
