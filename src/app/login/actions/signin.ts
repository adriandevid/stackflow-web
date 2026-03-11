'use server';

import { localdatabase } from "@pedreiro-web/infrastructure/database/config";
import { sha256, sha224 } from 'js-sha256';
import jwt from 'jsonwebtoken';
import { cookies } from "next/headers";

export default async function Signin(prev: any, body: { user: string, password: string }) : Promise<any> {

    const users = localdatabase.prepare(`select * from user where name = '${body.user}'`).all() as any[];

    if(users.length == 0) {
        return { message: "usuário não encontrado!", status: 401 }
    }

    if (users[0].password == sha256(body.password)) {
        const token = jwt.sign(
            { user_id: users[0].id, user_name: users[0].name },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );
        
        localdatabase.exec(`
            insert into token(token, user_id)
            values ('${token}', ${users[0].id})
        `)

        const cookiesSource = await cookies();

        cookiesSource.set('token-access', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60
        });

        return { status: 200 };
    } else {
        return { message: "Senha incorreta!", status: 401 };
    }
}