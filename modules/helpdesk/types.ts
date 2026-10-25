export type ComplaintStatus='MENUNGGU'|'DIPROSES'|'PERLU_DILENGKAPI'|'SELESAI';
export type Priority='LOW'|'MEDIUM'|'HIGH';
export type Category='PAYMENT'|'JOURNEY'|'BUG'|'OTHER';
export type HelpdeskContext={actorId:string;companyId:string};
export type PublicCase={code:string;title:string;category:Category;status:ComplaintStatus;priority:Priority|null;createdAt:string;updatedAt:string;publicRequest:string|null;publicOutcome:string|null};
export const statusLabels:Record<ComplaintStatus,string>={MENUNGGU:'Menunggu pemeriksaan',DIPROSES:'Sedang diproses',PERLU_DILENGKAPI:'Perlu dilengkapi',SELESAI:'Selesai'};
export const priorityLabels:Record<Priority,string>={LOW:'Rendah',MEDIUM:'Sedang',HIGH:'Tinggi'};
export const categoryLabels:Record<Category,string>={PAYMENT:'Pembayaran',JOURNEY:'Pelayanan perjalanan',BUG:'Bug aplikasi',OTHER:'Lainnya'};
