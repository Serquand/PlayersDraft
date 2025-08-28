import { DataSource } from "typeorm";
import { ENTITIES } from "./models";

export const AppDataSource = new DataSource({
    type: process.env.DB_DIALECT as "mysql" | "postgres",
    host: process.env.DB_HOST!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    synchronize: true,
    entities: ENTITIES,
});

export const initializeDatabase = async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log("Database connected!");
    }
}