/**
 * Format a item and total into the string item/total, where the item is padded
 * to the length of the total with zeros.
 */
export function formatTrackNumbers(item, total) {
  return `${String(item).padStart(String(total).length, '0')}/${total}`;
}
