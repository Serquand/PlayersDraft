// TODO: Check si des joueurs sont déjà dans la draft
import { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import DraftService from "../../services/Draft.service";
import StreamerService from "../../services/Streamer.service";
import PlayerService from "../../services/Player.service";

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
        },
        {
            name: "force",
            description: "Force adding the streamer even if there are already players in the draft (will remove all players)",
            type: "BOOLEAN",
            required: false,
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const draftName = interaction.options.getString("draft", true);
        const streamer = interaction.options.getUser("streamer", true);
        const balanceFromOption = interaction.options.getInteger("starting_balance", false);
        const streamerName = streamer.username;

        const draft = await DraftService.getDraftByName(draftName, ["streamers", 'players']);
        if (!draft) {
            await interaction.reply({ content: `Draft with name "${draftName}" not found.`, ephemeral: true });
            return;
        }

        const existingStreamer = draft.streamers.find(s => s.username.toLowerCase() === streamerName.toLowerCase());
        if (existingStreamer) {
            await interaction.reply({ content: `Streamer with name "${streamerName}" already exists in draft "${draftName}".`, ephemeral: true });
            return;
        }

        if (draft.players.length > 0) {
            const force = interaction.options.getBoolean("force", false);
            if (!force) {
                const content = `Cannot add streamer to draft "${draftName}" because it already has players.`
                return interaction.reply({ content, ephemeral: true });
            }

            await PlayerService.clearPlayersFromDraft(draft);
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