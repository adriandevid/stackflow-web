import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { InfrastructureComponent, InfrastructureComponentCommand, InfrastructureComponentEnvironment, InfrastructureComponentLabel, InfrastructureComponentNetwork, InfrastructureComponentPort, InfrastructureComponentVolume } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { createFile, readFile } from "@pedreiro-web/util/file";
import { normalizeQuery } from "@pedreiro-web/util/normalizeQuery";
import { NextRequest, NextResponse } from "next/server";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;

    const infrastructureComponents = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as InfrastructureComponent[];
    const infrastructureComponent = infrastructureComponents[0];
    infrastructureComponent.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentCommand[];
    infrastructureComponent.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentPort[];
    infrastructureComponent.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentVolume[];
    infrastructureComponent.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentNetwork[];
    infrastructureComponent.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentLabel[];
    infrastructureComponent.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${infrastructureComponent.id}`).all() as InfrastructureComponentEnvironment[];
    return NextResponse.json(infrastructureComponent, { status: 200 })
}
async function PUT(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;
    const body: InfrastructureComponent = await request.json();
    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all();
    if (row.length == 0) {
        return NextResponse.json({ message: "Código não existe!" }, { status: 400 })
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;
    localdatabase.exec(`
        UPDATE infrastructure_component
        SET service_key = '${body.service_key}', image = '${body.image}', container_name= '${body.container_name}',
        entrypoint = '${body.entrypoint}', command = '${body.command}', restart = '${body.restart}', alive = ${body.alive}
        WHERE id = ${id};
    `)

    if (body.commands && body.commands.length > 0) {
        body.commands.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_command
                        SET command = '${item.command}'
                        where id = ${id}
                    `))
                return;
            }

            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_command(command, infrastructure_component_id)
                    values ('${item.command}', ${id})
                `))
        })

        infrastructureComponentResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${id}`).all() as InfrastructureComponentCommand[];

        infrastructureComponentResult.commands.forEach(command => {
            if (body.commands.filter(x => x.id == command.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_command
                            WHERE id = ${command.id};
                        `)
            }
        })
    }

    if (body.ports && body.ports.length > 0) {
        body.ports.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_port
                        SET port_bind = '${item.port_bind}'
                        where id = ${id}
                    `))
                return;
            }

            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_port(port_bind, infrastructure_component_id)
                    values ('${item.port_bind}', ${id})
                `))
        })

        infrastructureComponentResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${id}`).all() as InfrastructureComponentPort[];

        infrastructureComponentResult.ports.forEach(port => {
            if (body.ports.filter(x => x.id == port.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_port
                            WHERE id = ${port.id};
                        `)
            }
        })
    }

    if (body.volumes && body.volumes.length > 0) {
        body.volumes.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_volumes
                        SET volume = '${item.volume}'
                        where id = ${id}
                    `))
                return;
            }

            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_volumes(volume, infrastructure_component_id)
                    values ('${item.volume}', ${id})
                `))
        })
        infrastructureComponentResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${id}`).all() as InfrastructureComponentVolume[];
        infrastructureComponentResult.volumes.forEach(volume => {
            if (body.volumes.filter(x => x.id == volume.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_volumes
                            WHERE id = ${volume.id};
                        `)
            }
        })
    } else {
        infrastructureComponentResult.volumes = []
    }

    if (body.networks && body.networks.length > 0) {
        body.networks.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_network
                        SET network = '${item.network}'
                        where id = ${id}
                    `))
                return;
            }

            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_network(network, infrastructure_component_id)
                    values ('${item.network}', ${id})
                `))
        })
        infrastructureComponentResult.networks = localdatabase.prepare(`select * from infrastructure_component_network where infrastructure_component_id = ${id}`).all() as InfrastructureComponentNetwork[];

        infrastructureComponentResult.networks.forEach(network => {
            if (body.networks.filter(x => x.id == network.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_network
                            WHERE id = ${network.id};
                        `)
            }
        })
    } else {
        infrastructureComponentResult.networks = []
    }

    if (body.labels && body.labels.length > 0) {
        body.labels.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_labels
                        SET label = '${item.label}'
                        where id = ${id}
                    `))
                return;
            }

            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_labels(label, infrastructure_component_id)
                    values ('${item.label}', ${id})
                `))
        })

        infrastructureComponentResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${id}`).all() as InfrastructureComponentLabel[];
        infrastructureComponentResult.labels.forEach(label => {
            if (body.labels.filter(x => x.id == label.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_labels
                            WHERE id = ${label.id};
                        `)
            }
        })
    } else {
        infrastructureComponentResult.labels = []
    }

    if (body.environments && body.environments.length > 0) {
        body.environments.forEach(item => {
            if (item.id != undefined && item.id != 0) {
                localdatabase.exec(normalizeQuery(`
                        UPDATE infrastructure_component_environment
                        SET environment_name = '${item.environment_name}', environment_value = '${item.environment_name}'
                        where id = ${id}
                    `))
                return;
            }
            localdatabase.exec(normalizeQuery(`
                    insert into infrastructure_component_environment(environment_name, environment_value, infrastructure_component_id)
                    values ('${item.environment_name}', '${item.environment_value}', ${id})
                `))
        })

        infrastructureComponentResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${id}`).all() as InfrastructureComponentEnvironment[];
        infrastructureComponentResult.environments.forEach(environment => {
            if (body.labels.filter(x => x.id == environment.id).length == 0) {
                localdatabase.exec(`
                            DELETE FROM infrastructure_component_environment
                            WHERE id = ${environment.id};
                        `)
            }
        })
    } else {
        infrastructureComponentResult.environments = []
    }

    return NextResponse.json(infrastructureComponentResult, { status: 200 })

}

async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;

    const row = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all();
    if (row.length == 0) {
        return NextResponse.json({ message: "Código não existe!" }, { status: 400 })
    }

    const infrastructureComponentResult: InfrastructureComponent = row[0] as InfrastructureComponent;
    localdatabase.exec(`
        DELETE FROM infrastructure_component
        WHERE id = ${id};
    `)

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

    return NextResponse.json({ status: 200 })
}

export { DELETE, PUT, GET }