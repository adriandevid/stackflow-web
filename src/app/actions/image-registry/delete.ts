'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";

export default async function DeleteImageRegistry(prev: any, id: number): Promise<any> {
    try {
        localdatabase.exec(normalizeQuery(`
            DELETE FROM image_registry
            WHERE id = ${id};
        `))

        return { status: 200 }
    } catch (ex) {
        return { status: 400 }
    }
}