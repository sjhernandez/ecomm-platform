/**
 * This file provides context to the server-side rendering function.
 * It exposes Cloudflare environment variables and other contextual data.
 */

export function getLoadContext({ request, env, params, cf }) {
  return {
    cloudflare: {
      request,
      env,
      params,
      cf,
    },
  };
}
