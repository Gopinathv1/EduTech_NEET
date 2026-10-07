/** Must run before constructing a database client or importing runtime services. */
export function assertDisposableCiDatabase() {
  if (process.env.CI !== 'true') throw new Error('This check requires disposable CI.');
  return (['DATABASE_URL', 'DIRECT_URL'] as const).map(name => {
    const url = new URL(process.env[name] ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432' || url.pathname !== '/neet_test' || url.searchParams.has('host') || url.searchParams.get('pgbouncer') === 'true') {
      throw new Error('Both database URLs must target localhost:5432/neet_test.');
    }
    return url;
  });
}
