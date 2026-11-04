export function movingAverages(values: number[], window: number, chop = Math.ceil(window / 20)): number[] {
  if (chop < 0 || chop * 2 >= window) throw new Error('Bad chop');
  if (values.length < window) return [];
  const sorted = values.slice(0, window).sort((a, b) => a - b), result: number[] = [];
  let sum = 0, dnfs = 0;
  const adjust = (value: number, direction: number) => {
    if (value === Infinity) dnfs += direction;
    else sum += direction * value;
  };
  const position = (value: number) => {
    let low = 0, high = sorted.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (sorted[mid] < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  sorted.slice(chop, window - chop).forEach(value => adjust(value, 1));
  const average = () => dnfs ? Infinity : sum / (window - chop * 2);
  result.push(average());
  for (let i = window; i < values.length; i++) {
    // Account for values crossing the chopped boundaries without summing DNFs.
    const outgoing = position(values[i - window]);
    adjust(sorted[outgoing < chop ? chop : outgoing >= window - chop ? window - chop - 1 : outgoing], -1);
    sorted.splice(outgoing, 1);
    const incoming = position(values[i]);
    adjust(incoming < chop ? sorted[chop - 1] : incoming >= window - chop ? sorted[window - chop - 1] : values[i], 1);
    sorted.splice(incoming, 0, values[i]);
    result.push(average());
  }
  return result;
}
