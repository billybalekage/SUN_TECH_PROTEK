const STANDARD_PROTECTION_RATINGS = [
  2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125,
];

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
