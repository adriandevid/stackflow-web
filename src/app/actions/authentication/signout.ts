'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import jwt from 'jsonwebtoken';
import { cookies } from "next/headers";

export default async function Signout(prev: any): Promise<any> {
    try {
        const cookiesSource = await cookies();
        const cookieToken = cookiesSource.get("token-access");

        if (cookieToken) {
            const tokenVeryfied: { user_id: number, user_name: string, iat: number, exp: number } = jwt.verify(cookieToken.value, process.env.JWT_SECRET!) as any;
            localdatabase.exec(`
            DELETE FROM token
            WHERE user_id = ${tokenVeryfied.user_id}
        `)
            cookiesSource.delete("token-access");
            return { status: 200 };
        }

        return { status: 401 };
    } catch (ex) {
        return { status: 404 };
    }
}