import { useAtom } from "jotai";
import { useEffect, useState } from "react";
function useAtomLocalStorage(key, atom) {
  const [keyTemp, setKeyTemp] = useState("");
  const [storedValue, setStoredValue] = useAtom(atom);
  useEffect(() => {
    setKeyTemp(key);
    const item = window.localStorage.getItem(key);
    if (!item) return;
    const value = parseJSON(item);
    if (value) setStoredValue(value);
  }, [key, setStoredValue]);
  useEffect(() => {
    if (keyTemp !== key) return;
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, keyTemp, storedValue]);
  return [storedValue, setStoredValue];
}
function parseJSON(value) {
  return value === "undefined" ? void 0 : JSON.parse(value);
}
export {
  useAtomLocalStorage
};
