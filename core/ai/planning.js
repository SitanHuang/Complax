function ai_givePlan(unit) {
  _ai_orderMove(unit);
  if (unit.rank == RANK_SQUAD) {
    return;
  }
  if (unit.rank == RANK_ARMY) {
    unit.plan = [];
    if (turnNumber % unit._attackCycle <= 1) {
      console.warn(owner + ': Attack cycle!');
    }
    traverseMap((pro) => {
      if (pro.owner != unit.owner) {
        if (pro._attackable) {
          if (turnNumber % unit._attackCycle == 10) unit.plan.push(pro.loc);
          if (pro.units.length == 0 && (pro._adjacentDiff > 1)) unit.plan.push(pro.loc);
          if (!pro._defendable) unit.plan.push(pro.loc);
          if (pro.city > 0) unit.plan.push(pro.loc);
          if (Math.random() < 0.1) unit.plan.push(pro.loc);
        }
      } else if (pro._defendable || pro.city) {
        if (pro._attackable) { unit.plan.push(pro.loc); unit.plan.push(pro.loc); } 
        if (pro.city) {
          unit.plan.push(pro.loc);
        }
      }
    });
  }

  let lastIndex = 0;
  unit.childrenUnits.forEach(child => {
    let perc = (child._totalAttack / unit._totalAttack).max(1).min(0);
    let length = (perc * unit.plan.length).floor().min(1);

    child.plan = unit.plan.slice(lastIndex, lastIndex + length);
    _ai_givePriority(unit, child);

    lastIndex += length;
    if (lastIndex >= unit.plan.length)
      lastIndex = 0;
  });

}

function _ai_givePriority(unit, child) {
  if (child.rank < RANK_SQUAD && child.children.length <= (1 + Math.random().round())) {
    child.orderPriority = ORDER_MIN;
    return;
  }
  switch (unit.orderPriority) {
    case ORDER_MAX:
      if (child._averageHP >= 0.3 && child.soldiers >= calcHQMinRecruits(child) / 1.5)
        child.orderPriority = ORDER_MAX;
      else
        child.orderPriority = ORDER_MED;
      break;
    case ORDER_MIN:
      if (child._averageHP >= 0.9 && (child.rank == RANK_SQUAD ? child.soldiers > 30 : child.soldiers >= calcHQMinRecruits(child)))
        child.orderPriority = ORDER_MED;
      else
        child.orderPriority = ORDER_MIN;
      break;
    default:
    case ORDER_MED:
      if (child._averageHP >= 0.8 && (child.rank == RANK_SQUAD ? child.soldiers > 25 : true))
        child.orderPriority = ORDER_MAX;
      else if (child._averageHP >= 0.6 && (child.rank == RANK_SQUAD ? child.soldiers > 15 : true))
        child.orderPriority = ORDER_MED;
      else
        child.orderPriority = ORDER_MIN;
      break;
  }
}

function _ai_squad_move(unit) {
  let moveTo = -1; // -1, stay, 0, defend, 1, attack
  switch (unit.orderPriority) {
    case ORDER_MAX:
      if (unit._averageHP >= 0.35 && unit.soldiers >= calcHQMinRecruits(unit) / 1.5)
        moveTo = 1;
      else
        moveTo = 0;
      break;
    case ORDER_MIN:
      if (unit._averageHP >= 0.9 && (unit.rank == RANK_SQUAD ? unit.soldiers > 40 : unit.soldiers >= calcHQMinRecruits(unit)))
        moveTo = 1;
      else if (unit._averageHP >= 0.6 && (unit.rank == RANK_SQUAD ? unit.soldiers > 20 : true))
        moveTo = 0;
      break;
    default:
    case ORDER_MED:
      if (unit._averageHP >= 0.6 && (unit.rank == RANK_SQUAD ? unit.soldiers > 30 : true))
        moveTo = 1;
      else if (unit._averageHP >= 0.35 && (unit.rank == RANK_SQUAD ? unit.soldiers > 10 : true))
        moveTo = 0;
      break;
  }

  let list = unit.plan.filter(a => {
    let x = a.province;
    return (moveTo == 1 && x.owner != unit.owner && x._attackable) ||
      (moveTo == 0 && x.owner == unit.owner && x._defendable) ||
      (moveTo == -1 && x.owner == unit.owner && x._defendable);
  });

  if (moveTo >= 0)
    unit.order = list.sample();
  else if (list.length) {
    let avail = [];
    list.forEach(a => {
      let x = a.province;
      let prov = x.nonAttackableFriendlyNeighbor(unit.owner);
      if (prov)
        avail.push(prov.loc);
    });
    if (!avail.length)
      avail = list;
    unit.order = avail.sample();
  }
}

function _ai_orderMove(unit) {
  unit.order = null;
  
  if (unit.orderPriority == ORDER_MIN && unit.averageExperience < 1.5) {
    unit.train();
    return;
  } else if (unit.orderPriority == ORDER_MED && unit.averageExperience < 1) {
    unit.train();
    return;
  }
    
  if (unit.rank == RANK_SQUAD || (unit.children.length == 0 && Math.random() > 0.8) || Math.random() > 0.95) {
    _ai_squad_move(unit);
    return;
  }

  // officer move
  var city;
  var plain;
  var neighbor;

  var most;
  var mostNum = 0;

  for (let i = 0;i < unit.plan;i++) {
    let x = unit.plan[i].province;

    if (x.owner != unit.owner) continue;

    if (x.city) city = x.loc;
    if (x._attackable) plain = x.loc;
    else {
      let prov = x.nonAttackableFriendlyNeighbor(unit.owner);
      if (prov)
        neighbor = prov.loc;
    }

    if (x.units > mostNum) {
      mostNum = x.units;
      most = x.loc;
    }
  }

  if (city) unit.order = city;
  else if (plain) unit.order = plain;
  else if (neighbor) unit.order = neighbor;
  else unit.order = most;
}
