const palette = ['#e1e111', '#97eb63', '#4beba2', '#00e6d3', '#43dbee'];
export { palette };

export default {
  get: idx => palette[idx % palette.length],
};
