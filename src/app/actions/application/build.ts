'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import { Application } from "@pedreiro-web/infrastructure/repository/types/application";

export default async function BuildApplication(prev: any, id: number): Promise<{
    status: number
} | undefined> {
    const rows = localdatabase.prepare(`select * from application where id = ${id}`).all() as Application[];

    localdatabase.exec(`insert into stream(operation, resource) values ('start', '${rows[0].name}')`);

    const buildeDeployment = new Promise<boolean>((resolve, reject) => {
        exec(`kubectl apply -f ./configuration/applications/${rows[0].name}/deployment.yml`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    const buildeService = new Promise<boolean>((resolve, reject) => {
        exec(`kubectl apply -f ./configuration/applications/${rows[0].name}/service.yml`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    await buildeDeployment;
    await buildeService;

    return {
        status: 200
    }
}