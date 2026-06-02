import { ExecException, exec } from "child_process";

/**
 * This class execute operations related to the docker compose
 * **/
export class DockerControlPlane {
    dockerComposePath: string;
    dockerBaseCommand = `docker compose -f %compose_path %operation %service_key -d`;
    /**
     *  @param dockerComposePath path of docker compose file example: ./configurations/docker-compose.yml
     */
    constructor(dockerComposePath: string) {
        //super();
        this.dockerComposePath = dockerComposePath;
        this.dockerBaseCommand = this.dockerBaseCommand.replace("%compose_path", dockerComposePath);
    }

    getCommand(operation: string, service_key: string) {
        var command = this.dockerBaseCommand.replace("%operation", operation);
        command = command.replace("%service_key", service_key);

        return command;
    }

    executeOperation(command: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    reject(false);
                    return;
                }
                resolve(true);
            })
        });
    }

    upService(service_key: string): Promise<boolean> {
        const command = this.getCommand("up", service_key);
        console.log(`==> command : ${command}`)
        return this.executeOperation(command);
    }

    downService(service_key: string): Promise<boolean> {
        const command = this.getCommand("down", service_key);
        return this.executeOperation(command);
    }

    stopService(service_key: string): Promise<boolean> {
        const command = this.getCommand("stop", service_key);
        return this.executeOperation(command);
    }
}

export const dockerControlPlane = new DockerControlPlane("./configuration/docker-compose.yml");