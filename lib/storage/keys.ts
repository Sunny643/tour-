import { nanoid } from "nanoid";

export function photoStorageKey(projectId: string, ext: string): string {
  return `projects/${projectId}/photos/${nanoid()}.${ext.replace(/^\./, "")}`;
}

export function brandLogoStorageKey(userId: string, ext: string): string {
  return `users/${userId}/brand-logo.${ext.replace(/^\./, "")}`;
}
