import string from 'rollup-plugin-string';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy-glob';
import html from 'rollup-plugin-fill-html';
import replace from 'rollup-plugin-replace';

export default [{
  input: 'src/app.js',
  context: 'window',
  output: {
    file: 'dist/js/app.js',
    format: 'iife',
    sourcemap: 'inline',
  },
  plugins: [
    string({
      include: ['**/*.css', '**/*.json'],
    }),
    commonjs(),
    nodeResolve({ jsnext: true }),
    copy([
      { files: 'src/assets/*.*', dest: 'dist/assets' },
      { files: 'src/css/*.*', dest: 'dist/css' },
      { files: 'node_modules/intro.js/introjs.css', dest: 'dist/css' },
    ]),
    html({
      template: 'index.html',
      filename: 'index.html',
    }),
    replace({
      'process.env.NODE_ENV': process.env.NODE_ENV,
    }),
  ],
}];
