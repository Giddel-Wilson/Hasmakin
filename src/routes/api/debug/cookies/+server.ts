import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, request }) => {
  const allCookies = request.headers.get('cookie');
  const authToken = cookies.get('auth-token');
  
  return new Response(JSON.stringify({
    allCookies,
    authToken,
    hasAuthToken: !!authToken,
    cookieCount: allCookies?.split(';').length || 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
