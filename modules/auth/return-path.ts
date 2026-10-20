export function validatedReturnPath(raw:unknown):string|null{
 if(typeof raw!=='string'||!/^\/(trips|holds)(\/|\?|$)/.test(raw)||/[\\\r\n]/.test(raw))return null;
 try{
  const url=new URL(raw,'http://localhost');
  if(url.origin!=='http://localhost'||!/^\/(trips|holds)(\/|$)/.test(url.pathname))return null;
  return url.pathname+url.search;
 }catch{return null;}
}
export function safeReturnPath(raw:unknown):string{return validatedReturnPath(raw)??'/account';}
