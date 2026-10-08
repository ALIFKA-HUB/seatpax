import {createServer} from 'node:http';
// Expose only the payment notification endpoint through the development tunnel.
const server=createServer(async(req,res)=>{
 if(req.method!=='POST'||req.url!=='/api/payments/midtrans'){res.writeHead(404);res.end();return;}
 let size=0;const chunks:Buffer[]=[];
 try{
  for await(const chunk of req){size+=chunk.length;if(size>65536){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const response=await fetch('http://127.0.0.1:3001/api/payments/midtrans',{method:'POST',headers:{'Content-Type':'application/json'},body:Buffer.concat(chunks),signal:AbortSignal.timeout(25000),redirect:'error'});
  res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());
 }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"temporarily_unavailable"}');}
});
server.listen(3002,'127.0.0.1',()=>console.log('Payment webhook proxy listening on localhost:3002.'));
