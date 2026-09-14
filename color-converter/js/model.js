const Model = (() => {

  const ILLUMINANTS = {
    D65: { Xw: 95.047, Yw: 100.000, Zw: 108.883 },
    D50: { Xw: 96.420, Yw: 100.000, Zw: 82.510  },
    E:   { Xw: 100.00, Yw: 100.000, Zw: 100.00  }
  };

  const RGB_TO_XYZ = [
    [ 0.412453, 0.357580, 0.180423 ],
    [ 0.212671, 0.715160, 0.072169 ],
    [ 0.019334, 0.119193, 0.950227 ]
  ];

  const XYZ_TO_RGB = [
    [  3.2406, -1.5372, -0.4986 ],
    [ -0.9689,  1.8758,  0.0415 ],
    [  0.0557, -0.2040,  1.0570 ]
  ];

  let currentIlluminant = 'D65';
  let cmykMethod = 'GCR';
  let oogStrategy = 'clipping';

  function matMulVec(mat, vec) {
    return [
      mat[0][0]*vec[0] + mat[0][1]*vec[1] + mat[0][2]*vec[2],
      mat[1][0]*vec[0] + mat[1][1]*vec[1] + mat[1][2]*vec[2],
      mat[2][0]*vec[0] + mat[2][1]*vec[1] + mat[2][2]*vec[2]
    ];
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function gammaEncode(x) {
    if (x >= 0.04045) {
      return Math.pow((x + 0.055) / 1.055, 2.4);
    }
    return x / 12.92;
  }

  function gammaDecode(x) {
    if (x >= 0.0031308) {
      return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    }
    return 12.92 * x;
  }

  function labF(x) {
    if (x >= 0.008856) return Math.cbrt(x);
    return 7.787 * x + 16 / 116;
  }

  function labFInv(x) {
    if (x * x * x >= 0.008856) return x * x * x;
    return (x - 16 / 116) / 7.787;
  }

  return {
    setIlluminant(name) {
      if (ILLUMINANTS[name]) currentIlluminant = name;
    },
    getIlluminant() { return currentIlluminant; },
    getWhitePoint() { return ILLUMINANTS[currentIlluminant]; },

    setCmykMethod(m) { cmykMethod = m; },
    getCmykMethod() { return cmykMethod; },

    setOogStrategy(s) { oogStrategy = s; },
    getOogStrategy() { return oogStrategy; },

    rgbToXyz(R, G, B) {
      const r = gammaEncode(R / 255) * 100;
      const g = gammaEncode(G / 255) * 100;
      const b = gammaEncode(B / 255) * 100;
      return matMulVec(RGB_TO_XYZ, [r, g, b]);
    },

    xyzToRgb(X, Y, Z) {
      const scaled = [X / 100, Y / 100, Z / 100];
      const rgb = matMulVec(XYZ_TO_RGB, scaled);
      return rgb.map(v => gammaDecode(v) * 255);
    },

    xyzToLab(X, Y, Z) {
      const wp = this.getWhitePoint();
      const fx = labF(X / wp.Xw);
      const fy = labF(Y / wp.Yw);
      const fz = labF(Z / wp.Zw);
      return [
        116 * fy - 16,
        500 * (fx - fy),
        200 * (fy - fz)
      ];
    },

    labToXyz(L, a, b) {
      const wp = this.getWhitePoint();
      const fy = (L + 16) / 116;
      const fx = a / 500 + fy;
      const fz = fy - b / 200;
      return [
        labFInv(fx) * wp.Xw,
        labFInv(fy) * wp.Yw,
        labFInv(fz) * wp.Zw
      ];
    },

    rgbToLab(R, G, B) {
      const xyz = this.rgbToXyz(R, G, B);
      return this.xyzToLab(...xyz);
    },

    labToRgb(L, a, b) {
      const xyz = this.labToXyz(L, a, b);
      return this.xyzToRgb(...xyz);
    },

    rgbToCmyk(R, G, B) {
      const r = 1 - R / 255;
      const g = 1 - G / 255;
      const b = 1 - B / 255;
      const kMin = Math.min(r, g, b);

      let K;
      if (cmykMethod === 'UCR') {
        K = kMin * 0.7;
      } else {
        K = kMin;
      }

      if (1 - K < 1e-6) {
        return { C: 0, M: 0, Y: 0, K: 1 };
      }

      return {
        C: (r - K) / (1 - K),
        M: (g - K) / (1 - K),
        Y: (b - K) / (1 - K),
        K: K
      };
    },

    cmykToRgb(C, M, Y, K) {
      return [
        255 * (1 - C) * (1 - K),
        255 * (1 - M) * (1 - K),
        255 * (1 - Y) * (1 - K)
      ];
    },

    isOutOfGamut(values) {
      return values.some(v => v < -0.5 || v > 255.5);
    },

    handleOutOfGamut(values) {
      if (oogStrategy === 'clipping') {
        return values.map(v => clamp(v, 0, 255));
      } else {
        const min = Math.min(...values);
        const max = Math.max(...values);
        if (max - min < 1e-6) return values.map(() => 0);
        return values.map(v => (v - min) / (max - min) * 255);
      }
    },

    rgbToHex(R, G, B) {
      const toHex = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
      return '#' + toHex(R) + toHex(G) + toHex(B);
    },

    hexToRgb(hex) {
      const h = hex.replace('#', '');
      return [
        parseInt(h.substr(0, 2), 16),
        parseInt(h.substr(2, 2), 16),
        parseInt(h.substr(4, 2), 16)
      ];
    }
  };
})();