var unitIDIncrement = 0;

class Unit {
  constructor (loc, owner, rank, parent, soldiers) {
    this.id = unitIDIncrement++;

    this.loc = loc.eq ? loc : null;

    this.owner = owner || 0;
    this.ai = true;

    /*
    1 - army
    2 - division
    3 - regiment
    4 - company
    10 - squad (in settings.js)
    */
    this.rank = rank || 0;

    this.recruits = 0;
    this.requestRecruits = 0;

    this.soldiers = soldiers || 0;
    this.averageExperience = 1 + Math.random();
    this.averageStrength = 1 + Math.random();

    this.entrench = 1;
    this.planning = 1;

    this.parent = parent || 0;
    this.children = [];

    this._totalAttack = 0;
    this._totalSoldiersLastSeen = 0;
    this._totalSoldiers = 0;
    this._prov = this.loc && this.loc.province;

    this.hp = 1;
    this._averageHP = 1;

    this.order = null;
    this._plan = [];
    this.orderPriority = ORDER_MED;
  }

  get plan() { return this._plan; }
  set plan(p) { this._plan = p; this.planning = (this.planning - 0.3).min(.7); }

  add() {
    UNITS[this.id] = this;
    this.loc.province.units.push(this.id);
    return this;
  }

  static fetch(id) {
    return UNITS[id];
  }

  get supplied() {
    return this.loc.province._defendable;
  }

  get parentUnit() {
    return UNITS[this.parent];
  }

  get attack() {
    this._prov = this._prov || this.loc.province;
    return this.soldiers * this.entrench * this.planning * this.averageExperience * this.averageStrength * (1.2 - this._prov._adjacentDiff * 0.2) * this.hp;
  }

  get childrenUnits() {
    return this.children.map(x => Unit.fetch(x));
  }

  calcTotalAttack() {
    let a = this.attack;
    let s = this.soldiers;
    let h = this.hp;

    this.children.forEach(x => {
      let d = Unit.fetch(x).calcTotalAttack();
      a += d[0];
      s += d[1];
      h += d[2];
    });

    h /= (this.children.length + 1);

    return [this._totalAttack = a, this._totalSoldiersLastSeen = this._totalSoldiers = s, this._averageHP = h];
  }

  calcEffectsDuetoNoSupply() {
    if (this.supplied) return;
    this.soldiers = (this.soldiers / 2).floor().min(EXPAND_MIN_SOLDIERS);
    this.hp = this.hp.max(0.2);
  }

  get fullHP() {
    /*
    army - 50
    division - 25
    regiment - 16.6
    comapny - 12.5
    squad - 5 - 15(10 soldiers) - 17(12 soldiers)
    */
    return this.soldiers * this.averageExperience * this.averageStrength + 50 / this.rank;
  }

  // whether or not to have soldiers
  get recruitable() {
  //   all can recruit
  //   return this.rank == RANK_SQUAD;
    return true;
  }

  // whether or not to have children
  get expandable() {
    return this.rank != RANK_SQUAD;
  }

  get childRank() {
    if (!this.expandable) return false;
    return this.rank == RANK_COMPANY ? RANK_SQUAD : this.rank + 1;
  }

  get expandCost() {
    return (this.expandable ? (50 / this.rank) + this.children.length * 10 : IMPOSSIBLE_EXPAND_COST).floor();
  }

  get rankTitle() {
    switch (this.rank) {
      case RANK_ARMY:
        return 'Army';
      case RANK_DIVISION:
        return 'Division';
      case RANK_REGIMENT:
        return 'Regiment';
      case RANK_COMPANY:
        return 'Company';
      case RANK_SQUAD:
        return 'Squad';
      default:
        return 'Rank ' + this.rank;
    }
  }
  // TODO: recursive title

  expand() {
    if (this._expanded) return false;
    if (!this.supplied) return false;

    this._expanded = true;

    if (!this.expandable) return false;

    let cost = this.expandCost;

    if (this.recruits < cost) return false;

    this.recruits -= cost;
    let u = new Unit(this.loc, this.owner, this.childRank, this.id, EXPAND_MIN_SOLDIERS);
    u.add();

    this.children.push(u.id);

    return u;
  }

  orderMove(target) {
    this.order = target;
  }

  processMove() {
    if (this._trained) this.order = null;
    
    // TODO: terrain & distance
    this.hp = (this.hp + 0.15).max(1);

    if (!this.order) {
      return;
    }
    if (this.removed) return;

    let pro = this.order.province;
    if (pro.owner == this.owner || !pro.units.length) {
      this._moveTo(this.order);
      this.order = null;
    } else {
      let targetProv = this.order.province;
      let retreatProv = targetProv.leastUnitsFriendlyNeighbor(this.owner) || this._prov;
      // TODO: move & battle

      let myDamage = this.attack;

      let enemies = targetProv.units.map(x => Unit.fetch(x));
      let enemyParticipation = enemies.length > 1 ? 0.5 : 1;

      for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        enemy._takeDamage(myDamage * enemyParticipation);
        if (enemy.hp <= 0.4) {
          enemy._retreat();
        }
        this._takeDamage(enemy.attack * enemyParticipation);
        if (this.hp <= 1 - MAX_MORALE_DAMAGE || this.soldiers <= EXPAND_MIN_SOLDIERS) {
          this.order = null;
          break;
        }
      }

      if (!this.removed) {
        this._moveTo(retreatProv.loc);

        if (!targetProv.units.length)
          this._moveTo(targetProv.loc);
      }
    }
  }

  _retreat() {
    let retreatProv = this._prov.leastUnitsFriendlyNeighbor(this.owner);
    if (!retreatProv) {
      this.hp = 1 - MAX_MORALE_DAMAGE;
      return;
    }
    this._moveTo(retreatProv.loc);
  }

  _takeDamage(m) {
    let str = this.attack;
    let defense = this.fullHP;
    let damage = Math.sqrt(m * (m / str).max(1));
    let percDamage = (damage / defense).max(MAX_MORALE_DAMAGE).min(0);
    let casualty = (this.soldiers * percDamage).round().min(1);

    this.addAverageExperience(0.2);

    let old = this.soldiers;
    this.soldiers = (this.soldiers - casualty).min(EXPAND_MIN_SOLDIERS);
    PLAYERS[this.owner].casualty += old - this.soldiers;

    this.hp = (this.hp - percDamage).min(0).max(1);
    if (this.hp <= 0 && this.soldiers <= EXPAND_MIN_SOLDIERS) {
      this.remove();
    }
  }

  remove() {
    this._calcSuccessor();

    this._prov.units = this._prov.units.filter(x => (x != this.id));
    UNITS[this.id] = undefined;

    let parent = Unit.fetch(this.parent);
    if (parent)
      parent.children = parent.children.filter(x => (x != this.id));

    this.removed = true;
  }

  _calcSuccessor() {
    // ==== pick best candidate ====
    if (!this.childrenUnits.length) return;

    let list = this.childrenUnits.sort((a, b) => (b.attack - a.attack));
    let candidate = list[0];

    candidate._calcSuccessor();

    candidate.rank = this.rank;
    candidate.children = this.children.filter(x => (x != candidate.id));
    candidate.parent = this.parent;

    candidate.childrenUnits.forEach(x => {
      x.parent = candidate.id;
    });

    let parent = Unit.fetch(this.parent);
    if (parent) {
      parent.children = parent.children.filter(x => (x != this.id));
      parent.children.push(candidate.id);
    }

    return candidate;
  }

  _moveTo(target) {
    if (this._trained) return;
    
    if (target.eq(this.loc)) return;
    if (this.removed) return;

    let prov = target.province;

    if (prov.units.length && prov.owner != this.owner)
      throw 'Attempt to move into foreign province with enemy units';
    prov.owner = this.owner;
    prov.units.push(this.id);


    this._prov.units = this._prov.units.filter(x => (x != this.id));

    this.loc = target;
    this._prov = this.loc.province;

    this.entrench = 1;
    this.addAverageExperience(0.05);
  }

  addAverageExperience(d) {
    this.averageExperience = (this.averageExperience + d).max(4).min(0.5);
  }
  
  train() {
    if (this._trained) return false;
    if (!this.supplied) return false;

    this._trained = true;
    
    this.order = null;
    this.addAverageExperience(0.1);
    
    return true;
  }

  // ============== actions ===============
  recruit(num) {
    if (this._recruited) return false;
    if (!this.supplied) return false;

    this._recruited = true;

    num = num.min(0).max(this.recruits).max(this.soldiers).floor();
    this.recruits -= num;

    let newExperience = 1 - Math.random() / 2;
    let newStrength = 1 + Math.random();

    if (this.soldiers > 0) {
      this.averageExperience = (this.averageExperience * this.soldiers + newExperience * num) / (this.soldiers + num);
      this.averageStrength = (this.averageStrength * this.soldiers + newStrength * num) / (this.soldiers + num);
    } else {
      this.averageExperience = newExperience;
      this.averageStrength = newStrength;
    }

    this.soldiers += num;
  }
}
