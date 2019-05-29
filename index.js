var turnNumber = 0;

// calculates both players' moves
function nextTurn(init) {
  let start = new Date().getTime();
  turnNumber++;

  PLAYERS.forEach(x => {
    x.totalRecruits = 0;
    x.totalSoldiers = 0;
    x.totalUnits = 0;
    x.recruitsStat = x.recruitsStat || [];
    x.soldiersStat = x.soldiersStat || [];
    x.unitsStat = x.unitsStat || [];
  });

  // update prov diff at the end
  if (init) map.forEach((rowData, row) => {
    rowData.forEach((p, col) => {
      p.calcAdjacentDiff();
    });
  });

  map.forEach((rowData, row) => {
    rowData.forEach((p, col) => {
      if (init) p.calcPostAdjacentDiff();
      p.units.forEach(x => {
        let u = Unit.fetch(x);
        u.calcTotalAttack();

        // ======= unit logics =======
        u.processMove();
        // ===========================

        PLAYERS[u.owner].totalRecruits += u.recruits;
        PLAYERS[u.owner].totalSoldiers += u.soldiers;
        PLAYERS[u.owner].totalUnits++;
        // u._childrenRequestRecruits = 0;
        delete u._recruited;
        delete u._expanded;
      });
    });
  });

  PLAYERS.forEach(x => {
    x.recruitsStat.push(x.totalRecruits);
    x.soldiersStat.push(x.totalSoldiers);
    x.unitsStat.push(x.totalUnits);
  });

  map.forEach((rowData, row) => {
    rowData.forEach((p, col) => {
      p.calcAdjacentDiff();
      PLAYERS[p.owner].production = 0;
    });
  });
  map.forEach((rowData, row) => {
    rowData.forEach((p, col) => {
      p.calcPostAdjacentDiff();
      PLAYERS[p.owner].production += p.city;
    });
  });

  currentUnit = 0;
  console.log(`nextTurn() done in ${(new Date().getTime() - start)}ms`);
}

function nextUnit() {
  if (++currentUnit >= UNITS.length) {
    currentUnit = 0;
    nextTurn();
    repaintCanvas();
  }

  let unit = Unit.fetch(currentUnit);

  if (!unit) {
    nextUnit();
    return;
  }

  currentPlayer = unit.owner;

  if (unit.rank == RANK_HIGHEST) {
    unit.recruits += PLAYERS[currentPlayer].production;
  }

  unit.requestRecruits = unit.requestRecruits.max(calcRequestRecruitsMaxIncludeChild(unit));
  unit.entrench += 0.1;
  unit.planning += 0.1;

  if (unit.ai) {
    think(unit);
    updateMenuDialog();
    setTimeout(nextUnit, 0)
  } else {
    DIALOGS_DELETE_LIST.forEach((x) => {
      x.remove();
    });
    DIALOGS_DELETE_LIST = [];

    repaintCanvas();
    highlightProvince(unit.loc);

    setTimeout(() => {
      selectProvince(unit.loc, unit.id);
    }, 1);
  }

  // for ai only
  DIALOGS_REFRESH_LIST.forEach(x => {
    window[x]();
  });
}

var skipEscapeListener = false;

$(function () {
  generateWorld();

  nextTurn(true);
  nextUnit();

  reinitCanvas();
  initControls();

  repaintCanvas();

  $(document).keydown(e => {
    if (skipEscapeListener) return;
    if (e.key == 'Escape') {
      // sometimes doesn't close
      let d;
      while (DIALOGS_DELETE_LIST.length && (d = DIALOGS_DELETE_LIST.pop())) {
        if (d.hasClass('ui-dialog-content')) {
          if (!d.dialog('isOpen')) {
            d.dialog('destroy').remove();
            continue;
          }
          d.dialog('close').dialog('destroy').remove();
          break;
        }
      }
      if (!DIALOGS_DELETE_LIST.length)
        removeAllHighlight();
    }
  });
});
