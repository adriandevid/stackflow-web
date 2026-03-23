'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { InfrastructureComponent } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { createFile, readFile } from "@pedreiro-web/util/file";
import { exec } from "child_process";

export default async function DeleteInfrastructureComponent(prev: any, body: { id: number }): Promise<any> {
    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${body.id}`).all() as InfrastructureComponent[];

    if (row.length == 0) {
        return { message: "Código não existe!", status: 400 }
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;

    localdatabase.exec(`
        DELETE FROM infrastructure_component
        WHERE id = ${body.id};
    `)

    localdatabase.exec(`
        DELETE FROM stream
        WHERE resource = '${row[0].service_key}';
    `)

    const downContainer = new Promise<boolean>((resolve, reject) => {
        exec(`docker compose -f ./configuration/docker-compose.yml down ${infrastructureComponentResult.service_key}`,{ windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(false);
                return;
            }
            resolve(true);
        })
    });

    var operationBuildResult = await downContainer;
    if (operationBuildResult) {
        readFile("./configuration/docker-compose.yml", (content: string) => {
            var result = content;

            result = result.replace(/services:[\s\S]*?#start/g, "services:\n#start")

            result = result.replace(
                new RegExp(`#start ${infrastructureComponentResult.service_key}[\\s\\S]*?#end ${infrastructureComponentResult.service_key}`, 'g'),
                ''
            )
            result = result.replace(/services:[\s\S]*?#[content]/g, "services:\n#[content]")
            result = result.replace(/#\[content\][\s\S]*?networks:/g, "#[content]\nnetworks:")

            createFile("./configuration/docker-compose.yml", result);
        });

        return { data: infrastructureComponentResult, status: 200 }
    }

    return { message: operationBuildResult, status: 400 }
}