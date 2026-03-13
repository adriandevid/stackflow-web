'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";

export default async function BuildInfrastructureComponent(prev: any, id: number) : Promise<{
    container: { name: string, status: string, log: string },
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    const buildComponent = new Promise<{name: string, status: string, log: string }>((resolve, reject) => {
        exec(`wsl docker compose -f ./configuration/docker-compose.yml up ${rows[0].service_key} -d  && wsl docker ps`, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }

            var stdoutDockerPs = `${stdout}`;

            var fields = stdoutDockerPs
                .replace(/^CONTAINER.*\n/gm, '')
                .split(/(?=^[a-z]+\d+)/gm)[0]
                .split("\n").map(x => x.split(/(\S+)/gm).filter(x => x.replaceAll(" ", "").length > 0)).filter(x => x.includes(rows[0].service_key));

            resolve({
                name: fields[0][fields[0].length - 1],
                status: fields[0][7],
                log: stderr
            });
        })
    });
    
    var operationBuildResult = await buildComponent;
    
    console.log(`build ${rows[0].service_key} => `, operationBuildResult);

    localdatabase.exec(`
        UPDATE infrastructure_component
        SET alive = ${operationBuildResult.status == "Up"}
        WHERE id = ${id};
    `)

    return {
        container: operationBuildResult,
        status: 200
    }
}