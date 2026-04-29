'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { ImageHub } from "@pedreiro-web/infrastructure/repository/types";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { exec } from "child_process";

export default async function LogoutImageRegistry(prev: any, id: number): Promise<any> {
    try {
        const imageHub = localdatabase.prepare(`select * from image_registry where id = '${id}'`).all() as ImageHub[]

        const logoutRegistryOperation = new Promise<boolean>((resolve, reject) => {
            exec(`docker logout ${imageHub[0].url}`, (error: any, stdout: string, stderr: string) => {
                if (error) {
                    reject(false);
                    return;
                }

                if (stdout.toLowerCase().includes("removing")) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
        });

        if (await logoutRegistryOperation) {
            localdatabase.exec(normalizeQuery(`
                update image_registry
                set active = '0'
                where id = ${id}
            `))

            return {
                status: 200
            }
        }
        return { status: 400, message: "Não foi possível concluir a operação!" }
    } catch (ex) {
        return { status: 400, message: "Não foi possível concluir a operação!" }
    }
}