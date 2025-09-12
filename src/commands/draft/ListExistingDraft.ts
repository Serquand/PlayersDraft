import { Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'list_draft',
    description: "Enregistrer une nouvelle draft",
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const drafts = await DraftService.listDraft();
        let message = 'Liste des drafts enregistrées :\n';
        for(const draft of drafts) {
            message += `- ${draft.name} (Break Down: ${draft.breakDown || 'N/A'})\n`;
        }
        return sendHiddenInteractionResponse(interaction, message);
    }
}

export default command;