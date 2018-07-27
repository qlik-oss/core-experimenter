import string from 'rollup-plugin-string';
import nodeResolve from 'rollup-plugin-node-resolve';

export default [{
  input: 'src/app.js',
  context: 'window',
  output: {
    file: 'dist/app.js',
    format: 'iife',
    sourcemap: 'inline',
  },
  plugins: [
    string({
      include: ['**/*.css', '**/*.json'],
    }),
    nodeResolve({ jsnext: true }),
  ],
}];
