import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs';
import { createFile, createFolder } from "@pedreiro-web/util/file";
import { Application, ApplicationCreate, ApplicationFile } from "@pedreiro-web/infrastructure/repository/types/application";

async function GET() {
    const applications = localdatabase.prepare(`select * from application`).all()
    const applicationsResult: Application[] = applications as Application[];

    return NextResponse.json(applicationsResult, { status: 200 })
}

async function POST(request: NextRequest) {
    const body: ApplicationCreate = await request.json();

    const applicationsWithName = localdatabase.prepare(`select * from application where name = '${body.name}'`).all()
    const applicationsWithNameResult: ApplicationFile[] = applicationsWithName as ApplicationFile[];

    if (applicationsWithNameResult.length > 0) {
        return NextResponse.json({ message: "Já existe esta aplicação!" }, { status: 400 })
    }

    localdatabase.exec(`
        insert into application(name, port, node_port, target_port, container_name, image, replicas, position_x, position_y, configuration_id)
        values ('${body.name}', ${body.port}, ${body.node_port}, ${body.target_port}, '${body.container_name}', '${body.image}', ${body.replicas}, ${body.position_x}, ${body.position_y}, 1)
    `)

    const row = localdatabase.prepare("select * from application order by id desc limit 1").all()
    const applicationCreatedResult: Application = row[0] as Application;

    createFolder(`./configuration/applications/${applicationCreatedResult.name}`);

    createFile(`./configuration/applications/${applicationCreatedResult.name}/service.yml`, `
apiVersion: v1
kind: Service
metadata:
    name: ${applicationCreatedResult.name}-deployment
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
    `);

    createFile(`./configuration/applications/${applicationCreatedResult.name}/deployment.yml`, `
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
    `);

    if (body.files != undefined && body.files.length > 0) {
        body.files.forEach(element => {
            localdatabase.exec(`
                insert into application_files(name, file, application_id)
                values ('${element.name}', '${element.file}', ${applicationCreatedResult.id})    
            `)
        });

        const row = localdatabase.prepare(`select * from application_files where application_id = ${applicationCreatedResult.id}`).all()
        const applicationFilesCreatedResult: ApplicationFile[] = row as ApplicationFile[];

        return NextResponse.json({
            ...applicationCreatedResult,
            files: applicationFilesCreatedResult
        }, { status: 200 })
    }

    return NextResponse.json(applicationCreatedResult, { status: 200 })
}

export { GET, POST }