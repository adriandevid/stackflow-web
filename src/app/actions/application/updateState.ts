'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";

export default async function UpdateStateApplication(prev: any, body: { id: number; state: string;}): Promise<{
    status: number
} | undefined> {
    localdatabase.exec(`
        UPDATE application
        SET alive = ${body.state == "Running"}
        WHERE id = ${body.id};
    `)

    return {
        status: 200
    }
}