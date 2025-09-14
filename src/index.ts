import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config({ quiet: false });

import { initializeDatabase } from "./database";
import { Client, Collection, TextChannel } from "discord.js";
import { commandHandler, eventHandler } from "./utils/handlers";
import DraftService from "./services/Draft.service";
import { Game } from "./services/Game.service";

async function main() {
    const client = new Client({ intents: 3276799 });

    // @ts-ignore
    client.commands = new Collection();
    client.login(process.env.BOT_TOKEN);

    await Promise.all([ eventHandler(client), commandHandler(client) ]);

    // TODO: Voir si on peut améliorer le bordel de la db
    // setInterval(async () => {
    //     await initializeDatabase();
    // }, 1_000);

    await initializeDatabase();
}

main();