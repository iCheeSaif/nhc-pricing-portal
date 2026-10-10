/* Pricing Portal — dependency-free SPA, backed by FastAPI/SQLite. */
const $ = (s,scope=document)=>scope.querySelector(s);
const $$ = (s,scope=document)=>Array.from(scope.querySelectorAll(s));
const H = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:2,minimumFractionDigits:0}).format(+n||0);
const date = x => x ? new Date(x).toLocaleDateString('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric'}) : '—';
const opts = (arr,selected,placeholder)=>`${placeholder?`<option value="">${H(placeholder)}</option>`:''}${arr.map(([v,l])=>`<option value="${H(v)}" ${String(v)===String(selected)?'selected':''}>${H(l)}</option>`).join('')}`;
const TYPES = {villa:'فيلا',townhouse:'تاون هاوس',apartment:'شقة'};
const METHODS = {inclusive:'شامل',detailed:'مفصل',allocated:'شامل مع التخصيص'};
const PACKAGES = {building_infra:'البناء + البنية التحتية',building_land:'البناء + الأرض الخام',infra_land:'البنية التحتية + الأرض الخام'};
const KINDS = {base:'التسعير المبدئي',price:'تغيير الأسعار',design:'تغيير التصاميم'};
const STATUSES = {draft:'مسودة',pending_checker:'بانتظار المراجع',pending_approvals:'سلسلة الموافقات',rework:'معاد للتعديل',rejected:'مرفوض',approved:'معتمد'};
const UNIT_STATUSES = {preliminary:'تسعير مبدئي',available:'متاحة للبيع',reserved:'محجوزة',sold:'مباعة'};
const ROLE_LABELS = {admin:'مدير النظام',maker:'ممثل شراكات',checker:'مراجع شراكات',project_manager:'مدير المشروع',pricing_specialist:'مختص التسعير',relationship_manager:'مدير العلاقة',devrel_manager:'مدير علاقات المطورين',operations_manager:'مدير العمليات',pmo_manager:'مدير PMO',sector_head:'رئيس القطاع'};
const ICONS={dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', destination:'<circle cx="12" cy="10" r="3"/><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>', agreements:'<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z"/><path d="M14 3v6h7M7 13h10M7 17h10"/>', projects:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M13 13h4m-4 4h4"/>',units:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/>',requests:'<path d="M8 3h8l4 4v14H4V7l4-4Z"/><path d="M8 12h8M8 16h8M8 3v4h8V3"/>',tasks:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>',compare:'<path d="M4 7h14M14 3l4 4-4 4M20 17H6m4-4-4 4 4 4"/>',report:'<path d="M4 20V9m5 11V4m5 16v-8m5 8v-6"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 11a3 3 0 0 0 0-6m0 9a5 5 0 0 1 4 5v1"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',arrow:'<path d="m9 18 6-6-6-6"/>',search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',logout:'<path d="M9 3H4v18h5M16 17l5-5-5-5M21 12H9"/>',check:'<path d="m4 12 5 5L20 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',currency:'<circle cx="12" cy="12" r="9"/><path d="M16 8h-5a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6H8M12 5v3m0 12v-2"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 18l9 5 9-5"/>',filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-9v.5"/>'};
const ic = (name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.info}</svg>`;
const state={user:null,csrf:'',page:'dashboard',projectId:null,requestId:null,projectFilter:null,tableSearch:'',draftCache:{},demo:true};

async function api(url,options={}){
  const {method='GET',data,body,...rest}=options;
  const headers={...(data!==undefined?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRF-Token':state.csrf}:{}),...rest.headers};
  let res;
  try{res=await fetch('/api'+url,{method,headers,credentials:'same-origin',body:data!==undefined?JSON.stringify(data):body,...rest});}
  catch{throw Error('تعذر الاتصال بالخادم. تأكد أن التطبيق يعمل.');}
  if(res.status===401){state.user=null;loginView();throw Error('انتهت الجلسة؛ يرجى تسجيل الدخول');}
  const json=await res.json().catch(()=>({detail:'خطأ في الخادم'}));
  if(!res.ok)throw Error(Array.isArray(json.detail)?json.detail.map(d=>d.msg).join('، '):(json.detail||'حدث خطأ'));
  return json;
}
function toast(message,type='success'){
 const element=document.createElement('div');element.className=`toast ${type==='error'?'error':''}`;element.textContent=message;
 $('#toast-root').appendChild(element);setTimeout(()=>element.remove(),4400);
}
function showError(e){toast(e.message||String(e),'error')}
function canMake(){return ['admin','maker'].includes(state.user?.role)}
function canReview(r){return state.user?.role==='admin'||state.user?.role==='checker'}
const btn=(label,action,cls='primary',icon='')=>`<button class="btn ${cls}" data-action="${H(action)}">${icon?ic(icon):''}${H(label)}</button>`;
function pill(status,kind='request'){
 const cl=status==='approved'||status==='available'?'green':status==='pending_checker'||status==='pending_approvals'?'amber':status==='rejected'||status==='sold'?'red':status==='rework'||status==='reserved'?'blue':'gray';
 return `<span class="pill ${cl}">${H((kind==='unit'?UNIT_STATUSES:STATUSES)[status]||status)}</span>`;
}
function field(name,label,type='text',value='',extras=''){
 const input=type==='textarea'?`<textarea class="textarea" name="${H(name)}" ${extras}>${H(value)}</textarea>`:
 `<input class="input" name="${H(name)}" ${type==='number'?'type="number" step="any" min="0"':`type="${type}"`} value="${H(value)}" ${extras}/>`;
 return `<div class="field"><label>${H(label)}</label>${input}</div>`;
}
function selectField(name,label,items,selected='',placeholder='اختر من القائمة',extras=''){
 return `<div class="field"><label>${H(label)}</label><select class="select" name="${H(name)}" ${extras}>${opts(items,selected,placeholder)}</select></div>`;
}
function section(title,description,actions=''){
 return `<div class="section-head"><div><h1 class="page-title">${H(title)}</h1><p class="page-desc">${H(description)}</p></div><div class="head-actions">${actions}</div></div>`;
}
function panel(title,content,desc='',actions=''){
 return `<div class="panel"><div class="panel-header"><div><div class="panel-title">${H(title)}</div>${desc?`<div class="panel-sub">${H(desc)}</div>`:''}</div>${actions}</div>${content}</div>`;
}
function table(headers,rows,empty='لا توجد بيانات لعرضها'){
 return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${H(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}"><div class="empty">${H(empty)}</div></td></tr>`}</tbody></table></div>`;
}
function modal(title,content,onSubmit=null,wide=false){
 const root=$('#modal-root');root.innerHTML=`<div class="modal-overlay" id="overlay"><div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${H(title)}"><div class="modal-top"><h3>${H(title)}</h3><button type="button" class="close-btn" id="modal-close" aria-label="إغلاق">×</button></div><form id="dialog-form"><div class="modal-scroller">${content}</div><div class="modal-footer">${onSubmit?'<button type="submit" class="btn primary">حفظ البيانات</button>':''}<button type="button" class="btn secondary" id="modal-cancel">إغلاق</button></div></form></div></div>`;
 $('#modal-close').onclick=$('#modal-cancel').onclick=()=>root.innerHTML='';
 $('#overlay').addEventListener('click',e=>{if(e.target.id==='overlay')root.innerHTML=''});
 $('#dialog-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!onSubmit)return;
  const submit=$('#dialog-form button[type=submit]');submit.disabled=true;
  try{const values=Object.fromEntries(new FormData(e.target).entries());await onSubmit(values,e.target);root.innerHTML='';}
  catch(err){showError(err)}finally{if(submit.isConnected)submit.disabled=false}
 });
}
function loginView(){
 $('#app').innerHTML=`<div class="login-layout"><div class="login-right"><div style="margin-bottom:35px;color:var(--green);font-weight:700;font-size:14px">NHC <span style="color:#6a9381;font-size:11px">/ PARTNERSHIPS</span></div><h1 class="login-title">مرحبًا بك في منصة التسعير</h1><p class="login-sub">إدارة التسعير المبدئي وتغييرات الأسعار والتصاميم<br>للمشاريع العقارية من مكان واحد.</p><form id="login-form" class="login-form"><div class="field"><label>اسم المستخدم</label><input class="input" name="username" value="${state.demo?'maker':''}" required autocomplete="username" /></div><div class="field"><label>كلمة المرور</label><input class="input" name="password" type="password" value="${state.demo?'Demo@2026!':''}" required autocomplete="current-password" /></div><button class="btn primary full" style="margin-top:13px;min-height:46px">تسجيل الدخول ${ic('arrow')}</button></form>${state.demo?`<div class="login-notice"><strong>بيئة تجريبية محلية</strong><br>الحسابات الجاهزة: <span class="ltr">admin, maker, checker, pm, pricing, relation, developers, ops, pmo, head</span><br>كلمة المرور الافتراضية: <strong class="ltr">Demo@2026!</strong><br>غيّر إعدادات الإدارة قبل نشر الموقع على الإنترنت.</div>`:''}<div class="login-copyright">نظام مستقل للتجربة والتطوير — ليس متصلًا تلقائيًا بأنظمة NHC</div></div><div class="login-visual"><div class="login-logo">NHC <span style="font-size:14px;letter-spacing:4px;color:#95e2b7">PRICING</span></div><h2>قرار تسعيري أوضح.<br>تحكم أدق.<br>وموافقات أسهل.</h2><p>من الاتفاقية والمشروع إلى الوحدات واحتساب الأسعار والاعتماد النهائي — دورة عمل متكاملة وقابلة للتتبع.</p><div class="login-features"><span class="login-feature">إدارة التسعير</span><span class="login-feature">سجل الموافقات</span><span class="login-feature">تكامل ملفات Excel</span></div></div></div>`;
 $('#login-form').addEventListener('submit',async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));try{const r=await api('/auth/login',{method:'POST',data:v});state.user=r.user;state.csrf=r.csrf;state.page='dashboard';shell();navigate('dashboard')}catch(ex){showError(ex)}});
}
const NAV=[['dashboard','لوحة التحكم','dashboard'],['destinations','الوجهات والميزانيات','destination'],['agreements','اتفاقيات التطوير','agreements'],['projects','المشاريع','projects'],['units','الوحدات وأسعارها','units'],['requests','طلبات التسعير','requests'],['tasks','الموافقات المطلوبة','tasks'],['compare','مقارنة الطلبات','compare'],['reports','التقارير','report'],['users','المستخدمون والصلاحيات','users'],['guide','دليل الاستخدام','info']];
function shell(){
 $('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-upper">NHC <span class="brand-mark">PARTNERSHIPS</span></div><div class="brand-name">منصة إدارة التسعير</div><div class="brand-caption">نظام مستقل لإدارة أسعار الوحدات</div></div><nav class="nav-group"><div class="nav-caption">مساحة العمل</div>${NAV.filter(n=>n[0]!=='users'||state.user.role==='admin').map(n=>`<button class="nav-link" data-nav="${n[0]}">${ic(n[2])}<span>${n[1]}</span></button>`).join('')}</nav><div class="sidebar-footer"><span class="indicator"></span> المنصة متاحة محليًا <span class="ltr">v1.0</span></div></aside><div class="main"><header class="topbar"><div class="breadcrumb"><span>المنصة</span>${ic('arrow',12)}<strong id="crumb">لوحة التحكم</strong></div><div class="topbar-end"><span class="top-date">${new Date().toLocaleDateString('ar-SA-u-ca-gregory',{day:'numeric',month:'long',year:'numeric'})}</span><div class="user-pill"><div class="avatar">${H((state.user.name||'م')[0])}</div><div class="user-info"><strong>${H(state.user.name)}</strong><small>${H(ROLE_LABELS[state.user.role]||state.user.role)}</small></div></div><button class="link-button" id="logout" title="تسجيل الخروج">${ic('logout',20)}</button></div></header><main class="content" id="page-content"></main></div></div>`;
 $$('[data-nav]').forEach(el=>el.onclick=()=>navigate(el.dataset.nav));
 $('#logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST'});state.user=null;state.csrf='';loginView()}catch(ex){showError(ex)}};
}
async function navigate(page,args={}){
 if(!state.user)return loginView();
 state.page=page;Object.assign(state,args);
 $$('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));
 $('#crumb').textContent=(NAV.find(x=>x[0]===page)||[])[1]||'المنصة';
 $('#page-content').innerHTML='<div style="padding:90px;text-align:center;color:#86a698"><span class="spinner" style="display:inline-block"></span></div>';
 try{
  const renderers={dashboard:dashboardPage,destinations:destinationsPage,agreements:agreementsPage,
   projects:projectsPage,units:unitsPage,requests:requestsPage,tasks:tasksPage,compare:comparePage,reports:reportsPage,users:usersPage,guide:guidePage};
  await (renderers[page]||dashboardPage)();
 }catch(ex){showError(ex);$('#page-content').innerHTML=`<div class="insight warn">${H(ex.message)}</div>`}
}
function setPage(html){$('#page-content').innerHTML=html;}
function showDetails(title,object){modal(title,`<pre style="direction:ltr;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;line-height:1.8;background:#f5f8f6;padding:20px;border-radius:10px">${H(JSON.stringify(object,null,2))}</pre>`)}

async function dashboardPage(){
 const s=await api('/dashboard');const max=Math.max(1,...s.project_prices.map(x=>x.amount));
 setPage(`${section('لوحة التحكم','نظرة شاملة على مشاريع التطوير وطلبات التسعير ومؤشرات الأداء')}
 <div class="top-banner"><div><h2>إدارة تسعير عقاري متكاملة</h2><p>ابدأ بمشروع جديد، أو تابع الأسعار وطلبات التغيير والموافقات الجارية.</p></div>${canMake()?btn('إنشاء طلب تسعير','new-request','secondary','plus'):btn('عرض طلبات التسعير','go-requests','secondary','requests')}</div>
 <div class="stat-grid">${[[s.projects,'المشاريع المسجلة','projects'],[s.units,'إجمالي الوحدات','units'],[s.requests,'طلبات التسعير','requests'],[s.pending,'طلبات قيد المراجعة','clock']].map(a=>`<div class="stat-card"><div class="stat-top"><span>${a[1]}</span><div class="stat-icon">${ic(a[2])}</div></div><div class="stat-number">${cash(a[0])}</div><div class="stat-sub">بيانات النظام الحالية</div></div>`).join('')}</div>
 <div class="layout-two"><div>${panel('أحدث طلبات التسعير',table(['رقم الطلب','المشروع','النوع','الحالة','التاريخ'],s.recent.map(r=>`<tr class="clickable" data-request="${r.id}"><td><span class="t-value ltr">${H(r.number)}</span></td><td>${H(r.project_name)}</td><td>${H(KINDS[r.kind])}</td><td>${pill(r.status)}</td><td>${date(r.created_at)}</td></tr>`)),'سجل آخر الطلبات الواردة')} </div><div>${panel('القيمة التقديرية للوحدات',`<div class="panel-body">${s.project_prices.length?s.project_prices.map(p=>`<div class="bar-label"><strong>${H(p.name)}</strong><span class="numeric">${cash(p.amount)} ر.س</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,p.amount/max*100)}%"></div></div>`).join(''):'<div class="empty">لا توجد مشاريع حتى الآن</div>'}<p class="tiny muted">حساب وفق فئة المستفيدين والأسعار المعتمدة الحالية.</p></div>`,'مجموع الأسعار الأساسية المعتمدة')}</div></div>`);
 bindRequests();bindActions();
}

async function destinationsPage(){
 const [data,budgets]=await Promise.all([api('/destinations'),api('/budgets')]);
 setPage(`${section('الوجهات والميزانيات','الوجهات السكنية واتفاقيات خصومات البنية التحتية والقسط الميسر',canMake()?`${btn('وجهة جديدة','add-destination','primary','plus')}${btn('إضافة ميزانية','add-budget','secondary','plus')}`:'')}
 <div class="card-list">${data.map(d=>`<div class="tile" data-destination="${d.id}"><div class="split"><div class="tile-badge">${ic('destination')}</div><span class="pill gray">${H(d.city)}</span></div><div class="tile-title">${H(d.name)}</div><div class="tile-desc">الوجهة تضم ${cash(d.project_count)} مشروعًا مسجلًا.</div><div class="tile-foot"><span>عرض التفاصيل والميزانيات</span>${ic('arrow',14)}</div></div>`).join('')||'<div class="empty">لا توجد وجهات</div>'}</div><div class="gap18"></div>
 ${panel('ميزانيات الخصومات',table(['الوجهة','اسم الاتفاقية','نوع الخصم','الميزانية','المستخدم','المتبقي','الاستهلاك'],budgets.map(b=>`<tr><td>${H(data.find(x=>x.id===b.destination_id)?.name||'—')}</td><td>${H(b.name)}</td><td>${b.budget_type==='infra'?'بنية تحتية':'قسط ميسر'}</td><td class="numeric">${cash(b.total_amount)}</td><td class="numeric">${cash(b.used)}</td><td class="numeric">${cash(b.remaining)}</td><td><span class="pill ${b.usage_pct>=90?'amber':'green'}">${b.usage_pct}%</span>${canMake()?` <button class="btn secondary small" data-budget="${b.id}">تعديل</button>`:''}</td></tr>`)),'حساب المبالغ المصروفة من سجل الاعتمادات')}`);
 bindActions();$$('[data-budget]').forEach(el=>el.onclick=()=>{const budget=budgets.find(b=>b.id==el.dataset.budget);if(!budget)return;modal('تعديل ميزانية الخصم',`<div class="fields">${field('name','اسم الميزانية','text',budget.name,'required')}${field('total_amount','إجمالي الميزانية (ر.س)','number',budget.total_amount,'required')}</div><div class="insight warn" style="margin-top:14px">المبالغ المعتمدة سابقًا: ${cash(budget.used)} ر.س. لا يمكن تخفيض الميزانية دون هذا الحد.</div>`,async values=>{await api(`/budgets/${budget.id}`,{method:'PATCH',data:values});toast('تم تعديل الميزانية');navigate('destinations')})});$$('[data-destination]').forEach(el=>el.onclick=()=>{const d=data.find(x=>x.id==el.dataset.destination),bs=budgets.filter(b=>b.destination_id===d.id);modal('تفاصيل الوجهة: '+d.name,`<div class="fields">${field('name','اسم الوجهة','text',d.name,'required')}${field('city','المدينة','text',d.city,'required')}</div><div class="gap18"></div><div class="small muted">عدد المشاريع: ${d.project_count} — الميزانيات: ${bs.length}</div><div class="small muted" style="margin-top:12px">${bs.map(b=>`${H(b.name)}: ${cash(b.used)} / ${cash(b.total_amount)} ر.س`).join('<br>')||'لا توجد ميزانيات'}</div>`,canMake()?async values=>{await api(`/destinations/${d.id}`,{method:'PATCH',data:values});toast('تم تحديث الوجهة');navigate('destinations')}:null)})
}

async function agreementsPage(){
 const data=await api('/agreements');
 setPage(`${section('اتفاقيات التطوير','سجل العقود التي تتم مزامنتها من PPM أو إدخالها يدويًا',canMake()?btn('إضافة اتفاقية','add-agreement','primary','plus'):'')}
 ${panel('سجل الاتفاقيات',table(['رقم العقد','المطور','اسم المشروع','المنطقة','مساحة الأرض','المصدر'],data.map(x=>`<tr><td class="t-value ltr">${H(x.contract_no)}</td><td>${H(x.developer)}</td><td>${H(x.project_name)}</td><td>${H(x.zone||'—')}</td><td class="numeric">${cash(x.land_area)} م²</td><td>${x.source==='manual'?'يدوي':x.source==='sample'?'بيانات تجريبية':'PPM'}</td></tr>`)),'الاتفاقيات المتاحة لتأسيس مشاريع التسعير')}`);
 bindActions();
}

async function projectsPage(){
 const data=await api('/projects');
 setPage(`${section('المشاريع','ربط المشاريع بالاتفاقيات والوجهات، ومتابعة الوحدات المرتبطة بكل مشروع',canMake()?btn('مشروع جديد','add-project','primary','plus'):'')}
 <div class="card-list">${data.map(p=>`<div class="tile" data-project="${p.id}"><div class="split"><div class="tile-badge">${ic('projects')}</div><span class="pill ${p.project_type==='ministry'?'blue':'gray'}">${p.project_type==='ministry'?'أرض وزارة':'أرض شركة'}</span></div><div class="tile-title">${H(p.name)}</div><div class="tile-desc">${H(p.developer)}<br>${H(p.destination_name)}</div><div class="tile-foot"><span><strong class="numeric">${cash(p.unit_count)}</strong> وحدة</span><span class="t-value ltr">${H(p.code)}</span></div></div>`).join('')||'<div class="empty">لا توجد مشاريع</div>'}</div>`);
 bindActions();$$('[data-project]').forEach(el=>el.onclick=()=>navigate('units',{projectFilter:Number(el.dataset.project)}));
}

let latestUnits=[];
async function unitsPage(){
 const projects=await api('/projects');
 const selected=state.projectFilter||projects[0]?.id;
 if(!selected){setPage(section('الوحدات والأسعار','')+'<div class="empty">يرجى إضافة مشروع أولًا.</div>');return}
 state.projectFilter=Number(selected);
 const data=await api(`/units?project_id=${selected}`);latestUnits=data;
 setPage(`${section('الوحدات والأسعار','الأسعار المعتمدة حاليًا، وحالة توافر الوحدات وتفاصيل توزيع السعر',`${btn('تصدير Excel','export-units','secondary','download')}${canMake()?btn('طلب تسعير جديد','new-request','primary','plus'):''}`)}
 <div class="mini-grid"><div class="info-block"><small>عدد وحدات المشروع</small><strong class="numeric">${cash(data.length)}</strong></div><div class="info-block"><small>متوسط السعر — مستفيد</small><strong class="numeric">${cash(data.reduce((s,x)=>s+(x.pricing?.segments?.beneficiary?.total||0),0)/Math.max(1,data.length))} ر.س</strong></div><div class="info-block"><small>المتاحة للبيع</small><strong class="numeric">${cash(data.filter(x=>x.data.status==='available').length)}</strong></div></div>
 ${panel('قائمة الوحدات',`<div class="toolbar"><div class="toolbar-filters"><select class="select" id="project-switch">${opts(projects.map(p=>[p.id,p.name]),selected)}</select><input class="input" id="units-search" placeholder="بحث برقم الوحدة أو البلوك..."/></div><div class="small muted">الوحدات الحالية للمشروع</div></div><div id="units-table"></div>`,'انقر على أي وحدة لعرض تفصيل أسعارها')}`);
 $('#project-switch').onchange=e=>navigate('units',{projectFilter:Number(e.target.value)});
 $('#units-search').oninput=e=>paintUnits(data,e.target.value);
 paintUnits(data,'');bindActions();
}
function paintUnits(data,search){
 const found=data.filter(x=>[x.unit_code,x.data.block,x.data.model].some(t=>String(t||'').toLowerCase().includes(search.toLowerCase())));
 $('#units-table').innerHTML=table(['رقم الوحدة','النوع','المساحة البيعية','سعر المستفيد','غير المستفيد','الحالة','التفاصيل'],found.map(u=>`<tr><td class="t-value ltr">${H(u.unit_code)}</td><td>${H(TYPES[u.data.unit_type])}</td><td class="numeric">${cash(u.data.sale_area)} م²</td><td class="numeric">${cash(u.pricing.segments.beneficiary.total)}</td><td class="numeric">${cash(u.pricing.segments.nonbeneficiary.total)}</td><td>${pill(u.data.status,'unit')}</td><td><button class="btn secondary small" data-unit="${u.id}">عرض التفاصيل</button></td></tr>`));
 $$('[data-unit]').forEach(btn=>btn.onclick=()=>unitModal(data.find(u=>u.id==btn.dataset.unit)));
}
function unitModal(unit){
 const s=unit.data,p=unit.pricing;
 const breakdown=(seg)=>`<div class="info-block"><div class="strong" style="margin-bottom:13px">${seg==='beneficiary'?'المستفيدون':'غير المستفيدين'}</div>${[['البناء','building'],['البنية التحتية','infra'],['الأرض','land'],['زيادة التدرج','escalation'],['السعر النهائي','total']].map(([l,k])=>`<div class="split" style="padding:8px 0;border-bottom:1px solid var(--line);font-size:11px"><span>${l}</span><strong class="numeric">${cash(p.segments[seg][k])}</strong></div>`).join('')}</div>`;
 modal(`تفاصيل الوحدة ${unit.unit_code}`,`<div class="detail-grid">${[['النوع',TYPES[s.unit_type]],['الحالة',UNIT_STATUSES[s.status]],['المساحة البيعية',s.sale_area+' م²'],['البلوك',s.block],['المبنى',s.building],['طريقة التسعير',METHODS[s.price_method]],['حصة الأرض',p.land_basis+' م²'],['إصدار السجل',unit.version]].map(([l,v])=>`<div class="kv"><small>${H(l)}</small><strong>${H(v)}</strong></div>`).join('')}</div><div class="gap18"></div><div class="fields">${breakdown('beneficiary')}${breakdown('nonbeneficiary')}</div><div class="form-actions">${canMake()?'<button type="button" class="btn secondary" id="update-status">تغيير حالة الوحدة</button>':''}<button class="btn secondary" type="button" id="unit-history">السجل التاريخي</button></div>`,null,true);
 $('#unit-history').onclick=async()=>{try{const h=await api(`/units/${unit.id}/history`);showDetails('سجل تغييرات الوحدة',h)}catch(e){showError(e)}};
 if($('#update-status'))$('#update-status').onclick=()=>{
  modal('تغيير حالة الوحدة',selectField('status','حالة الوحدة',Object.entries(UNIT_STATUSES),s.status,''),async v=>{await api(`/units/${unit.id}/status`,{method:'POST',data:v});toast('تم تحديث حالة الوحدة');navigate('units')});
 };
}

async function requestsPage(){
 const [requests,projects]=await Promise.all([api('/requests'),api('/projects')]);
 setPage(`${section('طلبات التسعير','طلبات التسعير المبدئي وتغيير الأسعار وتعديل التصاميم',canMake()?btn('طلب جديد','new-request','primary','plus'):'')}
 <div class="request-tabs" id="request-tabs"><button class="request-tab active" data-filter="all">جميع الطلبات (${requests.length})</button>${Object.keys(KINDS).map(k=>`<button class="request-tab" data-filter="${k}">${KINDS[k]} (${requests.filter(r=>r.kind===k).length})</button>`).join('')}</div>
 ${panel('سجل الطلبات',`<div class="toolbar"><input class="input" placeholder="بحث برقم الطلب أو المشروع..." id="request-search"/><select class="select" id="request-status">${opts(Object.entries(STATUSES),'','جميع الحالات')}</select></div><div id="requests-table"></div>`,'عرض تفاصيل الطلب ومتابعة حالة الاعتماد')}`);
 let filter='all';const paint=()=>{
  const q=$('#request-search').value.toLowerCase(),s=$('#request-status').value;
  const rows=requests.filter(r=>(filter==='all'||r.kind===filter)&&(!s||r.status===s)&&[r.number,r.project_name].some(x=>x.toLowerCase().includes(q)));
  $('#requests-table').innerHTML=table(['رقم الطلب','المشروع','الإجراء','الوحدات','الحالة','المنشئ','تاريخ الإنشاء'],rows.map(r=>`<tr class="clickable" data-request="${r.id}"><td class="t-value ltr">${H(r.number)}</td><td>${H(r.project_name)}</td><td>${H(KINDS[r.kind])}</td><td class="numeric">${r.item_count}</td><td>${pill(r.status)}</td><td>${H(r.creator_name)}</td><td>${date(r.created_at)}</td></tr>`));bindRequests();
 };
 $('#request-search').oninput=paint;$('#request-status').onchange=paint;
 $$('[data-filter]').forEach(x=>x.onclick=()=>{filter=x.dataset.filter;$$('[data-filter]').forEach(y=>y.classList.toggle('active',y===x));paint()});paint();bindActions();
}
function bindRequests(){$$('[data-request]').forEach(el=>el.onclick=()=>openRequest(Number(el.dataset.request)))}

async function openRequest(id){
 state.requestId=id;state.page='request';$$('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav==='requests'));
 $('#crumb').textContent='تفاصيل الطلب';$('#page-content').innerHTML='<div class="page-loader" style="height:40vh"><span class="spinner"></span></div>';
 try{
 const [r,projects,budgets]=await Promise.all([api(`/requests/${id}`),api('/projects'),api('/budgets')]);
 const p=projects.find(x=>x.id===r.project_id)||{},editing=['draft','rework'].includes(r.status)&&canMake()&&(r.created_by===state.user.id||state.user.role==='admin');
 const isReviewer=r.status==='pending_checker'&&canReview();
 const stage=r.approvals.find(a=>a.status==='pending');
 const canApproveStage=r.status==='pending_approvals'&&stage&&(stage.role===state.user.role||state.user.role==='admin');
 const actions=editing?`${btn('معاينة والتحقق','preview-request','secondary','search')}${btn('إرسال للمراجعة','submit-request','primary','check')}`:
 (isReviewer||canApproveStage)?`${btn('اعتماد','approve-request','primary','check')}${btn('إعادة للتعديل','rework-request','secondary')}${btn('رفض','reject-request','danger')}`:'';
 const components=(seg)=>(seg?.total===undefined?'—':cash(seg.total));
 setPage(`${section(`طلب ${r.number}`,`${KINDS[r.kind]} • ${p.name||''}`,`${btn('جميع الطلبات','go-requests','secondary')}${actions}`)}
 <div class="mini-grid"><div class="info-block"><small>حالة الطلب</small>${pill(r.status)}</div><div class="info-block"><small>نوع الإجراء</small><strong>${KINDS[r.kind]}</strong></div><div class="info-block"><small>إجمالي الوحدات ضمن الطلب</small><strong class="numeric">${r.items.length}</strong></div></div>
 ${editing?`<div class="insight">${ic('info')} الأسعار التي تعدّلها هنا تبقى ضمن الطلب فقط. لن تتغير الأسعار المعتمدة إلا بعد موافقة جميع الجهات المطلوبة.</div>`:''}
 <div class="layout-two"><div>
 ${panel('وحدات الطلب ومقارنة الأسعار',`${editing?`<div class="toolbar"><div class="toolbar-filters">${btn('إضافة / تعديل وحدة','add-request-item','primary','plus')}${btn('استيراد Excel','import-request','secondary','upload')}</div><span class="tiny muted">يمكن رفع الوحدات من القالب أو إدخالها يدويًا</span></div>`:''}
 ${table(['الوحدة','التغيير','السعر السابق','السعر الجديد','الفرق','الإجراء'],r.items.map(i=>{
   const old=i.before_pricing?.segments?.beneficiary?.total||0,cur=i.after_pricing?.segments?.beneficiary?.total||0;
   return `<tr><td class="t-value ltr">${H(i.unit_code)}</td><td>${i.operation==='remove'?'حذف':i.before?'تعديل':'إضافة'}</td><td class="numeric">${cash(old)}</td><td class="numeric">${cash(cur)}</td><td class="numeric" style="color:${cur-old<0?'#a65342':'#117f50'}">${cur-old>0?'+':''}${cash(cur-old)}</td><td><div style="display:flex;gap:6px">${editing?`<button class="btn secondary small" data-edit-item="${i.id}">تعديل</button><button class="btn danger small" data-remove-item="${i.id}">حذف</button>`:`<button class="btn secondary small" data-see-item="${i.id}">تفاصيل</button>`}</div></td></tr>`;
 }))}`,'قائمة الوحدات المستهدفة')}
 ${panel('بيانات الطلب',`<div class="panel-body"><div class="detail-grid"><div class="kv"><small>رقم الطلب</small><strong class="ltr">${r.number}</strong></div><div class="kv"><small>المشروع</small><strong>${H(p.name||'—')}</strong></div><div class="kv"><small>تاريخ التقديم</small><strong>${date(r.submitted_at)}</strong></div><div class="kv"><small>الاعتماد النهائي</small><strong>${date(r.closed_at)}</strong></div></div><p class="small muted" style="line-height:1.9;margin-top:15px">${H(r.notes||'لا توجد ملاحظات')}</p></div>`)}</div>
 <div>${panel('مراحل الاعتماد',`<div class="panel-body"><div class="timeline"><div class="timeline-row"><div class="timeline-icon">${ic('check',13)}</div><div class="timeline-body"><strong>إنشاء الطلب</strong><p>${date(r.created_at)}</p></div></div><div class="timeline-row"><div class="timeline-icon">${r.status==='pending_checker'?'○':'✓'}</div><div class="timeline-body"><strong>مراجع شراكات (Checker)</strong><p>${r.status==='draft'?'لم يُرسل بعد':r.status==='pending_checker'?'بانتظار المراجعة':r.checked_by?'تمت المراجعة':'قيد الإجراء'}</p></div></div>${r.kind==='price'?r.approvals.map(a=>`<div class="timeline-row"><div class="timeline-icon" style="${a.status==='pending'?'background:#fff3de;color:#9c6f28':a.status==='approved'?'':'background:#f1f4f2;color:#8da396'}">${a.status==='approved'?'✓':a.status==='pending'?'•':'○'}</div><div class="timeline-body"><strong>${H(ROLE_LABELS[a.role])}</strong><p>${a.status==='approved'?'تم الاعتماد':a.status==='pending'?'بانتظار الاعتماد':a.status==='rework'?'أعيد للتعديل':a.status==='rejected'?'تم الرفض':'لم تبدأ المرحلة'}</p>${a.comment?`<p>${H(a.comment)}</p>`:''}</div></div>`).join(''):''}</div></div>`) }
 ${panel('سجل النشاط',`<div class="panel-body">${r.audit.length?r.audit.slice(0,12).map(a=>`<div style="border-bottom:1px solid var(--line);padding:10px 0"><div class="small strong">${H(a.action)}</div><div class="tiny muted">${date(a.created_at)} • ${H(a.actor||'النظام')}</div><div class="tiny muted">${H(a.detail||'')}</div></div>`).join(''):'<div class="empty-item">لا يوجد نشاط</div>'}</div>`)}</div></div>`);
 $('#page-content').dataset.request=String(id);
 bindActions();
 $$('[data-edit-item]').forEach(x=>x.onclick=()=>unitEditor(r,r.items.find(i=>i.id==x.dataset.editItem),p,budgets));
 $$('[data-see-item]').forEach(x=>x.onclick=()=>showDetails('تفاصيل طلب الوحدة',r.items.find(i=>i.id==x.dataset.seeItem)));
 $$('[data-remove-item]').forEach(x=>x.onclick=async()=>{if(!confirm('هل تريد حذف الوحدة من الطلب؟'))return;try{await api(`/requests/${id}/items/${x.dataset.removeItem}`,{method:'DELETE'});toast('تم حذف الوحدة من الطلب');openRequest(id)}catch(e){showError(e)}});
 state.currentRequest=r;state.currentProject=p;state.currentBudgets=budgets;
 }catch(e){showError(e);navigate('requests')}
}

function unitEditor(r,item=null,p={},budgets=[]){
 const original=item?.after||item?.before||{};
 const raw=Object.fromEntries(Object.entries(original).map(([k,v])=>[k,v??'']));
 const readonly=r.kind==='design'&&!!item?'readonly':'';
 const geoReadonly=r.kind==='price'&&!!item?'readonly':'';
 const group=(prefix,label)=>`<h4>${label}</h4>${field(`${prefix}_inclusive_rate`,'سعر المتر الشامل','number',raw[`${prefix}_inclusive_rate`]||0,readonly)}${field(`${prefix}_building_rate`,'سعر متر البناء','number',raw[`${prefix}_building_rate`]||0,readonly)}${field(`${prefix}_infra_rate`,'سعر متر البنية التحتية','number',raw[`${prefix}_infra_rate`]||0,readonly)}${field(`${prefix}_land_rate`,'سعر متر الأرض الخام','number',raw[`${prefix}_land_rate`]||0,readonly)}`;
 let html=`<div class="insight">${ic('info',18)} أدخل قيم التسعير بالأرقام. جميع الحسابات تُعاد داخل الخادم قبل حفظها أو اعتمادها، وليس في المتصفح.</div><div class="fields triple">
 ${item?`<input type="hidden" name="unit_code" value="${H(raw.unit_code)}">`:field('unit_code','رقم الوحدة','text',raw.unit_code||'','required')}
 ${selectField('unit_type','نوع الوحدة',Object.entries(TYPES),raw.unit_type||'villa','')}
 ${selectField('status','حالة الوحدة',Object.entries(UNIT_STATUSES),raw.status||'available','')}
 ${selectField('operation','الإجراء',r.kind==='design'?[['update','إضافة / تحديث'],['remove','حذف الوحدة']]:[['update','إضافة / تحديث']],'update','')}
 ${field('block','رقم البلوك','text',raw.block||'')}${field('building','رقم المبنى','text',raw.building||'')}${field('floor','الدور','text',raw.floor||'')}${field('model','النموذج','text',raw.model||'')}
 ${field('sale_area','المساحة البيعية م²','number',raw.sale_area||0,'required '+geoReadonly)}${field('land_area','مساحة الأرض م²','number',raw.land_area||0,geoReadonly)}${field('shared_area','المساحة المشاعة للشقة','number',raw.shared_area||0,geoReadonly)}
 ${field('block_land_area','إجمالي أرض البلوك','number',raw.block_land_area||0,geoReadonly)}${field('block_total_nsa','مجموع NSA للبلوك','number',raw.block_total_nsa||0,geoReadonly)}${field('commercial_area','المساحة التجارية للبلوك','number',raw.commercial_area||0,geoReadonly)}
 ${field('bedrooms','غرف النوم','number',raw.bedrooms||0)}${field('bathrooms','دورات المياه','number',raw.bathrooms||0)}
 ${selectField('price_method','طريقة التسعير',Object.entries(METHODS),raw.price_method||'detailed','')}
 ${selectField('allocation_package','باقة التخصيص (إن وجدت)',Object.entries(PACKAGES),raw.allocation_package||'','بدون')}
 ${group('beneficiary','تسعير المستفيدين')}${group('nonbeneficiary','تسعير غير المستفيدين')}
 <h4>الخصومات والتدرجات (على المستفيدين)</h4>
 ${field('infra_discount','خصم البنية التحتية ر.س','number',raw.infra_discount||0,readonly)}${field('installment_discount','خصم القسط الميسر ر.س','number',raw.installment_discount||0,readonly)}
 ${field('inkind_discount','خصم الدعم العيني ر.س','number',raw.inkind_discount||0,readonly)}${field('building_discount','خصم البناء ر.س','number',raw.building_discount||0,readonly)}
 ${field('escalation_pct','نسبة التدرج %','number',raw.escalation_pct||0,readonly)}
 ${selectField('infra_budget_id','اتفاقية ميزانية البنية التحتية',budgets.filter(b=>b.destination_id===p.destination_id&&b.budget_type==='infra').map(b=>[b.id,b.name]),item?.infra_budget_id||'','بدون')}
 ${selectField('installment_budget_id','اتفاقية ميزانية القسط الميسر',budgets.filter(b=>b.destination_id===p.destination_id&&b.budget_type==='installment').map(b=>[b.id,b.name]),item?.installment_budget_id||'','بدون')}
 </div>`;
 modal(item?`تعديل الوحدة ${raw.unit_code}`:'إضافة وحدة للطلب',html,async values=>{
   const id=r.id;const {operation,infra_budget_id,installment_budget_id,...unit}=values;
   await api(`/requests/${id}/items`,{method:'POST',data:{data:unit,operation:operation==='remove'?'remove':'update',infra_budget_id:infra_budget_id||null,installment_budget_id:installment_budget_id||null}});
   toast('تم احتساب الوحدة وحفظها في الطلب');openRequest(id);
 },true);
}

async function tasksPage(){
 const rows=await api('/tasks');
 setPage(`${section('الموافقات المطلوبة','الطلبات المعلقة لدى دورك الحالي — يمكن الاعتماد أو الإرجاع أو الرفض عند فتح الطلب')}
 ${rows.length?`<div class="insight">${ic('clock')} يوجد لديك <strong>${rows.length}</strong> طلب/طلبات تحتاج إلى إجراء.</div>`:''}
 ${panel('قائمة الموافقات',table(['رقم الطلب','المشروع','نوع الطلب','المنشئ','الحالة','الإجراء'],rows.map(r=>`<tr><td class="t-value ltr">${H(r.number)}</td><td>${H(r.project_name)}</td><td>${KINDS[r.kind]}</td><td>${H(r.creator_name)}</td><td>${pill(r.status)}</td><td><button data-request="${r.id}" class="btn primary small">مراجعة الطلب</button></td></tr>`)),'الطلبات حسب صلاحيات الحساب الحالي')}`);bindRequests();
}

async function comparePage(){
 const requests=await api('/requests');
 setPage(`${section('مقارنة طلبات التسعير','قارن طلبين لنفس المشروع ونفس نوع الطلب لمعرفة الفروقات حقلًا بحقل')}
 ${panel('اختيار طلبين للمقارنة',`<div class="panel-body"><form id="compare-form"><div class="fields">${selectField('a','الطلب الأول',requests.map(r=>[r.id,`${r.number} — ${r.project_name}`]),'','اختر الطلب')}${selectField('b','الطلب الثاني',requests.map(r=>[r.id,`${r.number} — ${r.project_name}`]),'','اختر الطلب')}</div><div class="form-actions"><button type="submit" class="btn primary">${ic('compare')} تنفيذ المقارنة</button></div></form></div>`)}<div id="compare-result"></div>`);
 $('#compare-form').onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));try{
  const r=await api(`/compare?a=${v.a}&b=${v.b}`);
  $('#compare-result').innerHTML=r.matched?'<div class="insight">لا توجد فروقات بين الطلبين في بيانات الوحدات المعروضة.</div>':
  panel('نتائج المقارنة',`<div class="panel-body"><div class="insight warn">تم العثور على فروقات في ${r.differences.length} وحدة من أصل ${r.checked_units} وحدة مشتركة أو موجودة في أي طلب.</div>${r.differences.map(d=>`<div class="compare-row"><div class="strong" style="margin-bottom:10px">${H(d.unit_code)} (${d.fields.length} اختلاف)</div>${d.fields.map(f=>`<div class="diff-field"><strong>${H(f.field)}</strong><span class="muted">الأول: ${H(JSON.stringify(f.a))}</span><span class="accent">الثاني: ${H(JSON.stringify(f.b))}</span></div>`).join('')}</div>`).join('')}</div>`);
 }catch(err){showError(err)}};
}

async function reportsPage(){
 const [r,b]=await Promise.all([api('/reports'),api('/budgets')]);
 setPage(`${section('التقارير والتحليلات','ملخص القيم الإجمالية المعتمدة وطلبات التسعير ومصروفات الخصومات')}
 ${panel('التسعير حسب المشروع',table(['المشروع','الكود','الوحدات','الإجمالي للمستفيدين (ر.س)','الإجمالي لغير المستفيدين (ر.س)'],r.projects.map(p=>`<tr><td class="strong">${H(p.name)}</td><td class="ltr">${H(p.code)}</td><td class="numeric">${p.units}</td><td class="numeric">${cash(p.beneficiary_total)}</td><td class="numeric">${cash(p.nonbeneficiary_total)}</td></tr>`)),'احتساب من بيانات الوحدات الفعلية الحالية')}
 <div class="layout-two"><div>${panel('توزيع الطلبات حسب النوع والحالة',table(['النوع','الحالة','العدد'],r.requests.map(x=>`<tr><td>${KINDS[x.kind]}</td><td>${pill(x.status)}</td><td class="numeric">${x.count}</td></tr>`)))}</div><div>${panel('استهلاك ميزانيات الخصومات',`<div class="panel-body">${b.map(x=>`<div class="bar-label"><span>${H(x.name)}</span><strong class="numeric">${cash(x.used)} / ${cash(x.total_amount)}</strong></div><div class="bar-track"><div class="bar-fill ${x.usage_pct>=90?'budget-fill':''}" style="width:${Math.min(100,x.usage_pct)}%"></div></div>`).join('')||'<div class="empty">لا توجد ميزانيات</div>'}</div>`)}</div></div>`);
}
async function usersPage(){
 if(state.user.role!=='admin')return navigate('dashboard');
 const data=await api('/users');setPage(`${section('المستخدمون والصلاحيات','إدارة حسابات النظام وربط كل موظف بدوره الوظيفي',btn('إضافة مستخدم','add-user','primary','plus'))}
 ${panel('مستخدمو المنصة',table(['المستخدم','الاسم','الدور','الحالة'],data.map(u=>`<tr><td class="t-value ltr">${H(u.username)}</td><td>${H(u.name)}</td><td>${H(ROLE_LABELS[u.role])}</td><td>${u.active?'<span class="pill green">مفعل</span>':'<span class="pill red">موقوف</span>'}</td></tr>`)),'الموافقة مشروطة بدور المستخدم ومراحله')}`);bindActions();
}
function guidePage(){
 setPage(`${section('دليل النظام','كيف تستخدم منصة التسعير المستقلة، وحدود التكامل مع الأنظمة الأخرى')}
 ${panel('خطوات العمل',`<div class="panel-body"><div class="timeline">${[
 ['1','تعريف الوجهة والميزانيات','أنشئ وجهة وأضف اتفاقية أو أكثر لميزانيات الخصومات.'],
 ['2','تسجيل الاتفاقية والمشروع','اربط المشروع باتفاقية تطوير عقاري ونوع الأرض (وزارة أو شركة).'],
 ['3','طلب التسعير المبدئي','اختر مشروعًا جديدًا، وارفع ملف الوحدات أو أدخلها يدويًا، ثم راجع الأسعار.'],
 ['4','مراجعة Checker','يراجع Checker الوحدات ويعتمد الطلب، فتتحول إلى أسعار معتمدة.'],
 ['5','طلب تغيير أسعار','حدد الوحدات والأسعار والخصومات، واستخدم المعاينة قبل الإرسال.'],
 ['6','سلسلة الموافقات','Checker ثم مدير المشروع، مختص التسعير، مدير العلاقة، إدارة علاقات المطورين، العمليات، PMO، رئيس القطاع.'],
 ['7','تغيير التصاميم','تعديل بيانات الوحدة ومساحتها وإعادة احتساب الأسعار السابقة على المساحة الجديدة؛ Checker فقط.'],
 ['8','المقارنة والتقارير','قارن بين الطلبات، واستخرج ملف Excel للأسعار المعتمدة، وراجع السجل.']].map(([num,title,body])=>`<div class="timeline-row"><div class="timeline-icon">${num}</div><div class="timeline-body"><strong>${title}</strong><p>${body}</p></div></div>`).join('')}</div></div>`) }
 <div class="insight warn">هذه نسخة مستقلة قابلة للتشغيل، وليست متصلة حاليًا بـ PPM أو CRM. القالب الذي يُنزَّل من الموقع قالب داخلي، وليس ملف «إتمام» الرسمي. قواعد التخصيص الخاصة بالشقق وبعض استثناءات الاتفاقيات تستلزم اعتماد المعادلات من قطاع شراكات قبل التشغيل الفعلي.</div>
 ${panel('ملاحظات تقنية',`<div class="panel-body small" style="line-height:2.3">البيانات تحفظ في SQLite على الخادم وليس في المتصفح. جميع عمليات التسعير والموافقة تُراجع في Backend. يُحظر تغيير أسعار الوحدات المباعة أو المحجوزة. الميزانيات تمنع تجاوز السقف المحدد، مع تحذير عند 90%. طلبات الأسعار تتطلب سبعة موافقين بعد Checker. لا يُسمح بإجراء الموافقة بواسطة منشئ الطلب نفسه. بيانات الأمثلة ليست بيانات حقيقية.</div>`)}`);
}

async function newRequestDialog(){
 const projects=await api('/projects');if(!projects.length)return toast('أضف مشروعًا أولًا','error');
 modal('إنشاء طلب تسعير جديد',`<div class="fields">${selectField('project_id','المشروع',projects.map(p=>[p.id,p.name]),state.projectFilter||'','اختر المشروع','required')}${selectField('kind','نوع الطلب',Object.entries(KINDS),'base','اختر النوع','required')}<div class="field full-row"><label>أسباب تغيير الأسعار (اختياري حسب نوع الطلب)</label><div class="fields triple">${['زيادة تدرج الأسعار','زيادة استثنائية','إلغاء التدرج','تخفيض قيمة البناء','تعديل تمييز الوحدات','إعادة تقييم الأرض','تغيير الفئة المستهدفة','تعديل سعر بطلب المطور','خصم البنية التحتية','خصم القسط الميسر','خصم الدعم العيني','سبب آخر'].map((x,i)=>`<label class="small" style="font-weight:500;display:flex;gap:7px;align-items:center"><input type="checkbox" name="reason" value="${H(x)}">${H(x)}</label>`).join('')}</div></div>${field('notes','ملاحظات الطلب','textarea')}</div>`,async v=>{
  const reasons=$$('input[name=reason]:checked').map(x=>x.value);
  const r=await api('/requests',{method:'POST',data:{project_id:Number(v.project_id),kind:v.kind,notes:v.notes,reasons}});
  toast(`تم إنشاء الطلب ${r.number}`);openRequest(r.id);
 });
}
async function chooseRequestUnit(){
 const r=state.currentRequest;
 if(r.kind==='base')return unitEditor(r,null,state.currentProject,state.currentBudgets);
 const records=await api(`/units?project_id=${r.project_id}`);
 const available=records.filter(x=>!['reserved','sold'].includes(x.data.status));
 modal('اختيار الوحدة المطلوب تعديلها',`<div class="fields">${selectField('unit_id','الوحدة',available.map(x=>[x.id,`${x.unit_code} — ${TYPES[x.data.unit_type]} — ${cash(x.pricing.segments.beneficiary.total)} ر.س`]),'',r.kind==='design'?'وحدة جديدة (إضافة)':'اختر وحدة موجودة',''+(r.kind==='price'?'required':''))}</div><div class="insight" style="margin-top:14px">${r.kind==='design'?'اختر وحدة لتعديل تصميمها أو اترك الاختيار فارغًا لإضافة وحدة جديدة.':'تُعرض بيانات الوحدة المعتمدة تلقائيًا لتعديل السعر دون تغيير مواصفات التصميم.'}</div>`,async v=>{
  const u=available.find(x=>x.id==v.unit_id);
  if(r.kind==='price'&&!u)throw Error('اختر وحدة موجودة');
  // Schedule the next dialog after closing this one.
  setTimeout(()=>unitEditor(r,u?{after:u.data,unit_code:u.unit_code}:null,state.currentProject,state.currentBudgets),30);
 });
}
async function importDialog(){
 const r=state.currentRequest;
 modal('رفع ملف Excel للوحدات',`<div class="insight warn">يرجى استخدام قالب الوحدات المتاح بالمنصة. يرفض النظام الملف بالكامل إذا احتوى على صف خاطئ، ويعرض رقم الصف المخالف.</div><div class="file-drop">${ic('upload',28)}<br><strong>اختر ملف XLSX</strong><p>حتى 1000 وحدة في الملف الواحد، وبحد أقصى 6MB.</p><input class="input" type="file" accept=".xlsx" name="file" required/></div><p style="margin-top:14px"><a class="btn secondary" href="/api/templates/units.xlsx" download>${ic('download')} تنزيل نموذج Excel</a></p>`,async(v,form)=>{
  const file=$('input[type=file]',form)?.files?.[0];if(!file)throw Error('اختر ملفًا أولًا');const data=new FormData();data.append('file',file);
  const result=await api(`/requests/${r.id}/import`,{method:'POST',body:data});toast(`تم استيراد ${result.imported} وحدة بنجاح`);openRequest(r.id);
 });
}
async function actionDialog(action){
 const req=state.currentRequest;
 if(action==='submit'){
  if(!confirm('سيتم إرسال الطلب للمراجعة، ولن تتمكن من تعديله حتى إرجاعه. هل تريد المتابعة؟'))return;
  try{const r=await api(`/requests/${req.id}/action`,{method:'POST',data:{action}});toast('تم إرسال الطلب للمراجعة');openRequest(req.id)}catch(e){showError(e)}return;
 }
 const names={approve:'اعتماد الطلب',rework:'إعادة الطلب للتعديل',reject:'رفض الطلب'};
 modal(names[action],`<div class="insight ${action==='reject'?'warn':''}">${H(action==='approve'?'سيتم تسجيل موافقتك، وتطبيق الأسعار عند اكتمال الموافقات.':'سيتم إشعار منشئ الطلب وإيقاف مسار الموافقات الحالي.')}</div>${field('comment','الملاحظات أو سبب الإجراء','textarea','',''+(action==='approve'?'':'required'))}`,async v=>{
  const r=await api(`/requests/${req.id}/action`,{method:'POST',data:{action,comment:v.comment}});
  toast(r.status==='approved'?'اكتمل الاعتماد وتم تطبيق الأسعار':r.status==='rework'?'أعيد الطلب للتعديل':r.status==='rejected'?'تم رفض الطلب':'تم تسجيل الموافقة');openRequest(req.id);
 });
}
function bindActions(){
 $$('[data-action]').forEach(el=>el.onclick=async()=>{const action=el.dataset.action;
 try{
  if(action==='new-request')return newRequestDialog();
  if(action==='go-requests')return navigate('requests');
  if(action==='add-destination')return modal('إنشاء وجهة جديدة',`<div class="fields">${field('name','اسم الوجهة','text','','required')}${field('city','المدينة','text','','required')}</div>`,async v=>{await api('/destinations',{method:'POST',data:v});toast('تم إنشاء الوجهة');navigate('destinations')});
  if(action==='add-budget'){
   const d=await api('/destinations');return modal('إنشاء اتفاقية ميزانية',`<div class="fields">${selectField('destination_id','الوجهة',d.map(x=>[x.id,x.name]),'','اختر الوجهة','required')}${field('name','اسم الميزانية / الاتفاقية','text','','required')}${selectField('budget_type','نوع الخصم',[['infra','البنية التحتية'],['installment','القسط الميسر']],'infra','')}${field('total_amount','قيمة الميزانية (ر.س)','number',0,'required')}</div>`,async v=>{await api('/budgets',{method:'POST',data:{...v,destination_id:Number(v.destination_id)}});toast('تم إنشاء الميزانية');navigate('destinations')});
  }
  if(action==='add-agreement')return modal('إضافة اتفاقية تطوير',`<div class="fields">${field('contract_no','رقم العقد','text','','required')}${field('developer','اسم المطور','text','','required')}${field('project_name','اسم المشروع','text','','required')}${field('zone','المنطقة (Zone)')}${field('agreement_model','نموذج الاتفاقية')}${field('start_date','تاريخ البداية','date')}${field('end_date','تاريخ النهاية','date')}${field('land_area','مساحة الأرض','number',0)}${field('meter_price','سعر المتر الشامل','number',0)}</div>`,async v=>{await api('/agreements',{method:'POST',data:v});toast('تم حفظ الاتفاقية');navigate('agreements')});
  if(action==='add-project'){
   const [d,a]=await Promise.all([api('/destinations'),api('/agreements')]);return modal('تعريف مشروع جديد',`<div class="fields">${field('code','رمز المشروع','text','','required')}${field('name','اسم المشروع','text','','required')}${selectField('destination_id','الوجهة',d.map(x=>[x.id,x.name]),'','اختر','required')}${selectField('agreement_id','الاتفاقية',a.map(x=>[x.id,`${x.contract_no} — ${x.developer}`]),'','اختر','required')}${selectField('project_type','نوع المشروع',[['ministry','أرض وزارة'],['company','أرض شركة']],'ministry','')}${field('ministry_factor','معامل تخصيص أرض الوزارة (يتطلب تأكيد الأعمال)','number',0.2941)}</div>`,async v=>{await api('/projects',{method:'POST',data:{...v,destination_id:Number(v.destination_id),agreement_id:Number(v.agreement_id)}});toast('تم إنشاء المشروع');navigate('projects')});
  }
  if(action==='add-user')return modal('إضافة مستخدم',`<div class="fields">${field('username','اسم المستخدم','text','','required')}${field('name','الاسم الكامل','text','','required')}${selectField('role','الدور',Object.entries(ROLE_LABELS),'maker','')}${field('password','كلمة المرور (10 أحرف على الأقل)','password','','required')}</div>`,async v=>{await api('/users',{method:'POST',data:v});toast('تم إنشاء الحساب');navigate('users')});
  if(action==='export-units')return window.location.assign(`/api/exports/units.xlsx?project_id=${state.projectFilter}`);
  if(action==='add-request-item')return chooseRequestUnit();
  if(action==='import-request')return importDialog();
  if(action==='preview-request'){
   const r=await api(`/requests/${state.currentRequest.id}/preview`,{method:'POST'});
   return modal('معاينة حسابات الطلب',`<div class="mini-grid"><div class="info-block"><small>الوحدات</small><strong>${r.count}</strong></div><div class="info-block"><small>قبل التعديل</small><strong class="numeric">${cash(r.before)}</strong></div><div class="info-block"><small>بعد التعديل</small><strong class="numeric">${cash(r.after)}</strong></div></div><div class="info-block"><small>فرق إجمالي أسعار المستفيدين</small><strong class="numeric">${cash(r.delta)} ر.س</strong></div>${r.warnings.map(w=>`<div class="insight warn" style="margin-top:14px">${H(w)}</div>`).join('')}`);
  }
  if(action==='submit-request')return actionDialog('submit');
  if(action==='approve-request')return actionDialog('approve');
  if(action==='rework-request')return actionDialog('rework');
  if(action==='reject-request')return actionDialog('reject');
 }catch(e){showError(e)}
 });
}
async function bootstrap(){
 try{state.demo=(await api('/config')).demo}catch(_){}
 try{const res=await api('/auth/me');state.user=res.user;state.csrf=res.csrf;shell();navigate('dashboard')}
 catch(e){if(!state.user)loginView()}
}
bootstrap();
