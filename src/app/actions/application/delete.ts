'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Application } from "@pedreiro-web/infrastructure/repository/types/application";
import { deleteFolder } from "@pedreiro-web/util/file";

export default async function DeleteApplication(prev: any, body: { id: number }) : Promise<any> {
    const row = localdatabase.prepare(`select * from application where id = ${body.id}`).all()
    const applicationCreatedResult: Application = row[0] as Application;
    localdatabase.exec(`
        DELETE FROM application
        WHERE id = ${body.id};
    `)

    await deleteFolder(`./configuration/applications/${applicationCreatedResult.name}`);

    return { data: applicationCreatedResult, status: 200 }
}