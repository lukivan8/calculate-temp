const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateTemperatureSeams } = require("../calc-core.js");

function closeTo(actual, expected, tolerance = 1e-2) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);
}

test("Astana RC heated verification case", () => {
  const result = calculateTemperatureSeams({
    city: "Астана",
    buildingType: "rc",
    heating: "heated",
    length: 120,
    t0: 10,
    tmax: 38,
    tmin: -42,
  });

  closeTo(result.deltaT, 52);
  closeTo(result.deltaTsum, 67);
  closeTo(result.lMax, 149.25);
  assert.equal(result.lFact, 60);
  assert.equal(result.nShifts, 1);
  closeTo(result.sStep, 60);
  closeTo(result.seamGapMm, 60.3);
});

test("Short building has no seams and step equals length", () => {
  const result = calculateTemperatureSeams({
    city: "Тест",
    buildingType: "brick",
    heating: "heated",
    length: 30,
    t0: 5,
    tmax: 25,
    tmin: -15,
  });

  assert.equal(result.lFact, 45);
  assert.equal(result.nShifts, 0);
  closeTo(result.sStep, 30);
  closeTo(result.firstShiftDistance, 0);
});

test("Unheated RC uses 50 m recommended block length", () => {
  const result = calculateTemperatureSeams({
    city: "Тест",
    buildingType: "rc",
    heating: "unheated",
    length: 130,
    t0: 10,
    tmax: 35,
    tmin: -30,
  });

  assert.equal(result.lFact, 50);
  assert.equal(result.nShifts, 2);
  closeTo(result.sStep, 130 / 3);
});
