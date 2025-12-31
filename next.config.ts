import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '**/*': [
      './node_modules/{socket.io,@socket.io,engine.io}*/**/*',
      './node_modules/{accepts,base64id,cors,debug,mime-types,mime-db,negotiator,ms,cookie,ws,vary,object-assign}/**/*',
      './node_modules/{next,next-intl,better-sqlite3}/**/*',
      './node_modules/{browserslist,caniuse-lite,baseline-browser-mapping}/**/*',
    ],
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    return [
      {
        // Prevent caching of HTML pages to avoid stale chunk references
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*text/html.*)',
          },
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Long-term caching for static assets with hashed filenames
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
