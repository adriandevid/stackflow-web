import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery"
import { InfrastructureComponentUpdate } from "../types/infrastructure-component"

export default class InfrastructureComponentRepository {
    update(params: InfrastructureComponentUpdate) {
        localdatabase.exec(`
            UPDATE infrastructure_component
            SET service_key = '${params.service_key}', image = '${params.image}', container_name= '${params.container_name}',
            entrypoint = '${params.entrypoint}', command = '${params.command}', restart = '${params.restart}'
            WHERE id = ${params.id};
        `)
    }

    active(id: number) {
        localdatabase.exec(`
            UPDATE infrastructure_component
            SET alive = true
            WHERE id = ${id};
        `)
    }

    deactive(id: number) {
        localdatabase.exec(`
            UPDATE infrastructure_component
            SET alive = false
            WHERE id = ${id};
        `)
    }

    updateVolume(id: number, volume: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_volumes
            SET volume = '${volume}'
            where id = ${id}
        `))
    }

    insertVolume(infrastructureId: number, volume: string) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_volumes(volume, infrastructure_component_id)
            values ('${volume}', ${infrastructureId})
        `))
    }

    deleteVolume(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_volumes
            WHERE id = ${id};
        `)
    }

    deleteFile(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_file
            WHERE id = ${id};
        `)
    }

    insertFile(infrastructureId: number, fileName: string, file: string) {
        localdatabase.exec(`
            insert into infrastructure_component_file(name, file, infrastructure_component_id)
            values ('${fileName}', '${file}', ${infrastructureId})    
        `)
    }

    insertCommand(infrastructureId: number, command: string) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_command(command, infrastructure_component_id)
            values ('${command}', ${infrastructureId})
        `))
    }

    updateCommand(id: number, command: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_command
            SET command = '${command}'
            where id = ${id}
        `))
    }

    deleteCommand(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_command
            WHERE id = ${id};
        `)
    }

    updatePortBind(id: number, port_bind: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_port
            SET port_bind = '${port_bind}'
            where id = ${id}
        `))
    }

    deletePortBind(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_port
            WHERE id = ${id};
        `)
    }

    insertPortBind(infrastructureId: number, port_bind: string) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_port(port_bind, infrastructure_component_id)
            values ('${port_bind}', ${infrastructureId})
        `))
    }

    updateNetwork(id: number, network: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_network
            SET network = '${network}'
            where id = ${id}
        `))
    }

    deleteNetwork(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_network
            WHERE id = ${id};
        `)
    }

    insertNetwork(infrastructureId: number, networkName: string) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_network(network, infrastructure_component_id)
            values ('${networkName}', ${infrastructureId})
        `))
    }

    updateLabel(id: number, label: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_labels
            SET label = '${label}'
            where id = ${id}
        `))
    }

    deleteLabel(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_labels
            WHERE id = ${id};
        `)
    }

    insertLabel(infrastructureId: number, label: string) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_labels(label, infrastructure_component_id)
            values ('${label}', ${infrastructureId})
        `))
    }

    updateEnvironmentVariable(id: number, environmentName: string, environmentValue: string) {
        localdatabase.exec(normalizeQuery(`
            UPDATE infrastructure_component_environment
            SET environment_name = '${environmentName}', environment_value = '${environmentValue}'
            where id = ${id}
        `))
    }

    deleteEnvironmentVariable(id: number) {
        localdatabase.exec(`
            DELETE FROM infrastructure_component_environment
            WHERE id = ${id};
        `)
    }

    insertEnvironmentVariable(name: string, value: string, infrastructureId: number) {
        localdatabase.exec(normalizeQuery(`
            insert into infrastructure_component_environment(environment_name, environment_value, infrastructure_component_id)
            values ('${name}', '${value}', ${infrastructureId})
        `))
    }
}