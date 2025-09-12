import { Repository } from "typeorm";
import { Draft } from "../models/Draft";
import { AppDataSource } from "../database";

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

    async getDraftByName(name: string): Promise<Draft | null> {
        return this.draftRepository.findOne({ where: { name } });
    }

    async deleteDraftByName(name: string): Promise<void> {
        await this.draftRepository.delete({ name });
    }
}

export default new DraftService();