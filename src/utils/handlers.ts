import { Client } from "discord.js";
import { promises as fs } from "fs";
import path from "path";

const basisLocation = process.env.NODE_ENV === "prod" ? 'dist/' : 'src/'

export const loadFiles = async (dir: string): Promise<string[]> => {
    const directoryPath = path.resolve(process.cwd(), dir);
    const files = await fs.readdir(directoryPath, { recursive: true });
    return files
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((file) => path.join(directoryPath, file));
};

export const commandHandler = async (client: Client) => {
    try {
        const commandFiles = await loadFiles(basisLocation + "commands");
        for(let i = 0; i < commandFiles.length; i++) {
            const cmdFile = commandFiles[i];
            try {
                const cmd = (await import(cmdFile)).default;

                if (cmd.isDisabled) continue;

                if (!cmd.name || !cmd.description) {
                    console.warn(`⚠️ Commande non chargée (${cmdFile}): nom ou description manquant.`);
                    continue;
                }

                // @ts-ignore
                client.commands.set(cmd.name, cmd);
                console.log(`✅ Commande chargée : ${cmd.name} => (${i + 1} / ${commandFiles.length})`);
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de la commande ${cmdFile}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement des commandes :", error);
    }
};

export const eventHandler = async (client: Client) => {
    try {
        const eventFiles = await loadFiles(basisLocation + "events");

        for (const eventFile of eventFiles) {
            try {
                const event = (await import(eventFile)).default;

                if (!event.name || typeof event.execute !== "function") {
                    console.warn(`⚠️ Événement non chargé (${eventFile}): nom ou fonction 'execute' manquants.`);
                    continue;
                }

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(client, ...args));
                } else {
                    client.on(event.name, (...args) => event.execute(client, ...args));
                }

                console.log(`✅ Événement chargé : ${event.name}`);
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de l'événement ${eventFile}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement des événements :", error);
    }
};