import { Repository } from "typeorm";
import { Streamer } from "../models/Streamer";
import { AppDataSource } from "../database";
import { AutocompleteInteraction } from "discord.js";
import { sendAutocomplete } from "../utils/autocomplete";
import DraftService from "./Draft.service";

class StreamerService {
    private readonly streamerRepository: Repository<Streamer>;

    constructor() {
        this.streamerRepository = AppDataSource.getRepository(Streamer);
    }

    async assignNewStreamerToDraft(streamer: Partial<Streamer>): Promise<Streamer> {
        return this.streamerRepository.save(streamer);
    }

    async autocompleteStreamerInDraft(interaction: AutocompleteInteraction, draftName: string | null) {
        if (!draftName) {
            return [];
        }

        const draft = await DraftService.getDraftByName(draftName, ["streamers"]);
        if (!draft) {
            return [];
        }

        return sendAutocomplete(interaction, draft.streamers.map(s => s.username));
    }

    async deleteStreamerById(id: number): Promise<void> {
        await this.streamerRepository.delete({ id });
    }

    async updateStreamerBalance(id: number, newBalance: number): Promise<void> {
        await this.streamerRepository.update({ id }, { balance: newBalance });
    }
}

export default new StreamerService();