import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { ApplicationUpdate, ApplicationFile, Application } from "@pedreiro-web/infrastructure/repository/types/application";
import { deleteFolder } from "@pedreiro-web/util/file";
import { NextRequest, NextResponse } from "next/server";

async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const applications = localdatabase.prepare(`select * from application where id = ${id}`).all() as Application[];
    applications[0].files = localdatabase.prepare(`select * from application_files where application_id = ${id}`).all() as ApplicationFile[];

    return NextResponse.json(applications[0], { status: 200 })
}

async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body: ApplicationUpdate = await request.json();
    const row = localdatabase.prepare(`select * from application where id = ${id}`).all();
    if (row.length == 0) {
        return NextResponse.json({ message: "Código não existe!" }, { status: 400 })
    }

    localdatabase.exec(`
        update application
        set name = '${body.name}', port = ${body.port}, node_port = ${body.node_port}, target_port = ${body.target_port}, container_name = '${body.container_name}', image = '${body.image}', replicas = ${body.replicas}, position_x = ${body.position_x}, position_y = ${body.position_y}
        where id = ${id}
    `)

    if (body.files != undefined && body.files.length > 0) {
        body.files.forEach(element => {
            if (element.id != 0 && element.id) {
                localdatabase.exec(`
                    update application_files
                    set name = '${element.name}', file = '${element.file}'
                    where id = ${element.id}
                `)
                return;
            }
            localdatabase.exec(`
                    insert into application_files(name, file, application_id)
                    values ('${element.name}', '${element.file}', ${id})    
                `)
        });


        var files = localdatabase.prepare(`select * from application_files where application_id = ${id}`).all() as ApplicationFile[];
        files.forEach(file => {
            if (body.files?.filter(x => x.id == file.id).length == 0) {
                localdatabase.exec(`
                    DELETE FROM application_files
                    WHERE id = ${file.id};
                `)
            }
        })

        const row = localdatabase.prepare(`select * from application_files where application_id = ${id}`).all()
        const applicationFilesCreatedResult: ApplicationFile[] = row as ApplicationFile[];

        return NextResponse.json({
            ...row[0] as ApplicationUpdate,
            files: applicationFilesCreatedResult
        }, { status: 200 })
    }
}

async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const row = localdatabase.prepare(`select * from application where id = ${id}`).all()
    const applicationCreatedResult: Application = row[0] as Application;
    localdatabase.exec(`
        DELETE FROM application
        WHERE id = ${id};
    `)
    await deleteFolder(`./configuration/applications/${applicationCreatedResult.name}`);

    return NextResponse.json({ status: 200 })
}

export { DELETE, PUT, GET }