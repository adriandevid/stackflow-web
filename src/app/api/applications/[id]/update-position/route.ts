import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { ApplicationUpdate, ApplicationFile, Application } from "@pedreiro-web/infrastructure/repository/types/application";
import { deleteFolder } from "@pedreiro-web/util/file";
import { NextRequest, NextResponse } from "next/server";


async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body: ApplicationUpdate = await request.json();
    const row = localdatabase.prepare(`select * from application where id = ${id}`).all();
    if (row.length == 0) {
        return NextResponse.json({ message: "Código não existe!" }, { status: 400 })
    }

    localdatabase.exec(`
        update application
        set position_x = ${body.position_x}, position_y = ${body.position_y}
        where id = ${id}
    `)

    return NextResponse.json({
        ...row[0] as ApplicationUpdate
    }, { status: 200 })
}
export { PUT }