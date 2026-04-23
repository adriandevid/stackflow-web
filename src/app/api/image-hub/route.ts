import { ImageHub } from "@pedreiro-web/infrastructure/repository/types";
import { NextResponse } from "next/server";
import { localdatabase } from "@pedreiro-web/infrastructure/database/config";

export function GET() {
    const imageHubs = localdatabase.prepare(`select * from image_registry`).all() as ImageHub[];
    return NextResponse.json(imageHubs, { status: 200 })
}