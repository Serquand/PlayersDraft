import { Client, CommandInteraction } from "discord.js";

const command = {
    name: 'ping',
    order: 11,
    description: "Reply with pong !",
    runSlash: (client: Client, interaction: CommandInteraction) => {
        return interaction.reply("Pong !");
    }
}

export default command;