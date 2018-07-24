import babel from 'rollup-plugin-babel';

export default [{
  input: 'src/app.js',
  output: {
    file: 'dist/app.js',
    format: 'iife',
    sourceMap: true,
    plugins: [
      babel(),
    ],
  },
}];
