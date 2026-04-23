import { readFileAsync } from "@pedreiro-web/util/file";
import { NextResponse } from "next/server";

async function GET() {
    const content = await readFileAsync("./configuration/docker-compose.yml")
    
    return NextResponse.json({ content: content }, { status: 200 })
}

export { GET }