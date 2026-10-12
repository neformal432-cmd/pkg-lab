const View = (() => {

  const $ = id => document.getElementById(id);

  const elements = {
    illuminantSelect: $('illuminant-select'),
    cmykMethodSelect: $('cmyk-method'),
    oogStrategySelect: $('oog-strategy'),
    warningBox: $('warning-box'),
    mainSwatch: $('main-swatch'),
    hexDisplay: $('hex-display'),
    rgbPicker: $('rgb-picker'),

    sliderR: $('slider-r'), inputR: $('input-r'),
    sliderG: $('slider-g'), inputG: $('input-g'),
    sliderB: $('slider-b'), inputB: $('input-b'),

    sliderL: $('slider-l'), inputL: $('input-l'),
    sliderA: $('slider-a'), inputA: $('input-a'),
    sliderB_: $('slider-lab-b'), inputB_: $('input-lab-b'),

    sliderC: $('slider-c'), inputC: $('input-c'),
    sliderM: $('slider-m'), inputM: $('input-m'),
    sliderY: $('slider-y'), inputY: $('input-y'),
    sliderK: $('slider-k'), inputK: $('input-k'),

    runTestsBtn: $('run-tests'),
    testResults: $('test-results'),
    testOutput: $('test-output')
  };

  function updateSliderBackground(slider, gradient) {
    slider.style.background = `linear-gradient(to right, ${gradient})`;
  }

  function setSliderBgRgb(sliderR, sliderG, sliderB, curR, curG, curB) {
    const cR = clamp(curR, 0, 255), cG = clamp(curG, 0, 255), cB = clamp(curB, 0, 255);
    updateSliderBackground(sliderR, `rgb(0,${cG},${cB}), rgb(255,${cG},${cB})`);
    updateSliderBackground(sliderG, `rgb(${cR},0,${cB}), rgb(${cR},255,${cB})`);
    updateSliderBackground(sliderB, `rgb(${cR},${cG},0), rgb(${cR},${cG},255)`);
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function labToRgbClipped(L, a, b) {
    if (typeof Model === 'undefined') return [128, 128, 128];
    const rgb = Model.labToRgb(L, a, b);
    return rgb.map(v => clamp(v, 0, 255));
  }

  function cmykToRgbClipped(C, M, Y, K) {
    if (typeof Model === 'undefined') return [128, 128, 128];
    const rgb = Model.cmykToRgb(C/100, M/100, Y/100, K/100);
    return rgb.map(v => clamp(v, 0, 255));
  }

  function setSliderBgLab(sliderL, sliderA, sliderB, curL, curA, curB) {
    const rgbL0 = labToRgbClipped(0, curA, curB);
    const rgbL100 = labToRgbClipped(100, curA, curB);
    updateSliderBackground(sliderL,
      `rgb(${rgbL0.map(Math.round).join(',')}), rgb(${rgbL100.map(Math.round).join(',')})`);

    const rgbAmin = labToRgbClipped(curL, -128, curB);
    const rgbAmax = labToRgbClipped(curL, 127, curB);
    updateSliderBackground(sliderA,
      `rgb(${rgbAmin.map(Math.round).join(',')}), rgb(${rgbAmax.map(Math.round).join(',')})`);

    const rgbBmin = labToRgbClipped(curL, curA, -128);
    const rgbBmax = labToRgbClipped(curL, curA, 127);
    updateSliderBackground(sliderB,
      `rgb(${rgbBmin.map(Math.round).join(',')}), rgb(${rgbBmax.map(Math.round).join(',')})`);
  }

  function setSliderBgCmyk(sliderC, sliderM, sliderY, sliderK, curC, curM, curY, curK) {
    const rgbC0 = cmykToRgbClipped(0, curM, curY, curK);
    const rgbC100 = cmykToRgbClipped(100, curM, curY, curK);
    updateSliderBackground(sliderC,
      `rgb(${rgbC0.map(Math.round).join(',')}), rgb(${rgbC100.map(Math.round).join(',')})`);

    const rgbM0 = cmykToRgbClipped(curC, 0, curY, curK);
    const rgbM100 = cmykToRgbClipped(curC, 100, curY, curK);
    updateSliderBackground(sliderM,
      `rgb(${rgbM0.map(Math.round).join(',')}), rgb(${rgbM100.map(Math.round).join(',')})`);

    const rgbY0 = cmykToRgbClipped(curC, curM, 0, curK);
    const rgbY100 = cmykToRgbClipped(curC, curM, 100, curK);
    updateSliderBackground(sliderY,
      `rgb(${rgbY0.map(Math.round).join(',')}), rgb(${rgbY100.map(Math.round).join(',')})`);

    const rgbK0 = cmykToRgbClipped(curC, curM, curY, 0);
    const rgbK100 = cmykToRgbClipped(curC, curM, curY, 100);
    updateSliderBackground(sliderK,
      `rgb(${rgbK0.map(Math.round).join(',')}), rgb(${rgbK100.map(Math.round).join(',')})`);
  }

  return {
    elements,

    getIlluminant() { return elements.illuminantSelect.value; },
    getCmykMethod() { return elements.cmykMethodSelect.value; },
    getOogStrategy() { return elements.oogStrategySelect.value; },

    getRgbValues() {
      return {
        R: parseFloat(elements.inputR.value) || 0,
        G: parseFloat(elements.inputG.value) || 0,
        B: parseFloat(elements.inputB.value) || 0
      };
    },

    getLabValues() {
      return {
        L: parseFloat(elements.inputL.value) || 0,
        a: parseFloat(elements.inputA.value) || 0,
        b: parseFloat(elements.inputB_.value) || 0
      };
    },

    getCmykValues() {
      return {
        C: parseFloat(elements.inputC.value) || 0,
        M: parseFloat(elements.inputM.value) || 0,
        Y: parseFloat(elements.inputY.value) || 0,
        K: parseFloat(elements.inputK.value) || 0
      };
    },

    setRgbValues(R, G, B, skipSliders = false) {
      if (!skipSliders) {
        elements.sliderR.value = R;
        elements.sliderG.value = G;
        elements.sliderB.value = B;
      }
      elements.inputR.value = Math.round(R);
      elements.inputG.value = Math.round(G);
      elements.inputB.value = Math.round(B);
    },

    setLabValues(L, a, b, skipSliders = false) {
      if (!skipSliders) {
        elements.sliderL.value = L;
        elements.sliderA.value = a;
        elements.sliderB_.value = b;
      }
      elements.inputL.value = L.toFixed(2);
      elements.inputA.value = a.toFixed(2);
      elements.inputB_.value = b.toFixed(2);
    },

    setCmykValues(C, M, Y, K, skipSliders = false) {
      if (!skipSliders) {
        elements.sliderC.value = C * 100;
        elements.sliderM.value = M * 100;
        elements.sliderY.value = Y * 100;
        elements.sliderK.value = K * 100;
      }
      elements.inputC.value = (C * 100).toFixed(2);
      elements.inputM.value = (M * 100).toFixed(2);
      elements.inputY.value = (Y * 100).toFixed(2);
      elements.inputK.value = (K * 100).toFixed(2);
    },

    setMainSwatch(R, G, B) {
      const hex = Model.rgbToHex(R, G, B);
      elements.mainSwatch.style.backgroundColor = hex;
      elements.hexDisplay.textContent = hex.toUpperCase();
      elements.rgbPicker.value = hex;
    },

    updateSliderBackgrounds(R, G, B, L, a, b, C, M, Y, K) {
      setSliderBgRgb(elements.sliderR, elements.sliderG, elements.sliderB, R, G, B);
      setSliderBgLab(elements.sliderL, elements.sliderA, elements.sliderB_, L, a, b);
      setSliderBgCmyk(elements.sliderC, elements.sliderM, elements.sliderY, elements.sliderK,
        C * 100, M * 100, Y * 100, K * 100);
    },

    showWarning(msg) {
      elements.warningBox.textContent = '⚠️ ' + msg;
      elements.warningBox.classList.remove('hidden');
    },

    hideWarning() {
      elements.warningBox.classList.add('hidden');
    },

    showTestResults(results) {
      elements.testResults.classList.remove('hidden');
      const passed = results.filter(r => r.pass).length;
      const total = results.length;

      let html = '';
      results.forEach(r => {
        html += `<div class="test-item ${r.pass ? 'pass' : 'fail'}">
          ${r.pass ? '✅' : '❌'} ${r.message}
        </div>`;
      });
      html += `<div class="test-summary ${passed === total ? 'all-pass' : 'has-fail'}">
        Пройдено: ${passed} / ${total}
      </div>`;
      elements.testOutput.innerHTML = html;
    },

    hideTestResults() {
      elements.testResults.classList.add('hidden');
    },

    onIlluminantChange(fn) {
      elements.illuminantSelect.addEventListener('change', fn);
    },
    onCmykMethodChange(fn) {
      elements.cmykMethodSelect.addEventListener('change', fn);
    },
    onOogStrategyChange(fn) {
      elements.oogStrategySelect.addEventListener('change', fn);
    },
    onRgbPickerChange(fn) {
      elements.rgbPicker.addEventListener('input', fn);
    },
    onSliderRgbChange(fn) {
      const pairs = [
        [elements.sliderR, elements.inputR],
        [elements.sliderG, elements.inputG],
        [elements.sliderB, elements.inputB]
      ];
      pairs.forEach(([slider, input]) => {
        slider.addEventListener('input', e => {
          input.value = slider.value;
          fn(e);
        });
      });
    },
    onInputRgbChange(fn) {
      [elements.inputR, elements.inputG, elements.inputB].forEach(s =>
        s.addEventListener('input', fn));
    },
    onSliderLabChange(fn) {
      const pairs = [
        [elements.sliderL, elements.inputL],
        [elements.sliderA, elements.inputA],
        [elements.sliderB_, elements.inputB_]
      ];
      pairs.forEach(([slider, input]) => {
        slider.addEventListener('input', e => {
          input.value = slider.value;
          fn(e);
        });
      });
    },
    onInputLabChange(fn) {
      [elements.inputL, elements.inputA, elements.inputB_].forEach(s =>
        s.addEventListener('input', fn));
    },
    onSliderCmykChange(fn) {
      const pairs = [
        [elements.sliderC, elements.inputC],
        [elements.sliderM, elements.inputM],
        [elements.sliderY, elements.inputY],
        [elements.sliderK, elements.inputK]
      ];
      pairs.forEach(([slider, input]) => {
        slider.addEventListener('input', e => {
          input.value = slider.value;
          fn(e);
        });
      });
    },
    onInputCmykChange(fn) {
      [elements.inputC, elements.inputM, elements.inputY, elements.inputK].forEach(s =>
        s.addEventListener('input', fn));
    },
    onRunTests(fn) {
      elements.runTestsBtn.addEventListener('click', fn);
    }
  };
})();