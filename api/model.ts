export const config = {
  runtime: 'edge',
};

const DRIVE_MODEL_URL =
  'https://drive.usercontent.google.com/download?id=1pLkqtNjGOBX4OuMwi9xz587PfFr9szNd&export=download&confirm=t';

export default async function handler() {
  const upstream = await fetch(DRIVE_MODEL_URL, {
    redirect: 'follow',
    headers: {
      Accept: 'model/gltf-binary,application/octet-stream;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const contentType = upstream.headers.get('content-type') || '';

  if (!upstream.ok || !upstream.body || contentType.includes('text/html')) {
    return new Response('3D model could not be loaded from Google Drive.', {
      status: 502,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Content-Disposition': 'inline; filename="architecture-model.glb"',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
