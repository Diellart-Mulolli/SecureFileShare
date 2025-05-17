import { currentUser } from './auth.js';

export async function generateAesKey() {
    return await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptText(text, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
    return { iv: Array.from(iv), encryptedData: new Uint8Array(encrypted) };
}

export async function encryptFile(file, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileData = await readFileAsArrayBuffer(file);
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, fileData);
    return { iv: Array.from(iv), encryptedData: new Uint8Array(encrypted) };
}

export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
