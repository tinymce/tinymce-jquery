const swag = require('@ephox/swag');
const terser = require('@rollup/plugin-terser');

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
    ...(minify ? [terser()] : [])
  ]
});

module.exports = [build(false), build(true)];