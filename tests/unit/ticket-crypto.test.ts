import {it,expect} from 'vitest';
import {decryptToken,encryptToken} from '@/modules/ticket/crypto';
it('reopens a stable opaque token and rejects tampering or a wrong key version',()=>{
 const keys={v1:Buffer.alloc(32,7),v2:Buffer.alloc(32,8)},record=encryptToken('a'.repeat(43),'v1',keys);
 expect(record.token).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(Buffer.from(record.token,'base64url')).toHaveLength(32);
 expect(decryptToken(record,keys)).toBe(record.token);expect(()=>decryptToken({...record,authTag:'0'.repeat(32)},keys)).toThrow();expect(()=>decryptToken(record,{v2:keys.v2})).toThrow();
});
