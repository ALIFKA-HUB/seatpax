// Date.parse retains milliseconds; PostgreSQL timestamptz also retains microseconds.
function micros(value:string){const remainder=(value.match(/\.(\d+)/)?.[1]??'').padEnd(6,'0').slice(3,6);return BigInt(Date.parse(value))*BigInt(1000)+BigInt(remainder||'0');}
export function deadlineReached(now:string,deadline:string){return micros(now)>=micros(deadline);}
