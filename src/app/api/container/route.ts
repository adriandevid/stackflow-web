import { exec } from "child_process";
import { NextResponse } from "next/server";

async function GET() {
    var operacao = new Promise<any>((resolve) => {
        exec("wsl curl --unix-socket /var/run/docker.sock http://localhost/containers/rabbit/json", function (error, stdout, stderr) {
            resolve(JSON.parse(stdout))
        })
    })

    const response = await operacao;

    return NextResponse.json({ result: response }, { status: 200 })
}

export { GET }