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
            name: "basis_money_per_streamer",
            description: "L'argent de base par streamer",
            type: "INTEGER",
            required: true,
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
        const basisMoneyPerStreamer = interaction.options.getInteger("basis_money_per_streamer", true);
        const regexCheckBreadkDown = /^(\d+\/)*\d+$/;

        if (!name) {
            return sendHiddenInteractionResponse(interaction, "Vous devez fournir un nom pour la draft !");
        }

        if (
            breakDown &&
            (!regexCheckBreadkDown.test(breakDown) ||
            DraftService.getTotalNumberInBreakdown(breakDown) % 5 !== 0)
        ) {
            return sendHiddenInteractionResponse(interaction, "Le break down doit être au format X/X/X/X... (ex: 3/3/3/3/3) et être un multiple de 5 !");
        }

        if (!basisMoneyPerStreamer || basisMoneyPerStreamer <= 0) {
            return sendHiddenInteractionResponse(interaction, "L'argent de base par streamer doit être un entier strictement positif !");
        }

        try {
            // Enregistrer la draft en base via DraftService
            await DraftService.registerDraft({ name, breakDown, basisMoneyPerStreamer });
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