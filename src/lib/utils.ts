import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPhoneForTel(phone: string): string {
  return phone.replace(/\s/g, "");
}
