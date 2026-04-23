import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Edge } from "@pedreiro-web/infrastructure/repository/types";
import { NextRequest, NextResponse } from "next/server";

async function GET() {
    const edges = localdatabase.prepare(`select * from edges`).all()
    const adgesResult: Edge[] = edges as Edge[];

    return NextResponse.json(adgesResult, { status: 200 })
}

async function POST(request: NextRequest) {
    const body: Edge = await request.json();

    localdatabase.exec(`
        insert into edges(source_id, target_id)
        values ('${body.source_id}', '${body.target_id}')
    `)

    return NextResponse.json(body, { status: 200 })
}

export { GET, POST }