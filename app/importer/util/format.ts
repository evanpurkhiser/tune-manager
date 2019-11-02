type Num = string | number;

/**
 * Format a number and total into the string number/total, where the number is
 * padded to the length of the total with zeros.
 */
export function formatTrackNumbers(number: Num, total: Num) {
  const num = String(number).padStart(String(total).length, '0');
  return `${num}/${total}`;
}
