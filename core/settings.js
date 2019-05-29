// =================== core ======================
// map generation
MAP_HEIGHT = 15;
MAP_WIDTH = 30;
MAP_CHILDREN_PER_RANK = inclusiveRange(2, 4);
MAP_SOLDIER_PER_SQUAD = inclusiveRange(20, 30);
MAP_SOLDIER_PER_RANK = inclusiveRange(2, 10);
// ranks (also in unit.js)
RANK_ARMY = 1;
RANK_DIVISION = 2;
RANK_REGIMENT = 3;
RANK_COMPANY = 4;
RANK_SQUAD = 10;

RANK_HIGHEST = RANK_ARMY;
// expandCost
IMPOSSIBLE_EXPAND_COST = Infinity;
EXPAND_MIN_SOLDIERS = 1; // also used as the minimum soldiers to keep unit
// order
ORDER_MAX = 'Immediate';
ORDER_MED = 'Normal';
ORDER_MIN = 'Reserve';
// battle
MAX_MORALE_DAMAGE = 0.9;


// ==================== gui ======================
// assets
PRODUCTION_ICON = 'gui/images/production.png';
// map
SHOW_COORDINATE_INTERVAL = 5;
PROVINCE_WIDTH = 100;
// unit intelligence
RADAR_COVERAGE = 0.3;
BORDER_COVERAGE = 0.5;
// unit stack appearance
UNIT_STACK_OFFSET = 2;
UNIT_STACK_SIZE = 50; // see style.css, must be even
UNIT_STACK_1_SIZE = (60 / 50);
UNIT_STACK_2_SIZE = (55 / 50);
UNIT_STACK_3_SIZE = (40 / 50);
UNIT_STACK_4_SIZE = (35 / 50);
UNIT_STACK_10_SIZE = (30 / 50);
