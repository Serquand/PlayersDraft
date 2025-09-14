import { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'view_draft_information',
    description: 'View information about a specific draft',
    options: [
        {
            name: 'draft_name',
            type: 'STRING',
            description: 'The name of the draft to view',
            required: true,
            autocomplete: true,
        },
    ],
    async runSlash(client: Client, interaction: CommandInteraction) {
        const draftName = interaction.options.getString('draft_name', true);
        const draft = await DraftService.getDraftByName(draftName, ['streamers', 'players', 'streamers.players'])
        console.log(draft)
        // TODO:
    },
    autocomplete: (interaction: AutocompleteInteraction) => DraftService.autocompleteDraft(interaction)
}

export default command;