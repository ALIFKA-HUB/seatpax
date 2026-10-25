import {it,expect} from 'vitest';
import {validateAttachmentBytes} from '@/modules/helpdesk/attachments';
it('rejects disguised active files, oversized and unsupported files',()=>{expect(()=>validateAttachmentBytes(Buffer.from('<svg>'),'image/png','x.png')).toThrow();expect(()=>validateAttachmentBytes(Buffer.alloc(5242881),'application/pdf','x.pdf')).toThrow();expect(validateAttachmentBytes(Buffer.from('%PDF-1.7 test'),'application/pdf','../test.pdf').name).toBe('test.pdf')});
