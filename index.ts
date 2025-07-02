import { bootPlaygroundNode } from './bootPlaygroundNode';
import { readFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  // Load blueprint.json
  const blueprint = JSON.parse(
    readFileSync(resolve('./blueprint.json'), 'utf8')
  );

  // Boot Playground
  const playground = await bootPlaygroundNode({
    blueprint,
    mount: [
      {
        hostPath: resolve('./database/'),
        vfsPath: '/wordpress/wp-content/database/',
      },
    ],
  });

  // Make a sample request to /wp-admin/
  const req = {
    method: 'GET',
    url: '/wp-admin/',
    headers: {},
    body: null,
  };
  const res = await playground['handleRequest'](req);
  console.log('Response:', res.status, res.body);
})();
