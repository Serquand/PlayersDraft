import { Client, Interaction } from "discord.js";

export default {
    name: "interactionCreate",
    once: false,
    async execute(client: Client, interaction: Interaction) {
        if (interaction.isCommand()) {
            // @ts-expect-error The commands property has been set in src/index.ts and now exists
            const cmd = client.commands.get(interaction.commandName);
            if (!cmd) {
                return interaction.reply({
                    content: "Cette commande n'existe pas",
                    ephemeral: true,
                });
            }
            cmd.runSlash(client, interaction);
        } else if (interaction.isAutocomplete()) {
            // @ts-expect-error The commands property has been set in src/index.ts and now exists
            const command = client.commands.get(interaction.commandName);
            try {
                if (!command) {
                    throw new Error(`No command matching ${interaction.commandName} was found.`);
                }
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
}