'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { InfrastructureComponentCreate, InfrastructureComponentCommand, InfrastructureComponentPort, InfrastructureComponentVolume, InfrastructureComponentNetwork, InfrastructureComponentLabel, InfrastructureComponentEnvironment, InfrastructureComponent } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { createFile, readFile } from "@pedreiro-web/util/file";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { parseJsonToYmlStringFormat } from "@pedreiro-web/util/parser";

export default async function CreateInfrastructureComponent (prev: any, body: InfrastructureComponentCreate): Promise<any> {

    const infrastructureComponentsWithName = localdatabase.prepare(`select * from infrastructure_component where service_key = '${body.service_key}'`).all()
    const infrastructureComponentsResult: InfrastructureComponent[] = infrastructureComponentsWithName as InfrastructureComponent[];

    if (infrastructureComponentsResult.length > 0) {
        return { message: "Já existe este componente!", status: 400 }
    }

    localdatabase.exec(normalizeQuery(`
        insert into infrastructure_component(service_key, image, container_name, entrypoint, command, position_x, position_y, type, alive, configuration_id)
        values ('${body.service_key}', '${body.image}', '${body.container_name}', '${body.entrypoint}', '${body.command}', ${body.position_x}, ${body.position_y}, '${body.type}', false, 1)
    `))

    const lastInfrastructureComponentQuery = localdatabase.prepare("select * from infrastructure_component order by id desc limit 1").all();
    const lastInfrastructureComponentQueryResult: InfrastructureComponent = lastInfrastructureComponentQuery[0] as InfrastructureComponent

    if (body.commands && body.commands.length > 0) {
        body.commands.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_command(command, infrastructure_component_id)
                values ('${item.command}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })

        lastInfrastructureComponentQueryResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentCommand[];
    }

    if (body.ports && body.ports.length > 0) {
        body.ports.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_port(port_bind, infrastructure_component_id)
                values ('${item.port_bind}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })

        lastInfrastructureComponentQueryResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentPort[];
    }

    if (body.volumes && body.volumes.length > 0) {
        body.volumes.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_volumes(volume, infrastructure_component_id)
                values ('${item.volume}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })
        lastInfrastructureComponentQueryResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentVolume[];
    } else {
        lastInfrastructureComponentQueryResult.volumes = []
    }

    if (body.networks && body.networks.length > 0) {
        body.networks.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_network(network, infrastructure_component_id)
                values ('${item.network}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })
        lastInfrastructureComponentQueryResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentNetwork[];
    } else {
        lastInfrastructureComponentQueryResult.networks = []
    }

    if (body.labels && body.labels.length > 0) {
        body.labels.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_labels(label, infrastructure_component_id)
                values ('${item.label}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })

        lastInfrastructureComponentQueryResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentLabel[];
    } else {
        lastInfrastructureComponentQueryResult.labels = []
    }

    if (body.environments && body.environments.length > 0) {
        body.environments.forEach(item => {
            localdatabase.exec(normalizeQuery(`
                insert into infrastructure_component_environment(environment_name, environment_value, infrastructure_component_id)
                values ('${item.environment_name}', '${item.environment_value}', ${lastInfrastructureComponentQueryResult.id})
            `))
        })

        lastInfrastructureComponentQueryResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all() as InfrastructureComponentEnvironment[];
    } else {
        lastInfrastructureComponentQueryResult.environments = []
    }

    //ajuste de montagem para a geração de documento
    var templateDocumentJson: any = {
        [lastInfrastructureComponentQueryResult.service_key]: {
            ...lastInfrastructureComponentQueryResult,
            ports: lastInfrastructureComponentQueryResult.ports != undefined ? lastInfrastructureComponentQueryResult.ports.map(x => x.port_bind) : [],
            commands: lastInfrastructureComponentQueryResult.commands != undefined ? lastInfrastructureComponentQueryResult.commands.map(x => x.command) : [],
            environments: lastInfrastructureComponentQueryResult.environments != undefined ?  lastInfrastructureComponentQueryResult.environments.map(x => ({
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