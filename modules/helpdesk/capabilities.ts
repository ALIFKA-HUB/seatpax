import {randomBytes,createHmac,createHash,timingSafeEqual} from 'node:crypto';
export function newCode(){return 'SPX-ADU-'+randomBytes(16).toString('hex').toUpperCase();}
export function grantToken(id:string,caseId:string,secret:string){return id+'.'+createHmac('sha256',secret).update('helpdesk:'+id+':'+caseId).digest('base64url');}
export function digest(value:string){return createHash('sha256').update(value).digest('hex');}
export function verifyGrant(token:string,id:string,caseId:string,secret:string){const a=Buffer.from(digest(token));const b=Buffer.from(digest(grantToken(id,caseId,secret)));return timingSafeEqual(a,b);}
