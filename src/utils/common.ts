export const sleep = async (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1_000))
}

export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}