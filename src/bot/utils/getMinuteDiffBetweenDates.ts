export function getMinuteDiffBetweenDates(startDate: Date, endDate: Date) {
  const diff = endDate.getTime() - startDate.getTime();

  return Math.abs(diff / 60000);
}
