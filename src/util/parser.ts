function parseJsonToYmlStringFormat(json: any, r: string, tabSpaceLevel: number): string {
    var result = r;

    if (Object.keys(json).length > 0 && !Object.keys(json).includes('0')) {
        Object.keys(json).forEach(key => {
            if (json[key] != null) {
                if (Object.keys(json[key]).length > 0 && !Object.keys(json[key]).includes('0')) {
                    result += `${"  ".repeat(tabSpaceLevel)}${key}: \n`;
                    result = parseJsonToYmlStringFormat(json[key], result, tabSpaceLevel + 1);
                } else {
                    if (Array.isArray(json[key])) {
                        if (json[key].length > 0) {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: \n`;
                            json[key].forEach((x, index) => {
                                if (typeof (x) == "object") {
                                    result = parseJsonToYmlStringFormat(x, result, tabSpaceLevel + 1);
                                } else {
                                    var arrayType: string[] = json[key] as string[];
                                    result += `${"  ".repeat(tabSpaceLevel + 1)}- ${arrayType[index]} \n`
                                }
                            })
                        }
                    } else {
                        if(typeof(json[key]) == "string" && json[key].replaceAll(" ", "").length > 0) {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: ${json[key]} \n`;
                        } else if (typeof(json[key]) =="number") {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: ${json[key]} \n`;
                        }
                    }
                }
            }
        })
    }

    return result;
}

export { parseJsonToYmlStringFormat }