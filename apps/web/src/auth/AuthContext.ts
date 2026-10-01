import { createApiClient, createUnavailableClient, type HeliosApiClient } from "../api/client.js";

export function useAuth(): { client: HeliosApiClient } {
  const base = (globalThis as { HELIOS_API_BASE?: string }).HELIOS_API_BASE;
  return { client: base ? createApiClient() : createUnavailableClient() };
}
