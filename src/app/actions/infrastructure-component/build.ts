'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import DockerCompose from "dockerode-compose";
import Docker from "dockerode";

export default async function BuildInfrastructureComponent(prev: any, id: number): Promise<{
    status: number
} | undefined> {
    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    localdatabase.exec(`insert into stream(operation, resource) values ('start', '${rows[0].service_key}')`);

    const buildComponent = new Promise<boolean>((resolve, reject) => {
        exec(`docker compose -f ./configuration/docker-compose.yml up ${rows[0].service_key} -d`, (error, stdout, stderr) => {
            if (error) {
                console.log(error)
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    try {
        localdatabase.exec(`
            UPDATE infrastructure_component
            SET build_date = datetime('now')
            WHERE id = ${id};
        `)

        await buildComponent;
        return {
            status: 200
        }
    } catch {
        return {
            status: 400
        }
    }
}