import { Client } from "discord.js";

export default {
    name: "ready",
    once: true,
    async execute (client: Client) {
        const guildId = process.env.GUILD_ID;
        if(!guildId) {
            console.log("Guild ID not found. Set the GUILD_ID environment variable.");
            return;
        }

        const guild = client.guilds.cache.get(guildId);
        if(!guild) {
            console.log("Guild not found. Set a GUILD_ID environment variable that matches a guild the BOT is in.");
            return;
        }
        // @ts-ignore
        guild.commands.set(client.commands.map((cmd) => cmd));
        console.log("Bot launched !");
    }
}