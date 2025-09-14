import { Client, CommandInteraction, Collection } from "discord.js";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import { BotCommand } from "../../utils/Interfaces";

const command = {
    name: "help",
    order: 10,
    description: "Show the list of commands and their description",
    async runSlash(client: Client, interaction: CommandInteraction) {
        const nameToId = new Map<string, string>();

        const generateCommandDescription = (cmd: BotCommand): string => {
            const id = nameToId.get(cmd.name);
            const mention = id ? `</${cmd.name}:${id}>` : `\`/${cmd.name}\``;
            return `- ${mention} — ${cmd.description}`;
        }

        if (!interaction.guild) {
            return sendHiddenInteractionResponse(interaction, "Vous devez lancer cette commande au sein d'un serveur");
        }

        try {
            // @ts-expect-error Commands will be added to the client with the following line
            const commands = client.commands as Collection<string, BotCommand> ?? new Collection<string, BotCommand>();

            const fetched = await interaction.guild.commands.fetch({ force: true });
            fetched.forEach((c) => nameToId.set(c.name, c.id));

            const visible = [...commands.values()]
                .filter((c) => c && c.name && c.description)
                .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

            if (visible.length === 0) {
                return sendHiddenInteractionResponse(interaction, "_Aucune commande active n’a été trouvée._");
            }

            const content = "## Liste des commandes\n\n" + visible
                .map(generateCommandDescription)
                .join("\n");
            return sendHiddenInteractionResponse(interaction, content);
        } catch (error) {
            console.error("help command error:", error);
            return interaction.reply({
                content: "Something bad happened...",
                ephemeral: true,
            });
        }
    },
};

export default command;
