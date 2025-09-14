import { promises as fs } from "fs";
import path from "path";

export const sleep = async (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1_000))
}

export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const loadFiles = async (dir: string): Promise<string[]> => {
    const directoryPath = path.resolve(process.cwd(), dir);
    const files = await fs.readdir(directoryPath, { recursive: true });
    return files
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .map((file) => path.join(directoryPath, file));
};