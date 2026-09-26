const STANDARD_PROTECTION_RATINGS = [
  2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125,
];

/**
 * Sélectionne le plus petit calibre normalisé supérieur ou égal au courant d'emploi.
 * @param {number} ib - Courant d'emploi en A.
 * @returns {number|null} Calibre en A, ou null si aucun calibre ne couvre le courant.
 * @throws {Error} Si le courant est inférieur ou égal à zéro.
 */
function selectProtectionRating(ib) {
  if (ib <= 0) {
    throw new Error("Le courant Ib doit être positif");
  }

  return STANDARD_PROTECTION_RATINGS.find((rating) => rating >= ib) ?? null;
}

module.exports = {
  STANDARD_PROTECTION_RATINGS,
  selectProtectionRating,
};
