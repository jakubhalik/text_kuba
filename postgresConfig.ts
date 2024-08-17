import { Pool } from 'pg';
import crypto from 'crypto';

export const owner = process.env.owner; // as string;
export const ownerPassword = process.env.owner_password;
export const ownerString = owner as string;
export const postgresPassword = process.env.postgres_password; // as string;
export const host = process.env.host; // as string;
export const port = process.env.port ? Number(process.env.port) : 5432;

export const postgresUserPool = new Pool({
    host,
    port,
    database: `text_${owner}`,
    user: 'postgres',
    password: postgresPassword,
    max: 1000,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const postgresCombinedPassword = `postgres${postgresPassword}`;

export const postgresHashedPassword = crypto
    .createHash('sha256')
    .update(postgresCombinedPassword)
    .digest('hex');

