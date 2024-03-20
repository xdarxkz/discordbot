require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const voiceStateMap = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        activities: [{ name: 'Tabell-tid', type: 'PLAYING' }],
        status: 'available'
    });
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.channelId && !oldState.channelId) {
        voiceStateMap.set(newState.id, {
            id: newState.id,
            username: newState.member.user.username,
            joinTime: Date.now()
        });
    }

    if (!newState.channelId && oldState.channelId) {
        const userData = voiceStateMap.get(newState.id);

        if (userData) {
            const timeSpent = Math.floor((Date.now() - userData.joinTime) / 1000);
            console.log(`${userData.username} spent ${formatTime(timeSpent)} on the voice channel`);
            userData.timeSpent = timeSpent;
        }
    }
});

client.on('messageCreate', (message) => {
    if (message.content.toLowerCase() === '!tabell') {
        const sortedVoiceStateMap = new Map([...voiceStateMap.entries()].sort((a, b) => b[1].timeSpent - a[1].timeSpent));
        let table = '```\n';
        table += '| # | Username            | Time Spent (days:hours:minutes:seconds) |\n';
        table += '|----|--------------------|------------------------------------------|\n';
        let rank = 1;
        for (const [id, userData] of sortedVoiceStateMap) {
            const timeSpent = formatTime(userData.timeSpent);
            table += `| ${rank} | ${userData.username} | ${timeSpent} |\n`;
            rank++;
        }
        table += '```';
        message.channel.send(table);
    }
});

client.login(process.env.CLIENT_TOKEN);

function formatTime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    seconds %= 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${days}:${hours}:${minutes}:${seconds}`;
}
