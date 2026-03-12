import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;

    const rows = localdatabase.prepare(`select * from application where id = ${id}`).all() as { name: string }[];
    
    const executeCommand = new Promise((resolve, reject) => {
        exec("kubectl ", (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }

            const disks = stdout.split(/(?=^[A-Z]:)/gm);
            const selectedDisck = disks.filter(x => x.includes("C:"))[0].replaceAll("\\r", "").replaceAll("\\n", "").split(/(\d\S*)/gm);

            resolve({
                freeSpace: parseInt(selectedDisck[1].replaceAll(" ", "")),
                size: parseInt(selectedDisck[3].replaceAll(" ", ""))
            })
        })
    });

    return NextResponse.json({}, { status: 200 })
}