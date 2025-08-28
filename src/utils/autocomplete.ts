import { AutocompleteInteraction } from "discord.js";

export function sendAutocomplete (interaction: AutocompleteInteraction, listValues: Array<string>) {
    const beginningOfPrompt = interaction.options.getFocused().toLowerCase();
    const listToSend = listValues
        .map(el => {
            const isValid =  el.toLowerCase().includes(beginningOfPrompt);
            if(isValid) return { name: el, value: el };
            else return null;
        })
        .filter(el => el !== null)
        .slice(0, 15);
    interaction.respond(listToSend);
}