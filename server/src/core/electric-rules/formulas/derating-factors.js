function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit etre positif`);
}

/**
 * @param {object} params
 * @param {number} params.inCurrent
 * @param {number} params.k1
 * @param {number} params.k2
 * @param {number} params.k3
 * @returns {number}
 */

function calculateCorrectedCurrent({ inCurrent, k1, k2, k3 }) {
  validatePositive(inCurrent, "In");
  validatePositive(k1, "K1");
  validatePositive(k2, "K2");
  validatePositive(k3, "K3");

  return inCurrent / (k1 * k2 * k3);
}

module.exports = { calculateCorrectedCurrent };
