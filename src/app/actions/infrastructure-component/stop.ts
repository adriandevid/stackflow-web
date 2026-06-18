'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { DockerControlPlane } from "@pedreiro-web/lib/docker";

export default async function StopInfrastructureComponent(prev: any, id: number): Promise<{
    status: number
} | undefined> {
    const dockerControlPlane = new DockerControlPlane("/configuration/docker-compose.yml");
    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    localdatabase.exec(`insert into stream(operation, resource) values ('stop', '${rows[0].service_key}')`);

    if (await dockerControlPlane.stopService(rows[0].service_key)) {
        return {
            status: 200
        }
    } else {
        localdatabase.exec(`
            DELETE FROM stream
            WHERE resource = '${rows[0].service_key}' and operation = 'stop';
        `)
        return {
            status: 400
        }
    }
}