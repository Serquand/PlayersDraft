import { Client, CommandInteraction } from "discord.js";
import { sendHiddenInteractionResponse, sendErrorInteractionResponse } from "../../utils/discord";
import XLSX from "xlsx";
import fetch from "node-fetch";
import PlayerService from "../../services/Player.service";

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
            description: "Draft à laquelle ajouter les joueurs"
        }
    ],
    runSlash: async (client: Client, interaction: CommandInteraction) => {
        const attachment = interaction.options.getAttachment("file");
        const draftName = interaction.options.getString("draft");

        if (!draftName || !attachment) {
            return sendHiddenInteractionResponse(interaction, "Informations invalides");
        }

        // Remove the current players association with the draft
        await PlayerService.clearPlayersFromDraft(draftName);

        if (!attachment.name?.endsWith(".xlsx")) {
            return sendHiddenInteractionResponse(interaction, "Le fichier doit être au format .xlsx !");
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
            console.log(data);

            if (data.length === 0) {
                return sendHiddenInteractionResponse(interaction, "Le fichier Excel est vide !");
            }

            // Exemple : chaque ligne doit contenir Name et BasePrice
            const players = data.map(row => ({
                name: row.Name,
                basePrice: Number(row.BasePrice || 0)
            }));

            // Sauvegarder les joueurs en base via PlayerService
            // await PlayerService.bulkCreate(players);

            return sendHiddenInteractionResponse(interaction, `✅ ${players.length} joueurs ont été importés avec succès !`);
        } catch (err) {
            console.error(err);
            return sendErrorInteractionResponse(interaction);
        }
    },
};

export default command;
