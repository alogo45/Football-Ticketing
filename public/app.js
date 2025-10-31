async function api(path, opts={}){
  const res = await fetch(path, opts);
  const c = res.headers.get('content-type')||'';
  if(c.includes('application/json')){
    const j = await res.json();
    if(!res.ok) throw { status: res.status, body: j };
    return j;
  }
  if(!res.ok) throw { status: res.status, body:null };
  return null;
}

function $id(id){return document.getElementById(id)}

async function loadInitial(){
  try{
    const [eventsRes, usersRes] = await Promise.all([
      api('/orders/events').catch(()=>api('/events')),
      api('/orders/users').catch(()=>api('/users'))
    ]);
    const events = eventsRes.events || eventsRes;
    const users = usersRes.users || usersRes;
    const selEv = $id('event');
    events.forEach(e=>{
      const o = document.createElement('option'); o.value=e.id; o.textContent=`${e.name} (${new Date(e.starts_at).toLocaleString()})`; selEv.appendChild(o);
    });

    const selUser = $id('userSelect');
    users.forEach(u=>{
      const o = document.createElement('option'); o.value=u.id; o.textContent = u.name; selUser.appendChild(o);
    });

    if(events.length) {
      loadSeats(events[0].id);
      $id('event').value = events[0].id;
    }
    // restore selected user
    const saved = localStorage.getItem('selectedUser');
    if (saved) $id('userSelect').value = saved;
  }catch(e){console.error(e);}
}

async function loadSeats(eventId){
  const sel = $id('seat'); sel.innerHTML='';
  const res = await api(`/orders/seats?event_id=${eventId}`).catch(()=>api(`/seats?event_id=${eventId}`));
  const seats = res.seats || res;
  seats.forEach(s=>{
    const opt = document.createElement('option'); opt.value=s.id; opt.textContent = `${s.label} — ${s.status}`; sel.appendChild(opt);
  });
}

async function loadOrders(){
  const res = await api('/orders').catch(()=>({orders:[]}));
  const list = $id('ordersList'); list.innerHTML='';
  (res.orders||[]).forEach(o=>{
    const div = document.createElement('div'); div.className='order-item';
    div.innerHTML = `<div><strong>${o.id}</strong></div><div class='small'>user: ${o.user_id} • seat: ${o.seat_id} • ${o.status} • ${new Date(o.created_at).toLocaleString()}</div>`;
    list.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadInitial(); loadOrders(); setInterval(loadOrders,5000);
  $id('event').addEventListener('change', e=> loadSeats(e.target.value));
  $id('createUserForm').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const name = $id('newUserName').value.trim();
    if(!name) return alert('name required');
    try{
      const r = await api('/orders/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
      // append to users
      const sel = $id('userSelect'); const o = document.createElement('option'); o.value = r.user.id; o.textContent = r.user.name; sel.appendChild(o); sel.value = r.user.id;
      $id('newUserName').value='';
      localStorage.setItem('selectedUser', r.user.id);
    }catch(err){console.error(err); alert('failed to create user');}
  });

    $id('purchaseForm').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const userId = $id('userSelect').value; const seatId = $id('seat').value; let idem = $id('idem').value.trim();
    if(!userId) return alert('select user'); if(!seatId) return alert('select seat'); if(!idem) idem = 'idem-'+Date.now();
    $id('purchaseBtn').disabled=true; $id('purchaseResult').textContent='Processing...';
    try{
      const res = await api('/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':idem},body:JSON.stringify({user_id:userId,seat_id:seatId})});
      $id('purchaseResult').textContent = 'Success: '+JSON.stringify(res.order);
      loadOrders();
        localStorage.setItem('selectedUser', userId);
    }catch(err){
      console.error(err); $id('purchaseResult').textContent = 'Error: '+(err.body?JSON.stringify(err.body):err.status);
    }finally{ $id('purchaseBtn').disabled=false }
  });
});
