import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { ImageHub } from "@pedreiro-web/infrastructure/repository/types";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";

export async function GET(request: NextRequest, { params }: { params: Promise<{ registryId: string }> }) {
    try {
        const { registryId } = await params;

        const imageHubs = localdatabase.prepare(`select * from image_registry where id = ${registryId}`).all() as ImageHub[];

        const executeCommand = new Promise<string>((resolve, reject) => {
            exec(`curl ${imageHubs[0].url}/v2/_catalog`, { windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    reject(`exec error: ${error}`);
                    return;
                }
                resolve(`${stdout}`);
            })
        })

        return NextResponse.json(JSON.parse(await executeCommand), { status: 200 })
    } catch (ex) {
        return NextResponse.json({}, { status: 400 })
    }
}