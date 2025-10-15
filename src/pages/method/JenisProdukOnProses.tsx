import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@mui/material';
import TableExportToolbar from '../../components/TableExportToolbar';

type Row = { idSpk:string; namaDesain:string; jenisProduk:string; quantity:number; deadline:string };

export default function JenisProdukOnProses(){
  const tableRef = useRef<HTMLTableElement|null>(null);
  const [rows,setRows]=useState<Row[]>([]);
  const [search,setSearch]=useState('');

  useEffect(()=>{
    const load=()=>{
      try {
        const raw = localStorage.getItem('spk_pipeline');
        const list = raw? JSON.parse(raw):[];
        // sumber tambahan
        let designQueue: any[] = []; // berisi entri desain yang punya jenisProduk
        let spkDesignSnap: Record<string, any> = {}; // snapshot input desain per idSpk
        let spkOrders: Record<string, any> = {}; // map idSpk -> order snapshot (spk_orders)
        let antrianInput: any[] = []; // antrian_input_desain (tiap item mungkin punya tanggalInput, deadline, items)
        let keranjang: any[] = []; // keranjang (checkout) berpotensi simpan deadline
        let plottingQueue: any[] = []; // plotting_rekap_bordir_queue berpotensi simpan deadline
        try { designQueue = JSON.parse(localStorage.getItem('design_queue')||'[]'); } catch {}
        try { spkDesignSnap = JSON.parse(localStorage.getItem('spk_design')||'{}')||{}; } catch {}
        try { spkOrders = JSON.parse(localStorage.getItem('spk_orders')||'{}')||{}; } catch {}
        try { antrianInput = JSON.parse(localStorage.getItem('antrian_input_desain')||'[]')||[]; } catch {}
        try { keranjang = JSON.parse(localStorage.getItem('keranjang')||'[]')||[]; } catch {}
        try { plottingQueue = JSON.parse(localStorage.getItem('plotting_rekap_bordir_queue')||'[]')||[]; } catch {}
        // build map idSpk -> jenisProduk
        const jenisMap = new Map<string,string>();
        // dari design_queue (tiap item di sana mungkin ada idSpk & jenisProduk / product)
        designQueue.forEach(it=>{
          const idSpk = it?.idSpk || it?.id_spk; if(!idSpk) return;
          const jp = it.jenisProduk || it.product || it.jenis_produk;
          if(jp && !jenisMap.has(idSpk)) jenisMap.set(idSpk, jp);
        });
        // dari snapshot spk_design (tiap key idSpk -> object yang mungkin punya product / jenisProduk)
        Object.entries(spkDesignSnap).forEach(([idSpk,val]:any)=>{
          if(!idSpk||jenisMap.has(idSpk)) return;
          const jp = val?.jenisProduk || val?.product || val?.spesifikasi?.jenisProduk;
          if(jp) jenisMap.set(idSpk, jp);
        });
        // helper tanggal fleksibel
        const parseDateFlexible = (input:any):Date|null=>{
          if(!input) return null;
            try {
              if (input instanceof Date) return isNaN(+input)?null:input;
              const s = String(input).trim();
              const iso = new Date(s);
              if(!isNaN(+iso)) return iso;
              const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
              if(m){
                const a = parseInt(m[1],10); const b = parseInt(m[2],10); const y = parseInt(m[3].length===2?('20'+m[3]):m[3],10);
                const isDMY = a>12; const day = isDMY? a : b; const month = (isDMY? b:a)-1;
                const d = new Date(y,month,day); return isNaN(+d)?null:d;
              }
              return null;
            } catch { return null; }
        };
        const formatDate = (d:any)=>{
          if(!d) return '-';
          try { const dt = new Date(d); if(isNaN(+dt)) return String(d); return dt.toLocaleDateString('id-ID'); } catch { return String(d); }
        };
        const out:Row[] = [];
        (list||[]).forEach((it:any)=>{
          // dianggap masih on proses jika belum selesaiPengiriman
            const selesai = it.selesaiPengiriman || it.selesaiPengirimanAt;
            if(selesai) return; // sudah selesai semua
            // fallback chain untuk jenis produk
            const idSpk = it.idSpk;
            const jenisProduk = it.jenisProduk || jenisMap.get(idSpk) || '-';
            // quantity fallback: pipeline kuantity -> designQueue matching -> snapshot items length
            let quantity = Number(it.kuantity||it.quantity||0)||0;
            if(!quantity){
              const dq = designQueue.find(d=> (d.idSpk||d.id_spk) === idSpk);
              if(dq){
                quantity = Number(dq.kuantity||dq.quantity||0)||0;
                if(!quantity && Array.isArray(dq.items)) quantity = dq.items.length;
              }
            }
            // sumber-sumber untuk deadline
            const design = designQueue.find(d=> (d.idSpk||d.id_spk)===idSpk);
            const designSnap = spkDesignSnap[idSpk];
            const orderSnap = spkOrders[idSpk];
            const antrian = antrianInput.find(a=> (a.idSpk||a.id_spk)===idSpk);
            const cart = keranjang.find(k=> (k.idSpk||k.id_spk)===idSpk);
            const plotting = plottingQueue.find(p=> (p.idSpk||p.id_spk)===idSpk);
            // chain explicit fields
            let deadlineRaw = it.deadlineKonsumen || it.deadline || design?.deadline || designSnap?.deadline || orderSnap?.deadline || antrian?.deadline || cart?.deadline || plotting?.deadline;
            if(!deadlineRaw){
              // fallback hitung 30 hari setelah tanggalOrder / tanggalInput
              const baseDate = parseDateFlexible(it.tanggalOrder || antrian?.tanggalInput || orderSnap?.tanggalOrder || design?.tanggalOrder || cart?.tanggalOrder);
              if(baseDate){
                const d = new Date(baseDate.getTime());
                d.setDate(d.getDate()+30);
                deadlineRaw = d.toISOString();
              }
            }
            const deadline = deadlineRaw? formatDate(deadlineRaw):'-';
            out.push({
              idSpk,
              namaDesain: it.namaDesain || '-',
              jenisProduk,
              quantity,
              deadline,
            });
        });
        setRows(out);
      } catch { setRows([]); }
    };
    load();
    const h=(e:StorageEvent)=>{ if(['spk_pipeline','design_queue','spk_design','spk_orders','antrian_input_desain','keranjang','plotting_rekap_bordir_queue'].includes(e.key||'')) load(); };
    window.addEventListener('storage',h); const t=setInterval(load,2000);
    return()=>{window.removeEventListener('storage',h);clearInterval(t)};
  },[]);

  const filtered = rows.filter(r=>{
    return !search ? true : [r.idSpk,r.namaDesain,r.jenisProduk].some(v=>v.toLowerCase().includes(search.toLowerCase()));
  });

  const summary = useMemo(()=>{
    const map = new Map<string, number>();
    filtered.forEach(r=> map.set(r.jenisProduk, (map.get(r.jenisProduk)||0)+r.quantity));
    return Array.from(map.entries()).map(([jenisProduk, qty])=>({jenisProduk, qty}));
  },[filtered]);

  return (
    <Box sx={{display:'flex',flexDirection:'column',p:3, width:'100%', maxHeight:'calc(100vh - 64px)', overflowY:'auto'}}>
      <Typography variant='h6' sx={{fontWeight:'bold', mb:2, textAlign:'center'}}>Jenis Produk On Proses</Typography>
      <Box sx={{display:'flex', gap:2, mb:2, flexWrap:'wrap'}}>
        <TextField label='Search' size='small' value={search} onChange={e=>setSearch(e.target.value)} />
      </Box>
      <Paper sx={{p:2, mb:3}}>
        <TableExportToolbar title='Jenis Produk On Proses' tableRef={tableRef} fileBaseName='jenis-produk-on-proses' />
        <TableContainer sx={{maxHeight:400}}>
          <Table stickyHeader size='small' ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID SPK</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Deadline</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r,i)=>(
                <TableRow key={r.idSpk}>
                  <TableCell>{i+1}</TableCell>
                  <TableCell>{r.idSpk}</TableCell>
                  <TableCell>{r.namaDesain}</TableCell>
                  <TableCell>{r.jenisProduk}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{r.deadline}</TableCell>
                </TableRow>
              ))}
              {filtered.length===0 && (
                <TableRow><TableCell colSpan={6} align='center'>Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Paper sx={{p:2}}>
        <Typography variant='subtitle1' sx={{fontWeight:'bold', mb:1}}>Summary Quantity per Jenis Produk</Typography>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Jenis Produk</TableCell>
              <TableCell>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.map(s=>(
              <TableRow key={s.jenisProduk}>
                <TableCell>{s.jenisProduk}</TableCell>
                <TableCell>{s.qty}</TableCell>
              </TableRow>
            ))}
            {summary.length===0 && (
              <TableRow><TableCell colSpan={2} align='center'>Tidak ada data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
