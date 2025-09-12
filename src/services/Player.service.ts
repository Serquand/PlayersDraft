import { Repository } from "typeorm";
import { AppDataSource } from "../database";
import { Player } from "../models/Players";

class PlayerService {
    private readonly playerRepository: Repository<Player>;

    constructor() {
        this.playerRepository = AppDataSource.getRepository(Player);
    }

    async clearPlayersFromDraft(name: string): Promise<void> {
        await this.playerRepository.delete({ draft: { name } });
    }
}

export default new PlayerService();