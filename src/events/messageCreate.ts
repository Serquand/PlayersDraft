import { Client, Message } from "discord.js";

export default {
    name: "messageCreate",
    once: false,
    async execute(client: Client, createdMessage: Message) {
        // console.log(createdMessage.content);
        // createdMessage.react('✅');
    }
}