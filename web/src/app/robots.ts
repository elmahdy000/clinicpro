import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/*/dashboard', '/*/patient', '/*/settings', '/*/profile', '/*/queue'],
    },
    sitemap: 'https://clinicpro.online/sitemap.xml',
  };
}
