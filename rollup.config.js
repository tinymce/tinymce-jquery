const swag = require('@ephox/swag');
import { uglify } from 'rollup-plugin-uglify';

const build = (minify) => ({
  input: 'lib/main/ts/Main.js',
  output: {
    file: 'dist/tinymce-jquery' + (minify ? '.min' : '') + '.js',
    format: 'iife'
  },
  treeshake: true,
  onwarn: swag.onwarn,
  plugins: [
    swag.nodeResolve({
      basedir: __dirname,
      prefixes: {}
    }),
    swag.remapImports(),
    ...(minify ? [uglify()] : [])
  ]
});

export default [build(false), build(true)];