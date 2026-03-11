import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { localdatabase } from "./infrastructure/database/config";

export function proxy(request: NextRequest) {
    const cookieRequired = request.cookies.get("token-access");

    if (cookieRequired) {
        try {
            const tokenVeryfied: { user_id: number, user_name: string, iat: number, exp: number } = jwt.verify(cookieRequired.value, process.env.JWT_SECRET!) as any;
            const tokensSearched = localdatabase.prepare(`select * from token where user_id = '${tokenVeryfied.user_id}' and token = '${cookieRequired.value}'`).all() as any[];
            
            if (tokensSearched.length == 0) {
                const loginUrl = new URL('/login?status=401', request.url);
                return NextResponse.redirect(loginUrl);
            }

            return NextResponse.next();
        } catch {
            const loginUrl = new URL('/login?status=401', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    const loginUrl = new URL('/login?status=401', request.url);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/api/:path*', '/'],
};