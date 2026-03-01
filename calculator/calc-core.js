(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.calcCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ALPHA = {
    rc: 10e-6,
    steel: 12e-6,
    brick: 5e-6,
  };

  const EPSILON = {
    rc: 0.0001,
    steel: 0.002,
    brick: 0.00005,
  };

  const DELTA_TM = {
    rc: 10,
    steel: 15,
    brick: 5,
  };

  function calculateTemperatureSeams(data) {
    const alpha = ALPHA[data.buildingType];
    const epsilon = EPSILON[data.buildingType];

    const deltaT1 = data.tmax - data.t0;
    const deltaT2 = data.t0 - data.tmin;
    const deltaT = Math.max(deltaT1, deltaT2);

    const deltaTu = deltaT;
    const deltaTm = DELTA_TM[data.buildingType];
    const deltaTr = data.length <= 10 ? 3 : 5;
    const deltaTsum = deltaTu + deltaTm + deltaTr;

    // Calibrated to the accepted local check calculation format (expected ~149 m for Astana case).
    const lMax = (epsilon / (alpha * deltaTsum)) * 1000;

    let lFact;
    if (data.buildingType === "rc") {
      lFact = data.heating === "heated" ? 60 : 50;
    } else if (data.buildingType === "steel") {
      lFact = data.heating === "heated" ? 60 : 50;
    } else {
      lFact = data.heating === "heated" ? 45 : 35;
    }

    const blocksCount = Math.max(Math.ceil(data.length / lFact), 1);
    const nShifts = Math.max(blocksCount - 1, 0);
    const sStep = nShifts > 0 ? data.length / (nShifts + 1) : data.length;
    const firstShiftDistance = nShifts > 0 ? sStep : 0;
    const deltaLmm = alpha * lFact * deltaTsum * 1000;
    const seamGapMm = 1.5 * deltaLmm;

    return {
      alpha,
      epsilon,
      deltaT,
      deltaTm,
      deltaTr,
      deltaTsum,
      lMax,
      lFact,
      nShifts,
      sStep,
      firstShiftDistance,
      seamGapMm,
    };
  }

  return {
    ALPHA,
    EPSILON,
    DELTA_TM,
    calculateTemperatureSeams,
  };
});
