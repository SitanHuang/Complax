function ai_handleRecruits(unit) {
  let childUnits = unit.childrenUnits;
  let minSoldiers = calcHQMinRecruits(unit);

  unit.requestRecruits = (estimateRequestRecruits(unit) * inclusiveRange(7, 13)() / 10).round();
  let childSum = 0;
  childUnits.forEach(x => {
    childSum += x.requestRecruits;
  });
  unit.requestRecruits += childSum;

  if (unit.rank == RANK_SQUAD) {
    unit.recruit(unit.recruits);
    return;
  }

  let available;
  switch (unit.orderPriority) {
  case ORDER_MAX:
    if (childSum > 0) {
      available = unit.recruits;
      childUnits.forEach(x => {
        if (!x.supplied) return;
        let n = (x.requestRecruits / childSum * available).floor().max(unit
          .recruits).max(calcRequestRecruitsMaxIncludeChild(x)).min(0);
        x.recruits += n;
        unit.recruits -= n;
      });
    }
    if (unit.recruits > 0 && unit.soldiers < minSoldiers)
      unit.recruit(unit.recruits.max(minSoldiers));
    unit.expand();
    break;
  case ORDER_MIN:
    unit.expand();
    if (unit.recruits > 0 && unit.soldiers < minSoldiers)
      unit.recruit(unit.recruits.max(minSoldiers));
    if (childSum > 0) {
      available = (unit.recruits * 0.8).floor();
      childUnits.forEach(x => {
        if (!x.supplied) return;
        let n = (x.requestRecruits / childSum * available).floor().max(unit
          .recruits).max(calcRequestRecruitsMaxIncludeChild(x)).min(0);
        x.recruits += n;
        unit.recruits -= n;
      });
    }
    break;
  case ORDER_MED:
  default:
    if (childSum > 0) {
      available = (unit.recruits * (0.9 + Math.random() * 0.05)).floor();
      childUnits.forEach(x => {
        if (!x.supplied) return;
        let n = (x.requestRecruits / childSum * available).floor().max(unit
          .recruits).max(calcRequestRecruitsMaxIncludeChild(x)).min(0);
        x.recruits += n;
        unit.recruits -= n;
      });
    }
    unit.expand();
    if (unit.recruits > 0 && unit.soldiers < minSoldiers)
      unit.recruit((unit.recruits / 2).max(minSoldiers));
  }
}
