import { InfrastructureComponent, Log } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { NextRequest, NextResponse } from "next/server";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;

    const infrastructureComponents = localdatabase.prepare(`select * from infrastructure_component where id = ${id}`).all() as InfrastructureComponent[];
    const infrastructureComponent = infrastructureComponents[0];

    const streams: { id: number, resource: string, operation: string, logs: Log[] }[] = localdatabase.prepare(`select * from stream where resource = '${infrastructureComponent.service_key}' order by id DESC`).all() as any[];
    
    streams.forEach(stream => {
        const logs: { resource: string, log: string, time: number, short_log: string }[] = localdatabase.prepare(`select * from log where resource = '${infrastructureComponent.service_key}' and stream_id = ${stream.id}`).all() as any[];
        stream.logs = logs;
    })

    return NextResponse.json(streams, { status: 200 });
}

export { GET }