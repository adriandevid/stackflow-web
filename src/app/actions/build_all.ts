'use server';

import { exec } from "child_process";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";

export default async function BuildAllComponents(prev: any): Promise<{
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from infrastructure_component`).all() as { service_key: string }[];

    rows.forEach(row => {
        localdatabase.exec(`insert into stream(operation, resource) values ('start', '${row.service_key}')`);
    })

    const buildAllComponents = new Promise<boolean>((resolve, reject) => {
        exec(`docker compose -f ./configuration/docker-compose.yml up -d`, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    if (await buildAllComponents) {
        return {
            status: 200
        }
    }
    return {
        status: 400
    }
}