function validatePositive(value, label) {
  if (value <= 0) throw new Error(`${label} doit etre positif`);
}

/**
 * @param {object} params
 * @param {number} params.ib
 * @param {number} params.k1
 * @param {number} params.k2
 * @param {number} params.k3
 * @returns {number}
 */

function calculateCorrectedCurrent({ ib, k1, k2, k3 }) {
  validatePositive(ib, "Ib");
  validatePositive(k1, "K1");
  validatePositive(k2, "K2");
  validatePositive(k3, "K3");

  return ib / (k1 * k2 * k3);
}

module.exports = { calculateCorrectedCurrent };
