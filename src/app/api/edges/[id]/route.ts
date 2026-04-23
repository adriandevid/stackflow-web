import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { NextRequest, NextResponse } from "next/server";

async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    localdatabase.exec(`
        DELETE FROM edges
        WHERE id = ${id};
    `)

    return NextResponse.json({ status: 200 })
}

export { DELETE }