import copy from 'rollup-plugin-copy';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const pkg = require('./package.json');

export default [
  {
    input: 'src/index.js',
    output: [
      {
        sourcemap: true,
        format: 'commonjs',
        file: pkg.main
      },
      {
        sourcemap: true,
        format: 'esm',
        file: pkg.module
      }
    ],
    plugins: [
      copy({
        targets: [
          { src: 'src/types.d.ts', dest: 'dist' }
        ]
      })
    ]
  }
];