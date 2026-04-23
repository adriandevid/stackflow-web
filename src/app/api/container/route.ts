import { exec } from "child_process";
import { NextResponse } from "next/server";
import DockerCompose from "dockerode-compose";
import Docker from "dockerode";
import yaml from "js-yaml";
import fs from "fs";

async function GET() {
    /* var operacao = new Promise<any>((resolve) => {
        exec("wsl curl --unix-socket /var/run/docker.sock http://localhost/containers/rabbit/json", function (error, stdout, stderr) {
            resolve(JSON.parse(stdout))
        })
    })

    const response = await operacao; */

    /* const getStatusOfNetwork = new Promise<boolean>(async (resolve, reject) => {
        const eventsOfNetwork = await dockerode.getEvents({ filters: { type: ["network"] } });

        eventsOfNetwork.on("data", function (data) {
            const event = JSON.parse(data.toString('utf8'));
            console.log("==> ", event)
            if (event.Actor.Attributes.name == "test_web") {
                resolve(event.Action == "create")
            }
        })
    }) */
   /*  await compose.pull();

    var state = await compose.up();
    console.log(state); */

    return NextResponse.json({ result: {} }, { status: 200 })
}

export { GET }