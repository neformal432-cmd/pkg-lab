const ViewModel = (() => {

  let isUpdating = false;

  function updateAll(source, values) {
    if (isUpdating) return;
    isUpdating = true;

    try {
      let R, G, B, L, a, b, C, M, Y, K;
      let warning = null;

      if (source === 'rgb') {
        R = values.R; G = values.G; B = values.B;

        const lab = Model.rgbToLab(R, G, B);
        L = lab[0]; a = lab[1]; b = lab[2];

        const cmyk = Model.rgbToCmyk(R, G, B);
        C = cmyk.C; M = cmyk.M; Y = cmyk.Y; K = cmyk.K;

      } else if (source === 'lab') {
        L = values.L; a = values.a; b = values.b;

        let rgb = Model.labToRgb(L, a, b);
        if (Model.isOutOfGamut(rgb)) {
          warning = `LAB→RGB: значения вышли за границы [0,255] (${rgb.map(v=>v.toFixed(1)).join(', ')}). Применена стратегия "${Model.getOogStrategy()}".`;
          rgb = Model.handleOutOfGamut(rgb);
        }
        R = rgb[0]; G = rgb[1]; B = rgb[2];

        const cmyk = Model.rgbToCmyk(R, G, B);
        C = cmyk.C; M = cmyk.M; Y = cmyk.Y; K = cmyk.K;

      } else if (source === 'cmyk') {
        C = values.C; M = values.M; Y = values.Y; K = values.K;

        let rgb = Model.cmykToRgb(C, M, Y, K);
        R = rgb[0]; G = rgb[1]; B = rgb[2];

        const lab = Model.rgbToLab(R, G, B);
        L = lab[0]; a = lab[1]; b = lab[2];
      }

      View.setRgbValues(R, G, B);
      View.setLabValues(L, a, b);
      View.setCmykValues(C, M, Y, K);
      View.setMainSwatch(R, G, B);
      View.updateSliderBackgrounds(R, G, B, L, a, b, C, M, Y, K);

      if (warning) {
        View.showWarning(warning);
      } else {
        View.hideWarning();
      }

    } finally {
      isUpdating = false;
    }
  }

  function applySettings() {
    Model.setIlluminant(View.getIlluminant());
    Model.setCmykMethod(View.getCmykMethod());
    Model.setOogStrategy(View.getOogStrategy());
  }

  function recalculateFromRgb() {
    applySettings();
    const v = View.getRgbValues();
    updateAll('rgb', v);
  }

  function recalculateFromLab() {
    applySettings();
    const v = View.getLabValues();
    updateAll('lab', v);
  }

  function recalculateFromCmyk() {
    applySettings();
    const v = View.getCmykValues();
    updateAll('cmyk', {
      C: v.C / 100, M: v.M / 100, Y: v.Y / 100, K: v.K / 100
    });
  }

  return {
    init() {
      applySettings();

      View.onIlluminantChange(() => recalculateFromRgb());
      View.onCmykMethodChange(() => recalculateFromRgb());
      View.onOogStrategyChange(() => recalculateFromRgb());

      View.onRgbPickerChange(e => {
        const [R, G, B] = Model.hexToRgb(e.target.value);
        View.setRgbValues(R, G, B, true);
        recalculateFromRgb();
      });
      View.onSliderRgbChange(recalculateFromRgb);
      View.onInputRgbChange(recalculateFromRgb);

      View.onSliderLabChange(recalculateFromLab);
      View.onInputLabChange(recalculateFromLab);

      View.onSliderCmykChange(recalculateFromCmyk);
      View.onInputCmykChange(recalculateFromCmyk);

      View.onRunTests(() => {
        const results = Tests.run();
        View.showTestResults(results);
      });

      recalculateFromRgb();
    }
  };
})();