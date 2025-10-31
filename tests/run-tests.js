(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const out = (m)=>console.log('[TEST]',m);
  try{
    out('health...');
    let r = await fetch(base+'/health');
    if(!r.ok) throw new Error('health failed');
    out('ok');

    out('list events...');
    r = await fetch(base+'/orders/events');
    if(!r.ok) throw new Error('events failed');
    const ev = await r.json();
    out('events: '+(ev.events?ev.events.length:0));

    out('create user...');
    const name = 'Test User '+Date.now();
    r = await fetch(base+'/orders/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
    if(r.status!==201) throw new Error('create user failed');
    const user = await r.json(); out('user created '+user.user.id);

    out('list seats...');
    const eventId = ev.events && ev.events[0] && ev.events[0].id;
    if(!eventId) throw new Error('no event');
    r = await fetch(base+`/orders/seats?event_id=${eventId}`);
    const seats = await r.json();
    const seatId = seats.seats && seats.seats.find(s=>s.status==='available') && seats.seats.find(s=>s.status==='available').id;
    if(!seatId) throw new Error('no available seat');

    out('create order...');
    const idem = 'test-'+Date.now();
    r = await fetch(base+'/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':idem},body:JSON.stringify({user_id:user.user.id, seat_id:seatId})});
    if(r.status!==201) throw new Error('create order failed '+r.status);
    const order = await r.json(); out('order created '+order.order.id);

    out('ok all tests passed');
    process.exit(0);
  }catch(e){
    console.error('[TEST] failed',e);
    process.exit(2);
  }
})();
