import { Pool } from 'pg';

const owner = process.env.owner as string;
const postgres_password = process.env.postgres_password as string;
const host = process.env.host as string;
const port = process.env.port as string;
const numberifiedPortForTypeSafety = parseInt(port, 10);

if (!owner || !postgres_password || !host || !port) {
    throw new Error(
        'Missing required environment variables for PostgreSQL configuration'
    );
}

export const postgresUserPool = new Pool({
    host: host,
    port: numberifiedPortForTypeSafety,
    database: `text_${owner}`,
    user: 'postgres',
    password: postgres_password,
});
