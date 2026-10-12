const Tests = (() => {

  let results = [];

  function assertClose(actual, expected, tolerance, message) {
    const pass = Math.abs(actual - expected) <= tolerance;
    results.push({
      pass,
      message: `${message} — ожидалось ${expected.toFixed(4)}, получено ${actual.toFixed(4)}`
    });
  }

  function assertEqual(actual, expected, message) {
    const pass = actual === expected;
    results.push({ pass, message: `${message} — ожидалось ${expected}, получено ${actual}` });
  }

  function run() {
    results = [];

    Model.setIlluminant('D65');
    const lab1 = Model.rgbToLab(255, 0, 0);
    assertClose(lab1[0], 53.24, 0.1, 'RGB(255,0,0)→L');
    assertClose(lab1[1], 80.11, 0.5, 'RGB(255,0,0)→a');
    assertClose(lab1[2], 67.22, 0.5, 'RGB(255,0,0)→b');

    Model.setCmykMethod('GCR');
    const cmyk1 = Model.rgbToCmyk(255, 0, 0);
    assertClose(cmyk1.C, 0, 0.001, 'RGB(255,0,0)→C (GCR)');
    assertClose(cmyk1.M, 1, 0.001, 'RGB(255,0,0)→M (GCR)');
    assertClose(cmyk1.Y, 1, 0.001, 'RGB(255,0,0)→Y (GCR)');
    assertClose(cmyk1.K, 0, 0.001, 'RGB(255,0,0)→K (GCR)');

    const rgb1 = Model.cmykToRgb(0, 1, 1, 0);
    assertClose(rgb1[0], 255, 0.5, 'CMYK(0,1,1,0)→R');
    assertClose(rgb1[1], 0, 0.5, 'CMYK(0,1,1,0)→G');
    assertClose(rgb1[2], 0, 0.5, 'CMYK(0,1,1,0)→B');

    const lab2 = Model.rgbToLab(0, 255, 0);
    assertClose(lab2[0], 87.74, 0.3, 'RGB(0,255,0)→L');
    assertClose(lab2[1], -86.18, 0.5, 'RGB(0,255,0)→a');
    assertClose(lab2[2], 83.18, 0.5, 'RGB(0,255,0)→b');

    const lab3 = Model.rgbToLab(0, 0, 255);
    assertClose(lab3[0], 32.30, 0.3, 'RGB(0,0,255)→L');
    assertClose(lab3[1], 79.19, 0.5, 'RGB(0,0,255)→a');
    assertClose(lab3[2], -107.86, 0.5, 'RGB(0,0,255)→b');

    const rgb2 = Model.labToRgb(53.24, 80.11, 67.22);
    assertClose(rgb2[0], 255, 1, 'Lab→RGB R (красный)');
    assertClose(rgb2[1], 0, 1, 'Lab→RGB G (красный)');
    assertClose(rgb2[2], 0, 1, 'Lab→RGB B (красный)');

    const lab4 = Model.rgbToLab(0, 0, 0);
    assertClose(lab4[0], 0, 0.1, 'RGB(0,0,0)→L');
    assertClose(lab4[1], 0, 0.1, 'RGB(0,0,0)→a');
    assertClose(lab4[2], 0, 0.1, 'RGB(0,0,0)→b');

    const lab5 = Model.rgbToLab(255, 255, 255);
    assertClose(lab5[0], 100, 0.1, 'RGB(255,255,255)→L');
    assertClose(lab5[1], 0, 0.5, 'RGB(255,255,255)→a');
    assertClose(lab5[2], 0, 0.5, 'RGB(255,255,255)→b');

    Model.setCmykMethod('UCR');
    const cmyk2 = Model.rgbToCmyk(128, 128, 128);
    Model.setCmykMethod('GCR');
    const cmyk3 = Model.rgbToCmyk(128, 128, 128);
    assertClose(cmyk2.K, cmyk3.K * 0.7, 0.01, 'UCR K ≈ 0.7 * GCR K для серого');

    const rgbOog = Model.labToRgb(50, 127, 127);
    const isOog = Model.isOutOfGamut(rgbOog);
    assertEqual(isOog, true, 'Lab(50,127,127) должен быть out-of-gamut');

    Model.setOogStrategy('clipping');
    const rgbClip = Model.handleOutOfGamut([300, -50, 128]);
    assertEqual(rgbClip[0], 255, 'Clipping: 300→255');
    assertEqual(rgbClip[1], 0, 'Clipping: -50→0');
    assertEqual(rgbClip[2], 128, 'Clipping: 128→128');

    Model.setOogStrategy('scaling');
    const rgbScale = Model.handleOutOfGamut([300, -50, 128]);
    assertClose(rgbScale[0], 255, 1, 'Scaling: max→255');
    assertClose(rgbScale[1], 0, 1, 'Scaling: min→0');

    Model.setIlluminant('D50');
    const labD50 = Model.rgbToLab(255, 0, 0);
    Model.setIlluminant('D65');
    const labD65 = Model.rgbToLab(255, 0, 0);
    const diff = Math.abs(labD50[0] - labD65[0]) + Math.abs(labD50[1] - labD65[1]) + Math.abs(labD50[2] - labD65[2]);
    assertEqual(diff > 0.5, true, `D50 и D65 должны давать разные Lab (разница=${diff.toFixed(3)})`);

    const hex = Model.rgbToHex(255, 128, 0);
    assertEqual(hex, '#ff8000', 'RGB→Hex');
    const rgbHex = Model.hexToRgb('#ff8000');
    assertEqual(rgbHex[0], 255, 'Hex→R');
    assertEqual(rgbHex[1], 128, 'Hex→G');
    assertEqual(rgbHex[2], 0, 'Hex→B');

    const xyz = Model.rgbToXyz(255, 0, 0);
    assertClose(xyz[0], 41.2453, 0.01, 'RGB(255,0,0)→X');
    assertClose(xyz[1], 21.2671, 0.01, 'RGB(255,0,0)→Y');
    assertClose(xyz[2], 1.9334, 0.01, 'RGB(255,0,0)→Z');

    const rgbXyz = Model.xyzToRgb(41.2453, 21.2671, 1.9334);
    assertClose(rgbXyz[0], 255, 1, 'XYZ→RGB R');
    assertClose(rgbXyz[1], 0, 1, 'XYZ→RGB G');
    assertClose(rgbXyz[2], 0, 1, 'XYZ→RGB B');

    Model.setCmykMethod('GCR');
    const cmykGray = Model.rgbToCmyk(128, 128, 128);
    assertClose(cmykGray.C, 0, 0.01, 'Серый 128→C=0 (GCR)');
    assertClose(cmykGray.M, 0, 0.01, 'Серый 128→M=0 (GCR)');
    assertClose(cmykGray.Y, 0, 0.01, 'Серый 128→Y=0 (GCR)');
    assertClose(cmykGray.K, 0.498, 0.01, 'Серый 128→K≈0.5 (GCR)');

    return results;
  }

  return { run };
})();