'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";

export default async function StopInfrastructureComponent(prev: any, id: number) : Promise<{
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    localdatabase.exec(`insert into stream(operation, resource) values ('stop', '${rows[0].service_key}')`);

    const buildComponent = new Promise<string>((resolve, reject) => {
        exec(`docker compose -f ./configuration/docker-compose.yml stop ${rows[0].service_key}`,{ windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve("success");
        })
    });
    
    try {
        await buildComponent;
    } catch (ex) {
        localdatabase.exec(`
            DELETE FROM stream
            WHERE resource = '${rows[0].service_key}' and operation = 'stop';
        `)
    }

    return {
        status: 200
    }
}