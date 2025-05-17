export let currentUser = null;

export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
    return {
        publicKey: await window.crypto.subtle.exportKey("jwk", keyPair.publicKey),
        privateKey: await window.crypto.subtle.exportKey("jwk", keyPair.privateKey)
    };
}
