'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Application, ApplicationCreate, ApplicationFile } from "@pedreiro-web/infrastructure/repository/types/application";
import { base64ToUt8, createFile, createFolder } from "@pedreiro-web/util/file";

export default async function Create(prev: any, formData: ApplicationCreate) : Promise<any> {
    const applicationsWithName = localdatabase.prepare(`select * from application where name = '${formData.name}'`).all()
    const applicationsWithNameResult: Application[] = applicationsWithName as Application[];

    if (applicationsWithNameResult.length > 0) {
        return { message: "Já existe esta aplicação!", status: 400 }
    }

    localdatabase.exec(`
        insert into application(name, port, node_port, target_port, container_name, image, replicas, position_x, position_y, configuration_id, image_pull_policy, alive)
        values ('${formData.name}', ${formData.port}, ${formData.node_port}, ${formData.target_port}, '${formData.container_name}', '${formData.image}', ${formData.replicas}, ${formData.position_x}, ${formData.position_y}, 1, '${formData.image_pull_policy}', false)
    `)

    const row = localdatabase.prepare("select * from application order by id desc limit 1").all()
    const applicationCreatedResult: Application = row[0] as Application;

    createFolder(`./configuration/applications/${applicationCreatedResult.name}`);

    createFile(`./configuration/applications/${applicationCreatedResult.name}/service.yml`, `
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
        - name: ${applicationCreatedResult.image_pull_secrets}
    `);

    if (formData.files != undefined && formData.files.length > 0) {
        formData.files.forEach(element => {
            localdatabase.exec(`
                insert into application_files(name, file, application_id)
                values ('${element.name}', '${element.file}', ${applicationCreatedResult.id})    
            `)

            createFile(`./configuration/${element.name}`, base64ToUt8(element.file));
        });

        const row = localdatabase.prepare(`select * from application_files where application_id = ${applicationCreatedResult.id}`).all()
        const applicationFilesCreatedResult: ApplicationFile[] = row as ApplicationFile[];

        return { data: {
            ...applicationCreatedResult,
            files: applicationFilesCreatedResult
        }, status: 200 }
    }

    return { data: {
            ...applicationCreatedResult
        }, status: 200 }
}