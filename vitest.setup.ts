// Ensure a JWT secret exists for signing/verifying in tests.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key-for-vitest-only';
