/**
 * Minimal static-asset Worker for hosting the VISION INSPECT AI frontend.
 *
 * The React app is a pure client-side SPA (React Router + localStorage demo
 * engine), so this Worker has no API routes and no bindings: it only serves the
 * built files from ./dist, with index.html as the fallback for client routes
 * such as /history or /inspections/VI-2611-1463.
 */
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    // Deep links into the SPA: hand them index.html so the router can resolve.
    const url = new URL(request.url);
    if (request.method !== 'GET' || /\.[a-z0-9]+$/i.test(url.pathname)) return response;
    return env.ASSETS.fetch(new Request(new URL('/', url), request));
  },
};
