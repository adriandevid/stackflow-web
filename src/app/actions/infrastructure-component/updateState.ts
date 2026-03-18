'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import DockerCompose from "dockerode-compose";
import Docker from "dockerode";

export default async function UpdateStateInfrastructureComponent(prev: any, id: number): Promise<{
    container: { name: string, status: string, log: string },
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    const getStatusComponent = new Promise<{ name: string, status: string, log: string }>((resolve, reject) => {
        exec(`docker ps`, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }

            var stdoutDockerPs = `${stdout}`;

            const lines = stdoutDockerPs
                .split('\n')
                .slice(1)
                .map(line => line.trim())
                .filter(Boolean);

            const containers = lines.map(line => {
                const [
                    id,
                    image,
                    command,
                    created,
                    status,
                    ports,
                    name
                ] = line.split(/\s{2,}/);

                 return { id, image, command, created, status, ports, name };
            })

            var container = containers.filter(x => x.name != undefined && x.name.includes(rows[0].service_key))[0];
            
            if(container) {
                resolve({
                    name: container.name,
                    status: container.status.includes("Up") ? "Up" : container.status,
                    log: stderr
                });
            } else {
                resolve({
                    name: rows[0].service_key,
                    status: "down",
                    log: stderr
                });
            }
            
        })
    });

    var statusComponent = await getStatusComponent;

    localdatabase.exec(`
        UPDATE infrastructure_component
        SET alive = ${statusComponent.status == "Up"}
        WHERE id = ${id};
    `)

    return {
        container: statusComponent,
        status: 200
    }
}