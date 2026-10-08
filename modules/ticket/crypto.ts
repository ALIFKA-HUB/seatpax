import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export type TicketKeys=Record<string,Buffer>;
export type EncryptedToken={token:string;tokenHash:string;ciphertext:string;nonce:string;authTag:string;keyVersion:string};
export function encryptToken(token:string,keyVersion:string,keys:TicketKeys):EncryptedToken{
 const key=keys[keyVersion];if(!key||key.length!==32)throw new Error('Ticket encryption key unavailable.');
 const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce),ciphertext=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return {token,tokenHash:createHash('sha256').update(token).digest('hex'),ciphertext:ciphertext.toString('base64'),nonce:nonce.toString('base64'),authTag:cipher.getAuthTag().toString('base64'),keyVersion};
}
export function decryptToken(record:Omit<EncryptedToken,'token'|'tokenHash'> & {tokenHash?:string},keys:TicketKeys):string{
 const key=keys[record.keyVersion];if(!key||key.length!==32)throw new Error('Ticket encryption key unavailable.');
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(record.nonce,'base64'));decipher.setAuthTag(Buffer.from(record.authTag,'base64'));
 const token=Buffer.concat([decipher.update(Buffer.from(record.ciphertext,'base64')),decipher.final()]).toString('utf8');
 if(Buffer.from(token,'base64url').length!==32||! /^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('Ticket token is invalid.');
 if(record.tokenHash&&createHash('sha256').update(token).digest('hex')!==record.tokenHash)throw new Error('Ticket token integrity check failed.');return token;
}
export function createTicketToken(){return randomBytes(32).toString('base64url');}
