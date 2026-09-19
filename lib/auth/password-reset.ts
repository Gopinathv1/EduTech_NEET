import { createHash, randomBytes } from 'node:crypto';
export const RESET_TTL_MS = 60 * 60 * 1000;
export const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const createResetToken = () => randomBytes(32).toString('base64url');
