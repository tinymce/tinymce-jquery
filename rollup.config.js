const swag = require('@ephox/swag');
const { uglify } = require('rollup-plugin-uglify');

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

module.exports = [build(false), build(true)];