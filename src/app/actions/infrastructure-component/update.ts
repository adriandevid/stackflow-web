'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import InfrastructureComponentRepository from "@pedreiro-web/infrastructure/repository/infrastructure-component";
import { InfrastructureComponent, InfrastructureComponentCommand, InfrastructureComponentEnvironment, InfrastructureComponentFileUpdate, InfrastructureComponentLabel, InfrastructureComponentNetwork, InfrastructureComponentPort, InfrastructureComponentUpdate, InfrastructureComponentVolume } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { base64ToUt8, createFile, deleteFolder, readFile } from "@pedreiro-web/util/file";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { parseJsonToYmlStringFormat } from "@pedreiro-web/util/parser";
import { NextResponse } from "next/server";

export default async function UpdateInfrastructureComponent(prev: any, body: InfrastructureComponentUpdate): Promise<any> {
    const infrastructureComponentRepository = new InfrastructureComponentRepository();

    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${body.id}`).all();
    if (row.length == 0) {
        return { message: "Código não existe!", status: 400 }
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;
    const { id: infrastructureId } = infrastructureComponentResult;

    if (infrastructureComponentRepository.update(body)) {
        var files = localdatabase.prepare(`select * from infrastructure_component_file where infrastructure_component_id = ${infrastructureComponentResult.id}`).all() as InfrastructureComponentFileUpdate[];

        files.forEach(file => {
            if (body.files?.filter(x => x.id == file.id).length == 0) {
                if (file.id) {
                    infrastructureComponentRepository.deleteFile(file.id);
                    deleteFolder(`./configuration/${file.name}`);
                }
            }
        })

        if (body.files != undefined && body.files.length > 0) {
            body.files.filter(element => element.id != 0 && element.id != undefined).forEach(element => {
                if (element.id && element.infrastructure_component_id && element.id != null) {
                    infrastructureComponentRepository.updateFile({
                        id: element.id,
                        name: element.name,
                        file: element.file
                    });
                }
            });

            body.files.filter(element => element.id == 0 || element.id == undefined).forEach(element => {
                infrastructureComponentRepository.insertFile(infrastructureId, element.name, element.file);
                createFile(`./configuration/${element.name}`, base64ToUt8(element.file));
            });
        }

        if (body.commands && body.commands.length > 0) {
            infrastructureComponentResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentCommand[];

            body.commands.filter(item => item.id != undefined && item.id != 0).forEach(item => {
                if (item.id) {
                    infrastructureComponentRepository.updateCommand(item.id, item.command);
                }
            })

            infrastructureComponentResult.commands.forEach(command => {
                if (body.commands.filter(x => x.id == command.id).length == 0) {
                    if(command.id) {
                        infrastructureComponentRepository.deleteCommand(command.id);    
                    }
                }
            })

            body.commands.filter(x => x.id == 0 || x.id == undefined).forEach(item => {
                infrastructureComponentRepository.insertCommand(infrastructureId, item.command);
            })

            infrastructureComponentResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentCommand[];
        } else {
            infrastructureComponentResult.commands = []
        }

        if (body.ports && body.ports.length > 0) {
            infrastructureComponentResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentPort[];

            body.ports.filter(item => item.id != undefined && item.id != 0).forEach(item => {
                if(item.id) {
                    infrastructureComponentRepository.updatePortBind(item.id, item.port_bind);
                }
            })

            infrastructureComponentResult.ports.forEach(port => {
                if (body.ports.filter(x => x.id != 0 && x.id != undefined && x.id == port.id).length == 0) {
                    if(port.id) {
                        infrastructureComponentRepository.deletePortBind(port.id);
                    }
                }
            })

            body.ports.filter(x => x.id == 0 || x.id == undefined).forEach(port => {
                infrastructureComponentRepository.insertPortBind(infrastructureId, port.port_bind);
            })

            infrastructureComponentResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentPort[];
        } else {
            infrastructureComponentResult.ports = []
        }

        if (body.volumes && body.volumes.length > 0) {
            infrastructureComponentResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentVolume[];

            body.volumes.filter(item => item.id && item.id != 0).forEach(item => {
                if(item.id) {
                    infrastructureComponentRepository.updateVolume(item.id, item.volume);
                }
            })

            infrastructureComponentResult.volumes.forEach(volume => {
                if (body.volumes.filter(x => x.id == volume.id).length == 0) {
                    if(volume.id) {
                        infrastructureComponentRepository.deleteVolume(volume.id);
                    }
                }
            })

            body.volumes.filter(item => item.id == undefined || item.id == 0).forEach(item => {
                infrastructureComponentRepository.insertVolume(infrastructureId, item.volume);
            })

            infrastructureComponentResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentVolume[];
        } else {
            infrastructureComponentResult.volumes = []
        }

        if (body.networks && body.networks.length > 0) {
            infrastructureComponentResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentNetwork[];

            body.networks.filter(item => item.id && item.id != 0).forEach(item => {
                if(item.id) {
                    infrastructureComponentRepository.updateNetwork(item.id, item.network);
                }
            })

            infrastructureComponentResult.networks.forEach(network => {
                if (body.networks.filter(x => x.id == network.id).length == 0) {
                    if(network.id) {
                        infrastructureComponentRepository.deleteNetwork(network.id);
                    }
                }
            })

            body.networks.filter(item => item.id == undefined || item.id == 0).forEach(item => {
                infrastructureComponentRepository.insertNetwork(infrastructureId, item.network);
            })

            infrastructureComponentResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentNetwork[];
        } else {
            infrastructureComponentResult.networks = []
        }

        if (body.labels && body.labels.length > 0) {
            infrastructureComponentResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentLabel[];

            body.labels.filter(item => item.id && item.id != 0).forEach(item => {
                if(item.id) {
                    infrastructureComponentRepository.updateLabel(item.id, item.label);
                }
            })

            infrastructureComponentResult.labels.forEach(label => {
                if (body.labels.filter(x => x.id == label.id).length == 0) {
                    if(label.id) {
                        infrastructureComponentRepository.deleteLabel(label.id);
                    }
                }
            })

            body.labels.filter(item => item.id == undefined || item.id == 0).forEach(item => {
                infrastructureComponentRepository.insertLabel(infrastructureId, item.label);
            })

            infrastructureComponentResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentLabel[];
        } else {
            infrastructureComponentResult.labels = []
        }

        if (body.environments && body.environments.length > 0) {
            infrastructureComponentResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${body.id}`).all() as InfrastructureComponentEnvironment[];

            body.environments.filter(item => item.id && item.id != 0).forEach(item => {
                if(item.id) {
                    infrastructureComponentRepository.updateEnvironmentVariable(item.id, item.environment_name, item.environment_value);
                }
            })

            infrastructureComponentResult.environments.forEach(environment => {
                if (body.labels.filter(x => x.id == environment.id).length == 0) {
                    if(environment.id) {
                        infrastructureComponentRepository.deleteEnvironmentVariable(environment.id);
                    }
                }
            })

            body.environments.filter(item => item.id == undefined || item.id == 0).forEach(item => {
                infrastructureComponentRepository.insertEnvironmentVariable(item.environment_name, item.environment_value, infrastructureId);
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


}