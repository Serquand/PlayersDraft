import { Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'remove_draft',
    description: "Supprimer une draft",
    options: [
        {
            name: "draft",
            type: "STRING",
            required: true,
            description: "Draft à supprimer"
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft");

        if (!draftName) {
            return sendHiddenInteractionResponse(interaction, "Informations invalides");
        }

        const draft = await DraftService.getDraftByName(draftName);
        if (!draft) {
            return sendHiddenInteractionResponse(interaction, `La draft "${draftName}" n'existe pas !`);
        }

        await DraftService.deleteDraftByName(draftName);
        return sendHiddenInteractionResponse(interaction, `✅ La draft "${draftName}" a été supprimée avec succès !`);
    }
};

export default command;