import { json } from '@sveltejs/kit';

export async function GET() {
	console.log('=== SIMPLE STATUS API CALLED ===');
	return json({ message: 'Hello from status API', timestamp: new Date() });
}
