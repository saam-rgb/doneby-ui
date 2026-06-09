const baseWidth = 1920;
const baseHeight = 1080;

function vw(value) {
  return (value / baseWidth) * 100;
}

function vh(value) {
  return (value / baseHeight) * 100;
}

module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-functions')({
      functions: {
        fontSize: (size) => {
          size = parseFloat(size);
          const vwValue = vw(size) * 0.8;
          return `clamp(${size}px, ${vwValue.toFixed(3)}vw, ${(vwValue * 1.5).toFixed(3)}vw)`;
        },
        width: (w) => {
          w = parseFloat(w);
          const vwValue = vw(w);
          return `clamp(${w}px, ${vwValue.toFixed(3)}vw, ${vwValue.toFixed(3)}vw)`;
        },
        height: (h) => {
          h = parseFloat(h);
          const vhValue = vh(h);
          return `clamp(${h}px, ${vhValue.toFixed(3)}vh, ${vhValue.toFixed(3)}vh)`;
        },
        padding: (p) => {
          p = parseFloat(p);
          const vwValue = vw(p);
          return `clamp(${p}px, ${vwValue.toFixed(3)}vw, ${vwValue.toFixed(3)}vw)`;
        },
        margin: (m) => {
          m = parseFloat(m);
          const vwValue = vw(m);
          return `clamp(${m}px, ${vwValue.toFixed(3)}vw, ${vwValue.toFixed(3)}vw)`;
        },
        paddingX: (px) => {
          px = parseFloat(px);
          const vwValue = vw(px);
          return `clamp(${px}px, ${vwValue.toFixed(3)}vw, ${vwValue.toFixed(3)}vw)`;
        },
        paddingY: (py) => {
          py = parseFloat(py);
          const vhValue = vh(py);
          return `clamp(${py}px, ${vhValue.toFixed(3)}vh, ${vhValue.toFixed(3)}vh)`;
        },
        marginX: (mx) => {
          mx = parseFloat(mx);
          const vwValue = vw(mx);
          return `0 clamp(${mx}px, ${vwValue.toFixed(3)}vw, ${vwValue.toFixed(3)}vw)`;
        },
        marginY: (my) => {
          my = parseFloat(my);
          const vhValue = vh(my);
          return `clamp(${my}px, ${vhValue.toFixed(3)}vh, ${vhValue.toFixed(3)}vh)`;
        },
      }
    }),
    require('autoprefixer'),
  ]
};
