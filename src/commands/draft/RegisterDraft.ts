import { Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'register_draft',
    description: "Enregistrer une nouvelle draft",
    options: [
        {
            name: "name",
            type: "STRING",
            required: true,
            description: "Nom de la draft"
        },
        {
            name: "break_down",
            type: "STRING",
            required: false,
            description: "Le break down de la draft au format X/X/X/X... (remplaçant inclus)"
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const name = interaction.options.getString("name");
        const breakDown = interaction.options.getString("break_down");
        const regexCheckBreadkDown = /^(\d+\/)*\d+$/;

        if (!name) {
            return sendHiddenInteractionResponse(interaction, "Vous devez fournir un nom pour la draft !");
        }

        if (breakDown && !regexCheckBreadkDown.test(breakDown)) {
            return sendHiddenInteractionResponse(interaction, "Le break down doit être au format X/X/X/X... (ex: 3/3/3/3/3) !");
        }

        try {
            // Enregistrer la draft en base via DraftService
            await DraftService.registerDraft(name, breakDown)
            return sendHiddenInteractionResponse(interaction, `✅ La draft ${name} a été enregistrée avec succès !`);
        } catch (err: any) {
            if (err.code === 'ER_DUP_ENTRY') {
                return sendHiddenInteractionResponse(interaction, `❌ Une draft avec le nom ${name} existe déjà. Veuillez choisir un nom différent.`);
            }
            return sendHiddenInteractionResponse(interaction)
        }
    }
}

export default command;