export const SUBJECTS = ["Mathematics", "Science", "English", "Computer Science"];

export const EXAMS = ["Unit Test 1", "Mid 1", "Mid 2", "Final"];

// thresholds for status
export const STATUS_RULES = {
  top: 80, // >= 80
  atRisk: 50, // < 50
};

export function getStatusFromPercent(percent) {
  if (percent == null || Number.isNaN(percent)) return "Not evaluated";
  if (percent >= STATUS_RULES.top) return "Top Performer";
  if (percent < STATUS_RULES.atRisk) return "At Risk";
  return "Average";
}
