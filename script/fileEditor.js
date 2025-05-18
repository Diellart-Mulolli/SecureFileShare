import { currentUser } from './script/auth.js';

export async function decryptFileData(fileRecord, encryptedKey, tempDB) {
    const privateKey = await window.crypto.subtle.importKey("jwk", currentUser.privateKey, {
        name: "RSA-OAEP", hash: "SHA-256"
    }, true, ["decrypt"]);
    const decryptedAesKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        new Uint8Array(encryptedKey)
    );
    return await window.crypto.subtle.importKey("raw", decryptedAesKey, {
        name: "AES-GCM", length: 256
    }, true, ["decrypt"]);
}