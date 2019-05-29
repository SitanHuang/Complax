function think(unit) {
  if (unit.removed) return;
  ai_handleRecruits(unit);
  ai_givePlan(unit);
}
