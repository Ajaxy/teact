/** The median of the samples, sorted as numbers (the middle one, or the mean of the two middle ones) */
export function median(samples: readonly number[]) {
  if (!samples.length) {
    throw new Error('No samples');
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
