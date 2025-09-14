import DraftService from "../services/Draft.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isRowPlayerValid = (row: any): boolean => {
    // name => String non vide
    if (typeof row.Name !== "string" || row.Name.trim() === "") return false;

    const requiredFields = ["BasePrice", "IncrementTime", "BasisTime", "TownHallLevel"] as const;

    for (const field of requiredFields) {
        const value = row[field];
        if (value === undefined) return false;

        const canBeZero = field === "BasePrice"; // uniquement BasePrice peut être nul
        if (!isPositiveNumber(value, canBeZero)) {
            return false;
        }
    }

    return true;
};

export const isPositiveNumber = (data: unknown, canBeZero: boolean = false): data is number => {
    return (typeof data ===  "number" && (data > 0 || (canBeZero && data === 0)));
};

export const isValidTime = (time: number) => {
    return time >= 0
}

export const isValidBreakdown = (breakDown: string) => {
    const regexCheckBreadkDown = /^(\d+\/)*\d+$/;
    return regexCheckBreadkDown.test(breakDown) && DraftService.getTotalNumberInBreakdown(breakDown) % 5 === 0
}