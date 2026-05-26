'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import DockerCompose from "dockerode-compose";
import Docker from "dockerode";
import { dockerControlPlane } from "@pedreiro-web/lib/docker";

export default async function BuildInfrastructureComponent(prev: any, id: number): Promise<{
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as { service_key: string }[];

    localdatabase.exec(`insert into stream(operation, resource) values ('start', '${rows[0].service_key}')`);
    
    try {
        if(!await dockerControlPlane.upService(rows[0].service_key)) {
            throw "operation not executed";    
        }

        localdatabase.exec(`
            UPDATE infrastructure_component
            SET build_date = datetime('now')
            WHERE id = ${id};
        `)

        return {
            status: 200
        }
    } catch {
        return {
            status: 400
        }
    }
}