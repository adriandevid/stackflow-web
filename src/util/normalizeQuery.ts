export function normalizeQuery(query: string) {
    if(query.includes('undefined')) {
        return query.replaceAll("'undefined'", 'null').replaceAll('undefined', 'null')
    }

    return query;
}