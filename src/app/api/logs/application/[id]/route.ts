import { InfrastructureComponent, Log } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { NextRequest, NextResponse } from "next/server";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { Application } from "@pedreiro-web/infrastructure/repository/types/application";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const applications = localdatabase.prepare(`select * from application where id = ${id}`).all() as Application[];
    const application = applications[0];

    const streams: { id: number, resource: string, operation: string, logs: Log[] }[] = localdatabase.prepare(`select * from stream where resource = '${application.name}' order by id DESC`).all() as any[];
    
    streams.forEach(stream => {
        const logs: { resource: string, log: string, time: number, short_log: string }[] = localdatabase.prepare(`select * from log where resource = '${application.name}' and stream_id = ${stream.id}`).all() as any[];
        stream.logs = logs;
    })

    return NextResponse.json(streams, { status: 200 });
}

export { GET }