// Keeps server code and internal project notes from being served as pages.
// /_routes.json limits which requests reach this at all, but the rule below
// stands on its own: everything else passes straight through.
const HIDDEN = [/^\/functions\//, /^\/(README|DESIGN|PRODUCT)\.md$/i, /^\/\.gitignore$/, /^\/_routes\.json$/];

export async function onRequest({ request, next }) {
  const { pathname } = new URL(request.url);
  if (HIDDEN.some((re) => re.test(pathname))) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
  return next();
}
