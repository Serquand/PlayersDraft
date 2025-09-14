import { Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse } from "../../utils/discord";
import DraftService from "../../services/Draft.service";
import { isValidBreakdown, isValidTime } from "../../utils/validators";

const command = {
    name: 'create_draft',
    description: "Crée une nouvelle draft",
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
            name: "basis_expiration_time",
            description: "Le temps d'expiration d'un joueur",
            type: "INTEGER",
            required: true,
        },
        {
            name: "basis_increment_time",
            description: "Le temps d'incrément suite à un placement",
            type: "INTEGER",
            required: true,
        },
        {
            name: "break_down",
            type: "STRING",
            required: true,
            description: "Le break down de la draft au format X/X/X/X... (remplaçant inclus)"
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const name = interaction.options.getString("name", true);
        const basisMoneyPerStreamer = interaction.options.getInteger("basis_money_per_streamer", true);
        const basisIncrementTime = interaction.options.getInteger("basis_increment_time", true);
        const basisExpirationTime = interaction.options.getInteger("basis_expiration_time", true);
        const breakDown = interaction.options.getString("break_down", true);

        if (!isValidTime(basisExpirationTime)) {
            return sendHiddenInteractionResponse(interaction, "Le temps d'expiration n'est pas valide !")
        } else if (!isValidTime(basisIncrementTime)) {
            return sendHiddenInteractionResponse(interaction, "Le temps d'incrément n'est pas valide !")
        }

        if (!isValidBreakdown(breakDown)) {
            return sendHiddenInteractionResponse(interaction, "Le break down doit être au format X/X/X/X... (ex: 3/3/3/3/3) et être un multiple de 5 !");
        }

        if (!basisMoneyPerStreamer || basisMoneyPerStreamer <= 0) {
            return sendHiddenInteractionResponse(interaction, "L'argent de base par streamer doit être un entier strictement positif !");
        }

        try {
            // Enregistrer la draft en base via DraftService
            await DraftService.registerDraft({
                name,
                breakDown,
                basisMoneyPerStreamer,
                basisExpirationTime,
                basisIncrementTime
            });
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