export interface ILlmApiKeyCipher {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}
