import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const executeCommand = new Promise<string>((resolve, reject) => {
        exec(`wsl docker ps`,{ windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve(`${stdout} - ${stderr}`);
        })
    })

    var result = await executeCommand;
    var selected = result
                    .replace(/^CONTAINER.*\n/gm, '')
                    .split(/(?=^[a-z]+\d+)/gm)[0]
                    .split("\n").map(x => x.split(/(\S+)/gm).filter(x => x.replaceAll(" ", "").length > 0)).filter(x => x.includes("registry"));

    return NextResponse.json({
            name: selected[0][selected[0].length - 1],
            status: selected[0][7]
        }, { status: 200 })
}

export { GET }