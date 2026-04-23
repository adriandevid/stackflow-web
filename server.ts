
// server.js - Minimal custom server setup

type DockerEvent = {
    Type: string;
    Action: string;
    Actor: {
        ID: string;
        Attributes: {
            "com.docker.compose.config-hash": string;
            "com.docker.compose.container-number": string;
            "com.docker.compose.depends_on": string;
            "com.docker.compose.image": string;
            "com.docker.compose.oneoff": string;
            "com.docker.compose.project": string;
            "com.docker.compose.project.config_files": string;
            "com.docker.compose.project.working_dir": string;
            "com.docker.compose.service": string;
            "com.docker.compose.version": string;
            image: string;
            name: string;
            "org.opencontainers.image.ref.name": string;
            "org.opencontainers.image.version": string;
        };
    };
    scope: string;
    time: number;
    timeNano: number;
};

type KubernetesPod = {
    kind: 'Pod';
    apiVersion: 'v1';

    metadata: {
        name: string;
        generateName?: string;
        namespace: string;
        uid: string;
        resourceVersion: string;
        generation: number;
        creationTimestamp: string;

        labels?: Record<string, string>;

        ownerReferences?: Array<{
            apiVersion: string;
            kind: string;
            name: string;
            uid: string;
            controller?: boolean;
            blockOwnerDeletion?: boolean;
        }>;

        managedFields?: any[];
    };

    spec: {
        volumes?: any[];

        containers: Array<{
            name: string;
            image: string;
            ports?: Array<{
                containerPort: number;
                protocol?: string;
            }>;
        }>;

        restartPolicy: 'Always' | 'OnFailure' | 'Never';
        terminationGracePeriodSeconds?: number;

        dnsPolicy?: 'ClusterFirst' | 'Default';

        serviceAccountName?: string;
        nodeName?: string;

        securityContext?: Record<string, any>;
        schedulerName?: string;

        tolerations?: Array<{
            key?: string;
            operator?: string;
            value?: string;
            effect?: string;
            tolerationSeconds?: number;
        }>;

        priority?: number;
        enableServiceLinks?: boolean;
        preemptionPolicy?: string;
    };

    status: {
        phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

        conditions?: Array<{
            type: string;
            status: 'True' | 'False' | 'Unknown';
            lastProbeTime?: string;
            lastTransitionTime?: string;
        }>;

        hostIP?: string;
        hostIPs?: Array<{ ip: string }>;

        podIP?: string;
        podIPs?: Array<{ ip: string }>;

        startTime?: string;

        containerStatuses?: Array<{
            name: string;
            ready: boolean;
            restartCount: number;
            image: string;
            imageID: string;

            state?: {
                running?: {
                    startedAt: string;
                };
                waiting?: {
                    reason: string;
                    message?: string;
                };
                terminated?: {
                    exitCode: number;
                    reason?: string;
                    finishedAt?: string;
                };
            };
        }>;

        qosClass?: 'Guaranteed' | 'Burstable' | 'BestEffort';
    };
};


const Database = require("better-sqlite3");
const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const Docker = require("dockerode");
const { exec } = require("child_process");
const k8s = require('@kubernetes/client-node');

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handler = app.getRequestHandler();

const localdatabase = new Database('./src/infrastructure/database/mydatabase.db');

exec(`docker compose -f ./configuration/docker-compose.yml down`, (error: any, stdout: any, stderr: any) => {
    if (error) {
        return;
    }

    localdatabase.exec(`
        UPDATE infrastructure_component
        SET alive = false;
    `)
})

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", async (socket: any) => {
        console.log("Client connected");

        // Load the Kubernetes configuration from the default location (~/.kube/config)
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault({
            clusters: [{
                name: process.env.CLUSTER_NAME,
                server: process.env.CLUSTER_SERVER,
            }]
        });

        const watch = new k8s.Watch(kc);

        const uri = '/api/v1/pods';
        const queryParams = { allowWatchBookmarks: true };
        const callback = (phase: any, apiObj: KubernetesPod) => {
            if (apiObj.metadata.name) {
                const application: any[] = localdatabase.prepare(`select * from application where name = '${apiObj.metadata.name.split("-")[0]}'`).all() as any[];
                var shortLog = `${phase} - ${apiObj.metadata.name.split("-")[0]} - ${apiObj.status.phase}`;

                if (application.length > 0) {
                    const streams: { id: number, operation: string, resource: string, logs: { resource: string, log: string, time: number, short_log: string }[] }[] = localdatabase.prepare(`select * from stream where resource = '${apiObj.metadata.name.split("-")[0]}' order by id DESC`).all() as any[];
                    const lastStream = streams[0];

                    var date = new Date();

                    if (apiObj.status.startTime) {
                        date = new Date(apiObj.status.startTime);
                    }

                    var timestamp = date.getTime();

                    localdatabase.exec(`
                        insert into log(resource, log, time, short_log, stream_id)
                        values ('${apiObj.metadata.name.split("-")[0]}', '${JSON.stringify(apiObj)}', ${timestamp}, '${shortLog}', ${lastStream.id})
                    `);

                    if ((phase == "ADDED" || phase == "MODIFIED") && apiObj.status.phase == "Running") {
                        io.emit(`update-state-resource`, { resource: apiObj.metadata.name.split("-")[0], state: apiObj.status.phase });
                    } else if (phase == "DELETED" && apiObj.status.phase == "Succeeded") {
                        io.emit(`update-state-resource`, { resource: apiObj.metadata.name.split("-")[0], state: phase });
                    }
                }
            }
        };

        const dockerode = new Docker();

        const eventsOfNetwork = await dockerode.getEvents();

        eventsOfNetwork.on("data", function (data: any) {
            try {
                var event: DockerEvent = JSON.parse(data.toString('utf8'));

                if (event.Actor.Attributes.name == undefined) {
                    return;
                }
                const existLogs: { resource: string, log: string, time: number, short_log: string }[] = localdatabase.prepare(`select * from log where resource = '${event.Actor.Attributes.name}' and time = ${event.time}`).all() as any[];

                const streams: { id: number, operation: string, resource: string, logs: { resource: string, log: string, time: number, short_log: string }[] }[] = localdatabase.prepare(`select * from stream where resource = '${event.Actor.Attributes.name}' order by id DESC`).all() as any[];

                if (existLogs.length > 0 && existLogs[existLogs.length - 1].log == data.toString('utf8')) {
                    return;
                }

                const lastStream = streams[0];

                if (lastStream) {
                    var shortLog = `${event.Type} - ${event.Actor.Attributes.name} - ${event.Action}`;

                    const logsOfStream: { resource: string, log: string, time: number, short_log: string }[] = localdatabase.prepare(`select * from log where resource = '${event.Actor.Attributes.name}' and stream_id = ${lastStream.id}`).all() as any[];

                    if (logsOfStream.filter(x => x.short_log == shortLog).length > 0) {
                        return;
                    }

                    localdatabase.exec(`
                    insert into log(resource, log, time, short_log, stream_id)
                    values ('${event.Actor.Attributes.name}', '${data.toString('utf8')}', ${event.time}, '${shortLog}', ${lastStream.id})
                `);

                    streams.forEach(stream => {
                        const logs: { resource: string, log: string, time: number, short_log: string }[] = localdatabase.prepare(`select * from log where resource = '${stream.resource}' and stream_id = ${stream.id}`).all() as any[];
                        stream.logs = logs
                    })

                    io.emit(`logs-container`, JSON.stringify(streams));

                    if (
                        (
                            streams[0].operation == "start" &&
                            streams[0].logs.filter(x => x.short_log.includes("start")).length > 0 &&
                            !(streams[0].logs.filter(x => x.short_log.includes("die")).length > 0)
                        ) ||
                        (streams[0].operation == "stop" && (
                            streams[0].logs[streams[0].logs.length - 1].short_log.includes("die") ||
                            streams[0].logs[streams[0].logs.length - 1].short_log.includes("stop")
                        )) ||
                        (streams[0].operation == "down" && streams[0].logs[streams[0].logs.length - 1].short_log.includes("destroy"))
                    ) {
                        io.emit(`update-state-resource`, { resource: streams[0].resource });
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
        })

        watch.watch(
            uri,
            queryParams,
            callback,
            // Optional: a done callback that is called when the watch connection closes
            (err: any) => {
                console.error('Watch connection closed:', err);
                // Implement reconnection logic here
            }
        );
    });

    httpServer.listen(3000);
});
