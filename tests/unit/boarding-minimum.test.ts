import {it,expect} from 'vitest';
import {manifestPassengers} from '@/modules/boarding/ui-state';
it('limits manifest rows to operational list fields',()=>{const row={ticketId:'t',name:'N',seatCode:'01',fromName:'A',toName:'B',boarding:null,tripName:'private profile detail',vehicleName:'V',plateNumber:'P',departureAt:'date',fromStopId:'id',fromSequence:0};expect(manifestPassengers([row])).toEqual([{ticketId:'t',name:'N',seatCode:'01',fromName:'A',toName:'B',boarding:null}]);});
