'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { ImageHub } from "@pedreiro-web/infrastructure/repository/types";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";

export default async function CreateImageRegistry(prev: any, url: string): Promise<any> {
    try {
        const imagesHub = localdatabase.prepare(`select * from image_registry where url = '${url}'`).all() as ImageHub[]
        
        if(imagesHub.length > 0) {
            return { status: 400, message: "já existe um registry com esta url!" }
        }

        localdatabase.exec(normalizeQuery(`
            insert into image_registry(url, active, configuration_id)
            values ('${url}', false, 1)
        `))

        return { status: 200 }
    } catch (ex) {
        return { status: 400 }
    }
}