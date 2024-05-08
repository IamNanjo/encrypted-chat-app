export function getKeyPair(userId: number) {
  if (window.indexedDB) getKeyPairFromIDB(userId);
  else getKeyPairFromLocalStorage(userId);
}

function generateKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-512",
    } as RsaHashedKeyGenParams,
    true,
    ["encrypt", "decrypt"]
  ) as Promise<CryptoKeyPair>;
}

function getKeyPairFromLocalStorage(userId: number) {
  const keyPair = useKeyPair();

  let storedKeyPair = localStorage.getItem(userId.toString());

  if (!storedKeyPair) {
    const newKeys = generateKeyPair();

    newKeys.then(({ privateKey, publicKey }) => {
      Promise.all([exportKey(privateKey), exportKey(publicKey)]).then(
        ([exportedPrivateKey, exportedPublicKey]) => {
          localStorage.setItem(
            userId.toString(),
            JSON.stringify({
              privateKey: exportedPrivateKey,
              publicKey: exportedPublicKey,
            })
          );

          keyPair.value = {
            privateKey,
            publicKey,
          };
        }
      );
    });
  } else {
    const keys: { privateKey: JsonWebKey; publicKey: JsonWebKey } =
      JSON.parse(storedKeyPair);

    // Import private and public key concurrently
    Promise.all([
      importKey(keys.privateKey, "decrypt"),
      importKey(keys.publicKey, "encrypt"),
    ]).then(([privateKey, publicKey]) => {
      keyPair.value = { privateKey, publicKey };
    });
  }
}

function getKeyPairFromIDB(userId: number) {
  const keyPair = useKeyPair();

  const dbPromise = window.indexedDB.open("chatAppDB", 1);

  dbPromise.onupgradeneeded = (e) => {
    const db: IDBDatabase = (e.target as any).result;

    const objectStore = db.createObjectStore("keyPairs", {
      keyPath: "id",
      autoIncrement: true,
    });

    objectStore.createIndex("userId", "userId", { unique: true });
  };

  dbPromise.onsuccess = (e) => {
    const db: IDBDatabase = (e.target as any).result;
    const transaction = db.transaction(["keyPairs"], "readonly");
    const objectStore = transaction.objectStore("keyPairs");

    const getRequest = objectStore
      .index("userId")
      .get(IDBKeyRange.only(userId));

    getRequest.onsuccess = () => {
      if (getRequest.result === undefined) {
        generateKeyPair().then((generatedKeyPair) => {
          const transaction = db.transaction(["keyPairs"], "readwrite");
          const objectStore = transaction.objectStore("keyPairs");
          const addRequest = objectStore.add({
            userId: Number(userId),
            keyPair: generatedKeyPair,
          });

          keyPair.value = generatedKeyPair;

          addRequest.onsuccess = () => db.close();
          addRequest.onerror = () => db.close();
        });
      } else if (getRequest.result.keyPair) {
        keyPair.value = getRequest.result.keyPair;
      }
    };
  };

  dbPromise.onerror = (e) => {
    getKeyPairFromLocalStorage(auth);
  };
}
