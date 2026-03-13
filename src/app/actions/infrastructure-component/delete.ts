'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { InfrastructureComponent } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { createFile, readFile } from "@pedreiro-web/util/file";
import { exec } from "child_process";

export default async function DeleteInfrastructureComponent(prev: any, body: { id: number }): Promise<any> {
    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${body.id}`).all();
    if (row.length == 0) {
        return { message: "Código não existe!", status: 400 }
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;

    localdatabase.exec(`
        DELETE FROM infrastructure_component
        WHERE id = ${body.id};
    `)

    const downContainer = new Promise<{ name: string, status: string, log: string }>((resolve, reject) => {
        exec(`wsl docker compose -f ./configuration/docker-compose.yml down ${infrastructureComponentResult.service_key} && wsl docker ps`, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }

            var stdoutDockerPs = `${stdout}`;

            var fields = stdoutDockerPs
                .replace(/^CONTAINER.*\n/gm, '')
                .split(/(?=^[a-z]+\d+)/gm)[0]
                .split("\n").map(x => x.split(/(\S+)/gm).filter(x => x.replaceAll(" ", "").length > 0))
                .filter(x => x.includes(infrastructureComponentResult.service_key));

            resolve({
                name: fields.length > 0 ? fields[0][fields[0].length - 1] : infrastructureComponentResult.service_key,
                status: fields.length > 0 ? fields[0][7] : "down",
                log: stderr
            });
        })
    });

    var operationBuildResult = await downContainer;
    if (operationBuildResult.status == "down") {
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