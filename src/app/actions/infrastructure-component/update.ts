'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { InfrastructureComponent, InfrastructureComponentCommand, InfrastructureComponentEnvironment, InfrastructureComponentFileUpdate, InfrastructureComponentLabel, InfrastructureComponentNetwork, InfrastructureComponentPort, InfrastructureComponentUpdate, InfrastructureComponentVolume } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { base64ToUt8, createFile, deleteFolder, readFile } from "@pedreiro-web/util/file";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { parseJsonToYmlStringFormat } from "@pedreiro-web/util/parser";
import { NextResponse } from "next/server";

export default async function UpdateInfrastructureComponent(prev: any, body: InfrastructureComponentUpdate): Promise<any> {
    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${body.id}`).all();
    if (row.length == 0) {
        return { message: "Código não existe!", status: 400 }
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;
    localdatabase.exec(`
        UPDATE infrastructure_component
        SET service_key = '${body.service_key}', image = '${body.image}', container_name= '${body.container_name}',
        entrypoint = '${body.entrypoint}', command = '${body.command}', restart = '${body.restart}'
        WHERE id = ${body.id};
    `)

    var files = localdatabase.prepare(`select * from infrastructure_component_file where infrastructure_component_id = ${infrastructureComponentResult.id}`).all() as InfrastructureComponentFileUpdate[];

    files.forEach(file => {
        if (body.files?.filter(x => x.id == file.id).length == 0) {
            localdatabase.exec(`
                    DELETE FROM infrastructure_component_file
                    WHERE id = ${file.id};
                `)

            deleteFolder(`./configuration/${file.name}`);
        }
    })

    if (body.files != undefined && body.files.length > 0) {
        body.files.filter(element => element.id != 0 && element.id != undefined).forEach(element => {
            localdatabase.exec(`
                    update infrastructure_component_file
                    set name = '${element.name}', file = '${element.file}'
                    where id = ${element.id}
                `)
        });

        body.files.filter(element => element.id == 0 || element.id == undefined).forEach(element => {
            localdatabase.exec(`
                    insert into infrastructure_component_file(name, file, infrastructure_component_id)
                    values ('${element.name}', '${element.file}', ${infrastructureComponentResult.id})    
                `)

            createFile(`./configuration/${element.name}`, base64ToUt8(element.file));
        });
    }

    if (body.commands && body.commands.length > 0) {
        infrastructureComponentResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentCommand[];

        body.commands.filter(item => item.id != undefined && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_command
                        SET command = '${item.command}'
                        where id = ${item.id}
                    `))
        })

        infrastructureComponentResult.commands.forEach(command => {
            if (body.commands.filter(x => x.id == command.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_command
                            WHERE id = ${command.id};
                        `)
            }
        })

        body.commands.filter(x => x.id == 0 || x.id == undefined).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_command(command, infrastructure_component_id)
                    values ('${item.command}', ${body.id})
                `))
        })

        infrastructureComponentResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentCommand[];
    } else {
        infrastructureComponentResult.commands = []
    }

    if (body.ports && body.ports.length > 0) {
        infrastructureComponentResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentPort[];

        body.ports.filter(item => item.id != undefined && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_port
                        SET port_bind = '${item.port_bind}'
                        where id = ${item.id}
                    `))
        })

        infrastructureComponentResult.ports.forEach(port => {
            if (body.ports.filter(x => x.id != 0 && x.id != undefined && x.id == port.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_port
                            WHERE id = ${port.id};
                        `)
            }
        })

        body.ports.filter(x => x.id == 0 || x.id == undefined).forEach(port => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_port(port_bind, infrastructure_component_id)
                    values ('${port.port_bind}', ${body.id})
                `))
        })

        infrastructureComponentResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentPort[];
    } else {
        infrastructureComponentResult.ports = []
    }

    if (body.volumes && body.volumes.length > 0) {
        infrastructureComponentResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentVolume[];

        body.volumes.filter(item => item.id && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_volumes
                        SET volume = '${item.volume}'
                        where id = ${item.id}
                    `))

        })

        infrastructureComponentResult.volumes.forEach(volume => {
            if (body.volumes.filter(x => x.id == volume.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_volumes
                            WHERE id = ${volume.id};
                        `)
            }
        })

        body.volumes.filter(item => item.id == undefined || item.id == 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_volumes(volume, infrastructure_component_id)
                    values ('${item.volume}', ${body.id})
                `))
        })

        infrastructureComponentResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentVolume[];
    } else {
        infrastructureComponentResult.volumes = []
    }

    if (body.networks && body.networks.length > 0) {
        infrastructureComponentResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentNetwork[];

        body.networks.filter(item => item.id && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_network
                        SET network = '${item.network}'
                        where id = ${item.id}
                    `))
        })

        infrastructureComponentResult.networks.forEach(network => {
            if (body.networks.filter(x => x.id == network.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_network
                            WHERE id = ${network.id};
                        `)
            }
        })

        body.networks.filter(item => item.id == undefined || item.id == 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_network(network, infrastructure_component_id)
                    values ('${item.network}', ${body.id})
                `))
        })

        infrastructureComponentResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentNetwork[];
    } else {
        infrastructureComponentResult.networks = []
    }

    if (body.labels && body.labels.length > 0) {
        infrastructureComponentResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentLabel[];

        body.labels.filter(item => item.id && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_labels
                        SET label = '${item.label}'
                        where id = ${item.id}
                    `))
        })

        infrastructureComponentResult.labels.forEach(label => {
            if (body.labels.filter(x => x.id == label.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_labels
                            WHERE id = ${label.id};
                        `)
            }
        })

        body.labels.filter(item => item.id == undefined || item.id == 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_labels(label, infrastructure_component_id)
                    values ('${item.label}', ${body.id})
                `))
        })

        infrastructureComponentResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentLabel[];
    } else {
        infrastructureComponentResult.labels = []
    }

    if (body.environments && body.environments.length > 0) {
        infrastructureComponentResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentEnvironment[];

        body.environments.filter(item => item.id && item.id != 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_environment
                        SET environment_name = '${item.environment_name}', environment_value = '${item.environment_name}'
                        where id = ${item.id}
                    `))
        })

        infrastructureComponentResult.environments.forEach(environment => {
            if (body.labels.filter(x => x.id == environment.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_environment
                            WHERE id = ${environment.id};
                        `)
            }
        })

        body.environments.filter(item => item.id == undefined || item.id == 0).forEach(item => {
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_environment(environment_name, environment_value, infrastructure_component_id)
                    values ('${item.environment_name}', '${item.environment_value}', ${body.id})
                `))
        })

        infrastructureComponentResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentEnvironment[];
    } else {
        infrastructureComponentResult.environments = []
    }

    infrastructureComponentResult.command = body.command;
    infrastructureComponentResult.container_name = body.container_name;
    infrastructureComponentResult.image = body.image;
    infrastructureComponentResult.entrypoint = body.entrypoint;
    infrastructureComponentResult.restart = body.restart;

    var templateDocumentJson: any = {
        [infrastructureComponentResult.service_key]: {
            ...infrastructureComponentResult,
            ports: infrastructureComponentResult.ports.map(x => x.port_bind),
            commands: infrastructureComponentResult.commands.map(x => x.command),
            environment: infrastructureComponentResult.environments.map(x => ({
                [x.environment_name]: x.environment_value
            })),
            labels: infrastructureComponentResult.labels.map(x => x.label),
            networks: infrastructureComponentResult.networks.map(x => x.network),
            volumes: infrastructureComponentResult.volumes.map(x => x.volume)
        }
    }

    delete templateDocumentJson[infrastructureComponentResult.service_key]["service_key"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["id"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["configuration_id"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["position_x"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["position_y"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["type"]
    delete templateDocumentJson[infrastructureComponentResult.service_key]["environments"];
    delete templateDocumentJson[infrastructureComponentResult.service_key]["alive"];
    delete templateDocumentJson[infrastructureComponentResult.service_key]["build_date"];

    var ymlDocumentResult = parseJsonToYmlStringFormat(templateDocumentJson, "", 1)
    
    readFile("./configuration/docker-compose.yml", (content: string) => {
        var result = content;
        result = result.replace(/services:[\s\S]*?#start/g, "services:\n#start")

        result = result.replace(
            new RegExp(`#start ${infrastructureComponentResult.service_key}[\\s\\S]*?#end ${infrastructureComponentResult.service_key}`, 'g'),
            ''
        )
        result = result.replace(/services:[\s\S]*?#[content]/g, "services:\n#[content]")
        result = result.replace(/#\[content\][\s\S]*?networks:/g, "#[content]\nnetworks:")

        result = result.replace("#[content]", `
#start ${infrastructureComponentResult.service_key}
${ymlDocumentResult}
#end ${infrastructureComponentResult.service_key}
#[content]
        `)

        createFile("./configuration/docker-compose.yml", result);
    });

    return { data: infrastructureComponentResult, status: 200 }
}