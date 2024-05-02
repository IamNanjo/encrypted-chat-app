export default async function importKey(key: JsonWebKey, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSA-OAEP", hash: "SHA-512" },
    true,
    [usage]
  );
}
