import { Client, CommandInteraction, AutocompleteInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";
import StreamerService from "../../services/Streamer.service";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import { DraftStatus } from "../../utils/Interfaces";

const command = {
    name: "update_streamer_wallet",
    description: "Update a streamer's wallet balance in a draft",
    options: [
        {
            name: "draft",
            description: "The draft containing the streamer",
            type: "STRING",
            required: true,
            autocomplete: true
        },
        {
            name: "streamer",
            description: "The name of the streamer whose balance to update",
            type: "STRING",
            required: true,
            autocomplete: true
        },
        {
            name: "new_balance",
            description: "The new balance for the streamer",
            type: "INTEGER",
            required: true,
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft", true);
        const streamerName = interaction.options.getString("streamer", true);
        const newBalance = interaction.options.getInteger("new_balance", true);

        if (newBalance <= 0) {
            return sendHiddenInteractionResponse(interaction, "The new balance must be a strictly positive integer.");
        }

        const draft = await DraftService.getDraftByName(draftName, ["streamers"]);
        if (!draft) {
            return sendHiddenInteractionResponse(interaction, `Draft with name "${draftName}" not found`);
        } else if (draft.status !== DraftStatus.NOT_STARTED) {
            return sendHiddenInteractionResponse(interaction, `Cannot update streamer balance because draft "${draftName}" has already started or finished.`);
        }

        const streamer = draft.streamers.find(s => s.username.toLowerCase() === streamerName.toLowerCase());
        if (!streamer) {
            return sendHiddenInteractionResponse(interaction, `Streamer with name "${streamerName}" not found in draft "${draftName}".`);
        }

        await StreamerService.updateStreamerBalance(streamer.id, newBalance);
        return sendHiddenInteractionResponse(interaction, `✅ Streamer "${streamerName}" balance updated to ${newBalance} in draft "${draftName}".`);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        switch (interaction.options.getFocused(true).name) {
            case "draft":
                return DraftService.autocompleteDraft(interaction);
            case "streamer":
                const draftName = interaction.options.getString("draft");
                return StreamerService.autocompleteStreamerInDraft(interaction, draftName);
        }
    }
}

export default command;