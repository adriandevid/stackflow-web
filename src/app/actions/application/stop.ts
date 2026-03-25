'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import { Application } from "@pedreiro-web/infrastructure/repository/types/application";

export default async function StopApplication(prev: any, id: number): Promise<{
    status: number
} | undefined> {
    const rows = localdatabase.prepare(`select * from application where id = ${id}`).all() as Application[];

    localdatabase.exec(`insert into stream(operation, resource) values ('stop', '${rows[0].name}')`);

    const stopDeployment = new Promise<boolean>((resolve, reject) => {
        exec(`kubectl scale deployment ${rows[0].name}-deployment --replicas=0`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    await stopDeployment;

    return {
        status: 200
    }
}