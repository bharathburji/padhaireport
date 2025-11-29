export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading localStorage", err);
    return defaultValue;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Error writing localStorage", err);
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Error removing localStorage item", err);
  }
}
