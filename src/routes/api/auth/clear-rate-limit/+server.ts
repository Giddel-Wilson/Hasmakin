import type { RequestHandler } from './$types';
import { RateLimiter } from '$lib/server/auth';

export const POST: RequestHandler = async () => {
  try {
    // Clear all rate limiter attempts for development
    RateLimiter.clearAll();
    
    return new Response(JSON.stringify({ message: 'Rate limiter cleared successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Rate limiter clear error:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear rate limiter' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
