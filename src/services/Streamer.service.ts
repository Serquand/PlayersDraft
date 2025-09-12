import { Repository } from "typeorm";
import { Streamer } from "../models/Streamer";
import { AppDataSource } from "../database";

class StreamerService {
    private readonly streamerRepository: Repository<Streamer>;

    constructor() {
        this.streamerRepository = AppDataSource.getRepository(Streamer);
    }

    async assignNewStreamerToDraft(streamer: Partial<Streamer>): Promise<Streamer> {
        return this.streamerRepository.save(streamer);
    }
}

export default new StreamerService();