import { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";
import StreamerService from "../../services/Streamer.service";

const command = {
    name: "add_streamer",
    description: "Add a streamer to a draft",
    options: [
        {
            name: "draft",
            description: "The draft to add the streamer to",
            type: "STRING",
            required: true,
            autocomplete: true
        },
        {
            name: "streamer",
            description: "The streamer to add",
            type: "USER",
            required: true,
        },
        {
            name: "starting_balance",
            description: "The starting balance for the streamer",
            type: "INTEGER",
            required: false,
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft", true);
        const streamer = interaction.options.getUser("streamer", true);
        const balanceFromOption = interaction.options.getInteger("starting_balance", false);
        const streamerName = streamer.username;

        const draft = await DraftService.getDraftByName(draftName, ["streamers"]);
        if (!draft) {
            await interaction.reply({ content: `Draft with name "${draftName}" not found.`, ephemeral: true });
            return;
        }

        const existingStreamer = draft.streamers.find(s => s.username.toLowerCase() === streamerName.toLowerCase());
        if (existingStreamer) {
            await interaction.reply({ content: `Streamer with name "${streamerName}" already exists in draft "${draftName}".`, ephemeral: true });
            return;
        }

        const startingBalance = balanceFromOption === null || balanceFromOption <= 0 ? draft.basisMoneyPerStreamer : balanceFromOption;
        await StreamerService.assignNewStreamerToDraft({
            username: streamerName,
            discordId: streamer.id,
            balance: startingBalance,
            draft,
        })

        await interaction.reply({ content: `Streamer "${streamerName}" added to draft "${draftName}" with a starting balance of ${startingBalance}.`, ephemeral: true });
    },
    autocomplete: (interaction: AutocompleteInteraction) => DraftService.autocompleteDraft(interaction)
}

export default command;