'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import InfrastructureComponentRepository from "@pedreiro-web/infrastructure/repository/infrastructure-component";
import { InfrastructureComponentCreate, InfrastructureComponentCommand, InfrastructureComponentPort, InfrastructureComponentVolume, InfrastructureComponentNetwork, InfrastructureComponentLabel, InfrastructureComponentEnvironment, InfrastructureComponent } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { base64ToUt8, createFile, readFile } from "@pedreiro-web/util/file";
import { parseJsonToYmlStringFormat } from "@pedreiro-web/util/parser";

export default async function CreateInfrastructureComponent(prev: any, body: InfrastructureComponentCreate): Promise<any> {
    const infrastructureComponentRepository = new InfrastructureComponentRepository();

    const infrastructureComponentsWithName = localdatabase.prepare(`select * from infrastructure_component where service_key = '${body.service_key}'`).all()
    const infrastructureComponentsResult: InfrastructureComponent[] = infrastructureComponentsWithName as InfrastructureComponent[];

    if (infrastructureComponentsResult.length > 0) {
        return { message: "Já existe este componente!", status: 400 }
    }

    if (infrastructureComponentRepository.insert(body)) {
        const lastInfrastructureComponentQuery = localdatabase.prepare("select * from infrastructure_component order by id desc limit 1").all();
        const lastInfrastructureComponentQueryResult: InfrastructureComponent = lastInfrastructureComponentQuery[0] as InfrastructureComponent
        const { id: infrastructureComponentId } = lastInfrastructureComponentQueryResult;

        body.files.forEach(file => {
            infrastructureComponentRepository.insertFile(infrastructureComponentId, file.name, file.file);
            createFile(`./configuration/${file.name}`, base64ToUt8(file.file));
        });

        if (body.commands && body.commands.length > 0) {
            body.commands.forEach(item => {
                infrastructureComponentRepository.insertCommand(infrastructureComponentId, item.command);
            })

            lastInfrastructureComponentQueryResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentCommand[];
        }

        if (body.ports && body.ports.length > 0) {
            body.ports.forEach(item => {
                infrastructureComponentRepository.insertPortBind(infrastructureComponentId, item.port_bind);
            })

            lastInfrastructureComponentQueryResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentPort[];
        }

        if (body.volumes && body.volumes.length > 0) {
            body.volumes.forEach(item => {
                infrastructureComponentRepository.insertVolume(infrastructureComponentId, item.volume);
            })
            lastInfrastructureComponentQueryResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentVolume[];
        } else {
            lastInfrastructureComponentQueryResult.volumes = []
        }

        if (body.networks && body.networks.length > 0) {
            body.networks.forEach(item => {
                infrastructureComponentRepository.insertNetwork(infrastructureComponentId, item.network);
            })
            lastInfrastructureComponentQueryResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentNetwork[];
        } else {
            lastInfrastructureComponentQueryResult.networks = []
        }

        if (body.labels && body.labels.length > 0) {
            body.labels.forEach(item => {
                infrastructureComponentRepository.insertLabel(infrastructureComponentId, item.label);
            })

            lastInfrastructureComponentQueryResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentLabel[];
        } else {
            lastInfrastructureComponentQueryResult.labels = []
        }

        if (body.environments && body.environments.length > 0) {
            body.environments.forEach(item => {
                infrastructureComponentRepository.insertEnvironmentVariable(item.environment_name, item.environment_value,infrastructureComponentId);
            })

            lastInfrastructureComponentQueryResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${infrastructureComponentId}`).all() as InfrastructureComponentEnvironment[];
        } else {
            lastInfrastructureComponentQueryResult.environments = []
        }

        //ajuste de montagem para a geração de documento
        var templateDocumentJson: any = {
            [lastInfrastructureComponentQueryResult.service_key]: {
                ...lastInfrastructureComponentQueryResult,
                ports: lastInfrastructureComponentQueryResult.ports != undefined ? lastInfrastructureComponentQueryResult.ports.map(x => x.port_bind) : [],
                commands: lastInfrastructureComponentQueryResult.commands != undefined ? lastInfrastructureComponentQueryResult.commands.map(x => x.command) : [],
                environment: lastInfrastructureComponentQueryResult.environments != undefined ? lastInfrastructureComponentQueryResult.environments.map(x => ({
                    [x.environment_name]: x.environment_value
                })) : [],
                labels: lastInfrastructureComponentQueryResult.labels != undefined ? lastInfrastructureComponentQueryResult.labels.map(x => x.label) : [],
                networks: lastInfrastructureComponentQueryResult.networks != undefined ? lastInfrastructureComponentQueryResult.networks.map(x => x.network) : [],
                volumes: lastInfrastructureComponentQueryResult.volumes != undefined ? lastInfrastructureComponentQueryResult.volumes.map(x => x.volume) : []
            }
        }

        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["service_key"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["id"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["configuration_id"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["position_x"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["position_y"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["type"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["alive"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["environments"]
        delete templateDocumentJson[lastInfrastructureComponentQueryResult.service_key]["build_date"]

        var ymlDocumentResult = parseJsonToYmlStringFormat(templateDocumentJson, "", 1)

        readFile("./configuration/docker-compose.yml", (content: string) => {
            var result = content;
            result = result.replace("#[content]", `
#start ${lastInfrastructureComponentQueryResult.service_key}
${ymlDocumentResult}
#end ${lastInfrastructureComponentQueryResult.service_key}
#[content]
        `)

            createFile("./configuration/docker-compose.yml", result);
        });

        return { data: lastInfrastructureComponentQueryResult, status: 200 }
    }

    return { message: "Ocorreu um erro ao executar a operação!", status: 400 }
}