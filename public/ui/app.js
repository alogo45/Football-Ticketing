// Minimal UI helpers for navigation and demo data
document.addEventListener('DOMContentLoaded',()=>{
  // active nav link highlight
  const links = document.querySelectorAll('.nav a');
  const path = location.pathname.replace(/.*\/ui\//,'');
  links.forEach(a=>{
    if(a.getAttribute('href')===path || a.getAttribute('href')===('./'+path)) a.classList.add('active')
  })

  // small demo: attach seat selection handlers
  document.querySelectorAll('.seat.available').forEach(el=>{
    el.addEventListener('click',()=>{
      document.querySelectorAll('.seat').forEach(s=>s.classList.remove('selected'))
      el.classList.add('selected');
      const info = document.getElementById('seat-info');
      if(info) info.textContent = 'Selected: '+el.dataset.seatId;
    })
  })

  // show/hide mobile nav
  const menu = document.getElementById('mobile-menu-toggle');
  if(menu){
    menu.addEventListener('click',()=>{
      const nav = document.querySelector('.nav');
      if(nav.style.display==='flex') nav.style.display='none'; else nav.style.display='flex';
    })
  }
})
