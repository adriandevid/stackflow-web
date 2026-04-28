
'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { ImageHub } from "@pedreiro-web/infrastructure/repository/types";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { exec } from "child_process";
import Dockerode from "dockerode";

export default async function LoginIntoImageRegistry(prev: any, body: { id: number, user_name: string, password: string } | undefined) {

    if (body == undefined) {
        return {
            status: 400,
            message: "O image hub não foi encontrado!"
        }
    }

    const imageHub = localdatabase.prepare(`select * from image_registry where id = '${body.id}'`).all() as ImageHub[]

    if (imageHub.length == 0) {
        return {
            status: 400,
            message: "O image hub não foi encontrado!"
        }
    }

    
    const loginOperation = new Promise<boolean>((resolve, reject) => {
        exec(`docker login ${imageHub[0].url} -u ${body.user_name} -p ${body.password}`, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }

            if (stdout.toLowerCase().includes("succeeded")) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
    });

    if (await loginOperation) {
        localdatabase.exec(normalizeQuery(`
            update image_registry
            set active = '1'
            where id = ${body.id}
        `))

        return {
            status: 200
        }
    }
    return {
        status: 400,
        message: "Não foi possivel executar esta operação"
    }
}