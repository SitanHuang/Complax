Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];

Math.oldRound = Math.round;

Math.round = (number, places) => {
  places = places ? Math.max(places, 0) : 0;
  return Math.oldRound(number * Math.pow(10, places)) / Math.pow(10, places);
}

// inclusive
function inclusiveRange(min, inclusiveMax) {
  return () => ((Math.random() * (inclusiveMax - min)).round() + min);
}
// exclusive
function exclusiveRange(min, exclusiveMax) {
  return () => ((Math.random() * (exclusiveMax - min)).floor() + min);
}

Math.toDeg = function (rad) {
  return rad * (180/Math.PI);
}

function angle(dx, dy) {
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

Number.prototype.round = function (places) {
  return Math.round(this, places)
}

Number.prototype.min = function (min) {
  return Math.max(this, min);
}

Number.prototype.max = function (min) {
  return Math.min(this, min);
}

Number.prototype.floor = function () {
  return Math.floor(this);
};

String.prototype.deepClone = function () {
  return (' ' + this).slice(1)
}

Array.prototype.uniq = function () {
  return [...new Set(this)];
}
Array.prototype.sample = function () {
  return this[(Math.random() * this.length).floor()];
}

Array.prototype.last = function () {
  return this[this.length - 1];
}

function ordinal_suffix_of(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
