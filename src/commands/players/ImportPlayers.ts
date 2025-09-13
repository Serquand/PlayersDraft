import { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse, sendErrorInteractionResponse } from "../../utils/discord";
import XLSX from "xlsx";
import fetch from "node-fetch";
import PlayerService from "../../services/Player.service";
import { isRowPlayerValid } from "../../utils/validators";
import { Player } from "../../models/Players";
import DraftService from "../../services/Draft.service";

const command = {
    name: 'import_players',
    description: "Importer des joueurs depuis un fichier Excel",
    options: [
        {
            name: "file",
            type: "ATTACHMENT",
            required: true,
            description: "Fichier Excel (.xlsx) contenant les joueurs"
        },
        {
            name: "draft",
            type: "STRING",
            required: true,
            description: "Draft à laquelle ajouter les joueurs",
            autocomplete: true
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const attachment = interaction.options.getAttachment("file");
        const draftName = interaction.options.getString("draft");
        const players: Array<Partial<Player>> = [];
        const playersNames = new Set<string>();

        if (!draftName || !attachment) {
            return sendHiddenInteractionResponse(interaction, "Informations invalides");
        }

        if (!attachment.name?.endsWith(".xlsx")) {
            return sendHiddenInteractionResponse(interaction, "Le fichier doit être au format .xlsx !");
        }

        const draft = await DraftService.getDraftByName(draftName, ["streamers"]);
        if (!draft || draft.streamers.length === 0) {
            return sendHiddenInteractionResponse(interaction, "La draft spécifiée n'existe pas ou n'a pas de streamer associé !");
        }

        try {
            // Télécharger le fichier depuis Discord
            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();

            // Lire le fichier Excel
            const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convertir la première feuille en JSON
            const data: any[] = XLSX.utils.sheet_to_json(sheet);
            if (!DraftService.checkIfNumberOfPlayersIsValid(draft, data)) {
                return sendHiddenInteractionResponse(interaction, "Le fichier Excel ne contient pas un nombre valide de joueurs !");
            }

            for(const row of data) {
                if (!isRowPlayerValid(row)) {
                    return sendHiddenInteractionResponse(interaction, "Le format de donnée n'est pas valide !");
                }

                if (playersNames.has(row.Name)) {
                    return sendHiddenInteractionResponse(interaction, `Le joueur "${row.Name}" est en double dans le fichier !`);
                }
                playersNames.add(row.Name);

                players.unshift({
                    name: row.Name,
                    basePrice: Number(row.BasePrice || 0),
                    incrementTime: Number(row.IncrementTime || draft.basisIncrementTime),
                    basisTime: Number(row.BasisTime || draft.basisExpirationTime),
                    townHallLevel: row.TownHallLevel ? Number(row.TownHallLevel) : undefined,
                    draft
                })
            }

            // Supprimer les joueurs de la draft avant d'importer les nouveaux
            await PlayerService.clearPlayersFromDraft(draft);

            // Sauvegarder les joueurs en base via PlayerService
            await PlayerService.bulkCreate(players);

            return sendHiddenInteractionResponse(interaction, `✅ ${players.length} joueurs ont été importés avec succès !`);
        } catch (err) {
            console.error(err);
            return sendErrorInteractionResponse(interaction);
        }
    },
    autocomplete: (interaction: AutocompleteInteraction) => DraftService.autocompleteDraft(interaction)
};

export default command;
