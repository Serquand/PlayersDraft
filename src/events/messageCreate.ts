import { Client, Message } from "discord.js";
import games from "../services/Game.service";

export default {
    name: "messageCreate",
    once: false,
    async execute(client: Client, createdMessage: Message) {
        if(!games[createdMessage.channelId] || createdMessage.author.bot) return;

        games[createdMessage.channelId].handleMessage(createdMessage);
    }
}