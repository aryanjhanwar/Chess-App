import { useEffect, useState } from "react";
function useDebounce(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    if (value === debouncedValue) return;
    if (!debouncedValue) {
      setDebouncedValue(value);
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs, debouncedValue]);
  return debouncedValue;
}
export {
  useDebounce
};
