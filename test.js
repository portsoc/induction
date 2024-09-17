function fixEndTime(start, duration) {
  if (!Number.isInteger(duration)) {
    const frac = duration - Number.parseInt(duration);
    const mins = Math.round(60 * frac);
    return (`${Number.parseInt(start) + Number.parseInt(duration)}:${mins}`);
  } else {
    return (`${Number.parseInt(start) + duration}:00`);
  }
}

console.log(fixEndTime(13, 1.25));
console.log(fixEndTime(13, 1));
