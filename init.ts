import Database from "better-sqlite3";
import fs from 'fs';
import { rm } from 'node:fs/promises'; // Use fs/promises for async/await

if (!fs.existsSync(`./configuration`)) {
    fs.mkdirSync(`./configuration`, {
        recursive: true
    });
    console.log(`Folder ./configuration created.`);
}

if (!fs.existsSync(`./configuration/applications/`)) {
    fs.mkdirSync(`./configuration/applications/`, {
        recursive: true
    });
    console.log(`Folder ./configuration/applications/ created.`);
}

const data = new Uint8Array(Buffer.from(`
services:
#[content]
networks:
  web:
    external: false
`));

function parseJsonToYmlStringFormat(json: any, r: string, tabSpaceLevel: number): string {
    var result = r;

    if (Object.keys(json).length > 0 && !Object.keys(json).includes('0')) {
        Object.keys(json).forEach(key => {
            if (json[key] != null) {
                if (Object.keys(json[key]).length > 0 && !Object.keys(json[key]).includes('0')) {
                    result += `${"  ".repeat(tabSpaceLevel)}${key}: \n`;
                    result = parseJsonToYmlStringFormat(json[key], result, tabSpaceLevel + 1);
                } else {
                    if (Array.isArray(json[key])) {
                        if (json[key].length > 0) {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: \n`;
                            json[key].forEach((x, index) => {
                                if (typeof (x) == "object") {
                                    result = parseJsonToYmlStringFormat(x, result, tabSpaceLevel + 1);
                                } else {
                                    var arrayType: string[] = json[key] as string[];
                                    result += `${"  ".repeat(tabSpaceLevel + 1)}- ${arrayType[index]} \n`
                                }
                            })
                        }
                    } else {
                        if (typeof (json[key]) == "string" && json[key].replaceAll(" ", "").length > 0) {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: ${json[key]} \n`;
                        } else if (typeof (json[key]) == "number") {
                            result += `${"  ".repeat(tabSpaceLevel)}${key}: ${json[key]} \n`;
                        }
                    }
                }
            }
        })
    }

    return result;
}

async function buildApplications() {
    const localdatabase = new Database('./src/infrastructure/database/mydatabase.db', { verbose: console.log });
    const rows: any[] = localdatabase.prepare("select * from application;").all();

    if (fs.existsSync(`./configuration/applications`)) {
        await rm(`./configuration/applications`, { recursive: true, force: true });
    }

    fs.mkdirSync(`./configuration/applications/`);

    rows.forEach(async (applicationCreatedResult) => {
        fs.mkdirSync(`./configuration/applications/${applicationCreatedResult.name}`);

        fs.writeFile(`./configuration/applications/${applicationCreatedResult.name}/service.yml`, new Uint8Array(Buffer.from(`
apiVersion: v1
kind: Service
metadata:
    name: ${applicationCreatedResult.name}-service
    labels:
        app: ${applicationCreatedResult.name}
spec:
    type: NodePort
    selector:
        app: ${applicationCreatedResult.name}  # Replace with your application's label
    ports:
        - port: ${applicationCreatedResult.port}        # The port your application listens on internally
          targetPort: ${applicationCreatedResult.target_port}  # The port within the pod
          nodePort: ${applicationCreatedResult.node_port}
          protocol: ${applicationCreatedResult.protocol}
    `)), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });

        fs.writeFile(`./configuration/applications/${applicationCreatedResult.name}/deployment.yml`, new Uint8Array(Buffer.from(`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${applicationCreatedResult.name}-deployment
  labels:
    app: ${applicationCreatedResult.name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${applicationCreatedResult.name}
  template:
    metadata:
      labels:
        app: ${applicationCreatedResult.name}
    spec:
      containers:
        - name: ${applicationCreatedResult.container_name}
          image: ${applicationCreatedResult.image}
          imagePullPolicy: ${applicationCreatedResult.image_pull_policy}
      imagePullSecrets:
        - name: myregistrykey
    `)), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    })
}

async function buildInfrastructureComponents() {
    const localdatabase = new Database('./src/infrastructure/database/mydatabase.db', { verbose: console.log });
    const infrastructureComponents: any[] = localdatabase.prepare(`select * from infrastructure_component`).all();

    const decoder = new TextDecoder('utf-8');
    var stringDefault = decoder.decode(data.buffer);

    infrastructureComponents.forEach(async (lastInfrastructureComponentQueryResult) => {
        lastInfrastructureComponentQueryResult.commands = localdatabase.prepare(`select * from infrastructure_component_command where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all();
        lastInfrastructureComponentQueryResult.ports = localdatabase.prepare(`select * from infrastructure_component_port where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all();
        lastInfrastructureComponentQueryResult.volumes = localdatabase.prepare(`select * from infrastructure_component_volumes where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all();
        lastInfrastructureComponentQueryResult.labels = localdatabase.prepare(`select * from infrastructure_component_labels where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all();
        lastInfrastructureComponentQueryResult.environments = localdatabase.prepare(`select * from infrastructure_component_environment where infrastructure_component_id = ${lastInfrastructureComponentQueryResult.id}`).all();

        //ajuste de montagem para a geração de documento
        var templateDocumentJson: any = {
            [lastInfrastructureComponentQueryResult.service_key]: {
                ...lastInfrastructureComponentQueryResult,
                ports: lastInfrastructureComponentQueryResult.ports != undefined ? lastInfrastructureComponentQueryResult.ports.map((x: any) => x.port_bind) : [],
                commands: lastInfrastructureComponentQueryResult.commands != undefined ? lastInfrastructureComponentQueryResult.commands.map((x: any) => x.command) : [],
                environment: lastInfrastructureComponentQueryResult.environments != undefined ? lastInfrastructureComponentQueryResult.environments.map((x: any) => ({
                    [x.environment_name]: x.environment_value
                })) : [],
                labels: lastInfrastructureComponentQueryResult.labels != undefined ? lastInfrastructureComponentQueryResult.labels.map((x: any) => x.label) : [],
                networks: lastInfrastructureComponentQueryResult.networks != undefined ? lastInfrastructureComponentQueryResult.networks.map((x: any) => x.network) : [],
                volumes: lastInfrastructureComponentQueryResult.volumes != undefined ? lastInfrastructureComponentQueryResult.volumes.map((x: any) => x.volume) : []
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

        stringDefault = stringDefault.replace("#[content]", `
#start ${lastInfrastructureComponentQueryResult.service_key}
${ymlDocumentResult}
#end ${lastInfrastructureComponentQueryResult.service_key}
#[content]
        `)
    })

    fs.writeFile("./configuration/docker-compose.yml", new Uint8Array(Buffer.from(stringDefault)), (err: any) => {
        if (err) {
            console.log(err);
        }
    });
}

fs.writeFile(`./configuration/docker-compose.yml`, data, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});

if (!fs.existsSync(`./src/infrastructure/database/mydatabase.db`)) {
    const localdatabase = new Database('./src/infrastructure/database/mydatabase.db', { verbose: console.log });

    /*
        application:
            port => É a porta do service dentro do cluster
            node_port => É a porta dentro do container,
            target_port => É a porta externa aberta para acessar os nodes
            container_port => É a porta interna em que a aplicação é executada dentro do container (não obrigatório nesta situação)
    */
    localdatabase.exec(`
    drop table if exists application;
    drop table if exists application_files;
    drop table if exists configuration;
    drop table if exists infrastructure_component;
    drop table if exists infrastructure_component_command;
    drop table if exists infrastructure_component_port;
    drop table if exists infrastructure_component_volumes;
    drop table if exists infrastructure_component_network;
    drop table if exists infrastructure_component_labels;
    drop table if exists infrastructure_component_environment;
    drop table if exists edges;

    create table configuration(
        id integer primary key autoincrement,
        title varchar(200) not null,
        networks_web_external bool not null
    );

    create table edges(
        id integer primary key autoincrement,
        source_id varchar not null,
        target_id varchar not null
    );
    
    create table application(
        id integer primary key autoincrement,
        name varchar(100) not null,

        --service
        port integer not null,
        node_port integer not null,
        target_port integer not null,
        protocol varchar(10) default 'TCP',
        type varchar(10) default 'NodePort',

        --deployment
        container_name varchar not null,
        image varchar not null,
        image_pull_policy varchar(100) not null default 'Always',
        replicas integer not null default 1,
        configuration_id integer not null,
        alive bool not null,
        build_date datetime null,
        position_x integer not null,
        position_y integer not null,
        constraint configuration_id_c foreign key (configuration_id) references configuration(id) on delete cascade
    );

    create table application_files(
        id integer primary key autoincrement,
        name varchar(100) not null,
        file text not null,
        application_id integer not null,
        constraint application_id_c foreign key (application_id) references application(id) on delete cascade
    );

    create table infrastructure_component(
        id integer primary key autoincrement,
        service_key varchar(200) not null,
        image varchar(200) not null,
        container_name varchar(100) not null,
        entrypoint text null,
        command text null,
        type varchar not null,
        position_x integer not null,
        position_y integer not null,
        alive bool not null,
        restart varchar(100) not null default 'always',
        configuration_id integer not null,
        build_date datetime null,
        constraint configuration_id_c foreign key (configuration_id) references configuration(id) on delete cascade
    );

    create table infrastructure_component_file(
        id integer primary key autoincrement,
        name varchar(100) not null,
        file text not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );

    create table infrastructure_component_command(
        id integer primary key autoincrement,
        command varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );
    create table infrastructure_component_port(
        id integer primary key autoincrement,
        port_bind varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );
    create table infrastructure_component_volumes(
        id integer primary key autoincrement,
        volume varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );

    create table infrastructure_component_network(
        id integer primary key autoincrement,
        network varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );

    create table infrastructure_component_labels(
        id integer primary key autoincrement,
        label varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );

    create table infrastructure_component_environment(
        id integer primary key autoincrement,
        environment_name varchar not null,
        environment_value varchar not null,
        infrastructure_component_id integer not null,
        constraint infrastructure_component_id_c foreign key (infrastructure_component_id) references infrastructure_component(id) on delete cascade
    );


    insert into configuration(title, networks_web_external)
    select 'default-config-01', false
    where not exists (
        select 1 from configuration c where c.id = 1
    );
    `);
} else {
    buildApplications();
    buildInfrastructureComponents();
}
