import { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";
import StreamerService from "../../services/Streamer.service";
import { sendHiddenInteractionResponse } from "../../utils/discord";

const command = {
    name: "remove_streamer",
    description: "Remove a streamer from a draft",
    options: [
        {
            name: "draft",
            description: "The draft to remove the streamer from",
            type: "STRING",
            required: true,
            autocomplete: true
        },
        {
            name: "streamer",
            description: "The name of the streamer to remove",
            type: "STRING",
            required: true,
            autocomplete: true
        },
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft", true);
        const streamerName = interaction.options.getString("streamer", true);

        const draft = await DraftService.getDraftByName(draftName, ["streamers"]);
        if (!draft) {
            await interaction.reply({ content: `Draft with name "${draftName}" not found.`, ephemeral: true });
            return;
        }

        const streamerIndex = draft.streamers.findIndex(s => s.username.toLowerCase() === streamerName.toLowerCase());
        if (streamerIndex === -1) {
            await interaction.reply({ content: `Streamer with name "${streamerName}" not found in draft "${draftName}".`, ephemeral: true });
            return;
        }

        await StreamerService.deleteStreamerById(draft.streamers[streamerIndex].id);

        return sendHiddenInteractionResponse(interaction, `✅ Streamer "${streamerName}" has been removed from draft "${draftName}".`);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        switch(interaction.options.getFocused(true).name) {
            case "draft":
                return DraftService.autocompleteDraft(interaction);
            case "streamer": {
                const draftName = interaction.options.getString("draft");
                return StreamerService.autocompleteStreamerInDraft(interaction, draftName);
            }
        }
    }
}

export default command;