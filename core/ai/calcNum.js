function estimateRequestRecruits(unit) {
  if (unit.rank < RANK_SQUAD) {
    let d = calcHQMinRecruits(unit) - unit.soldiers;
    return d.min(0);
  }
  return ((50 - unit.soldiers) / ((unit.soldiers / 10) + 1)).min(Math.random().round()).max(20).round();
}

function estimateRequestRecruitsIncludeChild(unit) {
  if (unit.rank < RANK_SQUAD) {
    let d = calcHQMinRecruits(unit) - unit.soldiers;
    unit.childrenUnits.forEach(x => {
      d += x.requestRecruits;
    });
    return d.min(0);
  }
  return ((50 - unit.soldiers) / ((unit.soldiers / 10) + 1)).min(Math.random().round()).round();
}


function calcHQMinRecruits(unit) {
  if (unit.rank == RANK_SQUAD)
    return 6;
  else
    return (unit.averageExperience * unit.averageStrength + 12 / unit.rank).min(Math.random().round()).floor();
}

function calcRequestRecruitsMaxIncludeChild(unit) {
  return (estimateRequestRecruitsIncludeChild(unit) * 1.5).min(1).round();
}
