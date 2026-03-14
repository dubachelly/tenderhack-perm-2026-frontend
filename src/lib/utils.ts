import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCharacteristics(raw: string | null | undefined): { key: string; value: string }[] {
  if (!raw) return [];
  return raw.split(";").filter(Boolean).map(pair => {
    const [key, ...rest] = pair.split(":");
    return { key: key.trim(), value: rest.join(":").trim() };
  });
}
