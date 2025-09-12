// TODO:
export const isRowPlayerValid = (row: any): boolean => {
    return row.Name && row.BasePrice !== undefined;
}