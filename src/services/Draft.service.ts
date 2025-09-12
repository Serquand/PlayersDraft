import { Repository } from "typeorm";
import { Draft } from "../models/Draft";
import { AppDataSource } from "../database";
import { AutocompleteInteraction } from "discord.js";
import { sendAutocomplete } from "../utils/autocomplete";

class DraftService {
    private readonly draftRepository: Repository<Draft>;

    constructor() {
        this.draftRepository = AppDataSource.getRepository(Draft);
    }

    async registerDraft(name: string, breakDown: string | null): Promise<Draft> {
        try {
            return await this.draftRepository.save({ breakDown, name });
        } catch (error) {
            console.error("Error registering draft:", error);
            throw error;
        }
    }

    async listDraft() {
        return this.draftRepository.find();
    }

    async getDraftByName(name: string, relations: (keyof Draft)[] = []): Promise<Draft | null> {
        return this.draftRepository.findOne({ where: { name }, relations });
    }

    getNumberOfPlayerForDraft(breakdown: string): number {
        const byTownHalls = breakdown?.split('/')
        let counter = 0;
        for(const th of byTownHalls) {
            counter += Number.parseInt(th)
        }
        return counter
    }

    async deleteDraftByName(name: string): Promise<void> {
        await this.draftRepository.delete({ name });
    }

    async autocompleteDraft(interaction: AutocompleteInteraction) {
        const draftNames = (await this.listDraft()).map(d => d.name);
        return sendAutocomplete(interaction, draftNames);
    }
}

export default new DraftService();