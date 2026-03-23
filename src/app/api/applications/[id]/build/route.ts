import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;

    const rows = localdatabase.prepare(`select * from application where id = ${id}`).all() as { name: string }[];
    
    const executeCommand = new Promise<string>((resolve, reject) => {
        exec(`kubectl apply -f ./configuration/applications/${rows[0].name}/deployment.yml`,{ windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            resolve(`${stdout} - ${stderr}`);
        })
    });

    const result = await executeCommand;

    return NextResponse.json({
        result: result
    }, { status: 200 })
}

export { GET }