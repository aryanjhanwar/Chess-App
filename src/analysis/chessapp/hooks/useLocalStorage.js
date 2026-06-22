import { useEffect, useState } from "react";
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(null);
  useEffect(() => {
    const item = window.localStorage.getItem(key);
    if (item) {
      const value = parseJSON(item);
      if (value) {
        setStoredValue(value);
        return;
      }
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);
  const setValue = (value) => {
    if (storedValue === null)
      throw new Error("setLocalStorage value isn't ready yet");
    const newValue = value instanceof Function ? value(storedValue) : value;
    window.localStorage.setItem(key, JSON.stringify(newValue));
    setStoredValue(newValue);
  };
  return [storedValue, setValue];
}
function parseJSON(value) {
  return value === "undefined" ? void 0 : JSON.parse(value);
}
export {
  useLocalStorage
};
