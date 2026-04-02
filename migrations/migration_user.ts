import Database from "better-sqlite3";
import { sha256, sha224 } from 'js-sha256';

const localdatabase = new Database('./src/infrastructure/database/mydatabase.db', { verbose: console.log });

localdatabase.exec(`
    drop table if exists user;
    drop table if exists token;

    create table user(
        id integer primary key autoincrement,
        name varchar not null,
        password varchar not null
    );
    create table token(
        id integer primary key autoincrement,
        token text,
        user_id integer not null,
        constraint user_id_c foreign key (user_id) references user(id) on delete cascade
    );

    insert into user(name, password)
    values ('${process.env.STACKFLOW_USER_NAME}', '${sha256(`${process.env.STACKFLOW_PASSWORD}`)}')
`);