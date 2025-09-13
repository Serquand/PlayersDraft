import DraftService from "../services/Draft.service";

export const isRowPlayerValid = (row: any): boolean => {
    // name => String non vide
    if (typeof row.name !== "string" || row.name.trim() === "") return false;

    const optionnalPositiveNumber = ["basePrice", "incrementTime", "basisTime", "townHallLevel"] as const
    for(const option of optionnalPositiveNumber) {
        const data = row[option]
        if(data !== undefined || !isPositiveNumber(data)) {
            return false
        }
    }

    return true;
}

export const isPositiveNumber = (data: unknown): data is number => {
    return typeof data === "number" && data > 0
}

export const isValidTime = (time: number) => {
    return time >= 0
}

export const isValidBreakdown = (breakDown: string) => {
    const regexCheckBreadkDown = /^(\d+\/)*\d+$/;
    return regexCheckBreadkDown.test(breakDown) && DraftService.getTotalNumberInBreakdown(breakDown) % 5 === 0
}