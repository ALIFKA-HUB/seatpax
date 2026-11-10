export type StaffRole='ADMIN_PO'|'HELPDESK'|'CREW';
export type StaffStatus='ACTIVE'|'DISABLED';
export type StaffDirectoryQuery={q:string;status:'all'|'active'|'disabled';page:number};
export type StaffDirectoryRow={id:string;name:string;email:string|null;status:StaffStatus;roles:{role:StaffRole;status:StaffStatus}[]};
export type StaffDirectorySnapshot={
 company:{id:string;name:string;status:'ACTIVE'|'SUSPENDED'};
 counts:{total:number;active:number;disabled:number};
 query:StaffDirectoryQuery;page:number;pageSize:25;totalPages:number;filteredTotal:number;rows:StaffDirectoryRow[];
};
export type CreateStaffInput={name:string;email:string;role:StaffRole};
export type UpdateStaffInput={userId:string;role:StaffRole;status:StaffStatus};
