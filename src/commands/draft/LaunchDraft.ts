import { Client, CommandInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'launch_draft',
    options: [
        {
            name: "draft",
            type: "STRING",
            required: true,
            description: "Draft à supprimer",
            autocomplete: DraftService.autocompleteDraft
        }
    ],
    description: "Lancer une draft existante",
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        // return sendHiddenInteractionResponse(interaction, "Cette commande n'est pas encore implémentée.");
    }
}

export default command;