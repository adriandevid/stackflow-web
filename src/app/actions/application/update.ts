'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Application, ApplicationFile, ApplicationUpdate } from "@pedreiro-web/infrastructure/repository/types/application";
import { base64ToUt8, createFile, deleteFolder } from "@pedreiro-web/util/file";

export default async function UpdateApplication(prev: any, body: ApplicationUpdate): Promise<any> {
    const row = localdatabase.prepare(`select * from application where id = ${body.id}`).all() as Application[];
    if (row.length == 0) {
        return { message: "Código não existe!", status: 400 }
    }

    localdatabase.exec(`
        update application
        set name = '${body.name}', port = ${body.port}, node_port = ${body.node_port}, target_port = ${body.target_port}, container_name = '${body.container_name}', image = '${body.image}', replicas = ${body.replicas}, image_pull_policy = '${body.image_pull_policy}'
        where id = ${body.id}
    `)

    var files = localdatabase.prepare(`select * from application_files where application_id = ${body.id}`).all() as ApplicationFile[];

    files.forEach(file => {
        if (body.files?.filter(x => x.id == file.id).length == 0) {
            localdatabase.exec(`
                    DELETE FROM application_files
                    WHERE id = ${file.id};
                `)

            deleteFolder(`./configuration/${file.name}`);
        }
    })

    if (body.files != undefined && body.files.length > 0) {
        body.files.filter(element => element.id != 0 && element.id != undefined).forEach(element => {
            localdatabase.exec(`
                    update application_files
                    set name = '${element.name}', file = '${element.file}'
                    where id = ${element.id}
                `)
        });

        body.files.filter(element => element.id == 0 || element.id == undefined).forEach(element => {
            localdatabase.exec(`
                    insert into application_files(name, file, application_id)
                    values ('${element.name}', '${element.file}', ${body.id})    
                `)

            createFile(`./configuration/${element.name}`, base64ToUt8(element.file));
        });

        row[0].files = localdatabase.prepare(`select * from application_files where application_id = ${body.id}`).all() as ApplicationFile[];
    }

    return { data: row[0], status: 200 }
}