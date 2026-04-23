'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";

export default async function DestroyApplication(prev: any, id: number): Promise<{
    status: number
} | undefined> {

    const rows = localdatabase.prepare(`select * from application where id = ${id}`).all() as { name: string }[];

    localdatabase.exec(`insert into stream(operation, resource) values ('down', '${rows[0].name}')`);

    const deleteApplicationDeployment = new Promise<string>((resolve, reject) => {
        exec(`kubectl delete deployment ${rows[0].name}-deployment`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve("success");
        })
    });


    const deleteApplicationService = new Promise<string>((resolve, reject) => {
        exec(`kubectl delete service ${rows[0].name}-service`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve("success");
        })
    });

    try {
        await deleteApplicationService;
        await deleteApplicationDeployment;
    } catch (ex) {
        localdatabase.exec(`
            DELETE FROM stream
            WHERE resource = '${rows[0].name}' and operation = 'down';
        `)
    }

    return {
        status: 200
    }
}