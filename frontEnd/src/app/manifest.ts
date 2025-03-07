import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AlgoManiaX',
    short_name: 'AlgoX',
    description: 'The official CP club of BITS Goa',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f23',
    theme_color: '#000000',
    icons: [
      {
        src: '/algoLightXLogo.png',
        sizes: '192x192',
        type: 'image/png',
      }
    ],
  }
}