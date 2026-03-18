import Database from "better-sqlite3";
import { sha256, sha224 } from 'js-sha256';

const localdatabase = new Database('./src/infrastructure/database/mydatabase.db', { verbose: console.log });

localdatabase.exec(`
    drop table if exists log;
    drop table if exists stream;

    create table stream(
        id integer primary key autoincrement,
        operation varchar(100) not null,
        resource varchar(200) not null
    );

    create table log(
        id integer primary key autoincrement,
        resource varchar not null,
        log text not null,
        short_log text not null,
        time integer not null,
        stream_id integer not null,
        constraint stream_id_c foreign key (stream_id) references stream(id) on delete cascade
    );
`);