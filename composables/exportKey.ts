export default async (key: CryptoKey) => crypto.subtle.exportKey("jwk", key);
