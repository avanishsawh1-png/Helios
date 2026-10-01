export async function rpcCallPooled(endpoints, method, params = []) {
  const errors = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(8000),
      });
      const json = await res.json();
      if (res.status === 429 || json?.error?.code === 429) {
        errors.push(`${url}:429`);
        continue;
      }
      if (!res.ok || json.error) {
        errors.push(`${url}:${json.error?.message ?? res.status}`);
        continue;
      }
      return { availability: "OK", value: json.result, endpoint: url };
    } catch (e) {
      errors.push(`${url}:${e}`);
    }
  }
  return { availability: "UNAVAILABLE", value: null, errors };
}
