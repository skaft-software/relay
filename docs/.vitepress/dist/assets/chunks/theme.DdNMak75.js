const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/VPLocalSearchBox.BEVN6Q-h.js","assets/chunks/framework.b3aQeZRM.js"])))=>i.map(i=>d[i]);
import{d as Ce,c as j,r as te,n as lt,o as B,a as _i,t as ht,b as Ue,w as oe,T as To,e as Te,_ as Le,u as Zu,i as ju,f as Ju,g as Co,h as Ve,j as Z,k as X,l as vi,m as Ca,p as et,q as Vn,s as ws,v as wn,x as br,y as wo,z as Qu,A as ed,F as St,B as Yt,C as Ai,D as Rs,E as De,G as zc,H as En,I as Gc,J as Ns,K as ii,L as Fs,M as td,N as Ro,O as wa,P as No,Q as Hc,R as Ps,S as nd,U as id,V as rd,W as Wc,X as $c,Y as sd,Z as ad,$ as od,a0 as ld,a1 as cd,a2 as ps,a3 as ar}from"./framework.b3aQeZRM.js";const ud=Ce({__name:"VPBadge",props:{text:{},type:{default:"tip"}},setup(n){return(e,t)=>(B(),j("span",{class:lt(["VPBadge",n.type])},[te(e.$slots,"default",{},()=>[_i(ht(n.text),1)])],2))}}),dd={key:0,class:"VPBackdrop"},fd=Ce({__name:"VPBackdrop",props:{show:{type:Boolean}},setup(n){return(e,t)=>(B(),Ue(To,{name:"fade"},{default:oe(()=>[n.show?(B(),j("div",dd)):Te("",!0)]),_:1}))}}),hd=Le(fd,[["__scopeId","data-v-c79a1216"]]),je=Zu;function pd(n,e){let t,i=!1;return()=>{t&&clearTimeout(t),i?t=setTimeout(n,e):(n(),(i=!0)&&setTimeout(()=>i=!1,e))}}function Ra(n){return n.startsWith("/")?n:`/${n}`}function Fo(n){const{pathname:e,search:t,hash:i,protocol:r}=new URL(n,"http://a.com");if(ju(n)||n.startsWith("#")||!r.startsWith("http")||!Ju(e))return n;const{site:s}=je(),a=e.endsWith("/")||e.endsWith(".html")?n:n.replace(/(?:(^\.+)\/)?.*$/,`$1${e.replace(/(\.md)?$/,s.value.cleanUrls?"":".html")}${t}${i}`);return Co(a)}function Ar({correspondingLink:n=!1}={}){const{site:e,localeIndex:t,page:i,theme:r,hash:s}=je(),a=Ve(()=>{var l,c;return{label:(l=e.value.locales[t.value])==null?void 0:l.label,link:((c=e.value.locales[t.value])==null?void 0:c.link)||(t.value==="root"?"/":`/${t.value}/`)}});return{localeLinks:Ve(()=>Object.entries(e.value.locales).flatMap(([l,c])=>a.value.label===c.label?[]:{text:c.label,link:md(c.link||(l==="root"?"/":`/${l}/`),r.value.i18nRouting!==!1&&n,i.value.relativePath.slice(a.value.link.length-1),!e.value.cleanUrls)+s.value})),currentLang:a}}function md(n,e,t,i){return e?n.replace(/\/$/,"")+Ra(t.replace(/(^|\/)index\.md$/,"$1").replace(/\.md$/,i?".html":"")):n}const xd={class:"NotFound"},gd={class:"code"},_d={class:"title"},vd={class:"quote"},Sd={class:"action"},Md=["href","aria-label"],Ed=Ce({__name:"NotFound",setup(n){const{theme:e}=je(),{currentLang:t}=Ar();return(i,r)=>{var s,a,o,l,c;return B(),j("div",xd,[Z("p",gd,ht(((s=X(e).notFound)==null?void 0:s.code)??"404"),1),Z("h1",_d,ht(((a=X(e).notFound)==null?void 0:a.title)??"PAGE NOT FOUND"),1),r[0]||(r[0]=Z("div",{class:"divider"},null,-1)),Z("blockquote",vd,ht(((o=X(e).notFound)==null?void 0:o.quote)??"But if you don't change your direction, and if you keep looking, you may end up where you are heading."),1),Z("div",Sd,[Z("a",{class:"link",href:X(Co)(X(t).link),"aria-label":((l=X(e).notFound)==null?void 0:l.linkLabel)??"go to home"},ht(((c=X(e).notFound)==null?void 0:c.linkText)??"Take me home"),9,Md)])])}}}),bd=Le(Ed,[["__scopeId","data-v-d6be1790"]]);function Xc(n,e){if(Array.isArray(n))return as(n);if(n==null)return[];e=Ra(e);const t=Object.keys(n).sort((r,s)=>s.split("/").length-r.split("/").length).find(r=>e.startsWith(Ra(r))),i=t?n[t]:[];return Array.isArray(i)?as(i):as(i.items,i.base)}function Ad(n){const e=[];let t=0;for(const i in n){const r=n[i];if(r.items){t=e.push(r);continue}e[t]||e.push({items:[]}),e[t].items.push(r)}return e}function yd(n){const e=[];function t(i){for(const r of i)r.text&&r.link&&e.push({text:r.text,link:r.link,docFooterText:r.docFooterText}),r.items&&t(r.items)}return t(n),e}function Na(n,e){return Array.isArray(e)?e.some(t=>Na(n,t)):vi(n,e.link)?!0:e.items?Na(n,e.items):!1}function as(n,e){return[...n].map(t=>{const i={...t},r=i.base||e;return r&&i.link&&(i.link=r+i.link),i.items&&(i.items=as(i.items,r)),i})}function Wn(){const{frontmatter:n,page:e,theme:t}=je(),i=Ca("(min-width: 960px)"),r=et(!1),s=Ve(()=>{const S=t.value.sidebar,m=e.value.relativePath;return S?Xc(S,m):[]}),a=et(s.value);Vn(s,(S,m)=>{JSON.stringify(S)!==JSON.stringify(m)&&(a.value=s.value)});const o=Ve(()=>n.value.sidebar!==!1&&a.value.length>0&&n.value.layout!=="home"),l=Ve(()=>c?n.value.aside==null?t.value.aside==="left":n.value.aside==="left":!1),c=Ve(()=>n.value.layout==="home"?!1:n.value.aside!=null?!!n.value.aside:t.value.aside!==!1),d=Ve(()=>o.value&&i.value),f=Ve(()=>o.value?Ad(a.value):[]);function u(){r.value=!0}function p(){r.value=!1}function x(){r.value?p():u()}return{isOpen:r,sidebar:a,sidebarGroups:f,hasSidebar:o,hasAside:c,leftAside:l,isSidebarEnabled:d,open:u,close:p,toggle:x}}function Td(n,e){let t;ws(()=>{t=n.value?document.activeElement:void 0}),wn(()=>{window.addEventListener("keyup",i)}),br(()=>{window.removeEventListener("keyup",i)});function i(r){r.key==="Escape"&&n.value&&(e(),t==null||t.focus())}}function Cd(n){const{page:e,hash:t}=je(),i=et(!1),r=Ve(()=>n.value.collapsed!=null),s=Ve(()=>!!n.value.link),a=et(!1),o=()=>{a.value=vi(e.value.relativePath,n.value.link)};Vn([e,n,t],o),wn(o);const l=Ve(()=>a.value?!0:n.value.items?Na(e.value.relativePath,n.value.items):!1),c=Ve(()=>!!(n.value.items&&n.value.items.length));ws(()=>{i.value=!!(r.value&&n.value.collapsed)}),wo(()=>{(a.value||l.value)&&(i.value=!1)});function d(){r.value&&(i.value=!i.value)}return{collapsed:i,collapsible:r,isLink:s,isActiveLink:a,hasActiveLink:l,hasChildren:c,toggle:d}}function wd(){const{hasSidebar:n}=Wn(),e=Ca("(min-width: 960px)"),t=Ca("(min-width: 1280px)");return{isAsideEnabled:Ve(()=>!t.value&&!e.value?!1:n.value?t.value:e.value)}}const Rd=/\b(?:VPBadge|header-anchor|footnote-ref|ignore-header)\b/,Fa=[];function qc(n){return typeof n.outline=="object"&&!Array.isArray(n.outline)&&n.outline.label||n.outlineTitle||"On this page"}function Po(n){const e=[...document.querySelectorAll(".VPDoc :where(h1,h2,h3,h4,h5,h6)")].filter(t=>t.id&&t.hasChildNodes()).map(t=>{const i=Number(t.tagName[1]);return{element:t,title:Nd(t),link:"#"+t.id,level:i}});return Fd(e,n)}function Nd(n){let e="";for(const t of n.childNodes)if(t.nodeType===1){if(Rd.test(t.className))continue;e+=t.textContent}else t.nodeType===3&&(e+=t.textContent);return e.trim()}function Fd(n,e){if(e===!1)return[];const t=(typeof e=="object"&&!Array.isArray(e)?e.level:e)||2,[i,r]=typeof t=="number"?[t,t]:t==="deep"?[2,6]:t;return Dd(n,i,r)}function Pd(n,e){const{isAsideEnabled:t}=wd(),i=pd(s,100);let r=null;wn(()=>{requestAnimationFrame(s),window.addEventListener("scroll",i)}),Qu(()=>{a(location.hash)}),br(()=>{window.removeEventListener("scroll",i)});function s(){if(!t.value)return;const o=window.scrollY,l=window.innerHeight,c=document.body.offsetHeight,d=Math.abs(o+l-c)<1,f=Fa.map(({element:p,link:x})=>({link:x,top:Ld(p)})).filter(({top:p})=>!Number.isNaN(p)).sort((p,x)=>p.top-x.top);if(!f.length){a(null);return}if(o<1){a(null);return}if(d){a(f[f.length-1].link);return}let u=null;for(const{link:p,top:x}of f){if(x>o+ed()+4)break;u=p}a(u)}function a(o){r&&r.classList.remove("active"),o==null?r=null:r=n.value.querySelector(`a[href="${decodeURIComponent(o)}"]`);const l=r;l?(l.classList.add("active"),e.value.style.top=l.offsetTop+39+"px",e.value.style.opacity="1"):(e.value.style.top="33px",e.value.style.opacity="0")}}function Ld(n){let e=0;for(;n!==document.body;){if(n===null)return NaN;e+=n.offsetTop,n=n.offsetParent}return e}function Dd(n,e,t){Fa.length=0;const i=[],r=[];return n.forEach(s=>{const a={...s,children:[]};let o=r[r.length-1];for(;o&&o.level>=a.level;)r.pop(),o=r[r.length-1];if(a.element.classList.contains("ignore-header")||o&&"shouldIgnore"in o){r.push({level:a.level,shouldIgnore:!0});return}a.level>t||a.level<e||(Fa.push({element:a.element,link:a.link}),o?o.children.push(a):i.push(a),r.push(a))}),i}const Id=["href","title"],Ud=Ce({__name:"VPDocOutlineItem",props:{headers:{},root:{type:Boolean}},setup(n){function e({target:t}){const i=t.href.split("#")[1],r=document.getElementById(decodeURIComponent(i));r==null||r.focus({preventScroll:!0})}return(t,i)=>{const r=Ai("VPDocOutlineItem",!0);return B(),j("ul",{class:lt(["VPDocOutlineItem",n.root?"root":"nested"])},[(B(!0),j(St,null,Yt(n.headers,({children:s,link:a,title:o})=>(B(),j("li",null,[Z("a",{class:"outline-link",href:a,onClick:e,title:o},ht(o),9,Id),s!=null&&s.length?(B(),Ue(r,{key:0,headers:s},null,8,["headers"])):Te("",!0)]))),256))],2)}}}),Yc=Le(Ud,[["__scopeId","data-v-b933a997"]]),Bd={class:"content"},Od={"aria-level":"2",class:"outline-title",id:"doc-outline-aria-label",role:"heading"},kd=Ce({__name:"VPDocAsideOutline",setup(n){const{frontmatter:e,theme:t}=je(),i=zc([]);Rs(()=>{i.value=Po(e.value.outline??t.value.outline)});const r=et(),s=et();return Pd(r,s),(a,o)=>(B(),j("nav",{"aria-labelledby":"doc-outline-aria-label",class:lt(["VPDocAsideOutline",{"has-outline":i.value.length>0}]),ref_key:"container",ref:r},[Z("div",Bd,[Z("div",{class:"outline-marker",ref_key:"marker",ref:s},null,512),Z("div",Od,ht(X(qc)(X(t))),1),De(Yc,{headers:i.value,root:!0},null,8,["headers"])])],2))}}),Vd=Le(kd,[["__scopeId","data-v-a5bbad30"]]),zd={class:"VPDocAsideCarbonAds"},Gd=Ce({__name:"VPDocAsideCarbonAds",props:{carbonAds:{}},setup(n){const e=()=>null;return(t,i)=>(B(),j("div",zd,[De(X(e),{"carbon-ads":n.carbonAds},null,8,["carbon-ads"])]))}}),Hd={class:"VPDocAside"},Wd=Ce({__name:"VPDocAside",setup(n){const{theme:e}=je();return(t,i)=>(B(),j("div",Hd,[te(t.$slots,"aside-top",{},void 0,!0),te(t.$slots,"aside-outline-before",{},void 0,!0),De(Vd),te(t.$slots,"aside-outline-after",{},void 0,!0),i[0]||(i[0]=Z("div",{class:"spacer"},null,-1)),te(t.$slots,"aside-ads-before",{},void 0,!0),X(e).carbonAds?(B(),Ue(Gd,{key:0,"carbon-ads":X(e).carbonAds},null,8,["carbon-ads"])):Te("",!0),te(t.$slots,"aside-ads-after",{},void 0,!0),te(t.$slots,"aside-bottom",{},void 0,!0)]))}}),$d=Le(Wd,[["__scopeId","data-v-3f215769"]]);function Xd(){const{theme:n,page:e}=je();return Ve(()=>{const{text:t="Edit this page",pattern:i=""}=n.value.editLink||{};let r;return typeof i=="function"?r=i(e.value):r=i.replace(/:path/g,e.value.filePath),{url:r,text:t}})}function qd(){const{page:n,theme:e,frontmatter:t}=je();return Ve(()=>{var c,d,f,u,p,x,S,m;const i=Xc(e.value.sidebar,n.value.relativePath),r=yd(i),s=Yd(r,h=>h.link.replace(/[?#].*$/,"")),a=s.findIndex(h=>vi(n.value.relativePath,h.link)),o=((c=e.value.docFooter)==null?void 0:c.prev)===!1&&!t.value.prev||t.value.prev===!1,l=((d=e.value.docFooter)==null?void 0:d.next)===!1&&!t.value.next||t.value.next===!1;return{prev:o?void 0:{text:(typeof t.value.prev=="string"?t.value.prev:typeof t.value.prev=="object"?t.value.prev.text:void 0)??((f=s[a-1])==null?void 0:f.docFooterText)??((u=s[a-1])==null?void 0:u.text),link:(typeof t.value.prev=="object"?t.value.prev.link:void 0)??((p=s[a-1])==null?void 0:p.link)},next:l?void 0:{text:(typeof t.value.next=="string"?t.value.next:typeof t.value.next=="object"?t.value.next.text:void 0)??((x=s[a+1])==null?void 0:x.docFooterText)??((S=s[a+1])==null?void 0:S.text),link:(typeof t.value.next=="object"?t.value.next.link:void 0)??((m=s[a+1])==null?void 0:m.link)}}})}function Yd(n,e){const t=new Set;return n.filter(i=>{const r=e(i);return t.has(r)?!1:t.add(r)})}const bn=Ce({__name:"VPLink",props:{tag:{},href:{},noIcon:{type:Boolean},target:{},rel:{}},setup(n){const e=n,t=Ve(()=>e.tag??(e.href?"a":"span")),i=Ve(()=>e.href&&Gc.test(e.href)||e.target==="_blank");return(r,s)=>(B(),Ue(En(t.value),{class:lt(["VPLink",{link:n.href,"vp-external-link-icon":i.value,"no-icon":n.noIcon}]),href:n.href?X(Fo)(n.href):void 0,target:n.target??(i.value?"_blank":void 0),rel:n.rel??(i.value?"noreferrer":void 0)},{default:oe(()=>[te(r.$slots,"default")]),_:3},8,["class","href","target","rel"]))}}),Kd={class:"VPLastUpdated"},Zd=["datetime"],jd=Ce({__name:"VPDocFooterLastUpdated",setup(n){const{theme:e,page:t,lang:i}=je(),r=Ve(()=>new Date(t.value.lastUpdated)),s=Ve(()=>r.value.toISOString()),a=et("");return wn(()=>{ws(()=>{var o,l,c;a.value=new Intl.DateTimeFormat((l=(o=e.value.lastUpdated)==null?void 0:o.formatOptions)!=null&&l.forceLocale?i.value:void 0,((c=e.value.lastUpdated)==null?void 0:c.formatOptions)??{dateStyle:"short",timeStyle:"short"}).format(r.value)})}),(o,l)=>{var c;return B(),j("p",Kd,[_i(ht(((c=X(e).lastUpdated)==null?void 0:c.text)||X(e).lastUpdatedText||"Last updated")+": ",1),Z("time",{datetime:s.value},ht(a.value),9,Zd)])}}}),Jd=Le(jd,[["__scopeId","data-v-e98dd255"]]),Qd={key:0,class:"VPDocFooter"},ef={key:0,class:"edit-info"},tf={key:0,class:"edit-link"},nf={key:1,class:"last-updated"},rf={key:1,class:"prev-next","aria-labelledby":"doc-footer-aria-label"},sf={class:"pager"},af=["innerHTML"],of=["innerHTML"],lf={class:"pager"},cf=["innerHTML"],uf=["innerHTML"],df=Ce({__name:"VPDocFooter",setup(n){const{theme:e,page:t,frontmatter:i}=je(),r=Xd(),s=qd(),a=Ve(()=>e.value.editLink&&i.value.editLink!==!1),o=Ve(()=>t.value.lastUpdated),l=Ve(()=>a.value||o.value||s.value.prev||s.value.next);return(c,d)=>{var f,u,p,x;return l.value?(B(),j("footer",Qd,[te(c.$slots,"doc-footer-before",{},void 0,!0),a.value||o.value?(B(),j("div",ef,[a.value?(B(),j("div",tf,[De(bn,{class:"edit-link-button",href:X(r).url,"no-icon":!0},{default:oe(()=>[d[0]||(d[0]=Z("span",{class:"vpi-square-pen edit-link-icon"},null,-1)),_i(" "+ht(X(r).text),1)]),_:1},8,["href"])])):Te("",!0),o.value?(B(),j("div",nf,[De(Jd)])):Te("",!0)])):Te("",!0),(f=X(s).prev)!=null&&f.link||(u=X(s).next)!=null&&u.link?(B(),j("nav",rf,[d[1]||(d[1]=Z("span",{class:"visually-hidden",id:"doc-footer-aria-label"},"Pager",-1)),Z("div",sf,[(p=X(s).prev)!=null&&p.link?(B(),Ue(bn,{key:0,class:"pager-link prev",href:X(s).prev.link},{default:oe(()=>{var S;return[Z("span",{class:"desc",innerHTML:((S=X(e).docFooter)==null?void 0:S.prev)||"Previous page"},null,8,af),Z("span",{class:"title",innerHTML:X(s).prev.text},null,8,of)]}),_:1},8,["href"])):Te("",!0)]),Z("div",lf,[(x=X(s).next)!=null&&x.link?(B(),Ue(bn,{key:0,class:"pager-link next",href:X(s).next.link},{default:oe(()=>{var S;return[Z("span",{class:"desc",innerHTML:((S=X(e).docFooter)==null?void 0:S.next)||"Next page"},null,8,cf),Z("span",{class:"title",innerHTML:X(s).next.text},null,8,uf)]}),_:1},8,["href"])):Te("",!0)])])):Te("",!0)])):Te("",!0)}}}),ff=Le(df,[["__scopeId","data-v-e257564d"]]),hf={class:"container"},pf={class:"aside-container"},mf={class:"aside-content"},xf={class:"content"},gf={class:"content-container"},_f={class:"main"},vf=Ce({__name:"VPDoc",setup(n){const{theme:e}=je(),t=Ns(),{hasSidebar:i,hasAside:r,leftAside:s}=Wn(),a=Ve(()=>t.path.replace(/[./]+/g,"_").replace(/_html$/,""));return(o,l)=>{const c=Ai("Content");return B(),j("div",{class:lt(["VPDoc",{"has-sidebar":X(i),"has-aside":X(r)}])},[te(o.$slots,"doc-top",{},void 0,!0),Z("div",hf,[X(r)?(B(),j("div",{key:0,class:lt(["aside",{"left-aside":X(s)}])},[l[0]||(l[0]=Z("div",{class:"aside-curtain"},null,-1)),Z("div",pf,[Z("div",mf,[De($d,null,{"aside-top":oe(()=>[te(o.$slots,"aside-top",{},void 0,!0)]),"aside-bottom":oe(()=>[te(o.$slots,"aside-bottom",{},void 0,!0)]),"aside-outline-before":oe(()=>[te(o.$slots,"aside-outline-before",{},void 0,!0)]),"aside-outline-after":oe(()=>[te(o.$slots,"aside-outline-after",{},void 0,!0)]),"aside-ads-before":oe(()=>[te(o.$slots,"aside-ads-before",{},void 0,!0)]),"aside-ads-after":oe(()=>[te(o.$slots,"aside-ads-after",{},void 0,!0)]),_:3})])])],2)):Te("",!0),Z("div",xf,[Z("div",gf,[te(o.$slots,"doc-before",{},void 0,!0),Z("main",_f,[De(c,{class:lt(["vp-doc",[a.value,X(e).externalLinkIcon&&"external-link-icon-enabled"]])},null,8,["class"])]),De(ff,null,{"doc-footer-before":oe(()=>[te(o.$slots,"doc-footer-before",{},void 0,!0)]),_:3}),te(o.$slots,"doc-after",{},void 0,!0)])])]),te(o.$slots,"doc-bottom",{},void 0,!0)],2)}}}),Sf=Le(vf,[["__scopeId","data-v-39a288b8"]]),Mf=Ce({__name:"VPButton",props:{tag:{},size:{default:"medium"},theme:{default:"brand"},text:{},href:{},target:{},rel:{}},setup(n){const e=n,t=Ve(()=>e.href&&Gc.test(e.href)),i=Ve(()=>e.tag||(e.href?"a":"button"));return(r,s)=>(B(),Ue(En(i.value),{class:lt(["VPButton",[n.size,n.theme]]),href:n.href?X(Fo)(n.href):void 0,target:e.target??(t.value?"_blank":void 0),rel:e.rel??(t.value?"noreferrer":void 0)},{default:oe(()=>[_i(ht(n.text),1)]),_:1},8,["class","href","target","rel"]))}}),Ef=Le(Mf,[["__scopeId","data-v-fa7799d5"]]),bf=["src","alt"],Af=Ce({inheritAttrs:!1,__name:"VPImage",props:{image:{},alt:{}},setup(n){return(e,t)=>{const i=Ai("VPImage",!0);return n.image?(B(),j(St,{key:0},[typeof n.image=="string"||"src"in n.image?(B(),j("img",ii({key:0,class:"VPImage"},typeof n.image=="string"?e.$attrs:{...n.image,...e.$attrs},{src:X(Co)(typeof n.image=="string"?n.image:n.image.src),alt:n.alt??(typeof n.image=="string"?"":n.image.alt||"")}),null,16,bf)):(B(),j(St,{key:1},[De(i,ii({class:"dark",image:n.image.dark,alt:n.image.alt},e.$attrs),null,16,["image","alt"]),De(i,ii({class:"light",image:n.image.light,alt:n.image.alt},e.$attrs),null,16,["image","alt"])],64))],64)):Te("",!0)}}}),ms=Le(Af,[["__scopeId","data-v-8426fc1a"]]),yf={class:"container"},Tf={class:"main"},Cf={class:"heading"},wf=["innerHTML"],Rf=["innerHTML"],Nf=["innerHTML"],Ff={key:0,class:"actions"},Pf={key:0,class:"image"},Lf={class:"image-container"},Df=Ce({__name:"VPHero",props:{name:{},text:{},tagline:{},image:{},actions:{}},setup(n){const e=Fs("hero-image-slot-exists");return(t,i)=>(B(),j("div",{class:lt(["VPHero",{"has-image":n.image||X(e)}])},[Z("div",yf,[Z("div",Tf,[te(t.$slots,"home-hero-info-before",{},void 0,!0),te(t.$slots,"home-hero-info",{},()=>[Z("h1",Cf,[n.name?(B(),j("span",{key:0,innerHTML:n.name,class:"name clip"},null,8,wf)):Te("",!0),n.text?(B(),j("span",{key:1,innerHTML:n.text,class:"text"},null,8,Rf)):Te("",!0)]),n.tagline?(B(),j("p",{key:0,innerHTML:n.tagline,class:"tagline"},null,8,Nf)):Te("",!0)],!0),te(t.$slots,"home-hero-info-after",{},void 0,!0),n.actions?(B(),j("div",Ff,[(B(!0),j(St,null,Yt(n.actions,r=>(B(),j("div",{key:r.link,class:"action"},[De(Ef,{tag:"a",size:"medium",theme:r.theme,text:r.text,href:r.link,target:r.target,rel:r.rel},null,8,["theme","text","href","target","rel"])]))),128))])):Te("",!0),te(t.$slots,"home-hero-actions-after",{},void 0,!0)]),n.image||X(e)?(B(),j("div",Pf,[Z("div",Lf,[i[0]||(i[0]=Z("div",{class:"image-bg"},null,-1)),te(t.$slots,"home-hero-image",{},()=>[n.image?(B(),Ue(ms,{key:0,class:"image-src",image:n.image},null,8,["image"])):Te("",!0)],!0)])])):Te("",!0)])],2))}}),If=Le(Df,[["__scopeId","data-v-4f9c455b"]]),Uf=Ce({__name:"VPHomeHero",setup(n){const{frontmatter:e}=je();return(t,i)=>X(e).hero?(B(),Ue(If,{key:0,class:"VPHomeHero",name:X(e).hero.name,text:X(e).hero.text,tagline:X(e).hero.tagline,image:X(e).hero.image,actions:X(e).hero.actions},{"home-hero-info-before":oe(()=>[te(t.$slots,"home-hero-info-before")]),"home-hero-info":oe(()=>[te(t.$slots,"home-hero-info")]),"home-hero-info-after":oe(()=>[te(t.$slots,"home-hero-info-after")]),"home-hero-actions-after":oe(()=>[te(t.$slots,"home-hero-actions-after")]),"home-hero-image":oe(()=>[te(t.$slots,"home-hero-image")]),_:3},8,["name","text","tagline","image","actions"])):Te("",!0)}}),Bf={class:"box"},Of={key:0,class:"icon"},kf=["innerHTML"],Vf=["innerHTML"],zf=["innerHTML"],Gf={key:4,class:"link-text"},Hf={class:"link-text-value"},Wf=Ce({__name:"VPFeature",props:{icon:{},title:{},details:{},link:{},linkText:{},rel:{},target:{}},setup(n){return(e,t)=>(B(),Ue(bn,{class:"VPFeature",href:n.link,rel:n.rel,target:n.target,"no-icon":!0,tag:n.link?"a":"div"},{default:oe(()=>[Z("article",Bf,[typeof n.icon=="object"&&n.icon.wrap?(B(),j("div",Of,[De(ms,{image:n.icon,alt:n.icon.alt,height:n.icon.height||48,width:n.icon.width||48},null,8,["image","alt","height","width"])])):typeof n.icon=="object"?(B(),Ue(ms,{key:1,image:n.icon,alt:n.icon.alt,height:n.icon.height||48,width:n.icon.width||48},null,8,["image","alt","height","width"])):n.icon?(B(),j("div",{key:2,class:"icon",innerHTML:n.icon},null,8,kf)):Te("",!0),Z("h2",{class:"title",innerHTML:n.title},null,8,Vf),n.details?(B(),j("p",{key:3,class:"details",innerHTML:n.details},null,8,zf)):Te("",!0),n.linkText?(B(),j("div",Gf,[Z("p",Hf,[_i(ht(n.linkText)+" ",1),t[0]||(t[0]=Z("span",{class:"vpi-arrow-right link-text-icon"},null,-1))])])):Te("",!0)])]),_:1},8,["href","rel","target","tag"]))}}),$f=Le(Wf,[["__scopeId","data-v-a3976bdc"]]),Xf={key:0,class:"VPFeatures"},qf={class:"container"},Yf={class:"items"},Kf=Ce({__name:"VPFeatures",props:{features:{}},setup(n){const e=n,t=Ve(()=>{const i=e.features.length;if(i){if(i===2)return"grid-2";if(i===3)return"grid-3";if(i%3===0)return"grid-6";if(i>3)return"grid-4"}else return});return(i,r)=>n.features?(B(),j("div",Xf,[Z("div",qf,[Z("div",Yf,[(B(!0),j(St,null,Yt(n.features,s=>(B(),j("div",{key:s.title,class:lt(["item",[t.value]])},[De($f,{icon:s.icon,title:s.title,details:s.details,link:s.link,"link-text":s.linkText,rel:s.rel,target:s.target},null,8,["icon","title","details","link","link-text","rel","target"])],2))),128))])])])):Te("",!0)}}),Zf=Le(Kf,[["__scopeId","data-v-a6181336"]]),jf=Ce({__name:"VPHomeFeatures",setup(n){const{frontmatter:e}=je();return(t,i)=>X(e).features?(B(),Ue(Zf,{key:0,class:"VPHomeFeatures",features:X(e).features},null,8,["features"])):Te("",!0)}}),Jf=Ce({__name:"VPHomeContent",setup(n){const{width:e}=td({initialWidth:0,includeScrollbar:!1});return(t,i)=>(B(),j("div",{class:"vp-doc container",style:Ro(X(e)?{"--vp-offset":`calc(50% - ${X(e)/2}px)`}:{})},[te(t.$slots,"default",{},void 0,!0)],4))}}),Qf=Le(Jf,[["__scopeId","data-v-8e2d4988"]]),eh=Ce({__name:"VPHome",setup(n){const{frontmatter:e,theme:t}=je();return(i,r)=>{const s=Ai("Content");return B(),j("div",{class:lt(["VPHome",{"external-link-icon-enabled":X(t).externalLinkIcon}])},[te(i.$slots,"home-hero-before",{},void 0,!0),De(Uf,null,{"home-hero-info-before":oe(()=>[te(i.$slots,"home-hero-info-before",{},void 0,!0)]),"home-hero-info":oe(()=>[te(i.$slots,"home-hero-info",{},void 0,!0)]),"home-hero-info-after":oe(()=>[te(i.$slots,"home-hero-info-after",{},void 0,!0)]),"home-hero-actions-after":oe(()=>[te(i.$slots,"home-hero-actions-after",{},void 0,!0)]),"home-hero-image":oe(()=>[te(i.$slots,"home-hero-image",{},void 0,!0)]),_:3}),te(i.$slots,"home-hero-after",{},void 0,!0),te(i.$slots,"home-features-before",{},void 0,!0),De(jf),te(i.$slots,"home-features-after",{},void 0,!0),X(e).markdownStyles!==!1?(B(),Ue(Qf,{key:0},{default:oe(()=>[De(s)]),_:1})):(B(),Ue(s,{key:1}))],2)}}}),th=Le(eh,[["__scopeId","data-v-8b561e3d"]]),nh={},ih={class:"VPPage"};function rh(n,e){const t=Ai("Content");return B(),j("div",ih,[te(n.$slots,"page-top"),De(t),te(n.$slots,"page-bottom")])}const sh=Le(nh,[["render",rh]]),ah=Ce({__name:"VPContent",setup(n){const{page:e,frontmatter:t}=je(),{hasSidebar:i}=Wn();return(r,s)=>(B(),j("div",{class:lt(["VPContent",{"has-sidebar":X(i),"is-home":X(t).layout==="home"}]),id:"VPContent"},[X(e).isNotFound?te(r.$slots,"not-found",{key:0},()=>[De(bd)],!0):X(t).layout==="page"?(B(),Ue(sh,{key:1},{"page-top":oe(()=>[te(r.$slots,"page-top",{},void 0,!0)]),"page-bottom":oe(()=>[te(r.$slots,"page-bottom",{},void 0,!0)]),_:3})):X(t).layout==="home"?(B(),Ue(th,{key:2},{"home-hero-before":oe(()=>[te(r.$slots,"home-hero-before",{},void 0,!0)]),"home-hero-info-before":oe(()=>[te(r.$slots,"home-hero-info-before",{},void 0,!0)]),"home-hero-info":oe(()=>[te(r.$slots,"home-hero-info",{},void 0,!0)]),"home-hero-info-after":oe(()=>[te(r.$slots,"home-hero-info-after",{},void 0,!0)]),"home-hero-actions-after":oe(()=>[te(r.$slots,"home-hero-actions-after",{},void 0,!0)]),"home-hero-image":oe(()=>[te(r.$slots,"home-hero-image",{},void 0,!0)]),"home-hero-after":oe(()=>[te(r.$slots,"home-hero-after",{},void 0,!0)]),"home-features-before":oe(()=>[te(r.$slots,"home-features-before",{},void 0,!0)]),"home-features-after":oe(()=>[te(r.$slots,"home-features-after",{},void 0,!0)]),_:3})):X(t).layout&&X(t).layout!=="doc"?(B(),Ue(En(X(t).layout),{key:3})):(B(),Ue(Sf,{key:4},{"doc-top":oe(()=>[te(r.$slots,"doc-top",{},void 0,!0)]),"doc-bottom":oe(()=>[te(r.$slots,"doc-bottom",{},void 0,!0)]),"doc-footer-before":oe(()=>[te(r.$slots,"doc-footer-before",{},void 0,!0)]),"doc-before":oe(()=>[te(r.$slots,"doc-before",{},void 0,!0)]),"doc-after":oe(()=>[te(r.$slots,"doc-after",{},void 0,!0)]),"aside-top":oe(()=>[te(r.$slots,"aside-top",{},void 0,!0)]),"aside-outline-before":oe(()=>[te(r.$slots,"aside-outline-before",{},void 0,!0)]),"aside-outline-after":oe(()=>[te(r.$slots,"aside-outline-after",{},void 0,!0)]),"aside-ads-before":oe(()=>[te(r.$slots,"aside-ads-before",{},void 0,!0)]),"aside-ads-after":oe(()=>[te(r.$slots,"aside-ads-after",{},void 0,!0)]),"aside-bottom":oe(()=>[te(r.$slots,"aside-bottom",{},void 0,!0)]),_:3}))],2))}}),oh=Le(ah,[["__scopeId","data-v-1428d186"]]),lh={class:"container"},ch=["innerHTML"],uh=["innerHTML"],dh=Ce({__name:"VPFooter",setup(n){const{theme:e,frontmatter:t}=je(),{hasSidebar:i}=Wn();return(r,s)=>X(e).footer&&X(t).footer!==!1?(B(),j("footer",{key:0,class:lt(["VPFooter",{"has-sidebar":X(i)}])},[Z("div",lh,[X(e).footer.message?(B(),j("p",{key:0,class:"message",innerHTML:X(e).footer.message},null,8,ch)):Te("",!0),X(e).footer.copyright?(B(),j("p",{key:1,class:"copyright",innerHTML:X(e).footer.copyright},null,8,uh)):Te("",!0)])],2)):Te("",!0)}}),fh=Le(dh,[["__scopeId","data-v-e315a0ad"]]);function hh(){const{theme:n,frontmatter:e}=je(),t=zc([]),i=Ve(()=>t.value.length>0);return Rs(()=>{t.value=Po(e.value.outline??n.value.outline)}),{headers:t,hasLocalNav:i}}const ph={class:"menu-text"},mh={class:"header"},xh={class:"outline"},gh=Ce({__name:"VPLocalNavOutlineDropdown",props:{headers:{},navHeight:{}},setup(n){const e=n,{theme:t}=je(),i=et(!1),r=et(0),s=et(),a=et();function o(f){var u;(u=s.value)!=null&&u.contains(f.target)||(i.value=!1)}Vn(i,f=>{if(f){document.addEventListener("click",o);return}document.removeEventListener("click",o)}),wa("Escape",()=>{i.value=!1}),Rs(()=>{i.value=!1});function l(){i.value=!i.value,r.value=window.innerHeight+Math.min(window.scrollY-e.navHeight,0)}function c(f){f.target.classList.contains("outline-link")&&(a.value&&(a.value.style.transition="none"),No(()=>{i.value=!1}))}function d(){i.value=!1,window.scrollTo({top:0,left:0,behavior:"smooth"})}return(f,u)=>(B(),j("div",{class:"VPLocalNavOutlineDropdown",style:Ro({"--vp-vh":r.value+"px"}),ref_key:"main",ref:s},[n.headers.length>0?(B(),j("button",{key:0,onClick:l,class:lt({open:i.value})},[Z("span",ph,ht(X(qc)(X(t))),1),u[0]||(u[0]=Z("span",{class:"vpi-chevron-right icon"},null,-1))],2)):(B(),j("button",{key:1,onClick:d},ht(X(t).returnToTopLabel||"Return to top"),1)),De(To,{name:"flyout"},{default:oe(()=>[i.value?(B(),j("div",{key:0,ref_key:"items",ref:a,class:"items",onClick:c},[Z("div",mh,[Z("a",{class:"top-link",href:"#",onClick:d},ht(X(t).returnToTopLabel||"Return to top"),1)]),Z("div",xh,[De(Yc,{headers:n.headers},null,8,["headers"])])],512)):Te("",!0)]),_:1})],4))}}),_h=Le(gh,[["__scopeId","data-v-8a42e2b4"]]),vh={class:"container"},Sh=["aria-expanded"],Mh={class:"menu-text"},Eh=Ce({__name:"VPLocalNav",props:{open:{type:Boolean}},emits:["open-menu"],setup(n){const{theme:e,frontmatter:t}=je(),{hasSidebar:i}=Wn(),{headers:r}=hh(),{y:s}=Hc(),a=et(0);wn(()=>{a.value=parseInt(getComputedStyle(document.documentElement).getPropertyValue("--vp-nav-height"))}),Rs(()=>{r.value=Po(t.value.outline??e.value.outline)});const o=Ve(()=>r.value.length===0),l=Ve(()=>o.value&&!i.value),c=Ve(()=>({VPLocalNav:!0,"has-sidebar":i.value,empty:o.value,fixed:l.value}));return(d,f)=>X(t).layout!=="home"&&(!l.value||X(s)>=a.value)?(B(),j("div",{key:0,class:lt(c.value)},[Z("div",vh,[X(i)?(B(),j("button",{key:0,class:"menu","aria-expanded":n.open,"aria-controls":"VPSidebarNav",onClick:f[0]||(f[0]=u=>d.$emit("open-menu"))},[f[1]||(f[1]=Z("span",{class:"vpi-align-left menu-icon"},null,-1)),Z("span",Mh,ht(X(e).sidebarMenuLabel||"Menu"),1)],8,Sh)):Te("",!0),De(_h,{headers:X(r),navHeight:a.value},null,8,["headers","navHeight"])])],2)):Te("",!0)}}),bh=Le(Eh,[["__scopeId","data-v-a6f0e41e"]]);function Ah(){const n=et(!1);function e(){n.value=!0,window.addEventListener("resize",r)}function t(){n.value=!1,window.removeEventListener("resize",r)}function i(){n.value?t():e()}function r(){window.outerWidth>=768&&t()}const s=Ns();return Vn(()=>s.path,t),{isScreenOpen:n,openScreen:e,closeScreen:t,toggleScreen:i}}const yh={},Th={class:"VPSwitch",type:"button",role:"switch"},Ch={class:"check"},wh={key:0,class:"icon"};function Rh(n,e){return B(),j("button",Th,[Z("span",Ch,[n.$slots.default?(B(),j("span",wh,[te(n.$slots,"default",{},void 0,!0)])):Te("",!0)])])}const Nh=Le(yh,[["render",Rh],["__scopeId","data-v-1d5665e3"]]),Fh=Ce({__name:"VPSwitchAppearance",setup(n){const{isDark:e,theme:t}=je(),i=Fs("toggle-appearance",()=>{e.value=!e.value}),r=et("");return wo(()=>{r.value=e.value?t.value.lightModeSwitchTitle||"Switch to light theme":t.value.darkModeSwitchTitle||"Switch to dark theme"}),(s,a)=>(B(),Ue(Nh,{title:r.value,class:"VPSwitchAppearance","aria-checked":X(e),onClick:X(i)},{default:oe(()=>[...a[0]||(a[0]=[Z("span",{class:"vpi-sun sun"},null,-1),Z("span",{class:"vpi-moon moon"},null,-1)])]),_:1},8,["title","aria-checked","onClick"]))}}),Lo=Le(Fh,[["__scopeId","data-v-5337faa4"]]),Ph={key:0,class:"VPNavBarAppearance"},Lh=Ce({__name:"VPNavBarAppearance",setup(n){const{site:e}=je();return(t,i)=>X(e).appearance&&X(e).appearance!=="force-dark"&&X(e).appearance!=="force-auto"?(B(),j("div",Ph,[De(Lo)])):Te("",!0)}}),Dh=Le(Lh,[["__scopeId","data-v-6c893767"]]),Do=et();let Kc=!1,Hs=0;function Ih(n){const e=et(!1);if(Ps){!Kc&&Uh(),Hs++;const t=Vn(Do,i=>{var r,s,a;i===n.el.value||(r=n.el.value)!=null&&r.contains(i)?(e.value=!0,(s=n.onFocus)==null||s.call(n)):(e.value=!1,(a=n.onBlur)==null||a.call(n))});br(()=>{t(),Hs--,Hs||Bh()})}return nd(e)}function Uh(){document.addEventListener("focusin",Zc),Kc=!0,Do.value=document.activeElement}function Bh(){document.removeEventListener("focusin",Zc)}function Zc(){Do.value=document.activeElement}const Oh={class:"VPMenuLink"},kh=["innerHTML"],Vh=Ce({__name:"VPMenuLink",props:{item:{}},setup(n){const{page:e}=je();return(t,i)=>(B(),j("div",Oh,[De(bn,{class:lt({active:X(vi)(X(e).relativePath,n.item.activeMatch||n.item.link,!!n.item.activeMatch)}),href:n.item.link,target:n.item.target,rel:n.item.rel,"no-icon":n.item.noIcon},{default:oe(()=>[Z("span",{innerHTML:n.item.text},null,8,kh)]),_:1},8,["class","href","target","rel","no-icon"])]))}}),Ls=Le(Vh,[["__scopeId","data-v-35975db6"]]),zh={class:"VPMenuGroup"},Gh={key:0,class:"title"},Hh=Ce({__name:"VPMenuGroup",props:{text:{},items:{}},setup(n){return(e,t)=>(B(),j("div",zh,[n.text?(B(),j("p",Gh,ht(n.text),1)):Te("",!0),(B(!0),j(St,null,Yt(n.items,i=>(B(),j(St,null,["link"in i?(B(),Ue(Ls,{key:0,item:i},null,8,["item"])):Te("",!0)],64))),256))]))}}),Wh=Le(Hh,[["__scopeId","data-v-69e747b5"]]),$h={class:"VPMenu"},Xh={key:0,class:"items"},qh=Ce({__name:"VPMenu",props:{items:{}},setup(n){return(e,t)=>(B(),j("div",$h,[n.items?(B(),j("div",Xh,[(B(!0),j(St,null,Yt(n.items,i=>(B(),j(St,{key:JSON.stringify(i)},["link"in i?(B(),Ue(Ls,{key:0,item:i},null,8,["item"])):"component"in i?(B(),Ue(En(i.component),ii({key:1,ref_for:!0},i.props),null,16)):(B(),Ue(Wh,{key:2,text:i.text,items:i.items},null,8,["text","items"]))],64))),128))])):Te("",!0),te(e.$slots,"default",{},void 0,!0)]))}}),Yh=Le(qh,[["__scopeId","data-v-b98bc113"]]),Kh=["aria-expanded","aria-label"],Zh={key:0,class:"text"},jh=["innerHTML"],Jh={key:1,class:"vpi-more-horizontal icon"},Qh={class:"menu"},ep=Ce({__name:"VPFlyout",props:{icon:{},button:{},label:{},items:{}},setup(n){const e=et(!1),t=et();Ih({el:t,onBlur:i});function i(){e.value=!1}return(r,s)=>(B(),j("div",{class:"VPFlyout",ref_key:"el",ref:t,onMouseenter:s[1]||(s[1]=a=>e.value=!0),onMouseleave:s[2]||(s[2]=a=>e.value=!1)},[Z("button",{type:"button",class:"button","aria-haspopup":"true","aria-expanded":e.value,"aria-label":n.label,onClick:s[0]||(s[0]=a=>e.value=!e.value)},[n.button||n.icon?(B(),j("span",Zh,[n.icon?(B(),j("span",{key:0,class:lt([n.icon,"option-icon"])},null,2)):Te("",!0),n.button?(B(),j("span",{key:1,innerHTML:n.button},null,8,jh)):Te("",!0),s[3]||(s[3]=Z("span",{class:"vpi-chevron-down text-icon"},null,-1))])):(B(),j("span",Jh))],8,Kh),Z("div",Qh,[De(Yh,{items:n.items},{default:oe(()=>[te(r.$slots,"default",{},void 0,!0)]),_:3},8,["items"])])],544))}}),Io=Le(ep,[["__scopeId","data-v-cf11d7a2"]]),tp=["href","aria-label","innerHTML"],np=Ce({__name:"VPSocialLink",props:{icon:{},link:{},ariaLabel:{}},setup(n){const e=n,t=et();wn(async()=>{var s;await No();const r=(s=t.value)==null?void 0:s.children[0];r instanceof HTMLElement&&r.className.startsWith("vpi-social-")&&(getComputedStyle(r).maskImage||getComputedStyle(r).webkitMaskImage)==="none"&&r.style.setProperty("--icon",`url('https://api.iconify.design/simple-icons/${e.icon}.svg')`)});const i=Ve(()=>typeof e.icon=="object"?e.icon.svg:`<span class="vpi-social-${e.icon}"></span>`);return(r,s)=>(B(),j("a",{ref_key:"el",ref:t,class:"VPSocialLink no-icon",href:n.link,"aria-label":n.ariaLabel??(typeof n.icon=="string"?n.icon:""),target:"_blank",rel:"noopener",innerHTML:i.value},null,8,tp))}}),ip=Le(np,[["__scopeId","data-v-bd121fe5"]]),rp={class:"VPSocialLinks"},sp=Ce({__name:"VPSocialLinks",props:{links:{}},setup(n){return(e,t)=>(B(),j("div",rp,[(B(!0),j(St,null,Yt(n.links,({link:i,icon:r,ariaLabel:s})=>(B(),Ue(ip,{key:i,icon:r,link:i,ariaLabel:s},null,8,["icon","link","ariaLabel"]))),128))]))}}),Uo=Le(sp,[["__scopeId","data-v-7bc22406"]]),ap={key:0,class:"group translations"},op={class:"trans-title"},lp={key:1,class:"group"},cp={class:"item appearance"},up={class:"label"},dp={class:"appearance-action"},fp={key:2,class:"group"},hp={class:"item social-links"},pp=Ce({__name:"VPNavBarExtra",setup(n){const{site:e,theme:t}=je(),{localeLinks:i,currentLang:r}=Ar({correspondingLink:!0}),s=Ve(()=>i.value.length&&r.value.label||e.value.appearance||t.value.socialLinks);return(a,o)=>s.value?(B(),Ue(Io,{key:0,class:"VPNavBarExtra",label:"extra navigation"},{default:oe(()=>[X(i).length&&X(r).label?(B(),j("div",ap,[Z("p",op,ht(X(r).label),1),(B(!0),j(St,null,Yt(X(i),l=>(B(),Ue(Ls,{key:l.link,item:l},null,8,["item"]))),128))])):Te("",!0),X(e).appearance&&X(e).appearance!=="force-dark"&&X(e).appearance!=="force-auto"?(B(),j("div",lp,[Z("div",cp,[Z("p",up,ht(X(t).darkModeSwitchLabel||"Appearance"),1),Z("div",dp,[De(Lo)])])])):Te("",!0),X(t).socialLinks?(B(),j("div",fp,[Z("div",hp,[De(Uo,{class:"social-links-list",links:X(t).socialLinks},null,8,["links"])])])):Te("",!0)]),_:1})):Te("",!0)}}),mp=Le(pp,[["__scopeId","data-v-bb2aa2f0"]]),xp=["aria-expanded"],gp=Ce({__name:"VPNavBarHamburger",props:{active:{type:Boolean}},emits:["click"],setup(n){return(e,t)=>(B(),j("button",{type:"button",class:lt(["VPNavBarHamburger",{active:n.active}]),"aria-label":"mobile navigation","aria-expanded":n.active,"aria-controls":"VPNavScreen",onClick:t[0]||(t[0]=i=>e.$emit("click"))},[...t[1]||(t[1]=[Z("span",{class:"container"},[Z("span",{class:"top"}),Z("span",{class:"middle"}),Z("span",{class:"bottom"})],-1)])],10,xp))}}),_p=Le(gp,[["__scopeId","data-v-e5dd9c1c"]]),vp=["innerHTML"],Sp=Ce({__name:"VPNavBarMenuLink",props:{item:{}},setup(n){const{page:e}=je();return(t,i)=>(B(),Ue(bn,{class:lt({VPNavBarMenuLink:!0,active:X(vi)(X(e).relativePath,n.item.activeMatch||n.item.link,!!n.item.activeMatch)}),href:n.item.link,target:n.item.target,rel:n.item.rel,"no-icon":n.item.noIcon,tabindex:"0"},{default:oe(()=>[Z("span",{innerHTML:n.item.text},null,8,vp)]),_:1},8,["class","href","target","rel","no-icon"]))}}),Mp=Le(Sp,[["__scopeId","data-v-e56f3d57"]]),Ep=Ce({__name:"VPNavBarMenuGroup",props:{item:{}},setup(n){const e=n,{page:t}=je(),i=s=>"component"in s?!1:"link"in s?vi(t.value.relativePath,s.link,!!e.item.activeMatch):s.items.some(i),r=Ve(()=>i(e.item));return(s,a)=>(B(),Ue(Io,{class:lt({VPNavBarMenuGroup:!0,active:X(vi)(X(t).relativePath,n.item.activeMatch,!!n.item.activeMatch)||r.value}),button:n.item.text,items:n.item.items},null,8,["class","button","items"]))}}),bp={key:0,"aria-labelledby":"main-nav-aria-label",class:"VPNavBarMenu"},Ap=Ce({__name:"VPNavBarMenu",setup(n){const{theme:e}=je();return(t,i)=>X(e).nav?(B(),j("nav",bp,[i[0]||(i[0]=Z("span",{id:"main-nav-aria-label",class:"visually-hidden"}," Main Navigation ",-1)),(B(!0),j(St,null,Yt(X(e).nav,r=>(B(),j(St,{key:JSON.stringify(r)},["link"in r?(B(),Ue(Mp,{key:0,item:r},null,8,["item"])):"component"in r?(B(),Ue(En(r.component),ii({key:1,ref_for:!0},r.props),null,16)):(B(),Ue(Ep,{key:2,item:r},null,8,["item"]))],64))),128))])):Te("",!0)}}),yp=Le(Ap,[["__scopeId","data-v-dc692963"]]);function Tp(n){const{localeIndex:e,theme:t}=je();function i(r){var x,S,m;const s=r.split("."),a=(x=t.value.search)==null?void 0:x.options,o=a&&typeof a=="object",l=o&&((m=(S=a.locales)==null?void 0:S[e.value])==null?void 0:m.translations)||null,c=o&&a.translations||null;let d=l,f=c,u=n;const p=s.pop();for(const h of s){let E=null;const A=u==null?void 0:u[h];A&&(E=u=A);const T=f==null?void 0:f[h];T&&(E=f=T);const P=d==null?void 0:d[h];P&&(E=d=P),A||(u=E),T||(f=E),P||(d=E)}return(d==null?void 0:d[p])??(f==null?void 0:f[p])??(u==null?void 0:u[p])??""}return i}const Cp=["aria-label"],wp={class:"DocSearch-Button-Container"},Rp={class:"DocSearch-Button-Placeholder"},pl=Ce({__name:"VPNavBarSearchButton",setup(n){const t=Tp({button:{buttonText:"Search",buttonAriaLabel:"Search"}});return(i,r)=>(B(),j("button",{type:"button",class:"DocSearch DocSearch-Button","aria-label":X(t)("button.buttonAriaLabel")},[Z("span",wp,[r[0]||(r[0]=Z("span",{class:"vp-icon DocSearch-Search-Icon"},null,-1)),Z("span",Rp,ht(X(t)("button.buttonText")),1)]),r[1]||(r[1]=Z("span",{class:"DocSearch-Button-Keys"},[Z("kbd",{class:"DocSearch-Button-Key"}),Z("kbd",{class:"DocSearch-Button-Key"},"K")],-1))],8,Cp))}}),Np={class:"VPNavBarSearch"},Fp={id:"local-search"},Pp={key:1,id:"docsearch"},Lp=Ce({__name:"VPNavBarSearch",setup(n){const e=id(()=>rd(()=>import("./VPLocalSearchBox.BEVN6Q-h.js"),__vite__mapDeps([0,1]))),t=()=>null,{theme:i}=je(),r=et(!1),s=et(!1);wn(()=>{});function a(){r.value||(r.value=!0,setTimeout(o,16))}function o(){const f=new Event("keydown");f.key="k",f.metaKey=!0,window.dispatchEvent(f),setTimeout(()=>{document.querySelector(".DocSearch-Modal")||o()},16)}function l(f){const u=f.target,p=u.tagName;return u.isContentEditable||p==="INPUT"||p==="SELECT"||p==="TEXTAREA"}const c=et(!1);wa("k",f=>{(f.ctrlKey||f.metaKey)&&(f.preventDefault(),c.value=!0)}),wa("/",f=>{l(f)||(f.preventDefault(),c.value=!0)});const d="local";return(f,u)=>{var p;return B(),j("div",Np,[X(d)==="local"?(B(),j(St,{key:0},[c.value?(B(),Ue(X(e),{key:0,onClose:u[0]||(u[0]=x=>c.value=!1)})):Te("",!0),Z("div",Fp,[De(pl,{onClick:u[1]||(u[1]=x=>c.value=!0)})])],64)):X(d)==="algolia"?(B(),j(St,{key:1},[r.value?(B(),Ue(X(t),{key:0,algolia:((p=X(i).search)==null?void 0:p.options)??X(i).algolia,onVnodeBeforeMount:u[2]||(u[2]=x=>s.value=!0)},null,8,["algolia"])):Te("",!0),s.value?Te("",!0):(B(),j("div",Pp,[De(pl,{onClick:a})]))],64)):Te("",!0)])}}}),Dp=Ce({__name:"VPNavBarSocialLinks",setup(n){const{theme:e}=je();return(t,i)=>X(e).socialLinks?(B(),Ue(Uo,{key:0,class:"VPNavBarSocialLinks",links:X(e).socialLinks},null,8,["links"])):Te("",!0)}}),Ip=Le(Dp,[["__scopeId","data-v-0394ad82"]]),Up=["href","rel","target"],Bp=["innerHTML"],Op={key:2},kp=Ce({__name:"VPNavBarTitle",setup(n){const{site:e,theme:t}=je(),{hasSidebar:i}=Wn(),{currentLang:r}=Ar(),s=Ve(()=>{var l;return typeof t.value.logoLink=="string"?t.value.logoLink:(l=t.value.logoLink)==null?void 0:l.link}),a=Ve(()=>{var l;return typeof t.value.logoLink=="string"||(l=t.value.logoLink)==null?void 0:l.rel}),o=Ve(()=>{var l;return typeof t.value.logoLink=="string"||(l=t.value.logoLink)==null?void 0:l.target});return(l,c)=>(B(),j("div",{class:lt(["VPNavBarTitle",{"has-sidebar":X(i)}])},[Z("a",{class:"title",href:s.value??X(Fo)(X(r).link),rel:a.value,target:o.value},[te(l.$slots,"nav-bar-title-before",{},void 0,!0),X(t).logo?(B(),Ue(ms,{key:0,class:"logo",image:X(t).logo},null,8,["image"])):Te("",!0),X(t).siteTitle?(B(),j("span",{key:1,innerHTML:X(t).siteTitle},null,8,Bp)):X(t).siteTitle===void 0?(B(),j("span",Op,ht(X(e).title),1)):Te("",!0),te(l.$slots,"nav-bar-title-after",{},void 0,!0)],8,Up)],2))}}),Vp=Le(kp,[["__scopeId","data-v-1168a8e4"]]),zp={class:"items"},Gp={class:"title"},Hp=Ce({__name:"VPNavBarTranslations",setup(n){const{theme:e}=je(),{localeLinks:t,currentLang:i}=Ar({correspondingLink:!0});return(r,s)=>X(t).length&&X(i).label?(B(),Ue(Io,{key:0,class:"VPNavBarTranslations",icon:"vpi-languages",label:X(e).langMenuLabel||"Change language"},{default:oe(()=>[Z("div",zp,[Z("p",Gp,ht(X(i).label),1),(B(!0),j(St,null,Yt(X(t),a=>(B(),Ue(Ls,{key:a.link,item:a},null,8,["item"]))),128))])]),_:1},8,["label"])):Te("",!0)}}),Wp=Le(Hp,[["__scopeId","data-v-88af2de4"]]),$p={class:"wrapper"},Xp={class:"container"},qp={class:"title"},Yp={class:"content"},Kp={class:"content-body"},Zp=Ce({__name:"VPNavBar",props:{isScreenOpen:{type:Boolean}},emits:["toggle-screen"],setup(n){const e=n,{y:t}=Hc(),{hasSidebar:i}=Wn(),{frontmatter:r}=je(),s=et({});return wo(()=>{s.value={"has-sidebar":i.value,home:r.value.layout==="home",top:t.value===0,"screen-open":e.isScreenOpen}}),(a,o)=>(B(),j("div",{class:lt(["VPNavBar",s.value])},[Z("div",$p,[Z("div",Xp,[Z("div",qp,[De(Vp,null,{"nav-bar-title-before":oe(()=>[te(a.$slots,"nav-bar-title-before",{},void 0,!0)]),"nav-bar-title-after":oe(()=>[te(a.$slots,"nav-bar-title-after",{},void 0,!0)]),_:3})]),Z("div",Yp,[Z("div",Kp,[te(a.$slots,"nav-bar-content-before",{},void 0,!0),De(Lp,{class:"search"}),De(yp,{class:"menu"}),De(Wp,{class:"translations"}),De(Dh,{class:"appearance"}),De(Ip,{class:"social-links"}),De(mp,{class:"extra"}),te(a.$slots,"nav-bar-content-after",{},void 0,!0),De(_p,{class:"hamburger",active:n.isScreenOpen,onClick:o[0]||(o[0]=l=>a.$emit("toggle-screen"))},null,8,["active"])])])])]),o[1]||(o[1]=Z("div",{class:"divider"},[Z("div",{class:"divider-line"})],-1))],2))}}),jp=Le(Zp,[["__scopeId","data-v-6aa21345"]]),Jp={key:0,class:"VPNavScreenAppearance"},Qp={class:"text"},em=Ce({__name:"VPNavScreenAppearance",setup(n){const{site:e,theme:t}=je();return(i,r)=>X(e).appearance&&X(e).appearance!=="force-dark"&&X(e).appearance!=="force-auto"?(B(),j("div",Jp,[Z("p",Qp,ht(X(t).darkModeSwitchLabel||"Appearance"),1),De(Lo)])):Te("",!0)}}),tm=Le(em,[["__scopeId","data-v-b44890b2"]]),nm=["innerHTML"],im=Ce({__name:"VPNavScreenMenuLink",props:{item:{}},setup(n){const e=Fs("close-screen");return(t,i)=>(B(),Ue(bn,{class:"VPNavScreenMenuLink",href:n.item.link,target:n.item.target,rel:n.item.rel,"no-icon":n.item.noIcon,onClick:X(e)},{default:oe(()=>[Z("span",{innerHTML:n.item.text},null,8,nm)]),_:1},8,["href","target","rel","no-icon","onClick"]))}}),rm=Le(im,[["__scopeId","data-v-df37e6dd"]]),sm=["innerHTML"],am=Ce({__name:"VPNavScreenMenuGroupLink",props:{item:{}},setup(n){const e=Fs("close-screen");return(t,i)=>(B(),Ue(bn,{class:"VPNavScreenMenuGroupLink",href:n.item.link,target:n.item.target,rel:n.item.rel,"no-icon":n.item.noIcon,onClick:X(e)},{default:oe(()=>[Z("span",{innerHTML:n.item.text},null,8,sm)]),_:1},8,["href","target","rel","no-icon","onClick"]))}}),jc=Le(am,[["__scopeId","data-v-3e9c20e4"]]),om={class:"VPNavScreenMenuGroupSection"},lm={key:0,class:"title"},cm=Ce({__name:"VPNavScreenMenuGroupSection",props:{text:{},items:{}},setup(n){return(e,t)=>(B(),j("div",om,[n.text?(B(),j("p",lm,ht(n.text),1)):Te("",!0),(B(!0),j(St,null,Yt(n.items,i=>(B(),Ue(jc,{key:i.text,item:i},null,8,["item"]))),128))]))}}),um=Le(cm,[["__scopeId","data-v-8133b170"]]),dm=["aria-controls","aria-expanded"],fm=["innerHTML"],hm=["id"],pm={key:0,class:"item"},mm={key:1,class:"item"},xm={key:2,class:"group"},gm=Ce({__name:"VPNavScreenMenuGroup",props:{text:{},items:{}},setup(n){const e=n,t=et(!1),i=Ve(()=>`NavScreenGroup-${e.text.replace(" ","-").toLowerCase()}`);function r(){t.value=!t.value}return(s,a)=>(B(),j("div",{class:lt(["VPNavScreenMenuGroup",{open:t.value}])},[Z("button",{class:"button","aria-controls":i.value,"aria-expanded":t.value,onClick:r},[Z("span",{class:"button-text",innerHTML:n.text},null,8,fm),a[0]||(a[0]=Z("span",{class:"vpi-plus button-icon"},null,-1))],8,dm),Z("div",{id:i.value,class:"items"},[(B(!0),j(St,null,Yt(n.items,o=>(B(),j(St,{key:JSON.stringify(o)},["link"in o?(B(),j("div",pm,[De(jc,{item:o},null,8,["item"])])):"component"in o?(B(),j("div",mm,[(B(),Ue(En(o.component),ii({ref_for:!0},o.props,{"screen-menu":""}),null,16))])):(B(),j("div",xm,[De(um,{text:o.text,items:o.items},null,8,["text","items"])]))],64))),128))],8,hm)],2))}}),_m=Le(gm,[["__scopeId","data-v-b9ab8c58"]]),vm={key:0,class:"VPNavScreenMenu"},Sm=Ce({__name:"VPNavScreenMenu",setup(n){const{theme:e}=je();return(t,i)=>X(e).nav?(B(),j("nav",vm,[(B(!0),j(St,null,Yt(X(e).nav,r=>(B(),j(St,{key:JSON.stringify(r)},["link"in r?(B(),Ue(rm,{key:0,item:r},null,8,["item"])):"component"in r?(B(),Ue(En(r.component),ii({key:1,ref_for:!0},r.props,{"screen-menu":""}),null,16)):(B(),Ue(_m,{key:2,text:r.text||"",items:r.items},null,8,["text","items"]))],64))),128))])):Te("",!0)}}),Mm=Ce({__name:"VPNavScreenSocialLinks",setup(n){const{theme:e}=je();return(t,i)=>X(e).socialLinks?(B(),Ue(Uo,{key:0,class:"VPNavScreenSocialLinks",links:X(e).socialLinks},null,8,["links"])):Te("",!0)}}),Em={class:"list"},bm=Ce({__name:"VPNavScreenTranslations",setup(n){const{localeLinks:e,currentLang:t}=Ar({correspondingLink:!0}),i=et(!1);function r(){i.value=!i.value}return(s,a)=>X(e).length&&X(t).label?(B(),j("div",{key:0,class:lt(["VPNavScreenTranslations",{open:i.value}])},[Z("button",{class:"title",onClick:r},[a[0]||(a[0]=Z("span",{class:"vpi-languages icon lang"},null,-1)),_i(" "+ht(X(t).label)+" ",1),a[1]||(a[1]=Z("span",{class:"vpi-chevron-down icon chevron"},null,-1))]),Z("ul",Em,[(B(!0),j(St,null,Yt(X(e),o=>(B(),j("li",{key:o.link,class:"item"},[De(bn,{class:"link",href:o.link},{default:oe(()=>[_i(ht(o.text),1)]),_:2},1032,["href"])]))),128))])],2)):Te("",!0)}}),Am=Le(bm,[["__scopeId","data-v-858fe1a4"]]),ym={class:"container"},Tm=Ce({__name:"VPNavScreen",props:{open:{type:Boolean}},setup(n){const e=et(null),t=Wc(Ps?document.body:null);return(i,r)=>(B(),Ue(To,{name:"fade",onEnter:r[0]||(r[0]=s=>t.value=!0),onAfterLeave:r[1]||(r[1]=s=>t.value=!1)},{default:oe(()=>[n.open?(B(),j("div",{key:0,class:"VPNavScreen",ref_key:"screen",ref:e,id:"VPNavScreen"},[Z("div",ym,[te(i.$slots,"nav-screen-content-before",{},void 0,!0),De(Sm,{class:"menu"}),De(Am,{class:"translations"}),De(tm,{class:"appearance"}),De(Mm,{class:"social-links"}),te(i.$slots,"nav-screen-content-after",{},void 0,!0)])],512)):Te("",!0)]),_:3}))}}),Cm=Le(Tm,[["__scopeId","data-v-f2779853"]]),wm={key:0,class:"VPNav"},Rm=Ce({__name:"VPNav",setup(n){const{isScreenOpen:e,closeScreen:t,toggleScreen:i}=Ah(),{frontmatter:r}=je(),s=Ve(()=>r.value.navbar!==!1);return $c("close-screen",t),ws(()=>{Ps&&document.documentElement.classList.toggle("hide-nav",!s.value)}),(a,o)=>s.value?(B(),j("header",wm,[De(jp,{"is-screen-open":X(e),onToggleScreen:X(i)},{"nav-bar-title-before":oe(()=>[te(a.$slots,"nav-bar-title-before",{},void 0,!0)]),"nav-bar-title-after":oe(()=>[te(a.$slots,"nav-bar-title-after",{},void 0,!0)]),"nav-bar-content-before":oe(()=>[te(a.$slots,"nav-bar-content-before",{},void 0,!0)]),"nav-bar-content-after":oe(()=>[te(a.$slots,"nav-bar-content-after",{},void 0,!0)]),_:3},8,["is-screen-open","onToggleScreen"]),De(Cm,{open:X(e)},{"nav-screen-content-before":oe(()=>[te(a.$slots,"nav-screen-content-before",{},void 0,!0)]),"nav-screen-content-after":oe(()=>[te(a.$slots,"nav-screen-content-after",{},void 0,!0)]),_:3},8,["open"])])):Te("",!0)}}),Nm=Le(Rm,[["__scopeId","data-v-ae24b3ad"]]),Fm=["role","tabindex"],Pm={key:1,class:"items"},Lm=Ce({__name:"VPSidebarItem",props:{item:{},depth:{}},setup(n){const e=n,{collapsed:t,collapsible:i,isLink:r,isActiveLink:s,hasActiveLink:a,hasChildren:o,toggle:l}=Cd(Ve(()=>e.item)),c=Ve(()=>o.value?"section":"div"),d=Ve(()=>r.value?"a":"div"),f=Ve(()=>o.value?e.depth+2===7?"p":`h${e.depth+2}`:"p"),u=Ve(()=>r.value?void 0:"button"),p=Ve(()=>[[`level-${e.depth}`],{collapsible:i.value},{collapsed:t.value},{"is-link":r.value},{"is-active":s.value},{"has-active":a.value}]);function x(m){"key"in m&&m.key!=="Enter"||!e.item.link&&l()}function S(){e.item.link&&l()}return(m,h)=>{const E=Ai("VPSidebarItem",!0);return B(),Ue(En(c.value),{class:lt(["VPSidebarItem",p.value])},{default:oe(()=>[n.item.text?(B(),j("div",ii({key:0,class:"item",role:u.value},sd(n.item.items?{click:x,keydown:x}:{},!0),{tabindex:n.item.items&&0}),[h[1]||(h[1]=Z("div",{class:"indicator"},null,-1)),n.item.link?(B(),Ue(bn,{key:0,tag:d.value,class:"link",href:n.item.link,rel:n.item.rel,target:n.item.target},{default:oe(()=>[(B(),Ue(En(f.value),{class:"text",innerHTML:n.item.text},null,8,["innerHTML"]))]),_:1},8,["tag","href","rel","target"])):(B(),Ue(En(f.value),{key:1,class:"text",innerHTML:n.item.text},null,8,["innerHTML"])),n.item.collapsed!=null&&n.item.items&&n.item.items.length?(B(),j("div",{key:2,class:"caret",role:"button","aria-label":"toggle section",onClick:S,onKeydown:ad(S,["enter"]),tabindex:"0"},[...h[0]||(h[0]=[Z("span",{class:"vpi-chevron-right caret-icon"},null,-1)])],32)):Te("",!0)],16,Fm)):Te("",!0),n.item.items&&n.item.items.length?(B(),j("div",Pm,[n.depth<5?(B(!0),j(St,{key:0},Yt(n.item.items,A=>(B(),Ue(E,{key:A.text,item:A,depth:n.depth+1},null,8,["item","depth"]))),128)):Te("",!0)])):Te("",!0)]),_:1},8,["class"])}}}),Dm=Le(Lm,[["__scopeId","data-v-b3fd67f8"]]),Im=Ce({__name:"VPSidebarGroup",props:{items:{}},setup(n){const e=et(!0);let t=null;return wn(()=>{t=setTimeout(()=>{t=null,e.value=!1},300)}),od(()=>{t!=null&&(clearTimeout(t),t=null)}),(i,r)=>(B(!0),j(St,null,Yt(n.items,s=>(B(),j("div",{key:s.text,class:lt(["group",{"no-transition":e.value}])},[De(Dm,{item:s,depth:0},null,8,["item"])],2))),128))}}),Um=Le(Im,[["__scopeId","data-v-c40bc020"]]),Bm={class:"nav",id:"VPSidebarNav","aria-labelledby":"sidebar-aria-label",tabindex:"-1"},Om=Ce({__name:"VPSidebar",props:{open:{type:Boolean}},setup(n){const{sidebarGroups:e,hasSidebar:t}=Wn(),i=n,r=et(null),s=Wc(Ps?document.body:null);Vn([i,r],()=>{var o;i.open?(s.value=!0,(o=r.value)==null||o.focus()):s.value=!1},{immediate:!0,flush:"post"});const a=et(0);return Vn(e,()=>{a.value+=1},{deep:!0}),(o,l)=>X(t)?(B(),j("aside",{key:0,class:lt(["VPSidebar",{open:n.open}]),ref_key:"navEl",ref:r,onClick:l[0]||(l[0]=ld(()=>{},["stop"]))},[l[2]||(l[2]=Z("div",{class:"curtain"},null,-1)),Z("nav",Bm,[l[1]||(l[1]=Z("span",{class:"visually-hidden",id:"sidebar-aria-label"}," Sidebar Navigation ",-1)),te(o.$slots,"sidebar-nav-before",{},void 0,!0),(B(),Ue(Um,{items:X(e),key:a.value},null,8,["items"])),te(o.$slots,"sidebar-nav-after",{},void 0,!0)])],2)):Te("",!0)}}),km=Le(Om,[["__scopeId","data-v-319d5ca6"]]),Vm=Ce({__name:"VPSkipLink",setup(n){const{theme:e}=je(),t=Ns(),i=et();Vn(()=>t.path,()=>i.value.focus());function r({target:s}){const a=document.getElementById(decodeURIComponent(s.hash).slice(1));if(a){const o=()=>{a.removeAttribute("tabindex"),a.removeEventListener("blur",o)};a.setAttribute("tabindex","-1"),a.addEventListener("blur",o),a.focus(),window.scrollTo(0,0)}}return(s,a)=>(B(),j(St,null,[Z("span",{ref_key:"backToTop",ref:i,tabindex:"-1"},null,512),Z("a",{href:"#VPContent",class:"VPSkipLink visually-hidden",onClick:r},ht(X(e).skipToContentLabel||"Skip to content"),1)],64))}}),zm=Le(Vm,[["__scopeId","data-v-0b0ada53"]]),Gm=Ce({__name:"Layout",setup(n){const{isOpen:e,open:t,close:i}=Wn(),r=Ns();Vn(()=>r.path,i),Td(e,i);const{frontmatter:s}=je(),a=cd(),o=Ve(()=>!!a["home-hero-image"]);return $c("hero-image-slot-exists",o),(l,c)=>{const d=Ai("Content");return X(s).layout!==!1?(B(),j("div",{key:0,class:lt(["Layout",X(s).pageClass])},[te(l.$slots,"layout-top",{},void 0,!0),De(zm),De(hd,{class:"backdrop",show:X(e),onClick:X(i)},null,8,["show","onClick"]),De(Nm,null,{"nav-bar-title-before":oe(()=>[te(l.$slots,"nav-bar-title-before",{},void 0,!0)]),"nav-bar-title-after":oe(()=>[te(l.$slots,"nav-bar-title-after",{},void 0,!0)]),"nav-bar-content-before":oe(()=>[te(l.$slots,"nav-bar-content-before",{},void 0,!0)]),"nav-bar-content-after":oe(()=>[te(l.$slots,"nav-bar-content-after",{},void 0,!0)]),"nav-screen-content-before":oe(()=>[te(l.$slots,"nav-screen-content-before",{},void 0,!0)]),"nav-screen-content-after":oe(()=>[te(l.$slots,"nav-screen-content-after",{},void 0,!0)]),_:3}),De(bh,{open:X(e),onOpenMenu:X(t)},null,8,["open","onOpenMenu"]),De(km,{open:X(e)},{"sidebar-nav-before":oe(()=>[te(l.$slots,"sidebar-nav-before",{},void 0,!0)]),"sidebar-nav-after":oe(()=>[te(l.$slots,"sidebar-nav-after",{},void 0,!0)]),_:3},8,["open"]),De(oh,null,{"page-top":oe(()=>[te(l.$slots,"page-top",{},void 0,!0)]),"page-bottom":oe(()=>[te(l.$slots,"page-bottom",{},void 0,!0)]),"not-found":oe(()=>[te(l.$slots,"not-found",{},void 0,!0)]),"home-hero-before":oe(()=>[te(l.$slots,"home-hero-before",{},void 0,!0)]),"home-hero-info-before":oe(()=>[te(l.$slots,"home-hero-info-before",{},void 0,!0)]),"home-hero-info":oe(()=>[te(l.$slots,"home-hero-info",{},void 0,!0)]),"home-hero-info-after":oe(()=>[te(l.$slots,"home-hero-info-after",{},void 0,!0)]),"home-hero-actions-after":oe(()=>[te(l.$slots,"home-hero-actions-after",{},void 0,!0)]),"home-hero-image":oe(()=>[te(l.$slots,"home-hero-image",{},void 0,!0)]),"home-hero-after":oe(()=>[te(l.$slots,"home-hero-after",{},void 0,!0)]),"home-features-before":oe(()=>[te(l.$slots,"home-features-before",{},void 0,!0)]),"home-features-after":oe(()=>[te(l.$slots,"home-features-after",{},void 0,!0)]),"doc-footer-before":oe(()=>[te(l.$slots,"doc-footer-before",{},void 0,!0)]),"doc-before":oe(()=>[te(l.$slots,"doc-before",{},void 0,!0)]),"doc-after":oe(()=>[te(l.$slots,"doc-after",{},void 0,!0)]),"doc-top":oe(()=>[te(l.$slots,"doc-top",{},void 0,!0)]),"doc-bottom":oe(()=>[te(l.$slots,"doc-bottom",{},void 0,!0)]),"aside-top":oe(()=>[te(l.$slots,"aside-top",{},void 0,!0)]),"aside-bottom":oe(()=>[te(l.$slots,"aside-bottom",{},void 0,!0)]),"aside-outline-before":oe(()=>[te(l.$slots,"aside-outline-before",{},void 0,!0)]),"aside-outline-after":oe(()=>[te(l.$slots,"aside-outline-after",{},void 0,!0)]),"aside-ads-before":oe(()=>[te(l.$slots,"aside-ads-before",{},void 0,!0)]),"aside-ads-after":oe(()=>[te(l.$slots,"aside-ads-after",{},void 0,!0)]),_:3}),De(fh),te(l.$slots,"layout-bottom",{},void 0,!0)],2)):(B(),Ue(d,{key:1}))}}}),Hm=Le(Gm,[["__scopeId","data-v-5d98c3a5"]]),ml={Layout:Hm,enhanceApp:({app:n})=>{n.component("Badge",ud)}},Wm=["width","height"],$m=Ce({__name:"RelayLogo",props:{size:{default:28},hero:{type:Boolean,default:!1}},setup(n){const e=n,t=Ve(()=>({width:`${e.size}px`,height:`${e.size}px`}));return(i,r)=>(B(),j("div",{class:lt(["relay-logo",{hero:n.hero}]),style:Ro(t.value)},[(B(),j("svg",{width:n.size,height:n.size,viewBox:"0 0 48 48",fill:"none",xmlns:"http://www.w3.org/2000/svg",class:"relay-bolt"},[...r[0]||(r[0]=[Z("path",{d:"M28 3L8 27h11l-2 18 21-24H25l3-18z",fill:"currentColor",stroke:"currentColor","stroke-width":"1.5","stroke-linejoin":"round"},null,-1)])],8,Wm))],6))}}),Xm=Le($m,[["__scopeId","data-v-04f92ab2"]]);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Bo="184",qm=0,xl=1,Ym=2,os=1,Km=2,gr=3,ri=0,Zt=1,Un=2,On=0,Yi=1,gl=2,_l=3,vl=4,Zm=5,hi=100,jm=101,Jm=102,Qm=103,e0=104,t0=200,n0=201,i0=202,r0=203,Pa=204,La=205,s0=206,a0=207,o0=208,l0=209,c0=210,u0=211,d0=212,f0=213,h0=214,Da=0,Ia=1,Ua=2,ji=3,Ba=4,Oa=5,ka=6,Va=7,Jc=0,p0=1,m0=2,An=0,Qc=1,eu=2,tu=3,nu=4,iu=5,ru=6,su=7,au=300,Si=301,Ji=302,Ws=303,$s=304,Ds=306,za=1e3,Bn=1001,Ga=1002,Bt=1003,x0=1004,Rr=1005,Gt=1006,Xs=1007,mi=1008,an=1009,ou=1010,lu=1011,Sr=1012,Oo=1013,Tn=1014,hn=1015,zn=1016,ko=1017,Vo=1018,Mr=1020,cu=35902,uu=35899,du=1021,fu=1022,pn=1023,Gn=1026,xi=1027,zo=1028,Go=1029,Mi=1030,Ho=1031,Wo=1033,ls=33776,cs=33777,us=33778,ds=33779,Ha=35840,Wa=35841,$a=35842,Xa=35843,qa=36196,Ya=37492,Ka=37496,Za=37488,ja=37489,xs=37490,Ja=37491,Qa=37808,eo=37809,to=37810,no=37811,io=37812,ro=37813,so=37814,ao=37815,oo=37816,lo=37817,co=37818,uo=37819,fo=37820,ho=37821,po=36492,mo=36494,xo=36495,go=36283,_o=36284,gs=36285,vo=36286,g0=3200,Sl=0,_0=1,ei="",rn="srgb",_s="srgb-linear",vs="linear",ft="srgb",Ri=7680,Ml=519,v0=512,S0=513,M0=514,$o=515,E0=516,b0=517,Xo=518,A0=519,El=35044,bl="300 es",Mn=2e3,Ss=2001;function y0(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ms(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function T0(){const n=Ms("canvas");return n.style.display="block",n}const Al={};function yl(...n){const e="THREE."+n.shift();console.log(e,...n)}function hu(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function ke(...n){n=hu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function at(...n){n=hu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function So(...n){const e=n.join(" ");e in Al||(Al[e]=!0,ke(...n))}function C0(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const w0={[Da]:Ia,[Ua]:ka,[Ba]:Va,[ji]:Oa,[Ia]:Da,[ka]:Ua,[Va]:Ba,[Oa]:ji};class yi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Tl=1234567;const Ki=Math.PI/180,Er=180/Math.PI;function nr(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(kt[n&255]+kt[n>>8&255]+kt[n>>16&255]+kt[n>>24&255]+"-"+kt[e&255]+kt[e>>8&255]+"-"+kt[e>>16&15|64]+kt[e>>24&255]+"-"+kt[t&63|128]+kt[t>>8&255]+"-"+kt[t>>16&255]+kt[t>>24&255]+kt[i&255]+kt[i>>8&255]+kt[i>>16&255]+kt[i>>24&255]).toLowerCase()}function nt(n,e,t){return Math.max(e,Math.min(t,n))}function qo(n,e){return(n%e+e)%e}function R0(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function N0(n,e,t){return n!==e?(t-n)/(e-n):0}function vr(n,e,t){return(1-t)*n+t*e}function F0(n,e,t,i){return vr(n,e,1-Math.exp(-t*i))}function P0(n,e=1){return e-Math.abs(qo(n,e*2)-e)}function L0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function D0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function I0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function U0(n,e){return n+Math.random()*(e-n)}function B0(n){return n*(.5-Math.random())}function O0(n){n!==void 0&&(Tl=n);let e=Tl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function k0(n){return n*Ki}function V0(n){return n*Er}function z0(n){return(n&n-1)===0&&n!==0}function G0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function H0(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function W0(n,e,t,i,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),d=a((e+i)/2),f=s((e-i)/2),u=a((e-i)/2),p=s((i-e)/2),x=a((i-e)/2);switch(r){case"XYX":n.set(o*d,l*f,l*u,o*c);break;case"YZY":n.set(l*u,o*d,l*f,o*c);break;case"ZXZ":n.set(l*f,l*u,o*d,o*c);break;case"XZX":n.set(o*d,l*x,l*p,o*c);break;case"YXY":n.set(l*p,o*d,l*x,o*c);break;case"ZYZ":n.set(l*x,l*p,o*d,o*c);break;default:ke("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Xi(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function $t(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const $0={DEG2RAD:Ki,RAD2DEG:Er,generateUUID:nr,clamp:nt,euclideanModulo:qo,mapLinear:R0,inverseLerp:N0,lerp:vr,damp:F0,pingpong:P0,smoothstep:L0,smootherstep:D0,randInt:I0,randFloat:U0,randFloatSpread:B0,seededRandom:O0,degToRad:k0,radToDeg:V0,isPowerOfTwo:z0,ceilPowerOfTwo:G0,floorPowerOfTwo:H0,setQuaternionFromProperEuler:W0,normalize:$t,denormalize:Xi},tl=class tl{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(nt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};tl.prototype.isVector2=!0;let ut=tl;class ir{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],d=i[r+2],f=i[r+3],u=s[a+0],p=s[a+1],x=s[a+2],S=s[a+3];if(f!==S||l!==u||c!==p||d!==x){let m=l*u+c*p+d*x+f*S;m<0&&(u=-u,p=-p,x=-x,S=-S,m=-m);let h=1-o;if(m<.9995){const E=Math.acos(m),A=Math.sin(E);h=Math.sin(h*E)/A,o=Math.sin(o*E)/A,l=l*h+u*o,c=c*h+p*o,d=d*h+x*o,f=f*h+S*o}else{l=l*h+u*o,c=c*h+p*o,d=d*h+x*o,f=f*h+S*o;const E=1/Math.sqrt(l*l+c*c+d*d+f*f);l*=E,c*=E,d*=E,f*=E}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],d=i[r+3],f=s[a],u=s[a+1],p=s[a+2],x=s[a+3];return e[t]=o*x+d*f+l*p-c*u,e[t+1]=l*x+d*u+c*f-o*p,e[t+2]=c*x+d*p+o*u-l*f,e[t+3]=d*x-o*f-l*u-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(r/2),f=o(s/2),u=l(i/2),p=l(r/2),x=l(s/2);switch(a){case"XYZ":this._x=u*d*f+c*p*x,this._y=c*p*f-u*d*x,this._z=c*d*x+u*p*f,this._w=c*d*f-u*p*x;break;case"YXZ":this._x=u*d*f+c*p*x,this._y=c*p*f-u*d*x,this._z=c*d*x-u*p*f,this._w=c*d*f+u*p*x;break;case"ZXY":this._x=u*d*f-c*p*x,this._y=c*p*f+u*d*x,this._z=c*d*x+u*p*f,this._w=c*d*f-u*p*x;break;case"ZYX":this._x=u*d*f-c*p*x,this._y=c*p*f+u*d*x,this._z=c*d*x-u*p*f,this._w=c*d*f+u*p*x;break;case"YZX":this._x=u*d*f+c*p*x,this._y=c*p*f+u*d*x,this._z=c*d*x-u*p*f,this._w=c*d*f-u*p*x;break;case"XZY":this._x=u*d*f-c*p*x,this._y=c*p*f-u*d*x,this._z=c*d*x+u*p*f,this._w=c*d*f+u*p*x;break;default:ke("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],f=t[10],u=i+o+f;if(u>0){const p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(d-l)*p,this._y=(s-c)*p,this._z=(a-r)*p}else if(i>o&&i>f){const p=2*Math.sqrt(1+i-o-f);this._w=(d-l)/p,this._x=.25*p,this._y=(r+a)/p,this._z=(s+c)/p}else if(o>f){const p=2*Math.sqrt(1+o-i-f);this._w=(s-c)/p,this._x=(r+a)/p,this._y=.25*p,this._z=(l+d)/p}else{const p=2*Math.sqrt(1+f-i-o);this._w=(a-r)/p,this._x=(s+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(nt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+r*c-s*l,this._y=r*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-r*o,this._w=a*d-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),d=Math.sin(c);l=Math.sin(l*c)/d,t=Math.sin(t*c)/d,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const nl=class nl{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Cl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Cl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),d=2*(o*t-s*r),f=2*(s*i-a*t);return this.x=t+l*c+a*f-o*d,this.y=i+l*d+o*c-s*f,this.z=r+l*f+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this.z=nt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this.z=nt(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return qs.copy(this).projectOnVector(e),this.sub(qs)}reflect(e){return this.sub(qs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(nt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};nl.prototype.isVector3=!0;let z=nl;const qs=new z,Cl=new ir,il=class il{constructor(e,t,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],f=i[7],u=i[2],p=i[5],x=i[8],S=r[0],m=r[3],h=r[6],E=r[1],A=r[4],T=r[7],P=r[2],M=r[5],w=r[8];return s[0]=a*S+o*E+l*P,s[3]=a*m+o*A+l*M,s[6]=a*h+o*T+l*w,s[1]=c*S+d*E+f*P,s[4]=c*m+d*A+f*M,s[7]=c*h+d*T+f*w,s[2]=u*S+p*E+x*P,s[5]=u*m+p*A+x*M,s[8]=u*h+p*T+x*w,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],f=d*a-o*c,u=o*l-d*s,p=c*s-a*l,x=t*f+i*u+r*p;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/x;return e[0]=f*S,e[1]=(r*c-d*i)*S,e[2]=(o*i-r*a)*S,e[3]=u*S,e[4]=(d*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=p*S,e[7]=(i*l-c*t)*S,e[8]=(a*t-i*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Ys.makeScale(e,t)),this}rotate(e){return this.premultiply(Ys.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ys.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};il.prototype.isMatrix3=!0;let He=il;const Ys=new He,wl=new He().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rl=new He().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function X0(){const n={enabled:!0,workingColorSpace:_s,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===ft&&(r.r=kn(r.r),r.g=kn(r.g),r.b=kn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ft&&(r.r=Zi(r.r),r.g=Zi(r.g),r.b=Zi(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ei?vs:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return So("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return So("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[_s]:{primaries:e,whitePoint:i,transfer:vs,toXYZ:wl,fromXYZ:Rl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:rn},outputColorSpaceConfig:{drawingBufferColorSpace:rn}},[rn]:{primaries:e,whitePoint:i,transfer:ft,toXYZ:wl,fromXYZ:Rl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:rn}}}),n}const it=X0();function kn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Zi(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Ni;class q0{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ni===void 0&&(Ni=Ms("canvas")),Ni.width=e.width,Ni.height=e.height;const r=Ni.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Ni}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ms("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=kn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(kn(t[i]/255)*255):t[i]=kn(t[i]);return{data:t,width:e.width,height:e.height}}else return ke("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Y0=0;class Yo{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Y0++}),this.uuid=nr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Ks(r[a].image)):s.push(Ks(r[a]))}else s=Ks(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Ks(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?q0.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(ke("Texture: Unable to serialize Texture."),{})}let K0=0;const Zs=new z;class qt extends yi{constructor(e=qt.DEFAULT_IMAGE,t=qt.DEFAULT_MAPPING,i=Bn,r=Bn,s=Gt,a=mi,o=pn,l=an,c=qt.DEFAULT_ANISOTROPY,d=ei){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:K0++}),this.uuid=nr(),this.name="",this.source=new Yo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ut(0,0),this.repeat=new ut(1,1),this.center=new ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new He,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Zs).x}get height(){return this.source.getSize(Zs).y}get depth(){return this.source.getSize(Zs).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){ke(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){ke(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==au)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case za:e.x=e.x-Math.floor(e.x);break;case Bn:e.x=e.x<0?0:1;break;case Ga:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case za:e.y=e.y-Math.floor(e.y);break;case Bn:e.y=e.y<0?0:1;break;case Ga:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}qt.DEFAULT_IMAGE=null;qt.DEFAULT_MAPPING=au;qt.DEFAULT_ANISOTROPY=1;const rl=class rl{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],d=l[4],f=l[8],u=l[1],p=l[5],x=l[9],S=l[2],m=l[6],h=l[10];if(Math.abs(d-u)<.01&&Math.abs(f-S)<.01&&Math.abs(x-m)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+S)<.1&&Math.abs(x+m)<.1&&Math.abs(c+p+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(c+1)/2,T=(p+1)/2,P=(h+1)/2,M=(d+u)/4,w=(f+S)/4,_=(x+m)/4;return A>T&&A>P?A<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(A),r=M/i,s=w/i):T>P?T<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(T),i=M/r,s=_/r):P<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(P),i=w/s,r=_/s),this.set(i,r,s,t),this}let E=Math.sqrt((m-x)*(m-x)+(f-S)*(f-S)+(u-d)*(u-d));return Math.abs(E)<.001&&(E=1),this.x=(m-x)/E,this.y=(f-S)/E,this.z=(u-d)/E,this.w=Math.acos((c+p+h-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this.z=nt(this.z,e.z,t.z),this.w=nt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this.z=nt(this.z,e,t),this.w=nt(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};rl.prototype.isVector4=!0;let Rt=rl;class Z0 extends yi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Gt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Rt(0,0,e,t),this.scissorTest=!1,this.viewport=new Rt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new qt(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){const t={minFilter:Gt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Yo(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}}class yn extends Z0{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class pu extends qt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Bt,this.minFilter=Bt,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class j0 extends qt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Bt,this.minFilter=Bt,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Cs=class Cs{constructor(e,t,i,r,s,a,o,l,c,d,f,u,p,x,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,d,f,u,p,x,S,m)}set(e,t,i,r,s,a,o,l,c,d,f,u,p,x,S,m){const h=this.elements;return h[0]=e,h[4]=t,h[8]=i,h[12]=r,h[1]=s,h[5]=a,h[9]=o,h[13]=l,h[2]=c,h[6]=d,h[10]=f,h[14]=u,h[3]=p,h[7]=x,h[11]=S,h[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Cs().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Fi.setFromMatrixColumn(e,0).length(),s=1/Fi.setFromMatrixColumn(e,1).length(),a=1/Fi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const u=a*d,p=a*f,x=o*d,S=o*f;t[0]=l*d,t[4]=-l*f,t[8]=c,t[1]=p+x*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=x+p*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*d,p=l*f,x=c*d,S=c*f;t[0]=u+S*o,t[4]=x*o-p,t[8]=a*c,t[1]=a*f,t[5]=a*d,t[9]=-o,t[2]=p*o-x,t[6]=S+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*d,p=l*f,x=c*d,S=c*f;t[0]=u-S*o,t[4]=-a*f,t[8]=x+p*o,t[1]=p+x*o,t[5]=a*d,t[9]=S-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*d,p=a*f,x=o*d,S=o*f;t[0]=l*d,t[4]=x*c-p,t[8]=u*c+S,t[1]=l*f,t[5]=S*c+u,t[9]=p*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,p=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=S-u*f,t[8]=x*f+p,t[1]=f,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=p*f+x,t[10]=u-S*f}else if(e.order==="XZY"){const u=a*l,p=a*c,x=o*l,S=o*c;t[0]=l*d,t[4]=-f,t[8]=c*d,t[1]=u*f+S,t[5]=a*d,t[9]=p*f-x,t[2]=x*f-p,t[6]=o*d,t[10]=S*f+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(J0,e,Q0)}lookAt(e,t,i){const r=this.elements;return Qt.subVectors(e,t),Qt.lengthSq()===0&&(Qt.z=1),Qt.normalize(),Yn.crossVectors(i,Qt),Yn.lengthSq()===0&&(Math.abs(i.z)===1?Qt.x+=1e-4:Qt.z+=1e-4,Qt.normalize(),Yn.crossVectors(i,Qt)),Yn.normalize(),Nr.crossVectors(Qt,Yn),r[0]=Yn.x,r[4]=Nr.x,r[8]=Qt.x,r[1]=Yn.y,r[5]=Nr.y,r[9]=Qt.y,r[2]=Yn.z,r[6]=Nr.z,r[10]=Qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],f=i[5],u=i[9],p=i[13],x=i[2],S=i[6],m=i[10],h=i[14],E=i[3],A=i[7],T=i[11],P=i[15],M=r[0],w=r[4],_=r[8],C=r[12],L=r[1],R=r[5],O=r[9],$=r[13],Y=r[2],y=r[6],N=r[10],F=r[14],k=r[3],H=r[7],J=r[11],re=r[15];return s[0]=a*M+o*L+l*Y+c*k,s[4]=a*w+o*R+l*y+c*H,s[8]=a*_+o*O+l*N+c*J,s[12]=a*C+o*$+l*F+c*re,s[1]=d*M+f*L+u*Y+p*k,s[5]=d*w+f*R+u*y+p*H,s[9]=d*_+f*O+u*N+p*J,s[13]=d*C+f*$+u*F+p*re,s[2]=x*M+S*L+m*Y+h*k,s[6]=x*w+S*R+m*y+h*H,s[10]=x*_+S*O+m*N+h*J,s[14]=x*C+S*$+m*F+h*re,s[3]=E*M+A*L+T*Y+P*k,s[7]=E*w+A*R+T*y+P*H,s[11]=E*_+A*O+T*N+P*J,s[15]=E*C+A*$+T*F+P*re,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],f=e[6],u=e[10],p=e[14],x=e[3],S=e[7],m=e[11],h=e[15],E=l*p-c*u,A=o*p-c*f,T=o*u-l*f,P=a*p-c*d,M=a*u-l*d,w=a*f-o*d;return t*(S*E-m*A+h*T)-i*(x*E-m*P+h*M)+r*(x*A-S*P+h*w)-s*(x*T-S*M+m*w)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],f=e[9],u=e[10],p=e[11],x=e[12],S=e[13],m=e[14],h=e[15],E=t*o-i*a,A=t*l-r*a,T=t*c-s*a,P=i*l-r*o,M=i*c-s*o,w=r*c-s*l,_=d*S-f*x,C=d*m-u*x,L=d*h-p*x,R=f*m-u*S,O=f*h-p*S,$=u*h-p*m,Y=E*$-A*O+T*R+P*L-M*C+w*_;if(Y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const y=1/Y;return e[0]=(o*$-l*O+c*R)*y,e[1]=(r*O-i*$-s*R)*y,e[2]=(S*w-m*M+h*P)*y,e[3]=(u*M-f*w-p*P)*y,e[4]=(l*L-a*$-c*C)*y,e[5]=(t*$-r*L+s*C)*y,e[6]=(m*T-x*w-h*A)*y,e[7]=(d*w-u*T+p*A)*y,e[8]=(a*O-o*L+c*_)*y,e[9]=(i*L-t*O-s*_)*y,e[10]=(x*M-S*T+h*E)*y,e[11]=(f*T-d*M-p*E)*y,e[12]=(o*C-a*R-l*_)*y,e[13]=(t*R-i*C+r*_)*y,e[14]=(S*A-x*P-m*E)*y,e[15]=(d*P-f*A+u*E)*y,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,d*o+i,d*l-r*a,0,c*l-r*o,d*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,f=o+o,u=s*c,p=s*d,x=s*f,S=a*d,m=a*f,h=o*f,E=l*c,A=l*d,T=l*f,P=i.x,M=i.y,w=i.z;return r[0]=(1-(S+h))*P,r[1]=(p+T)*P,r[2]=(x-A)*P,r[3]=0,r[4]=(p-T)*M,r[5]=(1-(u+h))*M,r[6]=(m+E)*M,r[7]=0,r[8]=(x+A)*w,r[9]=(m-E)*w,r[10]=(1-(u+S))*w,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Fi.set(r[0],r[1],r[2]).length();const o=Fi.set(r[4],r[5],r[6]).length(),l=Fi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),cn.copy(this);const c=1/a,d=1/o,f=1/l;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=d,cn.elements[5]*=d,cn.elements[6]*=d,cn.elements[8]*=f,cn.elements[9]*=f,cn.elements[10]*=f,t.setFromRotationMatrix(cn),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=Mn,l=!1){const c=this.elements,d=2*s/(t-e),f=2*s/(i-r),u=(t+e)/(t-e),p=(i+r)/(i-r);let x,S;if(l)x=s/(a-s),S=a*s/(a-s);else if(o===Mn)x=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===Ss)x=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=Mn,l=!1){const c=this.elements,d=2/(t-e),f=2/(i-r),u=-(t+e)/(t-e),p=-(i+r)/(i-r);let x,S;if(l)x=1/(a-s),S=a/(a-s);else if(o===Mn)x=-2/(a-s),S=-(a+s)/(a-s);else if(o===Ss)x=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};Cs.prototype.isMatrix4=!0;let Et=Cs;const Fi=new z,cn=new Et,J0=new z(0,0,0),Q0=new z(1,1,1),Yn=new z,Nr=new z,Qt=new z,Nl=new Et,Fl=new ir;class Ei{constructor(e=0,t=0,i=0,r=Ei.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],d=r[9],f=r[2],u=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(nt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-nt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(nt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-nt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(nt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-nt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,p),this._y=0);break;default:ke("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Nl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Nl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Fl.setFromEuler(this),this.setFromQuaternion(Fl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ei.DEFAULT_ORDER="XYZ";class mu{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let ex=0;const Pl=new z,Pi=new ir,Nn=new Et,Fr=new z,or=new z,tx=new z,nx=new ir,Ll=new z(1,0,0),Dl=new z(0,1,0),Il=new z(0,0,1),Ul={type:"added"},ix={type:"removed"},Li={type:"childadded",child:null},js={type:"childremoved",child:null};class Ht extends yi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ex++}),this.uuid=nr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ht.DEFAULT_UP.clone();const e=new z,t=new Ei,i=new ir,r=new z(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Et},normalMatrix:{value:new He}}),this.matrix=new Et,this.matrixWorld=new Et,this.matrixAutoUpdate=Ht.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new mu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Pi.setFromAxisAngle(e,t),this.quaternion.multiply(Pi),this}rotateOnWorldAxis(e,t){return Pi.setFromAxisAngle(e,t),this.quaternion.premultiply(Pi),this}rotateX(e){return this.rotateOnAxis(Ll,e)}rotateY(e){return this.rotateOnAxis(Dl,e)}rotateZ(e){return this.rotateOnAxis(Il,e)}translateOnAxis(e,t){return Pl.copy(e).applyQuaternion(this.quaternion),this.position.add(Pl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ll,e)}translateY(e){return this.translateOnAxis(Dl,e)}translateZ(e){return this.translateOnAxis(Il,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Fr.copy(e):Fr.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),or.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(or,Fr,this.up):Nn.lookAt(Fr,or,this.up),this.quaternion.setFromRotationMatrix(Nn),r&&(Nn.extractRotation(r.matrixWorld),Pi.setFromRotationMatrix(Nn),this.quaternion.premultiply(Pi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(at("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ul),Li.child=e,this.dispatchEvent(Li),Li.child=null):at("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ix),js.child=e,this.dispatchEvent(js),js.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ul),Li.child=e,this.dispatchEvent(Li),Li.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(or,e,tx),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(or,nx,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),f=a(e.shapes),u=a(e.skeletons),p=a(e.animations),x=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),p.length>0&&(i.animations=p),x.length>0&&(i.nodes=x)}return i.object=r,i;function a(o){const l=[];for(const c in o){const d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Ht.DEFAULT_UP=new z(0,1,0);Ht.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class qi extends Ht{constructor(){super(),this.isGroup=!0,this.type="Group"}}const rx={type:"move"};class Js{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new qi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new qi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new qi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,i),h=this._getHandJoint(c,S);m!==null&&(h.matrix.fromArray(m.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=m.radius),h.visible=m!==null}const d=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=d.position.distanceTo(f.position),p=.02,x=.005;c.inputState.pinching&&u>p+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=p-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(rx)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new qi;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const xu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},Pr={h:0,s:0,l:0};function Qs(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Ke{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=rn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,it.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=it.workingColorSpace){return this.r=e,this.g=t,this.b=i,it.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=it.workingColorSpace){if(e=qo(e,1),t=nt(t,0,1),i=nt(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Qs(a,s,e+1/3),this.g=Qs(a,s,e),this.b=Qs(a,s,e-1/3)}return it.colorSpaceToWorking(this,r),this}setStyle(e,t=rn){function i(s){s!==void 0&&parseFloat(s)<1&&ke("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:ke("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);ke("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=rn){const i=xu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):ke("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=kn(e.r),this.g=kn(e.g),this.b=kn(e.b),this}copyLinearToSRGB(e){return this.r=Zi(e.r),this.g=Zi(e.g),this.b=Zi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=rn){return it.workingToColorSpace(Vt.copy(this),e),Math.round(nt(Vt.r*255,0,255))*65536+Math.round(nt(Vt.g*255,0,255))*256+Math.round(nt(Vt.b*255,0,255))}getHexString(e=rn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=it.workingColorSpace){it.workingToColorSpace(Vt.copy(this),t);const i=Vt.r,r=Vt.g,s=Vt.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const d=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=d<=.5?f/(a+o):f/(2-a-o),a){case i:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-i)/f+2;break;case s:l=(i-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=it.workingColorSpace){return it.workingToColorSpace(Vt.copy(this),t),e.r=Vt.r,e.g=Vt.g,e.b=Vt.b,e}getStyle(e=rn){it.workingToColorSpace(Vt.copy(this),e);const t=Vt.r,i=Vt.g,r=Vt.b;return e!==rn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Kn),this.setHSL(Kn.h+e,Kn.s+t,Kn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Kn),e.getHSL(Pr);const i=vr(Kn.h,Pr.h,t),r=vr(Kn.s,Pr.s,t),s=vr(Kn.l,Pr.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Vt=new Ke;Ke.NAMES=xu;class sx extends Ht{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ei,this.environmentIntensity=1,this.environmentRotation=new Ei,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const un=new z,Fn=new z,ea=new z,Pn=new z,Di=new z,Ii=new z,Bl=new z,ta=new z,na=new z,ia=new z,ra=new Rt,sa=new Rt,aa=new Rt;class on{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),un.subVectors(e,t),r.cross(un);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){un.subVectors(r,t),Fn.subVectors(i,t),ea.subVectors(e,t);const a=un.dot(un),o=un.dot(Fn),l=un.dot(ea),c=Fn.dot(Fn),d=Fn.dot(ea),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const u=1/f,p=(c*l-o*d)*u,x=(a*d-o*l)*u;return s.set(1-p-x,x,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Pn)===null?!1:Pn.x>=0&&Pn.y>=0&&Pn.x+Pn.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,Pn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Pn.x),l.addScaledVector(a,Pn.y),l.addScaledVector(o,Pn.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return ra.setScalar(0),sa.setScalar(0),aa.setScalar(0),ra.fromBufferAttribute(e,t),sa.fromBufferAttribute(e,i),aa.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ra,s.x),a.addScaledVector(sa,s.y),a.addScaledVector(aa,s.z),a}static isFrontFacing(e,t,i,r){return un.subVectors(i,t),Fn.subVectors(e,t),un.cross(Fn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return un.subVectors(this.c,this.b),Fn.subVectors(this.a,this.b),un.cross(Fn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return on.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return on.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return on.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return on.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return on.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;Di.subVectors(r,i),Ii.subVectors(s,i),ta.subVectors(e,i);const l=Di.dot(ta),c=Ii.dot(ta);if(l<=0&&c<=0)return t.copy(i);na.subVectors(e,r);const d=Di.dot(na),f=Ii.dot(na);if(d>=0&&f<=d)return t.copy(r);const u=l*f-d*c;if(u<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(Di,a);ia.subVectors(e,s);const p=Di.dot(ia),x=Ii.dot(ia);if(x>=0&&p<=x)return t.copy(s);const S=p*c-l*x;if(S<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(i).addScaledVector(Ii,o);const m=d*x-p*f;if(m<=0&&f-d>=0&&p-x>=0)return Bl.subVectors(s,r),o=(f-d)/(f-d+(p-x)),t.copy(r).addScaledVector(Bl,o);const h=1/(m+S+u);return a=S*h,o=u*h,t.copy(i).addScaledVector(Di,a).addScaledVector(Ii,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Ti{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(dn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(dn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=dn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,dn):dn.fromBufferAttribute(s,a),dn.applyMatrix4(e.matrixWorld),this.expandByPoint(dn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Lr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Lr.copy(i.boundingBox)),Lr.applyMatrix4(e.matrixWorld),this.union(Lr)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,dn),dn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(lr),Dr.subVectors(this.max,lr),Ui.subVectors(e.a,lr),Bi.subVectors(e.b,lr),Oi.subVectors(e.c,lr),Zn.subVectors(Bi,Ui),jn.subVectors(Oi,Bi),ai.subVectors(Ui,Oi);let t=[0,-Zn.z,Zn.y,0,-jn.z,jn.y,0,-ai.z,ai.y,Zn.z,0,-Zn.x,jn.z,0,-jn.x,ai.z,0,-ai.x,-Zn.y,Zn.x,0,-jn.y,jn.x,0,-ai.y,ai.x,0];return!oa(t,Ui,Bi,Oi,Dr)||(t=[1,0,0,0,1,0,0,0,1],!oa(t,Ui,Bi,Oi,Dr))?!1:(Ir.crossVectors(Zn,jn),t=[Ir.x,Ir.y,Ir.z],oa(t,Ui,Bi,Oi,Dr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,dn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(dn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ln[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ln[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ln[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ln[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ln[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ln[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ln[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ln[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ln),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Ln=[new z,new z,new z,new z,new z,new z,new z,new z],dn=new z,Lr=new Ti,Ui=new z,Bi=new z,Oi=new z,Zn=new z,jn=new z,ai=new z,lr=new z,Dr=new z,Ir=new z,oi=new z;function oa(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){oi.fromArray(n,s);const o=r.x*Math.abs(oi.x)+r.y*Math.abs(oi.y)+r.z*Math.abs(oi.z),l=e.dot(oi),c=t.dot(oi),d=i.dot(oi);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}const Nt=new z,Ur=new ut;let ax=0;class mn extends yi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ax++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=El,this.updateRanges=[],this.gpuType=hn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ur.fromBufferAttribute(this,t),Ur.applyMatrix3(e),this.setXY(t,Ur.x,Ur.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyMatrix3(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyMatrix4(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyNormalMatrix(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.transformDirection(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Xi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=$t(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Xi(t,this.array)),t}setX(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Xi(t,this.array)),t}setY(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Xi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Xi(t,this.array)),t}setW(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),i=$t(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),i=$t(i,this.array),r=$t(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),i=$t(i,this.array),r=$t(r,this.array),s=$t(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==El&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class gu extends mn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class _u extends mn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class bt extends mn{constructor(e,t,i){super(new Float32Array(e),t,i)}}const ox=new Ti,cr=new z,la=new z;class rr{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):ox.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;cr.subVectors(e,this.center);const t=cr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(cr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(la.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(cr.copy(e.center).add(la)),this.expandByPoint(cr.copy(e.center).sub(la))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let lx=0;const nn=new Et,ca=new Ht,ki=new z,en=new Ti,ur=new Ti,It=new z;class Wt extends yi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:lx++}),this.uuid=nr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(y0(e)?_u:gu)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new He().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return nn.makeRotationFromQuaternion(e),this.applyMatrix4(nn),this}rotateX(e){return nn.makeRotationX(e),this.applyMatrix4(nn),this}rotateY(e){return nn.makeRotationY(e),this.applyMatrix4(nn),this}rotateZ(e){return nn.makeRotationZ(e),this.applyMatrix4(nn),this}translate(e,t,i){return nn.makeTranslation(e,t,i),this.applyMatrix4(nn),this}scale(e,t,i){return nn.makeScale(e,t,i),this.applyMatrix4(nn),this}lookAt(e){return ca.lookAt(e),ca.updateMatrix(),this.applyMatrix4(ca.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ki).negate(),this.translate(ki.x,ki.y,ki.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new bt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&ke("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ti);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){at("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];en.setFromBufferAttribute(s),this.morphTargetsRelative?(It.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(It),It.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(It)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&at('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new rr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){at("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){const i=this.boundingSphere.center;if(en.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];ur.setFromBufferAttribute(o),this.morphTargetsRelative?(It.addVectors(en.min,ur.min),en.expandByPoint(It),It.addVectors(en.max,ur.max),en.expandByPoint(It)):(en.expandByPoint(ur.min),en.expandByPoint(ur.max))}en.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)It.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(It));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)It.fromBufferAttribute(o,c),l&&(ki.fromBufferAttribute(e,c),It.add(ki)),r=Math.max(r,i.distanceToSquared(It))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&at('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){at("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new mn(new Float32Array(4*i.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new z,l[_]=new z;const c=new z,d=new z,f=new z,u=new ut,p=new ut,x=new ut,S=new z,m=new z;function h(_,C,L){c.fromBufferAttribute(i,_),d.fromBufferAttribute(i,C),f.fromBufferAttribute(i,L),u.fromBufferAttribute(s,_),p.fromBufferAttribute(s,C),x.fromBufferAttribute(s,L),d.sub(c),f.sub(c),p.sub(u),x.sub(u);const R=1/(p.x*x.y-x.x*p.y);isFinite(R)&&(S.copy(d).multiplyScalar(x.y).addScaledVector(f,-p.y).multiplyScalar(R),m.copy(f).multiplyScalar(p.x).addScaledVector(d,-x.x).multiplyScalar(R),o[_].add(S),o[C].add(S),o[L].add(S),l[_].add(m),l[C].add(m),l[L].add(m))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let _=0,C=E.length;_<C;++_){const L=E[_],R=L.start,O=L.count;for(let $=R,Y=R+O;$<Y;$+=3)h(e.getX($+0),e.getX($+1),e.getX($+2))}const A=new z,T=new z,P=new z,M=new z;function w(_){P.fromBufferAttribute(r,_),M.copy(P);const C=o[_];A.copy(C),A.sub(P.multiplyScalar(P.dot(C))).normalize(),T.crossVectors(M,C);const R=T.dot(l[_])<0?-1:1;a.setXYZW(_,A.x,A.y,A.z,R)}for(let _=0,C=E.length;_<C;++_){const L=E[_],R=L.start,O=L.count;for(let $=R,Y=R+O;$<Y;$+=3)w(e.getX($+0)),w(e.getX($+1)),w(e.getX($+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new mn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,p=i.count;u<p;u++)i.setXYZ(u,0,0,0);const r=new z,s=new z,a=new z,o=new z,l=new z,c=new z,d=new z,f=new z;if(e)for(let u=0,p=e.count;u<p;u+=3){const x=e.getX(u+0),S=e.getX(u+1),m=e.getX(u+2);r.fromBufferAttribute(t,x),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),o.fromBufferAttribute(i,x),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(x,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,p=t.count;u<p;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),d.subVectors(a,s),f.subVectors(r,s),d.cross(f),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)It.fromBufferAttribute(e,t),It.normalize(),e.setXYZ(t,It.x,It.y,It.z)}toNonIndexed(){function e(o,l){const c=o.array,d=o.itemSize,f=o.normalized,u=new c.constructor(l.length*d);let p=0,x=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?p=l[S]*o.data.stride+o.offset:p=l[S]*d;for(let h=0;h<d;h++)u[x++]=c[p++]}return new mn(u,d,f)}if(this.index===null)return ke("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Wt,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let d=0,f=c.length;d<f;d++){const u=c[d],p=e(u,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let f=0,u=c.length;f<u;f++){const p=c[f];d.push(p.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const d=r[c];this.setAttribute(c,d.clone(t))}const s=e.morphAttributes;for(const c in s){const d=[],f=s[c];for(let u=0,p=f.length;u<p;u++)d.push(f[u].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,d=a.length;c<d;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}let cx=0;class yr extends yi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:cx++}),this.uuid=nr(),this.name="",this.type="Material",this.blending=Yi,this.side=ri,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pa,this.blendDst=La,this.blendEquation=hi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ke(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ml,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ri,this.stencilZFail=Ri,this.stencilZPass=Ri,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){ke(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){ke(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Yi&&(i.blending=this.blending),this.side!==ri&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Pa&&(i.blendSrc=this.blendSrc),this.blendDst!==La&&(i.blendDst=this.blendDst),this.blendEquation!==hi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==ji&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ml&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ri&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ri&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ri&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Dn=new z,ua=new z,Br=new z,Jn=new z,da=new z,Or=new z,fa=new z;class vu{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Dn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Dn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Dn.copy(this.origin).addScaledVector(this.direction,t),Dn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){ua.copy(e).add(t).multiplyScalar(.5),Br.copy(t).sub(e).normalize(),Jn.copy(this.origin).sub(ua);const s=e.distanceTo(t)*.5,a=-this.direction.dot(Br),o=Jn.dot(this.direction),l=-Jn.dot(Br),c=Jn.lengthSq(),d=Math.abs(1-a*a);let f,u,p,x;if(d>0)if(f=a*l-o,u=a*o-l,x=s*d,f>=0)if(u>=-x)if(u<=x){const S=1/d;f*=S,u*=S,p=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=s,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;else u=-s,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;else u<=-x?(f=Math.max(0,-(-a*s+o)),u=f>0?-s:Math.min(Math.max(-s,-l),s),p=-f*f+u*(u+2*l)+c):u<=x?(f=0,u=Math.min(Math.max(-s,-l),s),p=u*(u+2*l)+c):(f=Math.max(0,-(a*s+o)),u=f>0?s:Math.min(Math.max(-s,-l),s),p=-f*f+u*(u+2*l)+c);else u=a>0?-s:s,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(ua).addScaledVector(Br,u),p}intersectSphere(e,t){Dn.subVectors(e.center,this.origin);const i=Dn.dot(this.direction),r=Dn.dot(Dn)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),d>=0?(s=(e.min.y-u.y)*d,a=(e.max.y-u.y)*d):(s=(e.max.y-u.y)*d,a=(e.min.y-u.y)*d),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-u.z)*f,l=(e.max.z-u.z)*f):(o=(e.max.z-u.z)*f,l=(e.min.z-u.z)*f),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Dn)!==null}intersectTriangle(e,t,i,r,s){da.subVectors(t,e),Or.subVectors(i,e),fa.crossVectors(da,Or);let a=this.direction.dot(fa),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Jn.subVectors(this.origin,e);const l=o*this.direction.dot(Or.crossVectors(Jn,Or));if(l<0)return null;const c=o*this.direction.dot(da.cross(Jn));if(c<0||l+c>a)return null;const d=-o*Jn.dot(fa);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class In extends yr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ei,this.combine=Jc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Ol=new Et,li=new vu,kr=new rr,kl=new z,Vr=new z,zr=new z,Gr=new z,ha=new z,Hr=new z,Vl=new z,Wr=new z;class Ut extends Ht{constructor(e=new Wt,t=new In){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Hr.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const d=o[l],f=s[l];d!==0&&(ha.fromBufferAttribute(f,e),a?Hr.addScaledVector(ha,d):Hr.addScaledVector(ha.sub(t),d))}t.add(Hr)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),kr.copy(i.boundingSphere),kr.applyMatrix4(s),li.copy(e.ray).recast(e.near),!(kr.containsPoint(li.origin)===!1&&(li.intersectSphere(kr,kl)===null||li.origin.distanceToSquared(kl)>(e.far-e.near)**2))&&(Ol.copy(s).invert(),li.copy(e.ray).applyMatrix4(Ol),!(i.boundingBox!==null&&li.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,li)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,f=s.attributes.normal,u=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],h=a[m.materialIndex],E=Math.max(m.start,p.start),A=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let T=E,P=A;T<P;T+=3){const M=o.getX(T),w=o.getX(T+1),_=o.getX(T+2);r=$r(this,h,e,i,c,d,f,M,w,_),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,p.start),S=Math.min(o.count,p.start+p.count);for(let m=x,h=S;m<h;m+=3){const E=o.getX(m),A=o.getX(m+1),T=o.getX(m+2);r=$r(this,a,e,i,c,d,f,E,A,T),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,S=u.length;x<S;x++){const m=u[x],h=a[m.materialIndex],E=Math.max(m.start,p.start),A=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let T=E,P=A;T<P;T+=3){const M=T,w=T+1,_=T+2;r=$r(this,h,e,i,c,d,f,M,w,_),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const x=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let m=x,h=S;m<h;m+=3){const E=m,A=m+1,T=m+2;r=$r(this,a,e,i,c,d,f,E,A,T),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function ux(n,e,t,i,r,s,a,o){let l;if(e.side===Zt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===ri,o),l===null)return null;Wr.copy(o),Wr.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Wr);return c<t.near||c>t.far?null:{distance:c,point:Wr.clone(),object:n}}function $r(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,Vr),n.getVertexPosition(l,zr),n.getVertexPosition(c,Gr);const d=ux(n,e,t,i,Vr,zr,Gr,Vl);if(d){const f=new z;on.getBarycoord(Vl,Vr,zr,Gr,f),r&&(d.uv=on.getInterpolatedAttribute(r,o,l,c,f,new ut)),s&&(d.uv1=on.getInterpolatedAttribute(s,o,l,c,f,new ut)),a&&(d.normal=on.getInterpolatedAttribute(a,o,l,c,f,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new z,materialIndex:0};on.getNormal(Vr,zr,Gr,u.normal),d.face=u,d.barycoord=f}return d}class Su extends qt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=Bt,d=Bt,f,u){super(null,a,o,l,c,d,r,s,f,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class zl extends mn{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Vi=new Et,Gl=new Et,Xr=[],Hl=new Ti,dx=new Et,dr=new Ut,fr=new rr;class Wl extends Ut{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new zl(new Float32Array(i*16),16),this.previousInstanceMatrix=null,this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,dx)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ti),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Vi),Hl.copy(e.boundingBox).applyMatrix4(Vi),this.boundingBox.union(Hl)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new rr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Vi),fr.copy(e.boundingSphere).applyMatrix4(Vi),this.boundingSphere.union(fr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.previousInstanceMatrix!==null&&(this.previousInstanceMatrix=e.previousInstanceMatrix.clone()),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=r[a+o]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(dr.geometry=this.geometry,dr.material=this.material,dr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fr.copy(this.boundingSphere),fr.applyMatrix4(i),e.ray.intersectsSphere(fr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Vi),Gl.multiplyMatrices(i,Vi),dr.matrixWorld=Gl,dr.raycast(e,Xr);for(let a=0,o=Xr.length;a<o;a++){const l=Xr[a];l.instanceId=s,l.object=this,t.push(l)}Xr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new zl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Su(new Float32Array(r*this.count),r,this.count,zo,hn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<i.length;c++)a+=i[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(i,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const pa=new z,fx=new z,hx=new He;class fi{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=pa.subVectors(i,t).cross(fx.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(pa),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||hx.getNormalMatrix(e),r=this.coplanarPoint(pa).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ci=new rr,px=new ut(.5,.5),qr=new z;class Mu{constructor(e=new fi,t=new fi,i=new fi,r=new fi,s=new fi,a=new fi){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Mn,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],d=s[4],f=s[5],u=s[6],p=s[7],x=s[8],S=s[9],m=s[10],h=s[11],E=s[12],A=s[13],T=s[14],P=s[15];if(r[0].setComponents(c-a,p-d,h-x,P-E).normalize(),r[1].setComponents(c+a,p+d,h+x,P+E).normalize(),r[2].setComponents(c+o,p+f,h+S,P+A).normalize(),r[3].setComponents(c-o,p-f,h-S,P-A).normalize(),i)r[4].setComponents(l,u,m,T).normalize(),r[5].setComponents(c-l,p-u,h-m,P-T).normalize();else if(r[4].setComponents(c-l,p-u,h-m,P-T).normalize(),t===Mn)r[5].setComponents(c+l,p+u,h+m,P+T).normalize();else if(t===Ss)r[5].setComponents(l,u,m,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ci.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ci.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ci)}intersectsSprite(e){ci.center.set(0,0,0);const t=px.distanceTo(e.center);return ci.radius=.7071067811865476+t,ci.applyMatrix4(e.matrixWorld),this.intersectsSphere(ci)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(qr.x=r.normal.x>0?e.max.x:e.min.x,qr.y=r.normal.y>0?e.max.y:e.min.y,qr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(qr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class fs extends yr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ke(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Es=new z,bs=new z,$l=new Et,hr=new vu,Yr=new rr,ma=new z,Xl=new z;class mx extends Ht{constructor(e=new Wt,t=new fs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Es.fromBufferAttribute(t,r-1),bs.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Es.distanceTo(bs);e.setAttribute("lineDistance",new bt(i,1))}else ke("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Yr.copy(i.boundingSphere),Yr.applyMatrix4(r),Yr.radius+=s,e.ray.intersectsSphere(Yr)===!1)return;$l.copy(r).invert(),hr.copy(e.ray).applyMatrix4($l);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=i.index,u=i.attributes.position;if(d!==null){const p=Math.max(0,a.start),x=Math.min(d.count,a.start+a.count);for(let S=p,m=x-1;S<m;S+=c){const h=d.getX(S),E=d.getX(S+1),A=Kr(this,e,hr,l,h,E,S);A&&t.push(A)}if(this.isLineLoop){const S=d.getX(x-1),m=d.getX(p),h=Kr(this,e,hr,l,S,m,x-1);h&&t.push(h)}}else{const p=Math.max(0,a.start),x=Math.min(u.count,a.start+a.count);for(let S=p,m=x-1;S<m;S+=c){const h=Kr(this,e,hr,l,S,S+1,S);h&&t.push(h)}if(this.isLineLoop){const S=Kr(this,e,hr,l,x-1,p,x-1);S&&t.push(S)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Kr(n,e,t,i,r,s,a){const o=n.geometry.attributes.position;if(Es.fromBufferAttribute(o,r),bs.fromBufferAttribute(o,s),t.distanceSqToSegment(Es,bs,ma,Xl)>i)return;ma.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(ma);if(!(c<e.near||c>e.far))return{distance:c,point:Xl.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}const ql=new z,Yl=new z;class Zr extends mx{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)ql.fromBufferAttribute(t,r),Yl.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+ql.distanceTo(Yl);e.setAttribute("lineDistance",new bt(i,1))}else ke("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Eu extends qt{constructor(e=[],t=Si,i,r,s,a,o,l,c,d){super(e,t,i,r,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Qi extends qt{constructor(e,t,i=Tn,r,s,a,o=Bt,l=Bt,c,d=Gn,f=1){if(d!==Gn&&d!==xi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:f};super(u,r,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Yo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class xx extends Qi{constructor(e,t=Tn,i=Si,r,s,a=Bt,o=Bt,l,c=Gn){const d={width:e,height:e,depth:1},f=[d,d,d,d,d,d];super(e,e,t,i,r,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class bu extends qt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Tr extends Wt{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],d=[],f=[];let u=0,p=0;x("z","y","x",-1,-1,i,t,e,a,s,0),x("z","y","x",1,-1,i,t,-e,a,s,1),x("x","z","y",1,1,e,i,t,r,a,2),x("x","z","y",1,-1,e,i,-t,r,a,3),x("x","y","z",1,-1,e,t,i,r,s,4),x("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new bt(c,3)),this.setAttribute("normal",new bt(d,3)),this.setAttribute("uv",new bt(f,2));function x(S,m,h,E,A,T,P,M,w,_,C){const L=T/w,R=P/_,O=T/2,$=P/2,Y=M/2,y=w+1,N=_+1;let F=0,k=0;const H=new z;for(let J=0;J<N;J++){const re=J*R-$;for(let xe=0;xe<y;xe++){const Re=xe*L-O;H[S]=Re*E,H[m]=re*A,H[h]=Y,c.push(H.x,H.y,H.z),H[S]=0,H[m]=0,H[h]=M>0?1:-1,d.push(H.x,H.y,H.z),f.push(xe/w),f.push(1-J/_),F+=1}}for(let J=0;J<_;J++)for(let re=0;re<w;re++){const xe=u+re+y*J,Re=u+re+y*(J+1),Je=u+(re+1)+y*(J+1),Ie=u+(re+1)+y*J;l.push(xe,Re,Ie),l.push(Re,Je,Ie),k+=6}o.addGroup(p,k,C),p+=k,u+=F}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Tr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class As extends Wt{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new z,d=new ut;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,u=3;f<=t;f++,u+=3){const p=i+f/t*r;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),d.x=(a[u]/e+1)/2,d.y=(a[u+1]/e+1)/2,l.push(d.x,d.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new bt(a,3)),this.setAttribute("normal",new bt(o,3)),this.setAttribute("uv",new bt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new As(e.radius,e.segments,e.thetaStart,e.thetaLength)}}const jr=new z,Jr=new z,xa=new z,Qr=new on;class gx extends Wt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const r=Math.pow(10,4),s=Math.cos(Ki*t),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],d=["a","b","c"],f=new Array(3),u={},p=[];for(let x=0;x<l;x+=3){a?(c[0]=a.getX(x),c[1]=a.getX(x+1),c[2]=a.getX(x+2)):(c[0]=x,c[1]=x+1,c[2]=x+2);const{a:S,b:m,c:h}=Qr;if(S.fromBufferAttribute(o,c[0]),m.fromBufferAttribute(o,c[1]),h.fromBufferAttribute(o,c[2]),Qr.getNormal(xa),f[0]=`${Math.round(S.x*r)},${Math.round(S.y*r)},${Math.round(S.z*r)}`,f[1]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,f[2]=`${Math.round(h.x*r)},${Math.round(h.y*r)},${Math.round(h.z*r)}`,!(f[0]===f[1]||f[1]===f[2]||f[2]===f[0]))for(let E=0;E<3;E++){const A=(E+1)%3,T=f[E],P=f[A],M=Qr[d[E]],w=Qr[d[A]],_=`${T}_${P}`,C=`${P}_${T}`;C in u&&u[C]?(xa.dot(u[C].normal)<=s&&(p.push(M.x,M.y,M.z),p.push(w.x,w.y,w.z)),u[C]=null):_ in u||(u[_]={index0:c[E],index1:c[A],normal:xa.clone()})}}for(const x in u)if(u[x]){const{index0:S,index1:m}=u[x];jr.fromBufferAttribute(o,S),Jr.fromBufferAttribute(o,m),p.push(jr.x,jr.y,jr.z),p.push(Jr.x,Jr.y,Jr.z)}this.setAttribute("position",new bt(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class er extends Wt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,d=l+1,f=e/o,u=t/l,p=[],x=[],S=[],m=[];for(let h=0;h<d;h++){const E=h*u-a;for(let A=0;A<c;A++){const T=A*f-s;x.push(T,-E,0),S.push(0,0,1),m.push(A/o),m.push(1-h/l)}}for(let h=0;h<l;h++)for(let E=0;E<o;E++){const A=E+c*h,T=E+c*(h+1),P=E+1+c*(h+1),M=E+1+c*h;p.push(A,T,M),p.push(T,P,M)}this.setIndex(p),this.setAttribute("position",new bt(x,3)),this.setAttribute("normal",new bt(S,3)),this.setAttribute("uv",new bt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new er(e.width,e.height,e.widthSegments,e.heightSegments)}}class ys extends Wt{constructor(e=.5,t=1,i=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:a},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],d=[];let f=e;const u=(t-e)/r,p=new z,x=new ut;for(let S=0;S<=r;S++){for(let m=0;m<=i;m++){const h=s+m/i*a;p.x=f*Math.cos(h),p.y=f*Math.sin(h),l.push(p.x,p.y,p.z),c.push(0,0,1),x.x=(p.x/t+1)/2,x.y=(p.y/t+1)/2,d.push(x.x,x.y)}f+=u}for(let S=0;S<r;S++){const m=S*(i+1);for(let h=0;h<i;h++){const E=h+m,A=E,T=E+i+1,P=E+i+2,M=E+1;o.push(A,T,M),o.push(T,P,M)}}this.setIndex(o),this.setAttribute("position",new bt(l,3)),this.setAttribute("normal",new bt(c,3)),this.setAttribute("uv",new bt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ys(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class Ko extends Wt{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const d=[],f=new z,u=new z,p=[],x=[],S=[],m=[];for(let h=0;h<=i;h++){const E=[],A=h/i;let T=0;h===0&&a===0?T=.5/t:h===i&&l===Math.PI&&(T=-.5/t);for(let P=0;P<=t;P++){const M=P/t;f.x=-e*Math.cos(r+M*s)*Math.sin(a+A*o),f.y=e*Math.cos(a+A*o),f.z=e*Math.sin(r+M*s)*Math.sin(a+A*o),x.push(f.x,f.y,f.z),u.copy(f).normalize(),S.push(u.x,u.y,u.z),m.push(M+T,1-A),E.push(c++)}d.push(E)}for(let h=0;h<i;h++)for(let E=0;E<t;E++){const A=d[h][E+1],T=d[h][E],P=d[h+1][E],M=d[h+1][E+1];(h!==0||a>0)&&p.push(A,T,M),(h!==i-1||l<Math.PI)&&p.push(T,P,M)}this.setIndex(p),this.setAttribute("position",new bt(x,3)),this.setAttribute("normal",new bt(S,3)),this.setAttribute("uv",new bt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ko(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}function tr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(Kl(r))r.isRenderTargetTexture?(ke("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Kl(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Xt(n){const e={};for(let t=0;t<n.length;t++){const i=tr(n[t]);for(const r in i)e[r]=i[r]}return e}function Kl(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function _x(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Au(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:it.workingColorSpace}const vx={clone:tr,merge:Xt};var Sx=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Mx=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Cn extends yr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Sx,this.fragmentShader=Mx,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=tr(e.uniforms),this.uniformsGroups=_x(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Ex extends Cn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class bx extends yr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=g0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Ax extends yr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const es=new z,ts=new ir,_n=new z;class yu extends Ht{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Et,this.projectionMatrix=new Et,this.projectionMatrixInverse=new Et,this.coordinateSystem=Mn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(es,ts,_n),_n.x===1&&_n.y===1&&_n.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,_n.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(es,ts,_n),_n.x===1&&_n.y===1&&_n.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,_n.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Qn=new z,Zl=new ut,jl=new ut;class sn extends yu{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Er*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ki*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Er*2*Math.atan(Math.tan(Ki*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z),Qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z)}getViewSize(e,t){return this.getViewBounds(e,Zl,jl),t.subVectors(jl,Zl)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ki*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Tu extends yu{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const zi=-90,Gi=1;class yx extends Ht{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new sn(zi,Gi,e,t);r.layers=this.layers,this.add(r);const s=new sn(zi,Gi,e,t);s.layers=this.layers,this.add(s);const a=new sn(zi,Gi,e,t);a.layers=this.layers,this.add(a);const o=new sn(zi,Gi,e,t);o.layers=this.layers,this.add(o);const l=new sn(zi,Gi,e,t);l.layers=this.layers,this.add(l);const c=new sn(zi,Gi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===Mn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ss)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,d]=this.children,f=e.getRenderTarget(),u=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;const S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,d),e.setRenderTarget(f,u,p),e.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class Tx extends sn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const sl=class sl{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};sl.prototype.isMatrix2=!0;let Jl=sl;function Ql(n,e,t,i){const r=Cx(i);switch(t){case du:return n*e;case zo:return n*e/r.components*r.byteLength;case Go:return n*e/r.components*r.byteLength;case Mi:return n*e*2/r.components*r.byteLength;case Ho:return n*e*2/r.components*r.byteLength;case fu:return n*e*3/r.components*r.byteLength;case pn:return n*e*4/r.components*r.byteLength;case Wo:return n*e*4/r.components*r.byteLength;case ls:case cs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case us:case ds:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Wa:case Xa:return Math.max(n,16)*Math.max(e,8)/4;case Ha:case $a:return Math.max(n,8)*Math.max(e,8)/2;case qa:case Ya:case Za:case ja:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ka:case xs:case Ja:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case eo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case to:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case no:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case io:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ro:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case so:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case ao:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case oo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case lo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case co:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case uo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case fo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case ho:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case po:case mo:case xo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case go:case _o:return Math.ceil(n/4)*Math.ceil(e/4)*8;case gs:case vo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Cx(n){switch(n){case an:case ou:return{byteLength:1,components:1};case Sr:case lu:case zn:return{byteLength:2,components:1};case ko:case Vo:return{byteLength:2,components:4};case Tn:case Oo:case hn:return{byteLength:4,components:1};case cu:case uu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Bo}}));typeof window<"u"&&(window.__THREE__?ke("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Bo);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Cu(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function wx(n){const e=new WeakMap;function t(o,l){const c=o.array,d=o.usage,f=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,d),o.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,l,c){const d=l.array,f=l.updateRanges;if(n.bindBuffer(c,o),f.length===0)n.bufferSubData(c,0,d);else{f.sort((p,x)=>p.start-x.start);let u=0;for(let p=1;p<f.length;p++){const x=f[u],S=f[p];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++u,f[u]=S)}f.length=u+1;for(let p=0,x=f.length;p<x;p++){const S=f[p];n.bufferSubData(c,S.start*d.BYTES_PER_ELEMENT,d,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var Rx=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Nx=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Fx=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Px=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Lx=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Dx=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ix=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ux=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Bx=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Ox=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,kx=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Vx=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zx=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Gx=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Hx=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Wx=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,$x=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Xx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,qx=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Yx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Kx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Zx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,jx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Jx=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Qx=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,eg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,tg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ng=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,ig=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,rg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,sg="gl_FragColor = linearToOutputTexel( gl_FragColor );",ag=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,og=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,lg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,cg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ug=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,dg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,hg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,pg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,mg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,xg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,gg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,_g=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,vg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Sg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Mg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Eg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,bg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ag=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,yg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Tg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Cg=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,wg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Rg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Ng=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Fg=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Pg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Lg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Dg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ig=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ug=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Bg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Og=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,kg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Vg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,zg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Gg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Hg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Wg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$g=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Xg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Yg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Kg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Zg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Jg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Qg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,e_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,t_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,n_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,i_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,r_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,s_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,a_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,o_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,l_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,c_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,u_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,d_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,f_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,h_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,p_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,m_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,x_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,g_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,__=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,v_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,S_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,M_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,E_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,b_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,A_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,y_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,T_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,C_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,w_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const R_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,N_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,F_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,P_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,L_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,D_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,I_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,U_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,B_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,O_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,k_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,V_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,z_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,G_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,H_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,W_=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,X_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,q_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Y_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,K_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Z_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,j_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,J_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Q_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,ev=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tv=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,nv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,iv=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,av=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ov=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,lv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ye={alphahash_fragment:Rx,alphahash_pars_fragment:Nx,alphamap_fragment:Fx,alphamap_pars_fragment:Px,alphatest_fragment:Lx,alphatest_pars_fragment:Dx,aomap_fragment:Ix,aomap_pars_fragment:Ux,batching_pars_vertex:Bx,batching_vertex:Ox,begin_vertex:kx,beginnormal_vertex:Vx,bsdfs:zx,iridescence_fragment:Gx,bumpmap_pars_fragment:Hx,clipping_planes_fragment:Wx,clipping_planes_pars_fragment:$x,clipping_planes_pars_vertex:Xx,clipping_planes_vertex:qx,color_fragment:Yx,color_pars_fragment:Kx,color_pars_vertex:Zx,color_vertex:jx,common:Jx,cube_uv_reflection_fragment:Qx,defaultnormal_vertex:eg,displacementmap_pars_vertex:tg,displacementmap_vertex:ng,emissivemap_fragment:ig,emissivemap_pars_fragment:rg,colorspace_fragment:sg,colorspace_pars_fragment:ag,envmap_fragment:og,envmap_common_pars_fragment:lg,envmap_pars_fragment:cg,envmap_pars_vertex:ug,envmap_physical_pars_fragment:Mg,envmap_vertex:dg,fog_vertex:fg,fog_pars_vertex:hg,fog_fragment:pg,fog_pars_fragment:mg,gradientmap_pars_fragment:xg,lightmap_pars_fragment:gg,lights_lambert_fragment:_g,lights_lambert_pars_fragment:vg,lights_pars_begin:Sg,lights_toon_fragment:Eg,lights_toon_pars_fragment:bg,lights_phong_fragment:Ag,lights_phong_pars_fragment:yg,lights_physical_fragment:Tg,lights_physical_pars_fragment:Cg,lights_fragment_begin:wg,lights_fragment_maps:Rg,lights_fragment_end:Ng,lightprobes_pars_fragment:Fg,logdepthbuf_fragment:Pg,logdepthbuf_pars_fragment:Lg,logdepthbuf_pars_vertex:Dg,logdepthbuf_vertex:Ig,map_fragment:Ug,map_pars_fragment:Bg,map_particle_fragment:Og,map_particle_pars_fragment:kg,metalnessmap_fragment:Vg,metalnessmap_pars_fragment:zg,morphinstance_vertex:Gg,morphcolor_vertex:Hg,morphnormal_vertex:Wg,morphtarget_pars_vertex:$g,morphtarget_vertex:Xg,normal_fragment_begin:qg,normal_fragment_maps:Yg,normal_pars_fragment:Kg,normal_pars_vertex:Zg,normal_vertex:jg,normalmap_pars_fragment:Jg,clearcoat_normal_fragment_begin:Qg,clearcoat_normal_fragment_maps:e_,clearcoat_pars_fragment:t_,iridescence_pars_fragment:n_,opaque_fragment:i_,packing:r_,premultiplied_alpha_fragment:s_,project_vertex:a_,dithering_fragment:o_,dithering_pars_fragment:l_,roughnessmap_fragment:c_,roughnessmap_pars_fragment:u_,shadowmap_pars_fragment:d_,shadowmap_pars_vertex:f_,shadowmap_vertex:h_,shadowmask_pars_fragment:p_,skinbase_vertex:m_,skinning_pars_vertex:x_,skinning_vertex:g_,skinnormal_vertex:__,specularmap_fragment:v_,specularmap_pars_fragment:S_,tonemapping_fragment:M_,tonemapping_pars_fragment:E_,transmission_fragment:b_,transmission_pars_fragment:A_,uv_pars_fragment:y_,uv_pars_vertex:T_,uv_vertex:C_,worldpos_vertex:w_,background_vert:R_,background_frag:N_,backgroundCube_vert:F_,backgroundCube_frag:P_,cube_vert:L_,cube_frag:D_,depth_vert:I_,depth_frag:U_,distance_vert:B_,distance_frag:O_,equirect_vert:k_,equirect_frag:V_,linedashed_vert:z_,linedashed_frag:G_,meshbasic_vert:H_,meshbasic_frag:W_,meshlambert_vert:$_,meshlambert_frag:X_,meshmatcap_vert:q_,meshmatcap_frag:Y_,meshnormal_vert:K_,meshnormal_frag:Z_,meshphong_vert:j_,meshphong_frag:J_,meshphysical_vert:Q_,meshphysical_frag:ev,meshtoon_vert:tv,meshtoon_frag:nv,points_vert:iv,points_frag:rv,shadow_vert:sv,shadow_frag:av,sprite_vert:ov,sprite_frag:lv},_e={common:{diffuse:{value:new Ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new z},probesMax:{value:new z},probesResolution:{value:new z}},points:{diffuse:{value:new Ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new Ke(16777215)},opacity:{value:1},center:{value:new ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},Sn={basic:{uniforms:Xt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:Ye.meshbasic_vert,fragmentShader:Ye.meshbasic_frag},lambert:{uniforms:Xt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Ke(0)},envMapIntensity:{value:1}}]),vertexShader:Ye.meshlambert_vert,fragmentShader:Ye.meshlambert_frag},phong:{uniforms:Xt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Ke(0)},specular:{value:new Ke(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphong_vert,fragmentShader:Ye.meshphong_frag},standard:{uniforms:Xt([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new Ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag},toon:{uniforms:Xt([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new Ke(0)}}]),vertexShader:Ye.meshtoon_vert,fragmentShader:Ye.meshtoon_frag},matcap:{uniforms:Xt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:Ye.meshmatcap_vert,fragmentShader:Ye.meshmatcap_frag},points:{uniforms:Xt([_e.points,_e.fog]),vertexShader:Ye.points_vert,fragmentShader:Ye.points_frag},dashed:{uniforms:Xt([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ye.linedashed_vert,fragmentShader:Ye.linedashed_frag},depth:{uniforms:Xt([_e.common,_e.displacementmap]),vertexShader:Ye.depth_vert,fragmentShader:Ye.depth_frag},normal:{uniforms:Xt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:Ye.meshnormal_vert,fragmentShader:Ye.meshnormal_frag},sprite:{uniforms:Xt([_e.sprite,_e.fog]),vertexShader:Ye.sprite_vert,fragmentShader:Ye.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ye.background_vert,fragmentShader:Ye.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Ye.backgroundCube_vert,fragmentShader:Ye.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ye.cube_vert,fragmentShader:Ye.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ye.equirect_vert,fragmentShader:Ye.equirect_frag},distance:{uniforms:Xt([_e.common,_e.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ye.distance_vert,fragmentShader:Ye.distance_frag},shadow:{uniforms:Xt([_e.lights,_e.fog,{color:{value:new Ke(0)},opacity:{value:1}}]),vertexShader:Ye.shadow_vert,fragmentShader:Ye.shadow_frag}};Sn.physical={uniforms:Xt([Sn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new Ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new Ke(0)},specularColor:{value:new Ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag};const ns={r:0,b:0,g:0},cv=new Et,wu=new He;wu.set(-1,0,0,0,1,0,0,0,1);function uv(n,e,t,i,r,s){const a=new Ke(0);let o=r===!0?0:1,l,c,d=null,f=0,u=null;function p(E){let A=E.isScene===!0?E.background:null;if(A&&A.isTexture){const T=E.backgroundBlurriness>0;A=e.get(A,T)}return A}function x(E){let A=!1;const T=p(E);T===null?m(a,o):T&&T.isColor&&(m(T,1),A=!0);const P=n.xr.getEnvironmentBlendMode();P==="additive"?t.buffers.color.setClear(0,0,0,1,s):P==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||A)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(E,A){const T=p(A);T&&(T.isCubeTexture||T.mapping===Ds)?(c===void 0&&(c=new Ut(new Tr(1,1,1),new Cn({name:"BackgroundCubeMaterial",uniforms:tr(Sn.backgroundCube.uniforms),vertexShader:Sn.backgroundCube.vertexShader,fragmentShader:Sn.backgroundCube.fragmentShader,side:Zt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(P,M,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=T,c.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(cv.makeRotationFromEuler(A.backgroundRotation)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(wu),c.material.toneMapped=it.getTransfer(T.colorSpace)!==ft,(d!==T||f!==T.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,d=T,f=T.version,u=n.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null)):T&&T.isTexture&&(l===void 0&&(l=new Ut(new er(2,2),new Cn({name:"BackgroundMaterial",uniforms:tr(Sn.background.uniforms),vertexShader:Sn.background.vertexShader,fragmentShader:Sn.background.fragmentShader,side:ri,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=T,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.toneMapped=it.getTransfer(T.colorSpace)!==ft,T.matrixAutoUpdate===!0&&T.updateMatrix(),l.material.uniforms.uvTransform.value.copy(T.matrix),(d!==T||f!==T.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,d=T,f=T.version,u=n.toneMapping),l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null))}function m(E,A){E.getRGB(ns,Au(n)),t.buffers.color.setClear(ns.r,ns.g,ns.b,A,s)}function h(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(E,A=1){a.set(E),o=A,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(E){o=E,m(a,o)},render:x,addToRenderList:S,dispose:h}}function dv(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null);let s=r,a=!1;function o(R,O,$,Y,y){let N=!1;const F=f(R,Y,$,O);s!==F&&(s=F,c(s.object)),N=p(R,Y,$,y),N&&x(R,Y,$,y),y!==null&&e.update(y,n.ELEMENT_ARRAY_BUFFER),(N||a)&&(a=!1,T(R,O,$,Y),y!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(y).buffer))}function l(){return n.createVertexArray()}function c(R){return n.bindVertexArray(R)}function d(R){return n.deleteVertexArray(R)}function f(R,O,$,Y){const y=Y.wireframe===!0;let N=i[O.id];N===void 0&&(N={},i[O.id]=N);const F=R.isInstancedMesh===!0?R.id:0;let k=N[F];k===void 0&&(k={},N[F]=k);let H=k[$.id];H===void 0&&(H={},k[$.id]=H);let J=H[y];return J===void 0&&(J=u(l()),H[y]=J),J}function u(R){const O=[],$=[],Y=[];for(let y=0;y<t;y++)O[y]=0,$[y]=0,Y[y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:$,attributeDivisors:Y,object:R,attributes:{},index:null}}function p(R,O,$,Y){const y=s.attributes,N=O.attributes;let F=0;const k=$.getAttributes();for(const H in k)if(k[H].location>=0){const re=y[H];let xe=N[H];if(xe===void 0&&(H==="instanceMatrix"&&R.instanceMatrix&&(xe=R.instanceMatrix),H==="instanceColor"&&R.instanceColor&&(xe=R.instanceColor)),re===void 0||re.attribute!==xe||xe&&re.data!==xe.data)return!0;F++}return s.attributesNum!==F||s.index!==Y}function x(R,O,$,Y){const y={},N=O.attributes;let F=0;const k=$.getAttributes();for(const H in k)if(k[H].location>=0){let re=N[H];re===void 0&&(H==="instanceMatrix"&&R.instanceMatrix&&(re=R.instanceMatrix),H==="instanceColor"&&R.instanceColor&&(re=R.instanceColor));const xe={};xe.attribute=re,re&&re.data&&(xe.data=re.data),y[H]=xe,F++}s.attributes=y,s.attributesNum=F,s.index=Y}function S(){const R=s.newAttributes;for(let O=0,$=R.length;O<$;O++)R[O]=0}function m(R){h(R,0)}function h(R,O){const $=s.newAttributes,Y=s.enabledAttributes,y=s.attributeDivisors;$[R]=1,Y[R]===0&&(n.enableVertexAttribArray(R),Y[R]=1),y[R]!==O&&(n.vertexAttribDivisor(R,O),y[R]=O)}function E(){const R=s.newAttributes,O=s.enabledAttributes;for(let $=0,Y=O.length;$<Y;$++)O[$]!==R[$]&&(n.disableVertexAttribArray($),O[$]=0)}function A(R,O,$,Y,y,N,F){F===!0?n.vertexAttribIPointer(R,O,$,y,N):n.vertexAttribPointer(R,O,$,Y,y,N)}function T(R,O,$,Y){S();const y=Y.attributes,N=$.getAttributes(),F=O.defaultAttributeValues;for(const k in N){const H=N[k];if(H.location>=0){let J=y[k];if(J===void 0&&(k==="instanceMatrix"&&R.instanceMatrix&&(J=R.instanceMatrix),k==="instanceColor"&&R.instanceColor&&(J=R.instanceColor)),J!==void 0){const re=J.normalized,xe=J.itemSize,Re=e.get(J);if(Re===void 0)continue;const Je=Re.buffer,Ie=Re.type,ee=Re.bytesPerElement,pe=Ie===n.INT||Ie===n.UNSIGNED_INT||J.gpuType===Oo;if(J.isInterleavedBufferAttribute){const le=J.data,Be=le.stride,ze=J.offset;if(le.isInstancedInterleavedBuffer){for(let Oe=0;Oe<H.locationSize;Oe++)h(H.location+Oe,le.meshPerAttribute);R.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Oe=0;Oe<H.locationSize;Oe++)m(H.location+Oe);n.bindBuffer(n.ARRAY_BUFFER,Je);for(let Oe=0;Oe<H.locationSize;Oe++)A(H.location+Oe,xe/H.locationSize,Ie,re,Be*ee,(ze+xe/H.locationSize*Oe)*ee,pe)}else{if(J.isInstancedBufferAttribute){for(let le=0;le<H.locationSize;le++)h(H.location+le,J.meshPerAttribute);R.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let le=0;le<H.locationSize;le++)m(H.location+le);n.bindBuffer(n.ARRAY_BUFFER,Je);for(let le=0;le<H.locationSize;le++)A(H.location+le,xe/H.locationSize,Ie,re,xe*ee,xe/H.locationSize*le*ee,pe)}}else if(F!==void 0){const re=F[k];if(re!==void 0)switch(re.length){case 2:n.vertexAttrib2fv(H.location,re);break;case 3:n.vertexAttrib3fv(H.location,re);break;case 4:n.vertexAttrib4fv(H.location,re);break;default:n.vertexAttrib1fv(H.location,re)}}}}E()}function P(){C();for(const R in i){const O=i[R];for(const $ in O){const Y=O[$];for(const y in Y){const N=Y[y];for(const F in N)d(N[F].object),delete N[F];delete Y[y]}}delete i[R]}}function M(R){if(i[R.id]===void 0)return;const O=i[R.id];for(const $ in O){const Y=O[$];for(const y in Y){const N=Y[y];for(const F in N)d(N[F].object),delete N[F];delete Y[y]}}delete i[R.id]}function w(R){for(const O in i){const $=i[O];for(const Y in $){const y=$[Y];if(y[R.id]===void 0)continue;const N=y[R.id];for(const F in N)d(N[F].object),delete N[F];delete y[R.id]}}}function _(R){for(const O in i){const $=i[O],Y=R.isInstancedMesh===!0?R.id:0,y=$[Y];if(y!==void 0){for(const N in y){const F=y[N];for(const k in F)d(F[k].object),delete F[k];delete y[N]}delete $[Y],Object.keys($).length===0&&delete i[O]}}}function C(){L(),a=!0,s!==r&&(s=r,c(s.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:C,resetDefaultState:L,dispose:P,releaseStatesOfGeometry:M,releaseStatesOfObject:_,releaseStatesOfProgram:w,initAttributes:S,enableAttribute:m,disableUnusedAttributes:E}}function fv(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,d){d!==0&&(n.drawArraysInstanced(i,l,c,d),t.update(c,i,d))}function o(l,c,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,d);let u=0;for(let p=0;p<d;p++)u+=c[p];t.update(u,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function hv(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const w=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(w){return!(w!==pn&&i.convert(w)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const _=w===zn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(w!==an&&i.convert(w)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==hn&&!_)}function l(w){if(w==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const d=l(c);d!==c&&(ke("WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);const f=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&ke("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),E=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),A=n.getParameter(n.MAX_VARYING_VECTORS),T=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),P=n.getParameter(n.MAX_SAMPLES),M=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:p,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:m,maxAttributes:h,maxVertexUniforms:E,maxVaryings:A,maxFragmentUniforms:T,maxSamples:P,samples:M}}function pv(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new fi,o=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const p=f.length!==0||u||i!==0||r;return r=u,i=f.length,p},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,u){t=d(f,u,0)},this.setState=function(f,u,p){const x=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,h=n.get(f);if(!r||x===null||x.length===0||s&&!m)s?d(null):c();else{const E=s?0:i,A=E*4;let T=h.clippingState||null;l.value=T,T=d(x,u,A,p);for(let P=0;P!==A;++P)T[P]=t[P];h.clippingState=T,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=E}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(f,u,p,x){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=l.value,x!==!0||m===null){const h=p+S*4,E=u.matrixWorldInverse;o.getNormalMatrix(E),(m===null||m.length<h)&&(m=new Float32Array(h));for(let A=0,T=p;A!==S;++A,T+=4)a.copy(f[A]).applyMatrix4(E,o),a.normal.toArray(m,T),m[T+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}const ti=4,ec=[.125,.215,.35,.446,.526,.582],pi=20,mv=256,pr=new Tu,tc=new Ke;let ga=null,_a=0,va=0,Sa=!1;const xv=new z;class nc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=xv}=s;ga=this._renderer.getRenderTarget(),_a=this._renderer.getActiveCubeFace(),va=this._renderer.getActiveMipmapLevel(),Sa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=sc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=rc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(ga,_a,va),this._renderer.xr.enabled=Sa,e.scissorTest=!1,Hi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Si||e.mapping===Ji?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ga=this._renderer.getRenderTarget(),_a=this._renderer.getActiveCubeFace(),va=this._renderer.getActiveMipmapLevel(),Sa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Gt,minFilter:Gt,generateMipmaps:!1,type:zn,format:pn,colorSpace:_s,depthBuffer:!1},r=ic(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ic(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=gv(s)),this._blurMaterial=vv(s,e,t),this._ggxMaterial=_v(s,e,t)}return r}_compileMaterial(e){const t=new Ut(new Wt,e);this._renderer.compile(t,pr)}_sceneToCubeUV(e,t,i,r,s){const l=new sn(90,1,t,i),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,p=f.toneMapping;f.getClearColor(tc),f.toneMapping=An,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ut(new Tr,new In({name:"PMREM.Background",side:Zt,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let h=!1;const E=e.background;E?E.isColor&&(m.color.copy(E),e.background=null,h=!0):(m.color.copy(tc),h=!0);for(let A=0;A<6;A++){const T=A%3;T===0?(l.up.set(0,c[A],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+d[A],s.y,s.z)):T===1?(l.up.set(0,0,c[A]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+d[A],s.z)):(l.up.set(0,c[A],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+d[A]));const P=this._cubeSize;Hi(r,T*P,A>2?P:0,P,P),f.setRenderTarget(r),h&&f.render(S,l),f.render(e,l)}f.toneMapping=p,f.autoClear=u,e.background=E}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===Si||e.mapping===Ji;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=sc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=rc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Hi(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,pr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),d=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-d*d),u=0+c*1.25,p=f*u,{_lodMax:x}=this,S=this._sizeLods[i],m=3*S*(i>x-ti?i-x+ti:0),h=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=p,l.mipInt.value=x-t,Hi(s,m,h,3*S,2*S),r.setRenderTarget(s),r.render(o,pr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=x-i,Hi(e,m,h,3*S,2*S),r.setRenderTarget(e),r.render(o,pr)}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&at("blur direction must be either latitudinal or longitudinal!");const d=3,f=this._lodMeshes[r];f.material=c;const u=c.uniforms,p=this._sizeLods[i]-1,x=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*pi-1),S=s/x,m=isFinite(s)?1+Math.floor(d*S):pi;m>pi&&ke(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${pi}`);const h=[];let E=0;for(let w=0;w<pi;++w){const _=w/S,C=Math.exp(-_*_/2);h.push(C),w===0?E+=C:w<m&&(E+=2*C)}for(let w=0;w<h.length;w++)h[w]=h[w]/E;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=h,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:A}=this;u.dTheta.value=x,u.mipInt.value=A-i;const T=this._sizeLods[r],P=3*T*(r>A-ti?r-A+ti:0),M=4*(this._cubeSize-T);Hi(t,P,M,3*T,2*T),l.setRenderTarget(t),l.render(f,pr)}}function gv(n){const e=[],t=[],i=[];let r=n;const s=n-ti+1+ec.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let l=1/o;a>n-ti?l=ec[a-n+ti-1]:a===0&&(l=0),t.push(l);const c=1/(o-2),d=-c,f=1+c,u=[d,d,f,d,f,f,d,d,f,f,d,f],p=6,x=6,S=3,m=2,h=1,E=new Float32Array(S*x*p),A=new Float32Array(m*x*p),T=new Float32Array(h*x*p);for(let M=0;M<p;M++){const w=M%3*2/3-1,_=M>2?0:-1,C=[w,_,0,w+2/3,_,0,w+2/3,_+1,0,w,_,0,w+2/3,_+1,0,w,_+1,0];E.set(C,S*x*M),A.set(u,m*x*M);const L=[M,M,M,M,M,M];T.set(L,h*x*M)}const P=new Wt;P.setAttribute("position",new mn(E,S)),P.setAttribute("uv",new mn(A,m)),P.setAttribute("faceIndex",new mn(T,h)),i.push(new Ut(P,null)),r>ti&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function ic(n,e,t){const i=new yn(n,e,t);return i.texture.mapping=Ds,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Hi(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function _v(n,e,t){return new Cn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:mv,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Is(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function vv(n,e,t){const i=new Float32Array(pi),r=new z(0,1,0);return new Cn({name:"SphericalGaussianBlur",defines:{n:pi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Is(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function rc(){return new Cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Is(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function sc(){return new Cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Is(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function Is(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ru extends yn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Eu(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Tr(5,5,5),s=new Cn({name:"CubemapFromEquirect",uniforms:tr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Zt,blending:On});s.uniforms.tEquirect.value=t;const a=new Ut(r,s),o=t.minFilter;return t.minFilter===mi&&(t.minFilter=Gt),new yx(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function Sv(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,p=!1){return u==null?null:p?a(u):s(u)}function s(u){if(u&&u.isTexture){const p=u.mapping;if(p===Ws||p===$s)if(e.has(u)){const x=e.get(u).texture;return o(x,u.mapping)}else{const x=u.image;if(x&&x.height>0){const S=new Ru(x.height);return S.fromEquirectangularTexture(n,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const p=u.mapping,x=p===Ws||p===$s,S=p===Si||p===Ji;if(x||S){let m=t.get(u);const h=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==h)return i===null&&(i=new nc(n)),m=x?i.fromEquirectangular(u,m):i.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const E=u.image;return x&&E&&E.height>0||S&&E&&l(E)?(i===null&&(i=new nc(n)),m=x?i.fromEquirectangular(u):i.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",d),m.texture):null}}}return u}function o(u,p){return p===Ws?u.mapping=Si:p===$s&&(u.mapping=Ji),u}function l(u){let p=0;const x=6;for(let S=0;S<x;S++)u[S]!==void 0&&p++;return p===x}function c(u){const p=u.target;p.removeEventListener("dispose",c);const x=e.get(p);x!==void 0&&(e.delete(p),x.dispose())}function d(u){const p=u.target;p.removeEventListener("dispose",d);const x=t.get(p);x!==void 0&&(t.delete(p),x.dispose())}function f(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:f}}function Mv(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&So("WebGLRenderer: "+i+" extension not supported."),r}}}function Ev(n,e,t,i){const r={},s=new WeakMap;function a(f){const u=f.target;u.index!==null&&e.remove(u.index);for(const x in u.attributes)e.remove(u.attributes[x]);u.removeEventListener("dispose",a),delete r[u.id];const p=s.get(u);p&&(e.remove(p),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(f,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function l(f){const u=f.attributes;for(const p in u)e.update(u[p],n.ARRAY_BUFFER)}function c(f){const u=[],p=f.index,x=f.attributes.position;let S=0;if(x===void 0)return;if(p!==null){const E=p.array;S=p.version;for(let A=0,T=E.length;A<T;A+=3){const P=E[A+0],M=E[A+1],w=E[A+2];u.push(P,M,M,w,w,P)}}else{const E=x.array;S=x.version;for(let A=0,T=E.length/3-1;A<T;A+=3){const P=A+0,M=A+1,w=A+2;u.push(P,M,M,w,w,P)}}const m=new(x.count>=65535?_u:gu)(u,1);m.version=S;const h=s.get(f);h&&e.remove(h),s.set(f,m)}function d(f){const u=s.get(f);if(u){const p=f.index;p!==null&&u.version<p.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:d}}function bv(n,e,t){let i;function r(f){i=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,u){n.drawElements(i,u,s,f*a),t.update(u,i,1)}function c(f,u,p){p!==0&&(n.drawElementsInstanced(i,u,s,f*a,p),t.update(u,i,p))}function d(f,u,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,s,f,0,p);let S=0;for(let m=0;m<p;m++)S+=u[m];t.update(S,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d}function Av(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:at("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function yv(n,e,t){const i=new WeakMap,r=new Rt;function s(a,o,l){const c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=d!==void 0?d.length:0;let u=i.get(o);if(u===void 0||u.count!==f){let C=function(){w.dispose(),i.delete(o),o.removeEventListener("dispose",C)};u!==void 0&&u.texture.dispose();const p=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],E=o.morphAttributes.color||[];let A=0;p===!0&&(A=1),x===!0&&(A=2),S===!0&&(A=3);let T=o.attributes.position.count*A,P=1;T>e.maxTextureSize&&(P=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const M=new Float32Array(T*P*4*f),w=new pu(M,T,P,f);w.type=hn,w.needsUpdate=!0;const _=A*4;for(let L=0;L<f;L++){const R=m[L],O=h[L],$=E[L],Y=T*P*4*L;for(let y=0;y<R.count;y++){const N=y*_;p===!0&&(r.fromBufferAttribute(R,y),M[Y+N+0]=r.x,M[Y+N+1]=r.y,M[Y+N+2]=r.z,M[Y+N+3]=0),x===!0&&(r.fromBufferAttribute(O,y),M[Y+N+4]=r.x,M[Y+N+5]=r.y,M[Y+N+6]=r.z,M[Y+N+7]=0),S===!0&&(r.fromBufferAttribute($,y),M[Y+N+8]=r.x,M[Y+N+9]=r.y,M[Y+N+10]=r.z,M[Y+N+11]=$.itemSize===4?r.w:1)}}u={count:f,texture:w,size:new ut(T,P)},i.set(o,u),o.addEventListener("dispose",C)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let p=0;for(let S=0;S<c.length;S++)p+=c[S];const x=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(n,"morphTargetBaseInfluence",x),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:s}}function Tv(n,e,t,i,r){let s=new WeakMap;function a(c){const d=r.render.frame,f=c.geometry,u=e.get(c,f);if(s.get(u)!==d&&(e.update(u),s.set(u,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==d&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,d))),c.isSkinnedMesh){const p=c.skeleton;s.get(p)!==d&&(p.update(),s.set(p,d))}return u}function o(){s=new WeakMap}function l(c){const d=c.target;d.removeEventListener("dispose",l),i.releaseStatesOfObject(d),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:a,dispose:o}}const Cv={[Qc]:"LINEAR_TONE_MAPPING",[eu]:"REINHARD_TONE_MAPPING",[tu]:"CINEON_TONE_MAPPING",[nu]:"ACES_FILMIC_TONE_MAPPING",[ru]:"AGX_TONE_MAPPING",[su]:"NEUTRAL_TONE_MAPPING",[iu]:"CUSTOM_TONE_MAPPING"};function wv(n,e,t,i,r){const s=new yn(e,t,{type:n,depthBuffer:i,stencilBuffer:r,depthTexture:i?new Qi(e,t):void 0}),a=new yn(e,t,{type:zn,depthBuffer:!1,stencilBuffer:!1}),o=new Wt;o.setAttribute("position",new bt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new bt([0,2,0,0,2,0],2));const l=new Ex({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new Ut(o,l),d=new Tu(-1,1,1,-1,0,1);let f=null,u=null,p=!1,x,S=null,m=[],h=!1;this.setSize=function(E,A){s.setSize(E,A),a.setSize(E,A);for(let T=0;T<m.length;T++){const P=m[T];P.setSize&&P.setSize(E,A)}},this.setEffects=function(E){m=E,h=m.length>0&&m[0].isRenderPass===!0;const A=s.width,T=s.height;for(let P=0;P<m.length;P++){const M=m[P];M.setSize&&M.setSize(A,T)}},this.begin=function(E,A){if(p||E.toneMapping===An&&m.length===0)return!1;if(S=A,A!==null){const T=A.width,P=A.height;(s.width!==T||s.height!==P)&&this.setSize(T,P)}return h===!1&&E.setRenderTarget(s),x=E.toneMapping,E.toneMapping=An,!0},this.hasRenderPass=function(){return h},this.end=function(E,A){E.toneMapping=x,p=!0;let T=s,P=a;for(let M=0;M<m.length;M++){const w=m[M];if(w.enabled!==!1&&(w.render(E,P,T,A),w.needsSwap!==!1)){const _=T;T=P,P=_}}if(f!==E.outputColorSpace||u!==E.toneMapping){f=E.outputColorSpace,u=E.toneMapping,l.defines={},it.getTransfer(f)===ft&&(l.defines.SRGB_TRANSFER="");const M=Cv[u];M&&(l.defines[M]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=T.texture,E.setRenderTarget(S),E.render(c,d),S=null,p=!1},this.isCompositing=function(){return p},this.dispose=function(){s.depthTexture&&s.depthTexture.dispose(),s.dispose(),a.dispose(),o.dispose(),l.dispose()}}const Nu=new qt,Mo=new Qi(1,1),Fu=new pu,Pu=new j0,Lu=new Eu,ac=[],oc=[],lc=new Float32Array(16),cc=new Float32Array(9),uc=new Float32Array(4);function sr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=ac[r];if(s===void 0&&(s=new Float32Array(r),ac[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Lt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Dt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Us(n,e){let t=oc[e];t===void 0&&(t=new Int32Array(e),oc[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Rv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Nv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;n.uniform2fv(this.addr,e),Dt(t,e)}}function Fv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Lt(t,e))return;n.uniform3fv(this.addr,e),Dt(t,e)}}function Pv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;n.uniform4fv(this.addr,e),Dt(t,e)}}function Lv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Lt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,i))return;uc.set(i),n.uniformMatrix2fv(this.addr,!1,uc),Dt(t,i)}}function Dv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Lt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,i))return;cc.set(i),n.uniformMatrix3fv(this.addr,!1,cc),Dt(t,i)}}function Iv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Lt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Dt(t,e)}else{if(Lt(t,i))return;lc.set(i),n.uniformMatrix4fv(this.addr,!1,lc),Dt(t,i)}}function Uv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Bv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;n.uniform2iv(this.addr,e),Dt(t,e)}}function Ov(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Lt(t,e))return;n.uniform3iv(this.addr,e),Dt(t,e)}}function kv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;n.uniform4iv(this.addr,e),Dt(t,e)}}function Vv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function zv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Lt(t,e))return;n.uniform2uiv(this.addr,e),Dt(t,e)}}function Gv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Lt(t,e))return;n.uniform3uiv(this.addr,e),Dt(t,e)}}function Hv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Lt(t,e))return;n.uniform4uiv(this.addr,e),Dt(t,e)}}function Wv(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Mo.compareFunction=t.isReversedDepthBuffer()?Xo:$o,s=Mo):s=Nu,t.setTexture2D(e||s,r)}function $v(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Pu,r)}function Xv(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Lu,r)}function qv(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Fu,r)}function Yv(n){switch(n){case 5126:return Rv;case 35664:return Nv;case 35665:return Fv;case 35666:return Pv;case 35674:return Lv;case 35675:return Dv;case 35676:return Iv;case 5124:case 35670:return Uv;case 35667:case 35671:return Bv;case 35668:case 35672:return Ov;case 35669:case 35673:return kv;case 5125:return Vv;case 36294:return zv;case 36295:return Gv;case 36296:return Hv;case 35678:case 36198:case 36298:case 36306:case 35682:return Wv;case 35679:case 36299:case 36307:return $v;case 35680:case 36300:case 36308:case 36293:return Xv;case 36289:case 36303:case 36311:case 36292:return qv}}function Kv(n,e){n.uniform1fv(this.addr,e)}function Zv(n,e){const t=sr(e,this.size,2);n.uniform2fv(this.addr,t)}function jv(n,e){const t=sr(e,this.size,3);n.uniform3fv(this.addr,t)}function Jv(n,e){const t=sr(e,this.size,4);n.uniform4fv(this.addr,t)}function Qv(n,e){const t=sr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function eS(n,e){const t=sr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function tS(n,e){const t=sr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function nS(n,e){n.uniform1iv(this.addr,e)}function iS(n,e){n.uniform2iv(this.addr,e)}function rS(n,e){n.uniform3iv(this.addr,e)}function sS(n,e){n.uniform4iv(this.addr,e)}function aS(n,e){n.uniform1uiv(this.addr,e)}function oS(n,e){n.uniform2uiv(this.addr,e)}function lS(n,e){n.uniform3uiv(this.addr,e)}function cS(n,e){n.uniform4uiv(this.addr,e)}function uS(n,e,t){const i=this.cache,r=e.length,s=Us(t,r);Lt(i,s)||(n.uniform1iv(this.addr,s),Dt(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Mo:a=Nu;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function dS(n,e,t){const i=this.cache,r=e.length,s=Us(t,r);Lt(i,s)||(n.uniform1iv(this.addr,s),Dt(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Pu,s[a])}function fS(n,e,t){const i=this.cache,r=e.length,s=Us(t,r);Lt(i,s)||(n.uniform1iv(this.addr,s),Dt(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Lu,s[a])}function hS(n,e,t){const i=this.cache,r=e.length,s=Us(t,r);Lt(i,s)||(n.uniform1iv(this.addr,s),Dt(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Fu,s[a])}function pS(n){switch(n){case 5126:return Kv;case 35664:return Zv;case 35665:return jv;case 35666:return Jv;case 35674:return Qv;case 35675:return eS;case 35676:return tS;case 5124:case 35670:return nS;case 35667:case 35671:return iS;case 35668:case 35672:return rS;case 35669:case 35673:return sS;case 5125:return aS;case 36294:return oS;case 36295:return lS;case 36296:return cS;case 35678:case 36198:case 36298:case 36306:case 35682:return uS;case 35679:case 36299:case 36307:return dS;case 35680:case 36300:case 36308:case 36293:return fS;case 36289:case 36303:case 36311:case 36292:return hS}}class mS{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Yv(t.type)}}class xS{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=pS(t.type)}}class gS{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const Ma=/(\w+)(\])?(\[|\.)?/g;function dc(n,e){n.seq.push(e),n.map[e.id]=e}function _S(n,e,t){const i=n.name,r=i.length;for(Ma.lastIndex=0;;){const s=Ma.exec(i),a=Ma.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){dc(t,c===void 0?new mS(o,n,e):new xS(o,n,e));break}else{let f=t.map[o];f===void 0&&(f=new gS(o),dc(t,f)),t=f}}}class hs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);_S(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function fc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const vS=37297;let SS=0;function MS(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const hc=new He;function ES(n){it._getMatrix(hc,it.workingColorSpace,n);const e=`mat3( ${hc.elements.map(t=>t.toFixed(4))} )`;switch(it.getTransfer(n)){case vs:return[e,"LinearTransferOETF"];case ft:return[e,"sRGBTransferOETF"];default:return ke("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function pc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+MS(n.getShaderSource(e),o)}else return s}function bS(n,e){const t=ES(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const AS={[Qc]:"Linear",[eu]:"Reinhard",[tu]:"Cineon",[nu]:"ACESFilmic",[ru]:"AgX",[su]:"Neutral",[iu]:"Custom"};function yS(n,e){const t=AS[e];return t===void 0?(ke("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const is=new z;function TS(){it.getLuminanceCoefficients(is);const n=is.x.toFixed(4),e=is.y.toFixed(4),t=is.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function CS(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(_r).join(`
`)}function wS(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function RS(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function _r(n){return n!==""}function mc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function xc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const NS=/^[ \t]*#include +<([\w\d./]+)>/gm;function Eo(n){return n.replace(NS,PS)}const FS=new Map;function PS(n,e){let t=Ye[e];if(t===void 0){const i=FS.get(e);if(i!==void 0)t=Ye[i],ke('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Eo(t)}const LS=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function gc(n){return n.replace(LS,DS)}function DS(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function _c(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const IS={[os]:"SHADOWMAP_TYPE_PCF",[gr]:"SHADOWMAP_TYPE_VSM"};function US(n){return IS[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const BS={[Si]:"ENVMAP_TYPE_CUBE",[Ji]:"ENVMAP_TYPE_CUBE",[Ds]:"ENVMAP_TYPE_CUBE_UV"};function OS(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":BS[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const kS={[Ji]:"ENVMAP_MODE_REFRACTION"};function VS(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":kS[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const zS={[Jc]:"ENVMAP_BLENDING_MULTIPLY",[p0]:"ENVMAP_BLENDING_MIX",[m0]:"ENVMAP_BLENDING_ADD"};function GS(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":zS[n.combine]||"ENVMAP_BLENDING_NONE"}function HS(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function WS(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=US(t),c=OS(t),d=VS(t),f=GS(t),u=HS(t),p=CS(t),x=wS(s),S=r.createProgram();let m,h,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(_r).join(`
`),m.length>0&&(m+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(_r).join(`
`),h.length>0&&(h+=`
`)):(m=[_c(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(_r).join(`
`),h=[_c(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==An?"#define TONE_MAPPING":"",t.toneMapping!==An?Ye.tonemapping_pars_fragment:"",t.toneMapping!==An?yS("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ye.colorspace_pars_fragment,bS("linearToOutputTexel",t.outputColorSpace),TS(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(_r).join(`
`)),a=Eo(a),a=mc(a,t),a=xc(a,t),o=Eo(o),o=mc(o,t),o=xc(o,t),a=gc(a),o=gc(o),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,h=["#define varying in",t.glslVersion===bl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===bl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);const A=E+m+a,T=E+h+o,P=fc(r,r.VERTEX_SHADER,A),M=fc(r,r.FRAGMENT_SHADER,T);r.attachShader(S,P),r.attachShader(S,M),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function w(R){if(n.debug.checkShaderErrors){const O=r.getProgramInfoLog(S)||"",$=r.getShaderInfoLog(P)||"",Y=r.getShaderInfoLog(M)||"",y=O.trim(),N=$.trim(),F=Y.trim();let k=!0,H=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(k=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,P,M);else{const J=pc(r,P,"vertex"),re=pc(r,M,"fragment");at("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+y+`
`+J+`
`+re)}else y!==""?ke("WebGLProgram: Program Info Log:",y):(N===""||F==="")&&(H=!1);H&&(R.diagnostics={runnable:k,programLog:y,vertexShader:{log:N,prefix:m},fragmentShader:{log:F,prefix:h}})}r.deleteShader(P),r.deleteShader(M),_=new hs(r,S),C=RS(r,S)}let _;this.getUniforms=function(){return _===void 0&&w(this),_};let C;this.getAttributes=function(){return C===void 0&&w(this),C};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(S,vS)),L},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=SS++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=P,this.fragmentShader=M,this}let $S=0;class XS{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new qS(e),t.set(e,i)),i}}class qS{constructor(e){this.id=$S++,this.code=e,this.usedTimes=0}}function YS(n){return n===Mi||n===xs||n===gs}function KS(n,e,t,i,r,s){const a=new mu,o=new XS,l=new Set,c=[],d=new Map,f=i.logarithmicDepthBuffer;let u=i.precision;const p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,C,L,R,O,$){const Y=R.fog,y=O.geometry,N=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?R.environment:null,F=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,k=e.get(_.envMap||N,F),H=k&&k.mapping===Ds?k.image.height:null,J=p[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&ke("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));const re=y.morphAttributes.position||y.morphAttributes.normal||y.morphAttributes.color,xe=re!==void 0?re.length:0;let Re=0;y.morphAttributes.position!==void 0&&(Re=1),y.morphAttributes.normal!==void 0&&(Re=2),y.morphAttributes.color!==void 0&&(Re=3);let Je,Ie,ee,pe;if(J){const We=Sn[J];Je=We.vertexShader,Ie=We.fragmentShader}else Je=_.vertexShader,Ie=_.fragmentShader,o.update(_),ee=o.getVertexShaderID(_),pe=o.getFragmentShaderID(_);const le=n.getRenderTarget(),Be=n.state.buffers.depth.getReversed(),ze=O.isInstancedMesh===!0,Oe=O.isBatchedMesh===!0,ct=!!_.map,Qe=!!_.matcap,rt=!!k,dt=!!_.aoMap,Xe=!!_.lightMap,Ft=!!_.bumpMap,Mt=!!_.normalMap,jt=!!_.displacementMap,I=!!_.emissiveMap,Pt=!!_.metalnessMap,tt=!!_.roughnessMap,_t=_.anisotropy>0,ge=_.clearcoat>0,At=_.dispersion>0,b=_.iridescence>0,g=_.sheen>0,V=_.transmission>0,ne=_t&&!!_.anisotropyMap,ae=ge&&!!_.clearcoatMap,ce=ge&&!!_.clearcoatNormalMap,me=ge&&!!_.clearcoatRoughnessMap,K=b&&!!_.iridescenceMap,ie=b&&!!_.iridescenceThicknessMap,Me=g&&!!_.sheenColorMap,Ae=g&&!!_.sheenRoughnessMap,fe=!!_.specularMap,ue=!!_.specularColorMap,Ge=!!_.specularIntensityMap,qe=V&&!!_.transmissionMap,ot=V&&!!_.thicknessMap,D=!!_.gradientMap,de=!!_.alphaMap,Q=_.alphaTest>0,Ee=!!_.alphaHash,he=!!_.extensions;let se=An;_.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(se=n.toneMapping);const Ne={shaderID:J,shaderType:_.type,shaderName:_.name,vertexShader:Je,fragmentShader:Ie,defines:_.defines,customVertexShaderID:ee,customFragmentShaderID:pe,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:Oe,batchingColor:Oe&&O._colorsTexture!==null,instancing:ze,instancingColor:ze&&O.instanceColor!==null,instancingMorph:ze&&O.morphTexture!==null,outputColorSpace:le===null?n.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:it.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:ct,matcap:Qe,envMap:rt,envMapMode:rt&&k.mapping,envMapCubeUVHeight:H,aoMap:dt,lightMap:Xe,bumpMap:Ft,normalMap:Mt,displacementMap:jt,emissiveMap:I,normalMapObjectSpace:Mt&&_.normalMapType===_0,normalMapTangentSpace:Mt&&_.normalMapType===Sl,packedNormalMap:Mt&&_.normalMapType===Sl&&YS(_.normalMap.format),metalnessMap:Pt,roughnessMap:tt,anisotropy:_t,anisotropyMap:ne,clearcoat:ge,clearcoatMap:ae,clearcoatNormalMap:ce,clearcoatRoughnessMap:me,dispersion:At,iridescence:b,iridescenceMap:K,iridescenceThicknessMap:ie,sheen:g,sheenColorMap:Me,sheenRoughnessMap:Ae,specularMap:fe,specularColorMap:ue,specularIntensityMap:Ge,transmission:V,transmissionMap:qe,thicknessMap:ot,gradientMap:D,opaque:_.transparent===!1&&_.blending===Yi&&_.alphaToCoverage===!1,alphaMap:de,alphaTest:Q,alphaHash:Ee,combine:_.combine,mapUv:ct&&x(_.map.channel),aoMapUv:dt&&x(_.aoMap.channel),lightMapUv:Xe&&x(_.lightMap.channel),bumpMapUv:Ft&&x(_.bumpMap.channel),normalMapUv:Mt&&x(_.normalMap.channel),displacementMapUv:jt&&x(_.displacementMap.channel),emissiveMapUv:I&&x(_.emissiveMap.channel),metalnessMapUv:Pt&&x(_.metalnessMap.channel),roughnessMapUv:tt&&x(_.roughnessMap.channel),anisotropyMapUv:ne&&x(_.anisotropyMap.channel),clearcoatMapUv:ae&&x(_.clearcoatMap.channel),clearcoatNormalMapUv:ce&&x(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:me&&x(_.clearcoatRoughnessMap.channel),iridescenceMapUv:K&&x(_.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&x(_.iridescenceThicknessMap.channel),sheenColorMapUv:Me&&x(_.sheenColorMap.channel),sheenRoughnessMapUv:Ae&&x(_.sheenRoughnessMap.channel),specularMapUv:fe&&x(_.specularMap.channel),specularColorMapUv:ue&&x(_.specularColorMap.channel),specularIntensityMapUv:Ge&&x(_.specularIntensityMap.channel),transmissionMapUv:qe&&x(_.transmissionMap.channel),thicknessMapUv:ot&&x(_.thicknessMap.channel),alphaMapUv:de&&x(_.alphaMap.channel),vertexTangents:!!y.attributes.tangent&&(Mt||_t),vertexNormals:!!y.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!y.attributes.color&&y.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!y.attributes.uv&&(ct||de),fog:!!Y,useFog:_.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||y.attributes.normal===void 0&&Mt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Be,skinning:O.isSkinnedMesh===!0,morphTargets:y.morphAttributes.position!==void 0,morphNormals:y.morphAttributes.normal!==void 0,morphColors:y.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:Re,numDirLights:C.directional.length,numPointLights:C.point.length,numSpotLights:C.spot.length,numSpotLightMaps:C.spotLightMap.length,numRectAreaLights:C.rectArea.length,numHemiLights:C.hemi.length,numDirLightShadows:C.directionalShadowMap.length,numPointLightShadows:C.pointShadowMap.length,numSpotLightShadows:C.spotShadowMap.length,numSpotLightShadowsWithMaps:C.numSpotLightShadowsWithMaps,numLightProbes:C.numLightProbes,numLightProbeGrids:$.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:se,decodeVideoTexture:ct&&_.map.isVideoTexture===!0&&it.getTransfer(_.map.colorSpace)===ft,decodeVideoTextureEmissive:I&&_.emissiveMap.isVideoTexture===!0&&it.getTransfer(_.emissiveMap.colorSpace)===ft,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Un,flipSided:_.side===Zt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:he&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(he&&_.extensions.multiDraw===!0||Oe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Ne.vertexUv1s=l.has(1),Ne.vertexUv2s=l.has(2),Ne.vertexUv3s=l.has(3),l.clear(),Ne}function m(_){const C=[];if(_.shaderID?C.push(_.shaderID):(C.push(_.customVertexShaderID),C.push(_.customFragmentShaderID)),_.defines!==void 0)for(const L in _.defines)C.push(L),C.push(_.defines[L]);return _.isRawShaderMaterial===!1&&(h(C,_),E(C,_),C.push(n.outputColorSpace)),C.push(_.customProgramCacheKey),C.join()}function h(_,C){_.push(C.precision),_.push(C.outputColorSpace),_.push(C.envMapMode),_.push(C.envMapCubeUVHeight),_.push(C.mapUv),_.push(C.alphaMapUv),_.push(C.lightMapUv),_.push(C.aoMapUv),_.push(C.bumpMapUv),_.push(C.normalMapUv),_.push(C.displacementMapUv),_.push(C.emissiveMapUv),_.push(C.metalnessMapUv),_.push(C.roughnessMapUv),_.push(C.anisotropyMapUv),_.push(C.clearcoatMapUv),_.push(C.clearcoatNormalMapUv),_.push(C.clearcoatRoughnessMapUv),_.push(C.iridescenceMapUv),_.push(C.iridescenceThicknessMapUv),_.push(C.sheenColorMapUv),_.push(C.sheenRoughnessMapUv),_.push(C.specularMapUv),_.push(C.specularColorMapUv),_.push(C.specularIntensityMapUv),_.push(C.transmissionMapUv),_.push(C.thicknessMapUv),_.push(C.combine),_.push(C.fogExp2),_.push(C.sizeAttenuation),_.push(C.morphTargetsCount),_.push(C.morphAttributeCount),_.push(C.numDirLights),_.push(C.numPointLights),_.push(C.numSpotLights),_.push(C.numSpotLightMaps),_.push(C.numHemiLights),_.push(C.numRectAreaLights),_.push(C.numDirLightShadows),_.push(C.numPointLightShadows),_.push(C.numSpotLightShadows),_.push(C.numSpotLightShadowsWithMaps),_.push(C.numLightProbes),_.push(C.shadowMapType),_.push(C.toneMapping),_.push(C.numClippingPlanes),_.push(C.numClipIntersection),_.push(C.depthPacking)}function E(_,C){a.disableAll(),C.instancing&&a.enable(0),C.instancingColor&&a.enable(1),C.instancingMorph&&a.enable(2),C.matcap&&a.enable(3),C.envMap&&a.enable(4),C.normalMapObjectSpace&&a.enable(5),C.normalMapTangentSpace&&a.enable(6),C.clearcoat&&a.enable(7),C.iridescence&&a.enable(8),C.alphaTest&&a.enable(9),C.vertexColors&&a.enable(10),C.vertexAlphas&&a.enable(11),C.vertexUv1s&&a.enable(12),C.vertexUv2s&&a.enable(13),C.vertexUv3s&&a.enable(14),C.vertexTangents&&a.enable(15),C.anisotropy&&a.enable(16),C.alphaHash&&a.enable(17),C.batching&&a.enable(18),C.dispersion&&a.enable(19),C.batchingColor&&a.enable(20),C.gradientMap&&a.enable(21),C.packedNormalMap&&a.enable(22),C.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),C.fog&&a.enable(0),C.useFog&&a.enable(1),C.flatShading&&a.enable(2),C.logarithmicDepthBuffer&&a.enable(3),C.reversedDepthBuffer&&a.enable(4),C.skinning&&a.enable(5),C.morphTargets&&a.enable(6),C.morphNormals&&a.enable(7),C.morphColors&&a.enable(8),C.premultipliedAlpha&&a.enable(9),C.shadowMapEnabled&&a.enable(10),C.doubleSided&&a.enable(11),C.flipSided&&a.enable(12),C.useDepthPacking&&a.enable(13),C.dithering&&a.enable(14),C.transmission&&a.enable(15),C.sheen&&a.enable(16),C.opaque&&a.enable(17),C.pointsUvs&&a.enable(18),C.decodeVideoTexture&&a.enable(19),C.decodeVideoTextureEmissive&&a.enable(20),C.alphaToCoverage&&a.enable(21),C.numLightProbeGrids>0&&a.enable(22),_.push(a.mask)}function A(_){const C=p[_.type];let L;if(C){const R=Sn[C];L=vx.clone(R.uniforms)}else L=_.uniforms;return L}function T(_,C){let L=d.get(C);return L!==void 0?++L.usedTimes:(L=new WS(n,C,_,r),c.push(L),d.set(C,L)),L}function P(_){if(--_.usedTimes===0){const C=c.indexOf(_);c[C]=c[c.length-1],c.pop(),d.delete(_.cacheKey),_.destroy()}}function M(_){o.remove(_)}function w(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:A,acquireProgram:T,releaseProgram:P,releaseShaderCache:M,programs:c,dispose:w}}function ZS(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function jS(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function vc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Sc(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function o(u,p,x,S,m,h){let E=n[e];return E===void 0?(E={id:u.id,object:u,geometry:p,material:x,materialVariant:a(u),groupOrder:S,renderOrder:u.renderOrder,z:m,group:h},n[e]=E):(E.id=u.id,E.object=u,E.geometry=p,E.material=x,E.materialVariant=a(u),E.groupOrder=S,E.renderOrder=u.renderOrder,E.z=m,E.group=h),e++,E}function l(u,p,x,S,m,h){const E=o(u,p,x,S,m,h);x.transmission>0?i.push(E):x.transparent===!0?r.push(E):t.push(E)}function c(u,p,x,S,m,h){const E=o(u,p,x,S,m,h);x.transmission>0?i.unshift(E):x.transparent===!0?r.unshift(E):t.unshift(E)}function d(u,p){t.length>1&&t.sort(u||jS),i.length>1&&i.sort(p||vc),r.length>1&&r.sort(p||vc)}function f(){for(let u=e,p=n.length;u<p;u++){const x=n[u];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:f,sort:d}}function JS(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new Sc,n.set(i,[a])):r>=s.length?(a=new Sc,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function QS(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Ke};break;case"SpotLight":t={position:new z,direction:new z,color:new Ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Ke,groundColor:new Ke};break;case"RectAreaLight":t={color:new Ke,position:new z,halfWidth:new z,halfHeight:new z};break}return n[e.id]=t,t}}}function eM(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let tM=0;function nM(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function iM(n){const e=new QS,t=eM(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);const r=new z,s=new Et,a=new Et;function o(c){let d=0,f=0,u=0;for(let C=0;C<9;C++)i.probe[C].set(0,0,0);let p=0,x=0,S=0,m=0,h=0,E=0,A=0,T=0,P=0,M=0,w=0;c.sort(nM);for(let C=0,L=c.length;C<L;C++){const R=c[C],O=R.color,$=R.intensity,Y=R.distance;let y=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===Mi?y=R.shadow.map.texture:y=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)d+=O.r*$,f+=O.g*$,u+=O.b*$;else if(R.isLightProbe){for(let N=0;N<9;N++)i.probe[N].addScaledVector(R.sh.coefficients[N],$);w++}else if(R.isDirectionalLight){const N=e.get(R);if(N.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const F=R.shadow,k=t.get(R);k.shadowIntensity=F.intensity,k.shadowBias=F.bias,k.shadowNormalBias=F.normalBias,k.shadowRadius=F.radius,k.shadowMapSize=F.mapSize,i.directionalShadow[p]=k,i.directionalShadowMap[p]=y,i.directionalShadowMatrix[p]=R.shadow.matrix,E++}i.directional[p]=N,p++}else if(R.isSpotLight){const N=e.get(R);N.position.setFromMatrixPosition(R.matrixWorld),N.color.copy(O).multiplyScalar($),N.distance=Y,N.coneCos=Math.cos(R.angle),N.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),N.decay=R.decay,i.spot[S]=N;const F=R.shadow;if(R.map&&(i.spotLightMap[P]=R.map,P++,F.updateMatrices(R),R.castShadow&&M++),i.spotLightMatrix[S]=F.matrix,R.castShadow){const k=t.get(R);k.shadowIntensity=F.intensity,k.shadowBias=F.bias,k.shadowNormalBias=F.normalBias,k.shadowRadius=F.radius,k.shadowMapSize=F.mapSize,i.spotShadow[S]=k,i.spotShadowMap[S]=y,T++}S++}else if(R.isRectAreaLight){const N=e.get(R);N.color.copy(O).multiplyScalar($),N.halfWidth.set(R.width*.5,0,0),N.halfHeight.set(0,R.height*.5,0),i.rectArea[m]=N,m++}else if(R.isPointLight){const N=e.get(R);if(N.color.copy(R.color).multiplyScalar(R.intensity),N.distance=R.distance,N.decay=R.decay,R.castShadow){const F=R.shadow,k=t.get(R);k.shadowIntensity=F.intensity,k.shadowBias=F.bias,k.shadowNormalBias=F.normalBias,k.shadowRadius=F.radius,k.shadowMapSize=F.mapSize,k.shadowCameraNear=F.camera.near,k.shadowCameraFar=F.camera.far,i.pointShadow[x]=k,i.pointShadowMap[x]=y,i.pointShadowMatrix[x]=R.shadow.matrix,A++}i.point[x]=N,x++}else if(R.isHemisphereLight){const N=e.get(R);N.skyColor.copy(R.color).multiplyScalar($),N.groundColor.copy(R.groundColor).multiplyScalar($),i.hemi[h]=N,h++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=_e.LTC_FLOAT_1,i.rectAreaLTC2=_e.LTC_FLOAT_2):(i.rectAreaLTC1=_e.LTC_HALF_1,i.rectAreaLTC2=_e.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=u;const _=i.hash;(_.directionalLength!==p||_.pointLength!==x||_.spotLength!==S||_.rectAreaLength!==m||_.hemiLength!==h||_.numDirectionalShadows!==E||_.numPointShadows!==A||_.numSpotShadows!==T||_.numSpotMaps!==P||_.numLightProbes!==w)&&(i.directional.length=p,i.spot.length=S,i.rectArea.length=m,i.point.length=x,i.hemi.length=h,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.pointShadow.length=A,i.pointShadowMap.length=A,i.spotShadow.length=T,i.spotShadowMap.length=T,i.directionalShadowMatrix.length=E,i.pointShadowMatrix.length=A,i.spotLightMatrix.length=T+P-M,i.spotLightMap.length=P,i.numSpotLightShadowsWithMaps=M,i.numLightProbes=w,_.directionalLength=p,_.pointLength=x,_.spotLength=S,_.rectAreaLength=m,_.hemiLength=h,_.numDirectionalShadows=E,_.numPointShadows=A,_.numSpotShadows=T,_.numSpotMaps=P,_.numLightProbes=w,i.version=tM++)}function l(c,d){let f=0,u=0,p=0,x=0,S=0;const m=d.matrixWorldInverse;for(let h=0,E=c.length;h<E;h++){const A=c[h];if(A.isDirectionalLight){const T=i.directional[f];T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),f++}else if(A.isSpotLight){const T=i.spot[p];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),p++}else if(A.isRectAreaLight){const T=i.rectArea[x];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),a.identity(),s.copy(A.matrixWorld),s.premultiply(m),a.extractRotation(s),T.halfWidth.set(A.width*.5,0,0),T.halfHeight.set(0,A.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),x++}else if(A.isPointLight){const T=i.point[u];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),u++}else if(A.isHemisphereLight){const T=i.hemi[S];T.direction.setFromMatrixPosition(A.matrixWorld),T.direction.transformDirection(m),S++}}}return{setup:o,setupView:l,state:i}}function Mc(n){const e=new iM(n),t=[],i=[],r=[];function s(u){f.camera=u,t.length=0,i.length=0,r.length=0}function a(u){t.push(u)}function o(u){i.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function d(u){e.setupView(t,u)}const f={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:d,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function rM(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Mc(n),e.set(r,[o])):s>=a.length?(o=new Mc(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const sM=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,aM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,oM=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],lM=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],Ec=new Et,mr=new z,Ea=new z;function cM(n,e,t){let i=new Mu;const r=new ut,s=new ut,a=new Rt,o=new bx,l=new Ax,c={},d=t.maxTextureSize,f={[ri]:Zt,[Zt]:ri,[Un]:Un},u=new Cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ut},radius:{value:4}},vertexShader:sM,fragmentShader:aM}),p=u.clone();p.defines.HORIZONTAL_PASS=1;const x=new Wt;x.setAttribute("position",new mn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Ut(x,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=os;let h=this.type;this.render=function(M,w,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||M.length===0)return;this.type===Km&&(ke("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=os);const C=n.getRenderTarget(),L=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),O=n.state;O.setBlending(On),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const $=h!==this.type;$&&w.traverse(function(Y){Y.material&&(Array.isArray(Y.material)?Y.material.forEach(y=>y.needsUpdate=!0):Y.material.needsUpdate=!0)});for(let Y=0,y=M.length;Y<y;Y++){const N=M[Y],F=N.shadow;if(F===void 0){ke("WebGLShadowMap:",N,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;r.copy(F.mapSize);const k=F.getFrameExtents();r.multiply(k),s.copy(F.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/k.x),r.x=s.x*k.x,F.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/k.y),r.y=s.y*k.y,F.mapSize.y=s.y));const H=n.state.buffers.depth.getReversed();if(F.camera._reversedDepth=H,F.map===null||$===!0){if(F.map!==null&&(F.map.depthTexture!==null&&(F.map.depthTexture.dispose(),F.map.depthTexture=null),F.map.dispose()),this.type===gr){if(N.isPointLight){ke("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}F.map=new yn(r.x,r.y,{format:Mi,type:zn,minFilter:Gt,magFilter:Gt,generateMipmaps:!1}),F.map.texture.name=N.name+".shadowMap",F.map.depthTexture=new Qi(r.x,r.y,hn),F.map.depthTexture.name=N.name+".shadowMapDepth",F.map.depthTexture.format=Gn,F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Bt,F.map.depthTexture.magFilter=Bt}else N.isPointLight?(F.map=new Ru(r.x),F.map.depthTexture=new xx(r.x,Tn)):(F.map=new yn(r.x,r.y),F.map.depthTexture=new Qi(r.x,r.y,Tn)),F.map.depthTexture.name=N.name+".shadowMap",F.map.depthTexture.format=Gn,this.type===os?(F.map.depthTexture.compareFunction=H?Xo:$o,F.map.depthTexture.minFilter=Gt,F.map.depthTexture.magFilter=Gt):(F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Bt,F.map.depthTexture.magFilter=Bt);F.camera.updateProjectionMatrix()}const J=F.map.isWebGLCubeRenderTarget?6:1;for(let re=0;re<J;re++){if(F.map.isWebGLCubeRenderTarget)n.setRenderTarget(F.map,re),n.clear();else{re===0&&(n.setRenderTarget(F.map),n.clear());const xe=F.getViewport(re);a.set(s.x*xe.x,s.y*xe.y,s.x*xe.z,s.y*xe.w),O.viewport(a)}if(N.isPointLight){const xe=F.camera,Re=F.matrix,Je=N.distance||xe.far;Je!==xe.far&&(xe.far=Je,xe.updateProjectionMatrix()),mr.setFromMatrixPosition(N.matrixWorld),xe.position.copy(mr),Ea.copy(xe.position),Ea.add(oM[re]),xe.up.copy(lM[re]),xe.lookAt(Ea),xe.updateMatrixWorld(),Re.makeTranslation(-mr.x,-mr.y,-mr.z),Ec.multiplyMatrices(xe.projectionMatrix,xe.matrixWorldInverse),F._frustum.setFromProjectionMatrix(Ec,xe.coordinateSystem,xe.reversedDepth)}else F.updateMatrices(N);i=F.getFrustum(),T(w,_,F.camera,N,this.type)}F.isPointLightShadow!==!0&&this.type===gr&&E(F,_),F.needsUpdate=!1}h=this.type,m.needsUpdate=!1,n.setRenderTarget(C,L,R)};function E(M,w){const _=e.update(S);u.defines.VSM_SAMPLES!==M.blurSamples&&(u.defines.VSM_SAMPLES=M.blurSamples,p.defines.VSM_SAMPLES=M.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new yn(r.x,r.y,{format:Mi,type:zn})),u.uniforms.shadow_pass.value=M.map.depthTexture,u.uniforms.resolution.value=M.mapSize,u.uniforms.radius.value=M.radius,n.setRenderTarget(M.mapPass),n.clear(),n.renderBufferDirect(w,null,_,u,S,null),p.uniforms.shadow_pass.value=M.mapPass.texture,p.uniforms.resolution.value=M.mapSize,p.uniforms.radius.value=M.radius,n.setRenderTarget(M.map),n.clear(),n.renderBufferDirect(w,null,_,p,S,null)}function A(M,w,_,C){let L=null;const R=_.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(R!==void 0)L=R;else if(L=_.isPointLight===!0?l:o,n.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){const O=L.uuid,$=w.uuid;let Y=c[O];Y===void 0&&(Y={},c[O]=Y);let y=Y[$];y===void 0&&(y=L.clone(),Y[$]=y,w.addEventListener("dispose",P)),L=y}if(L.visible=w.visible,L.wireframe=w.wireframe,C===gr?L.side=w.shadowSide!==null?w.shadowSide:w.side:L.side=w.shadowSide!==null?w.shadowSide:f[w.side],L.alphaMap=w.alphaMap,L.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,L.map=w.map,L.clipShadows=w.clipShadows,L.clippingPlanes=w.clippingPlanes,L.clipIntersection=w.clipIntersection,L.displacementMap=w.displacementMap,L.displacementScale=w.displacementScale,L.displacementBias=w.displacementBias,L.wireframeLinewidth=w.wireframeLinewidth,L.linewidth=w.linewidth,_.isPointLight===!0&&L.isMeshDistanceMaterial===!0){const O=n.properties.get(L);O.light=_}return L}function T(M,w,_,C,L){if(M.visible===!1)return;if(M.layers.test(w.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&L===gr)&&(!M.frustumCulled||i.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,M.matrixWorld);const $=e.update(M),Y=M.material;if(Array.isArray(Y)){const y=$.groups;for(let N=0,F=y.length;N<F;N++){const k=y[N],H=Y[k.materialIndex];if(H&&H.visible){const J=A(M,H,C,L);M.onBeforeShadow(n,M,w,_,$,J,k),n.renderBufferDirect(_,null,$,J,M,k),M.onAfterShadow(n,M,w,_,$,J,k)}}}else if(Y.visible){const y=A(M,Y,C,L);M.onBeforeShadow(n,M,w,_,$,y,null),n.renderBufferDirect(_,null,$,y,M,null),M.onAfterShadow(n,M,w,_,$,y,null)}}const O=M.children;for(let $=0,Y=O.length;$<Y;$++)T(O[$],w,_,C,L)}function P(M){M.target.removeEventListener("dispose",P);for(const _ in c){const C=c[_],L=M.target.uuid;L in C&&(C[L].dispose(),delete C[L])}}}function uM(n,e){function t(){let D=!1;const de=new Rt;let Q=null;const Ee=new Rt(0,0,0,0);return{setMask:function(he){Q!==he&&!D&&(n.colorMask(he,he,he,he),Q=he)},setLocked:function(he){D=he},setClear:function(he,se,Ne,We,Tt){Tt===!0&&(he*=We,se*=We,Ne*=We),de.set(he,se,Ne,We),Ee.equals(de)===!1&&(n.clearColor(he,se,Ne,We),Ee.copy(de))},reset:function(){D=!1,Q=null,Ee.set(-1,0,0,0)}}}function i(){let D=!1,de=!1,Q=null,Ee=null,he=null;return{setReversed:function(se){if(de!==se){const Ne=e.get("EXT_clip_control");se?Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.ZERO_TO_ONE_EXT):Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.NEGATIVE_ONE_TO_ONE_EXT),de=se;const We=he;he=null,this.setClear(We)}},getReversed:function(){return de},setTest:function(se){se?le(n.DEPTH_TEST):Be(n.DEPTH_TEST)},setMask:function(se){Q!==se&&!D&&(n.depthMask(se),Q=se)},setFunc:function(se){if(de&&(se=w0[se]),Ee!==se){switch(se){case Da:n.depthFunc(n.NEVER);break;case Ia:n.depthFunc(n.ALWAYS);break;case Ua:n.depthFunc(n.LESS);break;case ji:n.depthFunc(n.LEQUAL);break;case Ba:n.depthFunc(n.EQUAL);break;case Oa:n.depthFunc(n.GEQUAL);break;case ka:n.depthFunc(n.GREATER);break;case Va:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ee=se}},setLocked:function(se){D=se},setClear:function(se){he!==se&&(he=se,de&&(se=1-se),n.clearDepth(se))},reset:function(){D=!1,Q=null,Ee=null,he=null,de=!1}}}function r(){let D=!1,de=null,Q=null,Ee=null,he=null,se=null,Ne=null,We=null,Tt=null;return{setTest:function(pt){D||(pt?le(n.STENCIL_TEST):Be(n.STENCIL_TEST))},setMask:function(pt){de!==pt&&!D&&(n.stencilMask(pt),de=pt)},setFunc:function(pt,Rn,xn){(Q!==pt||Ee!==Rn||he!==xn)&&(n.stencilFunc(pt,Rn,xn),Q=pt,Ee=Rn,he=xn)},setOp:function(pt,Rn,xn){(se!==pt||Ne!==Rn||We!==xn)&&(n.stencilOp(pt,Rn,xn),se=pt,Ne=Rn,We=xn)},setLocked:function(pt){D=pt},setClear:function(pt){Tt!==pt&&(n.clearStencil(pt),Tt=pt)},reset:function(){D=!1,de=null,Q=null,Ee=null,he=null,se=null,Ne=null,We=null,Tt=null}}}const s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let d={},f={},u={},p=new WeakMap,x=[],S=null,m=!1,h=null,E=null,A=null,T=null,P=null,M=null,w=null,_=new Ke(0,0,0),C=0,L=!1,R=null,O=null,$=null,Y=null,y=null;const N=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let F=!1,k=0;const H=n.getParameter(n.VERSION);H.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec(H)[1]),F=k>=1):H.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),F=k>=2);let J=null,re={};const xe=n.getParameter(n.SCISSOR_BOX),Re=n.getParameter(n.VIEWPORT),Je=new Rt().fromArray(xe),Ie=new Rt().fromArray(Re);function ee(D,de,Q,Ee){const he=new Uint8Array(4),se=n.createTexture();n.bindTexture(D,se),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ne=0;Ne<Q;Ne++)D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY?n.texImage3D(de,0,n.RGBA,1,1,Ee,0,n.RGBA,n.UNSIGNED_BYTE,he):n.texImage2D(de+Ne,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,he);return se}const pe={};pe[n.TEXTURE_2D]=ee(n.TEXTURE_2D,n.TEXTURE_2D,1),pe[n.TEXTURE_CUBE_MAP]=ee(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),pe[n.TEXTURE_2D_ARRAY]=ee(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),pe[n.TEXTURE_3D]=ee(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),le(n.DEPTH_TEST),a.setFunc(ji),Ft(!1),Mt(xl),le(n.CULL_FACE),dt(On);function le(D){d[D]!==!0&&(n.enable(D),d[D]=!0)}function Be(D){d[D]!==!1&&(n.disable(D),d[D]=!1)}function ze(D,de){return u[D]!==de?(n.bindFramebuffer(D,de),u[D]=de,D===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=de),D===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=de),!0):!1}function Oe(D,de){let Q=x,Ee=!1;if(D){Q=p.get(de),Q===void 0&&(Q=[],p.set(de,Q));const he=D.textures;if(Q.length!==he.length||Q[0]!==n.COLOR_ATTACHMENT0){for(let se=0,Ne=he.length;se<Ne;se++)Q[se]=n.COLOR_ATTACHMENT0+se;Q.length=he.length,Ee=!0}}else Q[0]!==n.BACK&&(Q[0]=n.BACK,Ee=!0);Ee&&n.drawBuffers(Q)}function ct(D){return S!==D?(n.useProgram(D),S=D,!0):!1}const Qe={[hi]:n.FUNC_ADD,[jm]:n.FUNC_SUBTRACT,[Jm]:n.FUNC_REVERSE_SUBTRACT};Qe[Qm]=n.MIN,Qe[e0]=n.MAX;const rt={[t0]:n.ZERO,[n0]:n.ONE,[i0]:n.SRC_COLOR,[Pa]:n.SRC_ALPHA,[c0]:n.SRC_ALPHA_SATURATE,[o0]:n.DST_COLOR,[s0]:n.DST_ALPHA,[r0]:n.ONE_MINUS_SRC_COLOR,[La]:n.ONE_MINUS_SRC_ALPHA,[l0]:n.ONE_MINUS_DST_COLOR,[a0]:n.ONE_MINUS_DST_ALPHA,[u0]:n.CONSTANT_COLOR,[d0]:n.ONE_MINUS_CONSTANT_COLOR,[f0]:n.CONSTANT_ALPHA,[h0]:n.ONE_MINUS_CONSTANT_ALPHA};function dt(D,de,Q,Ee,he,se,Ne,We,Tt,pt){if(D===On){m===!0&&(Be(n.BLEND),m=!1);return}if(m===!1&&(le(n.BLEND),m=!0),D!==Zm){if(D!==h||pt!==L){if((E!==hi||P!==hi)&&(n.blendEquation(n.FUNC_ADD),E=hi,P=hi),pt)switch(D){case Yi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case gl:n.blendFunc(n.ONE,n.ONE);break;case _l:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case vl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:at("WebGLState: Invalid blending: ",D);break}else switch(D){case Yi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case gl:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case _l:at("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case vl:at("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:at("WebGLState: Invalid blending: ",D);break}A=null,T=null,M=null,w=null,_.set(0,0,0),C=0,h=D,L=pt}return}he=he||de,se=se||Q,Ne=Ne||Ee,(de!==E||he!==P)&&(n.blendEquationSeparate(Qe[de],Qe[he]),E=de,P=he),(Q!==A||Ee!==T||se!==M||Ne!==w)&&(n.blendFuncSeparate(rt[Q],rt[Ee],rt[se],rt[Ne]),A=Q,T=Ee,M=se,w=Ne),(We.equals(_)===!1||Tt!==C)&&(n.blendColor(We.r,We.g,We.b,Tt),_.copy(We),C=Tt),h=D,L=!1}function Xe(D,de){D.side===Un?Be(n.CULL_FACE):le(n.CULL_FACE);let Q=D.side===Zt;de&&(Q=!Q),Ft(Q),D.blending===Yi&&D.transparent===!1?dt(On):dt(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),s.setMask(D.colorWrite);const Ee=D.stencilWrite;o.setTest(Ee),Ee&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),I(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?le(n.SAMPLE_ALPHA_TO_COVERAGE):Be(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ft(D){R!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),R=D)}function Mt(D){D!==qm?(le(n.CULL_FACE),D!==O&&(D===xl?n.cullFace(n.BACK):D===Ym?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Be(n.CULL_FACE),O=D}function jt(D){D!==$&&(F&&n.lineWidth(D),$=D)}function I(D,de,Q){D?(le(n.POLYGON_OFFSET_FILL),(Y!==de||y!==Q)&&(Y=de,y=Q,a.getReversed()&&(de=-de),n.polygonOffset(de,Q))):Be(n.POLYGON_OFFSET_FILL)}function Pt(D){D?le(n.SCISSOR_TEST):Be(n.SCISSOR_TEST)}function tt(D){D===void 0&&(D=n.TEXTURE0+N-1),J!==D&&(n.activeTexture(D),J=D)}function _t(D,de,Q){Q===void 0&&(J===null?Q=n.TEXTURE0+N-1:Q=J);let Ee=re[Q];Ee===void 0&&(Ee={type:void 0,texture:void 0},re[Q]=Ee),(Ee.type!==D||Ee.texture!==de)&&(J!==Q&&(n.activeTexture(Q),J=Q),n.bindTexture(D,de||pe[D]),Ee.type=D,Ee.texture=de)}function ge(){const D=re[J];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function At(){try{n.compressedTexImage2D(...arguments)}catch(D){at("WebGLState:",D)}}function b(){try{n.compressedTexImage3D(...arguments)}catch(D){at("WebGLState:",D)}}function g(){try{n.texSubImage2D(...arguments)}catch(D){at("WebGLState:",D)}}function V(){try{n.texSubImage3D(...arguments)}catch(D){at("WebGLState:",D)}}function ne(){try{n.compressedTexSubImage2D(...arguments)}catch(D){at("WebGLState:",D)}}function ae(){try{n.compressedTexSubImage3D(...arguments)}catch(D){at("WebGLState:",D)}}function ce(){try{n.texStorage2D(...arguments)}catch(D){at("WebGLState:",D)}}function me(){try{n.texStorage3D(...arguments)}catch(D){at("WebGLState:",D)}}function K(){try{n.texImage2D(...arguments)}catch(D){at("WebGLState:",D)}}function ie(){try{n.texImage3D(...arguments)}catch(D){at("WebGLState:",D)}}function Me(D){return f[D]!==void 0?f[D]:n.getParameter(D)}function Ae(D,de){f[D]!==de&&(n.pixelStorei(D,de),f[D]=de)}function fe(D){Je.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),Je.copy(D))}function ue(D){Ie.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),Ie.copy(D))}function Ge(D,de){let Q=c.get(de);Q===void 0&&(Q=new WeakMap,c.set(de,Q));let Ee=Q.get(D);Ee===void 0&&(Ee=n.getUniformBlockIndex(de,D.name),Q.set(D,Ee))}function qe(D,de){const Ee=c.get(de).get(D);l.get(de)!==Ee&&(n.uniformBlockBinding(de,Ee,D.__bindingPointIndex),l.set(de,Ee))}function ot(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),d={},f={},J=null,re={},u={},p=new WeakMap,x=[],S=null,m=!1,h=null,E=null,A=null,T=null,P=null,M=null,w=null,_=new Ke(0,0,0),C=0,L=!1,R=null,O=null,$=null,Y=null,y=null,Je.set(0,0,n.canvas.width,n.canvas.height),Ie.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:le,disable:Be,bindFramebuffer:ze,drawBuffers:Oe,useProgram:ct,setBlending:dt,setMaterial:Xe,setFlipSided:Ft,setCullFace:Mt,setLineWidth:jt,setPolygonOffset:I,setScissorTest:Pt,activeTexture:tt,bindTexture:_t,unbindTexture:ge,compressedTexImage2D:At,compressedTexImage3D:b,texImage2D:K,texImage3D:ie,pixelStorei:Ae,getParameter:Me,updateUBOMapping:Ge,uniformBlockBinding:qe,texStorage2D:ce,texStorage3D:me,texSubImage2D:g,texSubImage3D:V,compressedTexSubImage2D:ne,compressedTexSubImage3D:ae,scissor:fe,viewport:ue,reset:ot}}function dM(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ut,d=new WeakMap,f=new Set;let u;const p=new WeakMap;let x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(b,g){return x?new OffscreenCanvas(b,g):Ms("canvas")}function m(b,g,V){let ne=1;const ae=At(b);if((ae.width>V||ae.height>V)&&(ne=V/Math.max(ae.width,ae.height)),ne<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const ce=Math.floor(ne*ae.width),me=Math.floor(ne*ae.height);u===void 0&&(u=S(ce,me));const K=g?S(ce,me):u;return K.width=ce,K.height=me,K.getContext("2d").drawImage(b,0,0,ce,me),ke("WebGLRenderer: Texture has been resized from ("+ae.width+"x"+ae.height+") to ("+ce+"x"+me+")."),K}else return"data"in b&&ke("WebGLRenderer: Image in DataTexture is too big ("+ae.width+"x"+ae.height+")."),b;return b}function h(b){return b.generateMipmaps}function E(b){n.generateMipmap(b)}function A(b){return b.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?n.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(b,g,V,ne,ae,ce=!1){if(b!==null){if(n[b]!==void 0)return n[b];ke("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let me;ne&&(me=e.get("EXT_texture_norm16"),me||ke("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=g;if(g===n.RED&&(V===n.FLOAT&&(K=n.R32F),V===n.HALF_FLOAT&&(K=n.R16F),V===n.UNSIGNED_BYTE&&(K=n.R8),V===n.UNSIGNED_SHORT&&me&&(K=me.R16_EXT),V===n.SHORT&&me&&(K=me.R16_SNORM_EXT)),g===n.RED_INTEGER&&(V===n.UNSIGNED_BYTE&&(K=n.R8UI),V===n.UNSIGNED_SHORT&&(K=n.R16UI),V===n.UNSIGNED_INT&&(K=n.R32UI),V===n.BYTE&&(K=n.R8I),V===n.SHORT&&(K=n.R16I),V===n.INT&&(K=n.R32I)),g===n.RG&&(V===n.FLOAT&&(K=n.RG32F),V===n.HALF_FLOAT&&(K=n.RG16F),V===n.UNSIGNED_BYTE&&(K=n.RG8),V===n.UNSIGNED_SHORT&&me&&(K=me.RG16_EXT),V===n.SHORT&&me&&(K=me.RG16_SNORM_EXT)),g===n.RG_INTEGER&&(V===n.UNSIGNED_BYTE&&(K=n.RG8UI),V===n.UNSIGNED_SHORT&&(K=n.RG16UI),V===n.UNSIGNED_INT&&(K=n.RG32UI),V===n.BYTE&&(K=n.RG8I),V===n.SHORT&&(K=n.RG16I),V===n.INT&&(K=n.RG32I)),g===n.RGB_INTEGER&&(V===n.UNSIGNED_BYTE&&(K=n.RGB8UI),V===n.UNSIGNED_SHORT&&(K=n.RGB16UI),V===n.UNSIGNED_INT&&(K=n.RGB32UI),V===n.BYTE&&(K=n.RGB8I),V===n.SHORT&&(K=n.RGB16I),V===n.INT&&(K=n.RGB32I)),g===n.RGBA_INTEGER&&(V===n.UNSIGNED_BYTE&&(K=n.RGBA8UI),V===n.UNSIGNED_SHORT&&(K=n.RGBA16UI),V===n.UNSIGNED_INT&&(K=n.RGBA32UI),V===n.BYTE&&(K=n.RGBA8I),V===n.SHORT&&(K=n.RGBA16I),V===n.INT&&(K=n.RGBA32I)),g===n.RGB&&(V===n.UNSIGNED_SHORT&&me&&(K=me.RGB16_EXT),V===n.SHORT&&me&&(K=me.RGB16_SNORM_EXT),V===n.UNSIGNED_INT_5_9_9_9_REV&&(K=n.RGB9_E5),V===n.UNSIGNED_INT_10F_11F_11F_REV&&(K=n.R11F_G11F_B10F)),g===n.RGBA){const ie=ce?vs:it.getTransfer(ae);V===n.FLOAT&&(K=n.RGBA32F),V===n.HALF_FLOAT&&(K=n.RGBA16F),V===n.UNSIGNED_BYTE&&(K=ie===ft?n.SRGB8_ALPHA8:n.RGBA8),V===n.UNSIGNED_SHORT&&me&&(K=me.RGBA16_EXT),V===n.SHORT&&me&&(K=me.RGBA16_SNORM_EXT),V===n.UNSIGNED_SHORT_4_4_4_4&&(K=n.RGBA4),V===n.UNSIGNED_SHORT_5_5_5_1&&(K=n.RGB5_A1)}return(K===n.R16F||K===n.R32F||K===n.RG16F||K===n.RG32F||K===n.RGBA16F||K===n.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function P(b,g){let V;return b?g===null||g===Tn||g===Mr?V=n.DEPTH24_STENCIL8:g===hn?V=n.DEPTH32F_STENCIL8:g===Sr&&(V=n.DEPTH24_STENCIL8,ke("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Tn||g===Mr?V=n.DEPTH_COMPONENT24:g===hn?V=n.DEPTH_COMPONENT32F:g===Sr&&(V=n.DEPTH_COMPONENT16),V}function M(b,g){return h(b)===!0||b.isFramebufferTexture&&b.minFilter!==Bt&&b.minFilter!==Gt?Math.log2(Math.max(g.width,g.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?g.mipmaps.length:1}function w(b){const g=b.target;g.removeEventListener("dispose",w),C(g),g.isVideoTexture&&d.delete(g),g.isHTMLTexture&&f.delete(g)}function _(b){const g=b.target;g.removeEventListener("dispose",_),R(g)}function C(b){const g=i.get(b);if(g.__webglInit===void 0)return;const V=b.source,ne=p.get(V);if(ne){const ae=ne[g.__cacheKey];ae.usedTimes--,ae.usedTimes===0&&L(b),Object.keys(ne).length===0&&p.delete(V)}i.remove(b)}function L(b){const g=i.get(b);n.deleteTexture(g.__webglTexture);const V=b.source,ne=p.get(V);delete ne[g.__cacheKey],a.memory.textures--}function R(b){const g=i.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),i.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let ne=0;ne<6;ne++){if(Array.isArray(g.__webglFramebuffer[ne]))for(let ae=0;ae<g.__webglFramebuffer[ne].length;ae++)n.deleteFramebuffer(g.__webglFramebuffer[ne][ae]);else n.deleteFramebuffer(g.__webglFramebuffer[ne]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[ne])}else{if(Array.isArray(g.__webglFramebuffer))for(let ne=0;ne<g.__webglFramebuffer.length;ne++)n.deleteFramebuffer(g.__webglFramebuffer[ne]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let ne=0;ne<g.__webglColorRenderbuffer.length;ne++)g.__webglColorRenderbuffer[ne]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[ne]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const V=b.textures;for(let ne=0,ae=V.length;ne<ae;ne++){const ce=i.get(V[ne]);ce.__webglTexture&&(n.deleteTexture(ce.__webglTexture),a.memory.textures--),i.remove(V[ne])}i.remove(b)}let O=0;function $(){O=0}function Y(){return O}function y(b){O=b}function N(){const b=O;return b>=r.maxTextures&&ke("WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+r.maxTextures),O+=1,b}function F(b){const g=[];return g.push(b.wrapS),g.push(b.wrapT),g.push(b.wrapR||0),g.push(b.magFilter),g.push(b.minFilter),g.push(b.anisotropy),g.push(b.internalFormat),g.push(b.format),g.push(b.type),g.push(b.generateMipmaps),g.push(b.premultiplyAlpha),g.push(b.flipY),g.push(b.unpackAlignment),g.push(b.colorSpace),g.join()}function k(b,g){const V=i.get(b);if(b.isVideoTexture&&_t(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&V.__version!==b.version){const ne=b.image;if(ne===null)ke("WebGLRenderer: Texture marked for update but no image data found.");else if(ne.complete===!1)ke("WebGLRenderer: Texture marked for update but image is incomplete");else{Be(V,b,g);return}}else b.isExternalTexture&&(V.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,V.__webglTexture,n.TEXTURE0+g)}function H(b,g){const V=i.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&V.__version!==b.version){Be(V,b,g);return}else b.isExternalTexture&&(V.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,V.__webglTexture,n.TEXTURE0+g)}function J(b,g){const V=i.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&V.__version!==b.version){Be(V,b,g);return}t.bindTexture(n.TEXTURE_3D,V.__webglTexture,n.TEXTURE0+g)}function re(b,g){const V=i.get(b);if(b.isCubeDepthTexture!==!0&&b.version>0&&V.__version!==b.version){ze(V,b,g);return}t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture,n.TEXTURE0+g)}const xe={[za]:n.REPEAT,[Bn]:n.CLAMP_TO_EDGE,[Ga]:n.MIRRORED_REPEAT},Re={[Bt]:n.NEAREST,[x0]:n.NEAREST_MIPMAP_NEAREST,[Rr]:n.NEAREST_MIPMAP_LINEAR,[Gt]:n.LINEAR,[Xs]:n.LINEAR_MIPMAP_NEAREST,[mi]:n.LINEAR_MIPMAP_LINEAR},Je={[v0]:n.NEVER,[A0]:n.ALWAYS,[S0]:n.LESS,[$o]:n.LEQUAL,[M0]:n.EQUAL,[Xo]:n.GEQUAL,[E0]:n.GREATER,[b0]:n.NOTEQUAL};function Ie(b,g){if(g.type===hn&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===Gt||g.magFilter===Xs||g.magFilter===Rr||g.magFilter===mi||g.minFilter===Gt||g.minFilter===Xs||g.minFilter===Rr||g.minFilter===mi)&&ke("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(b,n.TEXTURE_WRAP_S,xe[g.wrapS]),n.texParameteri(b,n.TEXTURE_WRAP_T,xe[g.wrapT]),(b===n.TEXTURE_3D||b===n.TEXTURE_2D_ARRAY)&&n.texParameteri(b,n.TEXTURE_WRAP_R,xe[g.wrapR]),n.texParameteri(b,n.TEXTURE_MAG_FILTER,Re[g.magFilter]),n.texParameteri(b,n.TEXTURE_MIN_FILTER,Re[g.minFilter]),g.compareFunction&&(n.texParameteri(b,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(b,n.TEXTURE_COMPARE_FUNC,Je[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Bt||g.minFilter!==Rr&&g.minFilter!==mi||g.type===hn&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){const V=e.get("EXT_texture_filter_anisotropic");n.texParameterf(b,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function ee(b,g){let V=!1;b.__webglInit===void 0&&(b.__webglInit=!0,g.addEventListener("dispose",w));const ne=g.source;let ae=p.get(ne);ae===void 0&&(ae={},p.set(ne,ae));const ce=F(g);if(ce!==b.__cacheKey){ae[ce]===void 0&&(ae[ce]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,V=!0),ae[ce].usedTimes++;const me=ae[b.__cacheKey];me!==void 0&&(ae[b.__cacheKey].usedTimes--,me.usedTimes===0&&L(g)),b.__cacheKey=ce,b.__webglTexture=ae[ce].texture}return V}function pe(b,g,V){return Math.floor(Math.floor(b/V)/g)}function le(b,g,V,ne){const ce=b.updateRanges;if(ce.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,V,ne,g.data);else{ce.sort((Ae,fe)=>Ae.start-fe.start);let me=0;for(let Ae=1;Ae<ce.length;Ae++){const fe=ce[me],ue=ce[Ae],Ge=fe.start+fe.count,qe=pe(ue.start,g.width,4),ot=pe(fe.start,g.width,4);ue.start<=Ge+1&&qe===ot&&pe(ue.start+ue.count-1,g.width,4)===qe?fe.count=Math.max(fe.count,ue.start+ue.count-fe.start):(++me,ce[me]=ue)}ce.length=me+1;const K=t.getParameter(n.UNPACK_ROW_LENGTH),ie=t.getParameter(n.UNPACK_SKIP_PIXELS),Me=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let Ae=0,fe=ce.length;Ae<fe;Ae++){const ue=ce[Ae],Ge=Math.floor(ue.start/4),qe=Math.ceil(ue.count/4),ot=Ge%g.width,D=Math.floor(Ge/g.width),de=qe,Q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,ot),t.pixelStorei(n.UNPACK_SKIP_ROWS,D),t.texSubImage2D(n.TEXTURE_2D,0,ot,D,de,Q,V,ne,g.data)}b.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,K),t.pixelStorei(n.UNPACK_SKIP_PIXELS,ie),t.pixelStorei(n.UNPACK_SKIP_ROWS,Me)}}function Be(b,g,V){let ne=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(ne=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(ne=n.TEXTURE_3D);const ae=ee(b,g),ce=g.source;t.bindTexture(ne,b.__webglTexture,n.TEXTURE0+V);const me=i.get(ce);if(ce.version!==me.__version||ae===!0){if(t.activeTexture(n.TEXTURE0+V),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const Q=it.getPrimaries(it.workingColorSpace),Ee=g.colorSpace===ei?null:it.getPrimaries(g.colorSpace),he=g.colorSpace===ei||Q===Ee?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment);let ie=m(g.image,!1,r.maxTextureSize);ie=ge(g,ie);const Me=s.convert(g.format,g.colorSpace),Ae=s.convert(g.type);let fe=T(g.internalFormat,Me,Ae,g.normalized,g.colorSpace,g.isVideoTexture);Ie(ne,g);let ue;const Ge=g.mipmaps,qe=g.isVideoTexture!==!0,ot=me.__version===void 0||ae===!0,D=ce.dataReady,de=M(g,ie);if(g.isDepthTexture)fe=P(g.format===xi,g.type),ot&&(qe?t.texStorage2D(n.TEXTURE_2D,1,fe,ie.width,ie.height):t.texImage2D(n.TEXTURE_2D,0,fe,ie.width,ie.height,0,Me,Ae,null));else if(g.isDataTexture)if(Ge.length>0){qe&&ot&&t.texStorage2D(n.TEXTURE_2D,de,fe,Ge[0].width,Ge[0].height);for(let Q=0,Ee=Ge.length;Q<Ee;Q++)ue=Ge[Q],qe?D&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ue.width,ue.height,Me,Ae,ue.data):t.texImage2D(n.TEXTURE_2D,Q,fe,ue.width,ue.height,0,Me,Ae,ue.data);g.generateMipmaps=!1}else qe?(ot&&t.texStorage2D(n.TEXTURE_2D,de,fe,ie.width,ie.height),D&&le(g,ie,Me,Ae)):t.texImage2D(n.TEXTURE_2D,0,fe,ie.width,ie.height,0,Me,Ae,ie.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){qe&&ot&&t.texStorage3D(n.TEXTURE_2D_ARRAY,de,fe,Ge[0].width,Ge[0].height,ie.depth);for(let Q=0,Ee=Ge.length;Q<Ee;Q++)if(ue=Ge[Q],g.format!==pn)if(Me!==null)if(qe){if(D)if(g.layerUpdates.size>0){const he=Ql(ue.width,ue.height,g.format,g.type);for(const se of g.layerUpdates){const Ne=ue.data.subarray(se*he/ue.data.BYTES_PER_ELEMENT,(se+1)*he/ue.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,se,ue.width,ue.height,1,Me,Ne)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ue.width,ue.height,ie.depth,Me,ue.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Q,fe,ue.width,ue.height,ie.depth,0,ue.data,0,0);else ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else qe?D&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ue.width,ue.height,ie.depth,Me,Ae,ue.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Q,fe,ue.width,ue.height,ie.depth,0,Me,Ae,ue.data)}else{qe&&ot&&t.texStorage2D(n.TEXTURE_2D,de,fe,Ge[0].width,Ge[0].height);for(let Q=0,Ee=Ge.length;Q<Ee;Q++)ue=Ge[Q],g.format!==pn?Me!==null?qe?D&&t.compressedTexSubImage2D(n.TEXTURE_2D,Q,0,0,ue.width,ue.height,Me,ue.data):t.compressedTexImage2D(n.TEXTURE_2D,Q,fe,ue.width,ue.height,0,ue.data):ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qe?D&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ue.width,ue.height,Me,Ae,ue.data):t.texImage2D(n.TEXTURE_2D,Q,fe,ue.width,ue.height,0,Me,Ae,ue.data)}else if(g.isDataArrayTexture)if(qe){if(ot&&t.texStorage3D(n.TEXTURE_2D_ARRAY,de,fe,ie.width,ie.height,ie.depth),D)if(g.layerUpdates.size>0){const Q=Ql(ie.width,ie.height,g.format,g.type);for(const Ee of g.layerUpdates){const he=ie.data.subarray(Ee*Q/ie.data.BYTES_PER_ELEMENT,(Ee+1)*Q/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Ee,ie.width,ie.height,1,Me,Ae,he)}g.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,Me,Ae,ie.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,fe,ie.width,ie.height,ie.depth,0,Me,Ae,ie.data);else if(g.isData3DTexture)qe?(ot&&t.texStorage3D(n.TEXTURE_3D,de,fe,ie.width,ie.height,ie.depth),D&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,Me,Ae,ie.data)):t.texImage3D(n.TEXTURE_3D,0,fe,ie.width,ie.height,ie.depth,0,Me,Ae,ie.data);else if(g.isFramebufferTexture){if(ot)if(qe)t.texStorage2D(n.TEXTURE_2D,de,fe,ie.width,ie.height);else{let Q=ie.width,Ee=ie.height;for(let he=0;he<de;he++)t.texImage2D(n.TEXTURE_2D,he,fe,Q,Ee,0,Me,Ae,null),Q>>=1,Ee>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in n){const Q=n.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ie.parentNode!==Q){Q.appendChild(ie),f.add(g),Q.onpaint=We=>{const Tt=We.changedElements;for(const pt of f)Tt.includes(pt.image)&&(pt.needsUpdate=!0)},Q.requestPaint();return}const Ee=0,he=n.RGBA,se=n.RGBA,Ne=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,Ee,he,se,Ne,ie),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Ge.length>0){if(qe&&ot){const Q=At(Ge[0]);t.texStorage2D(n.TEXTURE_2D,de,fe,Q.width,Q.height)}for(let Q=0,Ee=Ge.length;Q<Ee;Q++)ue=Ge[Q],qe?D&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,Me,Ae,ue):t.texImage2D(n.TEXTURE_2D,Q,fe,Me,Ae,ue);g.generateMipmaps=!1}else if(qe){if(ot){const Q=At(ie);t.texStorage2D(n.TEXTURE_2D,de,fe,Q.width,Q.height)}D&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Me,Ae,ie)}else t.texImage2D(n.TEXTURE_2D,0,fe,Me,Ae,ie);h(g)&&E(ne),me.__version=ce.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function ze(b,g,V){if(g.image.length!==6)return;const ne=ee(b,g),ae=g.source;t.bindTexture(n.TEXTURE_CUBE_MAP,b.__webglTexture,n.TEXTURE0+V);const ce=i.get(ae);if(ae.version!==ce.__version||ne===!0){t.activeTexture(n.TEXTURE0+V);const me=it.getPrimaries(it.workingColorSpace),K=g.colorSpace===ei?null:it.getPrimaries(g.colorSpace),ie=g.colorSpace===ei||me===K?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ie);const Me=g.isCompressedTexture||g.image[0].isCompressedTexture,Ae=g.image[0]&&g.image[0].isDataTexture,fe=[];for(let se=0;se<6;se++)!Me&&!Ae?fe[se]=m(g.image[se],!0,r.maxCubemapSize):fe[se]=Ae?g.image[se].image:g.image[se],fe[se]=ge(g,fe[se]);const ue=fe[0],Ge=s.convert(g.format,g.colorSpace),qe=s.convert(g.type),ot=T(g.internalFormat,Ge,qe,g.normalized,g.colorSpace),D=g.isVideoTexture!==!0,de=ce.__version===void 0||ne===!0,Q=ae.dataReady;let Ee=M(g,ue);Ie(n.TEXTURE_CUBE_MAP,g);let he;if(Me){D&&de&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Ee,ot,ue.width,ue.height);for(let se=0;se<6;se++){he=fe[se].mipmaps;for(let Ne=0;Ne<he.length;Ne++){const We=he[Ne];g.format!==pn?Ge!==null?D?Q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,0,0,We.width,We.height,Ge,We.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,ot,We.width,We.height,0,We.data):ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,0,0,We.width,We.height,Ge,qe,We.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne,ot,We.width,We.height,0,Ge,qe,We.data)}}}else{if(he=g.mipmaps,D&&de){he.length>0&&Ee++;const se=At(fe[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Ee,ot,se.width,se.height)}for(let se=0;se<6;se++)if(Ae){D?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,fe[se].width,fe[se].height,Ge,qe,fe[se].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,ot,fe[se].width,fe[se].height,0,Ge,qe,fe[se].data);for(let Ne=0;Ne<he.length;Ne++){const Tt=he[Ne].image[se].image;D?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,0,0,Tt.width,Tt.height,Ge,qe,Tt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,ot,Tt.width,Tt.height,0,Ge,qe,Tt.data)}}else{D?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,Ge,qe,fe[se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,ot,Ge,qe,fe[se]);for(let Ne=0;Ne<he.length;Ne++){const We=he[Ne];D?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,0,0,Ge,qe,We.image[se]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ne+1,ot,Ge,qe,We.image[se])}}}h(g)&&E(n.TEXTURE_CUBE_MAP),ce.__version=ae.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function Oe(b,g,V,ne,ae,ce){const me=s.convert(V.format,V.colorSpace),K=s.convert(V.type),ie=T(V.internalFormat,me,K,V.normalized,V.colorSpace),Me=i.get(g),Ae=i.get(V);if(Ae.__renderTarget=g,!Me.__hasExternalTextures){const fe=Math.max(1,g.width>>ce),ue=Math.max(1,g.height>>ce);ae===n.TEXTURE_3D||ae===n.TEXTURE_2D_ARRAY?t.texImage3D(ae,ce,ie,fe,ue,g.depth,0,me,K,null):t.texImage2D(ae,ce,ie,fe,ue,0,me,K,null)}t.bindFramebuffer(n.FRAMEBUFFER,b),tt(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ne,ae,Ae.__webglTexture,0,Pt(g)):(ae===n.TEXTURE_2D||ae>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ae<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ne,ae,Ae.__webglTexture,ce),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ct(b,g,V){if(n.bindRenderbuffer(n.RENDERBUFFER,b),g.depthBuffer){const ne=g.depthTexture,ae=ne&&ne.isDepthTexture?ne.type:null,ce=P(g.stencilBuffer,ae),me=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;tt(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Pt(g),ce,g.width,g.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,Pt(g),ce,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,ce,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,me,n.RENDERBUFFER,b)}else{const ne=g.textures;for(let ae=0;ae<ne.length;ae++){const ce=ne[ae],me=s.convert(ce.format,ce.colorSpace),K=s.convert(ce.type),ie=T(ce.internalFormat,me,K,ce.normalized,ce.colorSpace);tt(g)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Pt(g),ie,g.width,g.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,Pt(g),ie,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,ie,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Qe(b,g,V){const ne=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,b),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const ae=i.get(g.depthTexture);if(ae.__renderTarget=g,(!ae.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),ne){if(ae.__webglInit===void 0&&(ae.__webglInit=!0,g.depthTexture.addEventListener("dispose",w)),ae.__webglTexture===void 0){ae.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ae.__webglTexture),Ie(n.TEXTURE_CUBE_MAP,g.depthTexture);const Me=s.convert(g.depthTexture.format),Ae=s.convert(g.depthTexture.type);let fe;g.depthTexture.format===Gn?fe=n.DEPTH_COMPONENT24:g.depthTexture.format===xi&&(fe=n.DEPTH24_STENCIL8);for(let ue=0;ue<6;ue++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,fe,g.width,g.height,0,Me,Ae,null)}}else k(g.depthTexture,0);const ce=ae.__webglTexture,me=Pt(g),K=ne?n.TEXTURE_CUBE_MAP_POSITIVE_X+V:n.TEXTURE_2D,ie=g.depthTexture.format===xi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===Gn)tt(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ie,K,ce,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,ie,K,ce,0);else if(g.depthTexture.format===xi)tt(g)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ie,K,ce,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,ie,K,ce,0);else throw new Error("Unknown depthTexture format")}function rt(b){const g=i.get(b),V=b.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==b.depthTexture){const ne=b.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),ne){const ae=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,ne.removeEventListener("dispose",ae)};ne.addEventListener("dispose",ae),g.__depthDisposeCallback=ae}g.__boundDepthTexture=ne}if(b.depthTexture&&!g.__autoAllocateDepthBuffer)if(V)for(let ne=0;ne<6;ne++)Qe(g.__webglFramebuffer[ne],b,ne);else{const ne=b.texture.mipmaps;ne&&ne.length>0?Qe(g.__webglFramebuffer[0],b,0):Qe(g.__webglFramebuffer,b,0)}else if(V){g.__webglDepthbuffer=[];for(let ne=0;ne<6;ne++)if(t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[ne]),g.__webglDepthbuffer[ne]===void 0)g.__webglDepthbuffer[ne]=n.createRenderbuffer(),ct(g.__webglDepthbuffer[ne],b,!1);else{const ae=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=g.__webglDepthbuffer[ne];n.bindRenderbuffer(n.RENDERBUFFER,ce),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,ce)}}else{const ne=b.texture.mipmaps;if(ne&&ne.length>0?t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),ct(g.__webglDepthbuffer,b,!1);else{const ae=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ce),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,ce)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function dt(b,g,V){const ne=i.get(b);g!==void 0&&Oe(ne.__webglFramebuffer,b,b.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),V!==void 0&&rt(b)}function Xe(b){const g=b.texture,V=i.get(b),ne=i.get(g);b.addEventListener("dispose",_);const ae=b.textures,ce=b.isWebGLCubeRenderTarget===!0,me=ae.length>1;if(me||(ne.__webglTexture===void 0&&(ne.__webglTexture=n.createTexture()),ne.__version=g.version,a.memory.textures++),ce){V.__webglFramebuffer=[];for(let K=0;K<6;K++)if(g.mipmaps&&g.mipmaps.length>0){V.__webglFramebuffer[K]=[];for(let ie=0;ie<g.mipmaps.length;ie++)V.__webglFramebuffer[K][ie]=n.createFramebuffer()}else V.__webglFramebuffer[K]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){V.__webglFramebuffer=[];for(let K=0;K<g.mipmaps.length;K++)V.__webglFramebuffer[K]=n.createFramebuffer()}else V.__webglFramebuffer=n.createFramebuffer();if(me)for(let K=0,ie=ae.length;K<ie;K++){const Me=i.get(ae[K]);Me.__webglTexture===void 0&&(Me.__webglTexture=n.createTexture(),a.memory.textures++)}if(b.samples>0&&tt(b)===!1){V.__webglMultisampledFramebuffer=n.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let K=0;K<ae.length;K++){const ie=ae[K];V.__webglColorRenderbuffer[K]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,V.__webglColorRenderbuffer[K]);const Me=s.convert(ie.format,ie.colorSpace),Ae=s.convert(ie.type),fe=T(ie.internalFormat,Me,Ae,ie.normalized,ie.colorSpace,b.isXRRenderTarget===!0),ue=Pt(b);n.renderbufferStorageMultisample(n.RENDERBUFFER,ue,fe,b.width,b.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+K,n.RENDERBUFFER,V.__webglColorRenderbuffer[K])}n.bindRenderbuffer(n.RENDERBUFFER,null),b.depthBuffer&&(V.__webglDepthRenderbuffer=n.createRenderbuffer(),ct(V.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ce){t.bindTexture(n.TEXTURE_CUBE_MAP,ne.__webglTexture),Ie(n.TEXTURE_CUBE_MAP,g);for(let K=0;K<6;K++)if(g.mipmaps&&g.mipmaps.length>0)for(let ie=0;ie<g.mipmaps.length;ie++)Oe(V.__webglFramebuffer[K][ie],b,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ie);else Oe(V.__webglFramebuffer[K],b,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);h(g)&&E(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(me){for(let K=0,ie=ae.length;K<ie;K++){const Me=ae[K],Ae=i.get(Me);let fe=n.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(fe=b.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(fe,Ae.__webglTexture),Ie(fe,Me),Oe(V.__webglFramebuffer,b,Me,n.COLOR_ATTACHMENT0+K,fe,0),h(Me)&&E(fe)}t.unbindTexture()}else{let K=n.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(K=b.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(K,ne.__webglTexture),Ie(K,g),g.mipmaps&&g.mipmaps.length>0)for(let ie=0;ie<g.mipmaps.length;ie++)Oe(V.__webglFramebuffer[ie],b,g,n.COLOR_ATTACHMENT0,K,ie);else Oe(V.__webglFramebuffer,b,g,n.COLOR_ATTACHMENT0,K,0);h(g)&&E(K),t.unbindTexture()}b.depthBuffer&&rt(b)}function Ft(b){const g=b.textures;for(let V=0,ne=g.length;V<ne;V++){const ae=g[V];if(h(ae)){const ce=A(b),me=i.get(ae).__webglTexture;t.bindTexture(ce,me),E(ce),t.unbindTexture()}}}const Mt=[],jt=[];function I(b){if(b.samples>0){if(tt(b)===!1){const g=b.textures,V=b.width,ne=b.height;let ae=n.COLOR_BUFFER_BIT;const ce=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,me=i.get(b),K=g.length>1;if(K)for(let Me=0;Me<g.length;Me++)t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,me.__webglMultisampledFramebuffer);const ie=b.texture.mipmaps;ie&&ie.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer);for(let Me=0;Me<g.length;Me++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(ae|=n.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(ae|=n.STENCIL_BUFFER_BIT)),K){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,me.__webglColorRenderbuffer[Me]);const Ae=i.get(g[Me]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ae,0)}n.blitFramebuffer(0,0,V,ne,0,0,V,ne,ae,n.NEAREST),l===!0&&(Mt.length=0,jt.length=0,Mt.push(n.COLOR_ATTACHMENT0+Me),b.depthBuffer&&b.resolveDepthBuffer===!1&&(Mt.push(ce),jt.push(ce),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,jt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Mt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),K)for(let Me=0;Me<g.length;Me++){t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.RENDERBUFFER,me.__webglColorRenderbuffer[Me]);const Ae=i.get(g[Me]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Me,n.TEXTURE_2D,Ae,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&l){const g=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function Pt(b){return Math.min(r.maxSamples,b.samples)}function tt(b){const g=i.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function _t(b){const g=a.render.frame;d.get(b)!==g&&(d.set(b,g),b.update())}function ge(b,g){const V=b.colorSpace,ne=b.format,ae=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||V!==_s&&V!==ei&&(it.getTransfer(V)===ft?(ne!==pn||ae!==an)&&ke("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):at("WebGLTextures: Unsupported texture color space:",V)),g}function At(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(c.width=b.naturalWidth||b.width,c.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(c.width=b.displayWidth,c.height=b.displayHeight):(c.width=b.width,c.height=b.height),c}this.allocateTextureUnit=N,this.resetTextureUnits=$,this.getTextureUnits=Y,this.setTextureUnits=y,this.setTexture2D=k,this.setTexture2DArray=H,this.setTexture3D=J,this.setTextureCube=re,this.rebindTextures=dt,this.setupRenderTarget=Xe,this.updateRenderTargetMipmap=Ft,this.updateMultisampleRenderTarget=I,this.setupDepthRenderbuffer=rt,this.setupFrameBufferTexture=Oe,this.useMultisampledRTT=tt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function fM(n,e){function t(i,r=ei){let s;const a=it.getTransfer(r);if(i===an)return n.UNSIGNED_BYTE;if(i===ko)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Vo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===cu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===uu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===ou)return n.BYTE;if(i===lu)return n.SHORT;if(i===Sr)return n.UNSIGNED_SHORT;if(i===Oo)return n.INT;if(i===Tn)return n.UNSIGNED_INT;if(i===hn)return n.FLOAT;if(i===zn)return n.HALF_FLOAT;if(i===du)return n.ALPHA;if(i===fu)return n.RGB;if(i===pn)return n.RGBA;if(i===Gn)return n.DEPTH_COMPONENT;if(i===xi)return n.DEPTH_STENCIL;if(i===zo)return n.RED;if(i===Go)return n.RED_INTEGER;if(i===Mi)return n.RG;if(i===Ho)return n.RG_INTEGER;if(i===Wo)return n.RGBA_INTEGER;if(i===ls||i===cs||i===us||i===ds)if(a===ft)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ls)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===cs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===us)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ds)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ls)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===cs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===us)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ds)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ha||i===Wa||i===$a||i===Xa)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Ha)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Wa)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===$a)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xa)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===qa||i===Ya||i===Ka||i===Za||i===ja||i===xs||i===Ja)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===qa||i===Ya)return a===ft?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Ka)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Za)return s.COMPRESSED_R11_EAC;if(i===ja)return s.COMPRESSED_SIGNED_R11_EAC;if(i===xs)return s.COMPRESSED_RG11_EAC;if(i===Ja)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Qa||i===eo||i===to||i===no||i===io||i===ro||i===so||i===ao||i===oo||i===lo||i===co||i===uo||i===fo||i===ho)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Qa)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===eo)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===to)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===no)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===io)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ro)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===so)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ao)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===oo)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===lo)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===co)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===uo)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===fo)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===ho)return a===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===po||i===mo||i===xo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===po)return a===ft?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===mo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===xo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===go||i===_o||i===gs||i===vo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===go)return s.COMPRESSED_RED_RGTC1_EXT;if(i===_o)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===gs)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Mr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const hM=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,pM=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class mM{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new bu(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Cn({vertexShader:hM,fragmentShader:pM,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ut(new er(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class xM extends yi{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,f=null,u=null,p=null,x=null;const S=typeof XRWebGLBinding<"u",m=new mM,h={},E=t.getContextAttributes();let A=null,T=null;const P=[],M=[],w=new ut;let _=null;const C=new sn;C.viewport=new Rt;const L=new sn;L.viewport=new Rt;const R=[C,L],O=new Tx;let $=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(ee){let pe=P[ee];return pe===void 0&&(pe=new Js,P[ee]=pe),pe.getTargetRaySpace()},this.getControllerGrip=function(ee){let pe=P[ee];return pe===void 0&&(pe=new Js,P[ee]=pe),pe.getGripSpace()},this.getHand=function(ee){let pe=P[ee];return pe===void 0&&(pe=new Js,P[ee]=pe),pe.getHandSpace()};function y(ee){const pe=M.indexOf(ee.inputSource);if(pe===-1)return;const le=P[pe];le!==void 0&&(le.update(ee.inputSource,ee.frame,c||a),le.dispatchEvent({type:ee.type,data:ee.inputSource}))}function N(){r.removeEventListener("select",y),r.removeEventListener("selectstart",y),r.removeEventListener("selectend",y),r.removeEventListener("squeeze",y),r.removeEventListener("squeezestart",y),r.removeEventListener("squeezeend",y),r.removeEventListener("end",N),r.removeEventListener("inputsourceschange",F);for(let ee=0;ee<P.length;ee++){const pe=M[ee];pe!==null&&(M[ee]=null,P[ee].disconnect(pe))}$=null,Y=null,m.reset();for(const ee in h)delete h[ee];e.setRenderTarget(A),p=null,u=null,f=null,r=null,T=null,Ie.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(w.width,w.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(ee){s=ee,i.isPresenting===!0&&ke("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(ee){o=ee,i.isPresenting===!0&&ke("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(ee){c=ee},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function(ee){if(r=ee,r!==null){if(A=e.getRenderTarget(),r.addEventListener("select",y),r.addEventListener("selectstart",y),r.addEventListener("selectend",y),r.addEventListener("squeeze",y),r.addEventListener("squeezestart",y),r.addEventListener("squeezeend",y),r.addEventListener("end",N),r.addEventListener("inputsourceschange",F),E.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(w),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let le=null,Be=null,ze=null;E.depth&&(ze=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,le=E.stencil?xi:Gn,Be=E.stencil?Mr:Tn);const Oe={colorFormat:t.RGBA8,depthFormat:ze,scaleFactor:s};f=this.getBinding(),u=f.createProjectionLayer(Oe),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),T=new yn(u.textureWidth,u.textureHeight,{format:pn,type:an,depthTexture:new Qi(u.textureWidth,u.textureHeight,Be,void 0,void 0,void 0,void 0,void 0,void 0,le),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const le={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,le),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),T=new yn(p.framebufferWidth,p.framebufferHeight,{format:pn,type:an,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Ie.setContext(r),Ie.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function F(ee){for(let pe=0;pe<ee.removed.length;pe++){const le=ee.removed[pe],Be=M.indexOf(le);Be>=0&&(M[Be]=null,P[Be].disconnect(le))}for(let pe=0;pe<ee.added.length;pe++){const le=ee.added[pe];let Be=M.indexOf(le);if(Be===-1){for(let Oe=0;Oe<P.length;Oe++)if(Oe>=M.length){M.push(le),Be=Oe;break}else if(M[Oe]===null){M[Oe]=le,Be=Oe;break}if(Be===-1)break}const ze=P[Be];ze&&ze.connect(le)}}const k=new z,H=new z;function J(ee,pe,le){k.setFromMatrixPosition(pe.matrixWorld),H.setFromMatrixPosition(le.matrixWorld);const Be=k.distanceTo(H),ze=pe.projectionMatrix.elements,Oe=le.projectionMatrix.elements,ct=ze[14]/(ze[10]-1),Qe=ze[14]/(ze[10]+1),rt=(ze[9]+1)/ze[5],dt=(ze[9]-1)/ze[5],Xe=(ze[8]-1)/ze[0],Ft=(Oe[8]+1)/Oe[0],Mt=ct*Xe,jt=ct*Ft,I=Be/(-Xe+Ft),Pt=I*-Xe;if(pe.matrixWorld.decompose(ee.position,ee.quaternion,ee.scale),ee.translateX(Pt),ee.translateZ(I),ee.matrixWorld.compose(ee.position,ee.quaternion,ee.scale),ee.matrixWorldInverse.copy(ee.matrixWorld).invert(),ze[10]===-1)ee.projectionMatrix.copy(pe.projectionMatrix),ee.projectionMatrixInverse.copy(pe.projectionMatrixInverse);else{const tt=ct+I,_t=Qe+I,ge=Mt-Pt,At=jt+(Be-Pt),b=rt*Qe/_t*tt,g=dt*Qe/_t*tt;ee.projectionMatrix.makePerspective(ge,At,b,g,tt,_t),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert()}}function re(ee,pe){pe===null?ee.matrixWorld.copy(ee.matrix):ee.matrixWorld.multiplyMatrices(pe.matrixWorld,ee.matrix),ee.matrixWorldInverse.copy(ee.matrixWorld).invert()}this.updateCamera=function(ee){if(r===null)return;let pe=ee.near,le=ee.far;m.texture!==null&&(m.depthNear>0&&(pe=m.depthNear),m.depthFar>0&&(le=m.depthFar)),O.near=L.near=C.near=pe,O.far=L.far=C.far=le,($!==O.near||Y!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),$=O.near,Y=O.far),O.layers.mask=ee.layers.mask|6,C.layers.mask=O.layers.mask&-5,L.layers.mask=O.layers.mask&-3;const Be=ee.parent,ze=O.cameras;re(O,Be);for(let Oe=0;Oe<ze.length;Oe++)re(ze[Oe],Be);ze.length===2?J(O,C,L):O.projectionMatrix.copy(C.projectionMatrix),xe(ee,O,Be)};function xe(ee,pe,le){le===null?ee.matrix.copy(pe.matrixWorld):(ee.matrix.copy(le.matrixWorld),ee.matrix.invert(),ee.matrix.multiply(pe.matrixWorld)),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.updateMatrixWorld(!0),ee.projectionMatrix.copy(pe.projectionMatrix),ee.projectionMatrixInverse.copy(pe.projectionMatrixInverse),ee.isPerspectiveCamera&&(ee.fov=Er*2*Math.atan(1/ee.projectionMatrix.elements[5]),ee.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(ee){l=ee,u!==null&&(u.fixedFoveation=ee),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=ee)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function(ee){return h[ee]};let Re=null;function Je(ee,pe){if(d=pe.getViewerPose(c||a),x=pe,d!==null){const le=d.views;p!==null&&(e.setRenderTargetFramebuffer(T,p.framebuffer),e.setRenderTarget(T));let Be=!1;le.length!==O.cameras.length&&(O.cameras.length=0,Be=!0);for(let Qe=0;Qe<le.length;Qe++){const rt=le[Qe];let dt=null;if(p!==null)dt=p.getViewport(rt);else{const Ft=f.getViewSubImage(u,rt);dt=Ft.viewport,Qe===0&&(e.setRenderTargetTextures(T,Ft.colorTexture,Ft.depthStencilTexture),e.setRenderTarget(T))}let Xe=R[Qe];Xe===void 0&&(Xe=new sn,Xe.layers.enable(Qe),Xe.viewport=new Rt,R[Qe]=Xe),Xe.matrix.fromArray(rt.transform.matrix),Xe.matrix.decompose(Xe.position,Xe.quaternion,Xe.scale),Xe.projectionMatrix.fromArray(rt.projectionMatrix),Xe.projectionMatrixInverse.copy(Xe.projectionMatrix).invert(),Xe.viewport.set(dt.x,dt.y,dt.width,dt.height),Qe===0&&(O.matrix.copy(Xe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Be===!0&&O.cameras.push(Xe)}const ze=r.enabledFeatures;if(ze&&ze.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){f=i.getBinding();const Qe=f.getDepthInformation(le[0]);Qe&&Qe.isValid&&Qe.texture&&m.init(Qe,r.renderState)}if(ze&&ze.includes("camera-access")&&S){e.state.unbindTexture(),f=i.getBinding();for(let Qe=0;Qe<le.length;Qe++){const rt=le[Qe].camera;if(rt){let dt=h[rt];dt||(dt=new bu,h[rt]=dt);const Xe=f.getCameraImage(rt);dt.sourceTexture=Xe}}}}for(let le=0;le<P.length;le++){const Be=M[le],ze=P[le];Be!==null&&ze!==void 0&&ze.update(Be,pe,c||a)}Re&&Re(ee,pe),pe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:pe}),x=null}const Ie=new Cu;Ie.setAnimationLoop(Je),this.setAnimationLoop=function(ee){Re=ee},this.dispose=function(){}}}const gM=new Et,Du=new He;Du.set(-1,0,0,0,1,0,0,0,1);function _M(n,e){function t(m,h){m.matrixAutoUpdate===!0&&m.updateMatrix(),h.value.copy(m.matrix)}function i(m,h){h.color.getRGB(m.fogColor.value,Au(n)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function r(m,h,E,A,T){h.isNodeMaterial?h.uniformsNeedUpdate=!1:h.isMeshBasicMaterial?s(m,h):h.isMeshLambertMaterial?(s(m,h),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)):h.isMeshToonMaterial?(s(m,h),f(m,h)):h.isMeshPhongMaterial?(s(m,h),d(m,h),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)):h.isMeshStandardMaterial?(s(m,h),u(m,h),h.isMeshPhysicalMaterial&&p(m,h,T)):h.isMeshMatcapMaterial?(s(m,h),x(m,h)):h.isMeshDepthMaterial?s(m,h):h.isMeshDistanceMaterial?(s(m,h),S(m,h)):h.isMeshNormalMaterial?s(m,h):h.isLineBasicMaterial?(a(m,h),h.isLineDashedMaterial&&o(m,h)):h.isPointsMaterial?l(m,h,E,A):h.isSpriteMaterial?c(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function s(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,t(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===Zt&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,t(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===Zt&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,t(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,t(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);const E=e.get(h),A=E.envMap,T=E.envMapRotation;A&&(m.envMap.value=A,m.envMapRotation.value.setFromMatrix4(gM.makeRotationFromEuler(T)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Du),m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap&&(m.lightMap.value=h.lightMap,m.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,m.lightMapTransform)),h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,m.aoMapTransform))}function a(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform))}function o(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function l(m,h,E,A){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*E,m.scale.value=A*.5,h.map&&(m.map.value=h.map,t(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function c(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function d(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function f(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function u(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,m.roughnessMapTransform)),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function p(m,h,E){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Zt&&m.clearcoatNormalScale.value.negate())),h.dispersion>0&&(m.dispersion.value=h.dispersion),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,h){h.matcap&&(m.matcap.value=h.matcap)}function S(m,h){const E=e.get(h).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function vM(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(E,A){const T=A.program;i.uniformBlockBinding(E,T)}function c(E,A){let T=r[E.id];T===void 0&&(x(E),T=d(E),r[E.id]=T,E.addEventListener("dispose",m));const P=A.program;i.updateUBOMapping(E,P);const M=e.render.frame;s[E.id]!==M&&(u(E),s[E.id]=M)}function d(E){const A=f();E.__bindingPointIndex=A;const T=n.createBuffer(),P=E.__size,M=E.usage;return n.bindBuffer(n.UNIFORM_BUFFER,T),n.bufferData(n.UNIFORM_BUFFER,P,M),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,A,T),T}function f(){for(let E=0;E<o;E++)if(a.indexOf(E)===-1)return a.push(E),E;return at("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(E){const A=r[E.id],T=E.uniforms,P=E.__cache;n.bindBuffer(n.UNIFORM_BUFFER,A);for(let M=0,w=T.length;M<w;M++){const _=Array.isArray(T[M])?T[M]:[T[M]];for(let C=0,L=_.length;C<L;C++){const R=_[C];if(p(R,M,C,P)===!0){const O=R.__offset,$=Array.isArray(R.value)?R.value:[R.value];let Y=0;for(let y=0;y<$.length;y++){const N=$[y],F=S(N);typeof N=="number"||typeof N=="boolean"?(R.__data[0]=N,n.bufferSubData(n.UNIFORM_BUFFER,O+Y,R.__data)):N.isMatrix3?(R.__data[0]=N.elements[0],R.__data[1]=N.elements[1],R.__data[2]=N.elements[2],R.__data[3]=0,R.__data[4]=N.elements[3],R.__data[5]=N.elements[4],R.__data[6]=N.elements[5],R.__data[7]=0,R.__data[8]=N.elements[6],R.__data[9]=N.elements[7],R.__data[10]=N.elements[8],R.__data[11]=0):ArrayBuffer.isView(N)?R.__data.set(new N.constructor(N.buffer,N.byteOffset,R.__data.length)):(N.toArray(R.__data,Y),Y+=F.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(E,A,T,P){const M=E.value,w=A+"_"+T;if(P[w]===void 0)return typeof M=="number"||typeof M=="boolean"?P[w]=M:ArrayBuffer.isView(M)?P[w]=M.slice():P[w]=M.clone(),!0;{const _=P[w];if(typeof M=="number"||typeof M=="boolean"){if(_!==M)return P[w]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(_.equals(M)===!1)return _.copy(M),!0}}return!1}function x(E){const A=E.uniforms;let T=0;const P=16;for(let w=0,_=A.length;w<_;w++){const C=Array.isArray(A[w])?A[w]:[A[w]];for(let L=0,R=C.length;L<R;L++){const O=C[L],$=Array.isArray(O.value)?O.value:[O.value];for(let Y=0,y=$.length;Y<y;Y++){const N=$[Y],F=S(N),k=T%P,H=k%F.boundary,J=k+H;T+=H,J!==0&&P-J<F.storage&&(T+=P-J),O.__data=new Float32Array(F.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=T,T+=F.storage}}}const M=T%P;return M>0&&(T+=P-M),E.__size=T,E.__cache={},this}function S(E){const A={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(A.boundary=4,A.storage=4):E.isVector2?(A.boundary=8,A.storage=8):E.isVector3||E.isColor?(A.boundary=16,A.storage=12):E.isVector4?(A.boundary=16,A.storage=16):E.isMatrix3?(A.boundary=48,A.storage=48):E.isMatrix4?(A.boundary=64,A.storage=64):E.isTexture?ke("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(E)?(A.boundary=16,A.storage=E.byteLength):ke("WebGLRenderer: Unsupported uniform value type.",E),A}function m(E){const A=E.target;A.removeEventListener("dispose",m);const T=a.indexOf(A.__bindingPointIndex);a.splice(T,1),n.deleteBuffer(r[A.id]),delete r[A.id],delete s[A.id]}function h(){for(const E in r)n.deleteBuffer(r[E]);a=[],r={},s={}}return{bind:l,update:c,dispose:h}}const SM=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let vn=null;function MM(){return vn===null&&(vn=new Su(SM,16,16,Mi,zn),vn.name="DFG_LUT",vn.minFilter=Gt,vn.magFilter=Gt,vn.wrapS=Bn,vn.wrapT=Bn,vn.generateMipmaps=!1,vn.needsUpdate=!0),vn}class EM{constructor(e={}){const{canvas:t=T0(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:p=an}=e;this.isWebGLRenderer=!0;let x;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=i.getContextAttributes().alpha}else x=a;const S=p,m=new Set([Wo,Ho,Go]),h=new Set([an,Tn,Sr,Mr,ko,Vo]),E=new Uint32Array(4),A=new Int32Array(4),T=new z;let P=null,M=null;const w=[],_=[];let C=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=An,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const L=this;let R=!1,O=null;this._outputColorSpace=rn;let $=0,Y=0,y=null,N=-1,F=null;const k=new Rt,H=new Rt;let J=null;const re=new Ke(0);let xe=0,Re=t.width,Je=t.height,Ie=1,ee=null,pe=null;const le=new Rt(0,0,Re,Je),Be=new Rt(0,0,Re,Je);let ze=!1;const Oe=new Mu;let ct=!1,Qe=!1;const rt=new Et,dt=new z,Xe=new Rt,Ft={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Mt=!1;function jt(){return y===null?Ie:1}let I=i;function Pt(v,U){return t.getContext(v,U)}try{const v={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Bo}`),t.addEventListener("webglcontextlost",se,!1),t.addEventListener("webglcontextrestored",Ne,!1),t.addEventListener("webglcontextcreationerror",We,!1),I===null){const U="webgl2";if(I=Pt(U,v),I===null)throw Pt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw at("WebGLRenderer: "+v.message),v}let tt,_t,ge,At,b,g,V,ne,ae,ce,me,K,ie,Me,Ae,fe,ue,Ge,qe,ot,D,de,Q;function Ee(){tt=new Mv(I),tt.init(),D=new fM(I,tt),_t=new hv(I,tt,e,D),ge=new uM(I,tt),_t.reversedDepthBuffer&&u&&ge.buffers.depth.setReversed(!0),At=new Av(I),b=new ZS,g=new dM(I,tt,ge,b,_t,D,At),V=new Sv(L),ne=new wx(I),de=new dv(I,ne),ae=new Ev(I,ne,At,de),ce=new Tv(I,ae,ne,de,At),Ge=new yv(I,_t,g),Ae=new pv(b),me=new KS(L,V,tt,_t,de,Ae),K=new _M(L,b),ie=new JS,Me=new rM(tt),ue=new uv(L,V,ge,ce,x,l),fe=new cM(L,ce,_t),Q=new vM(I,At,_t,ge),qe=new fv(I,tt,At),ot=new bv(I,tt,At),At.programs=me.programs,L.capabilities=_t,L.extensions=tt,L.properties=b,L.renderLists=ie,L.shadowMap=fe,L.state=ge,L.info=At}Ee(),S!==an&&(C=new wv(S,t.width,t.height,r,s));const he=new xM(L,I);this.xr=he,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const v=tt.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=tt.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return Ie},this.setPixelRatio=function(v){v!==void 0&&(Ie=v,this.setSize(Re,Je,!1))},this.getSize=function(v){return v.set(Re,Je)},this.setSize=function(v,U,q=!0){if(he.isPresenting){ke("WebGLRenderer: Can't change size while VR device is presenting.");return}Re=v,Je=U,t.width=Math.floor(v*Ie),t.height=Math.floor(U*Ie),q===!0&&(t.style.width=v+"px",t.style.height=U+"px"),C!==null&&C.setSize(t.width,t.height),this.setViewport(0,0,v,U)},this.getDrawingBufferSize=function(v){return v.set(Re*Ie,Je*Ie).floor()},this.setDrawingBufferSize=function(v,U,q){Re=v,Je=U,Ie=q,t.width=Math.floor(v*q),t.height=Math.floor(U*q),this.setViewport(0,0,v,U)},this.setEffects=function(v){if(S===an){at("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let U=0;U<v.length;U++)if(v[U].isOutputPass===!0){ke("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}C.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(k)},this.getViewport=function(v){return v.copy(le)},this.setViewport=function(v,U,q,G){v.isVector4?le.set(v.x,v.y,v.z,v.w):le.set(v,U,q,G),ge.viewport(k.copy(le).multiplyScalar(Ie).round())},this.getScissor=function(v){return v.copy(Be)},this.setScissor=function(v,U,q,G){v.isVector4?Be.set(v.x,v.y,v.z,v.w):Be.set(v,U,q,G),ge.scissor(H.copy(Be).multiplyScalar(Ie).round())},this.getScissorTest=function(){return ze},this.setScissorTest=function(v){ge.setScissorTest(ze=v)},this.setOpaqueSort=function(v){ee=v},this.setTransparentSort=function(v){pe=v},this.getClearColor=function(v){return v.copy(ue.getClearColor())},this.setClearColor=function(){ue.setClearColor(...arguments)},this.getClearAlpha=function(){return ue.getClearAlpha()},this.setClearAlpha=function(){ue.setClearAlpha(...arguments)},this.clear=function(v=!0,U=!0,q=!0){let G=0;if(v){let W=!1;if(y!==null){const Se=y.texture.format;W=m.has(Se)}if(W){const Se=y.texture.type,ye=h.has(Se),ve=ue.getClearColor(),we=ue.getClearAlpha(),Fe=ve.r,$e=ve.g,Ze=ve.b;ye?(E[0]=Fe,E[1]=$e,E[2]=Ze,E[3]=we,I.clearBufferuiv(I.COLOR,0,E)):(A[0]=Fe,A[1]=$e,A[2]=Ze,A[3]=we,I.clearBufferiv(I.COLOR,0,A))}else G|=I.COLOR_BUFFER_BIT}U&&(G|=I.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),q&&(G|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&I.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),O=v},this.dispose=function(){t.removeEventListener("webglcontextlost",se,!1),t.removeEventListener("webglcontextrestored",Ne,!1),t.removeEventListener("webglcontextcreationerror",We,!1),ue.dispose(),ie.dispose(),Me.dispose(),b.dispose(),V.dispose(),ce.dispose(),de.dispose(),Q.dispose(),me.dispose(),he.dispose(),he.removeEventListener("sessionstart",al),he.removeEventListener("sessionend",ol),si.stop()};function se(v){v.preventDefault(),yl("WebGLRenderer: Context Lost."),R=!0}function Ne(){yl("WebGLRenderer: Context Restored."),R=!1;const v=At.autoReset,U=fe.enabled,q=fe.autoUpdate,G=fe.needsUpdate,W=fe.type;Ee(),At.autoReset=v,fe.enabled=U,fe.autoUpdate=q,fe.needsUpdate=G,fe.type=W}function We(v){at("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Tt(v){const U=v.target;U.removeEventListener("dispose",Tt),pt(U)}function pt(v){Rn(v),b.remove(v)}function Rn(v){const U=b.get(v).programs;U!==void 0&&(U.forEach(function(q){me.releaseProgram(q)}),v.isShaderMaterial&&me.releaseShaderCache(v))}this.renderBufferDirect=function(v,U,q,G,W,Se){U===null&&(U=Ft);const ye=W.isMesh&&W.matrixWorld.determinant()<0,ve=Wu(v,U,q,G,W);ge.setMaterial(G,ye);let we=q.index,Fe=1;if(G.wireframe===!0){if(we=ae.getWireframeAttribute(q),we===void 0)return;Fe=2}const $e=q.drawRange,Ze=q.attributes.position;let Pe=$e.start*Fe,mt=($e.start+$e.count)*Fe;Se!==null&&(Pe=Math.max(Pe,Se.start*Fe),mt=Math.min(mt,(Se.start+Se.count)*Fe)),we!==null?(Pe=Math.max(Pe,0),mt=Math.min(mt,we.count)):Ze!=null&&(Pe=Math.max(Pe,0),mt=Math.min(mt,Ze.count));const Ct=mt-Pe;if(Ct<0||Ct===1/0)return;de.setup(W,G,ve,q,we);let yt,xt=qe;if(we!==null&&(yt=ne.get(we),xt=ot,xt.setIndex(yt)),W.isMesh)G.wireframe===!0?(ge.setLineWidth(G.wireframeLinewidth*jt()),xt.setMode(I.LINES)):xt.setMode(I.TRIANGLES);else if(W.isLine){let Ot=G.linewidth;Ot===void 0&&(Ot=1),ge.setLineWidth(Ot*jt()),W.isLineSegments?xt.setMode(I.LINES):W.isLineLoop?xt.setMode(I.LINE_LOOP):xt.setMode(I.LINE_STRIP)}else W.isPoints?xt.setMode(I.POINTS):W.isSprite&&xt.setMode(I.TRIANGLES);if(W.isBatchedMesh)if(tt.get("WEBGL_multi_draw"))xt.renderMultiDraw(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount);else{const Ot=W._multiDrawStarts,be=W._multiDrawCounts,Jt=W._multiDrawCount,st=we?ne.get(we).bytesPerElement:1,tn=b.get(G).currentProgram.getUniforms();for(let gn=0;gn<Jt;gn++)tn.setValue(I,"_gl_DrawID",gn),xt.render(Ot[gn]/st,be[gn])}else if(W.isInstancedMesh)xt.renderInstances(Pe,Ct,W.count);else if(q.isInstancedBufferGeometry){const Ot=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,be=Math.min(q.instanceCount,Ot);xt.renderInstances(Pe,Ct,be)}else xt.render(Pe,Ct)};function xn(v,U,q){v.transparent===!0&&v.side===Un&&v.forceSinglePass===!1?(v.side=Zt,v.needsUpdate=!0,wr(v,U,q),v.side=ri,v.needsUpdate=!0,wr(v,U,q),v.side=Un):wr(v,U,q)}this.compile=function(v,U,q=null){q===null&&(q=v),M=Me.get(q),M.init(U),_.push(M),q.traverseVisible(function(W){W.isLight&&W.layers.test(U.layers)&&(M.pushLight(W),W.castShadow&&M.pushShadow(W))}),v!==q&&v.traverseVisible(function(W){W.isLight&&W.layers.test(U.layers)&&(M.pushLight(W),W.castShadow&&M.pushShadow(W))}),M.setupLights();const G=new Set;return v.traverse(function(W){if(!(W.isMesh||W.isPoints||W.isLine||W.isSprite))return;const Se=W.material;if(Se)if(Array.isArray(Se))for(let ye=0;ye<Se.length;ye++){const ve=Se[ye];xn(ve,q,W),G.add(ve)}else xn(Se,q,W),G.add(Se)}),M=_.pop(),G},this.compileAsync=function(v,U,q=null){const G=this.compile(v,U,q);return new Promise(W=>{function Se(){if(G.forEach(function(ye){b.get(ye).currentProgram.isReady()&&G.delete(ye)}),G.size===0){W(v);return}setTimeout(Se,10)}tt.get("KHR_parallel_shader_compile")!==null?Se():setTimeout(Se,10)})};let zs=null;function Gu(v){zs&&zs(v)}function al(){si.stop()}function ol(){si.start()}const si=new Cu;si.setAnimationLoop(Gu),typeof self<"u"&&si.setContext(self),this.setAnimationLoop=function(v){zs=v,he.setAnimationLoop(v),v===null?si.stop():si.start()},he.addEventListener("sessionstart",al),he.addEventListener("sessionend",ol),this.render=function(v,U){if(U!==void 0&&U.isCamera!==!0){at("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;O!==null&&O.renderStart(v,U);const q=he.enabled===!0&&he.isPresenting===!0,G=C!==null&&(y===null||q)&&C.begin(L,y);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),he.enabled===!0&&he.isPresenting===!0&&(C===null||C.isCompositing()===!1)&&(he.cameraAutoUpdate===!0&&he.updateCamera(U),U=he.getCamera()),v.isScene===!0&&v.onBeforeRender(L,v,U,y),M=Me.get(v,_.length),M.init(U),M.state.textureUnits=g.getTextureUnits(),_.push(M),rt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),Oe.setFromProjectionMatrix(rt,Mn,U.reversedDepth),Qe=this.localClippingEnabled,ct=Ae.init(this.clippingPlanes,Qe),P=ie.get(v,w.length),P.init(),w.push(P),he.enabled===!0&&he.isPresenting===!0){const ye=L.xr.getDepthSensingMesh();ye!==null&&Gs(ye,U,-1/0,L.sortObjects)}Gs(v,U,0,L.sortObjects),P.finish(),L.sortObjects===!0&&P.sort(ee,pe),Mt=he.enabled===!1||he.isPresenting===!1||he.hasDepthSensing()===!1,Mt&&ue.addToRenderList(P,v),this.info.render.frame++,ct===!0&&Ae.beginShadows();const W=M.state.shadowsArray;if(fe.render(W,v,U),ct===!0&&Ae.endShadows(),this.info.autoReset===!0&&this.info.reset(),(G&&C.hasRenderPass())===!1){const ye=P.opaque,ve=P.transmissive;if(M.setupLights(),U.isArrayCamera){const we=U.cameras;if(ve.length>0)for(let Fe=0,$e=we.length;Fe<$e;Fe++){const Ze=we[Fe];cl(ye,ve,v,Ze)}Mt&&ue.render(v);for(let Fe=0,$e=we.length;Fe<$e;Fe++){const Ze=we[Fe];ll(P,v,Ze,Ze.viewport)}}else ve.length>0&&cl(ye,ve,v,U),Mt&&ue.render(v),ll(P,v,U)}y!==null&&Y===0&&(g.updateMultisampleRenderTarget(y),g.updateRenderTargetMipmap(y)),G&&C.end(L),v.isScene===!0&&v.onAfterRender(L,v,U),de.resetDefaultState(),N=-1,F=null,_.pop(),_.length>0?(M=_[_.length-1],g.setTextureUnits(M.state.textureUnits),ct===!0&&Ae.setGlobalState(L.clippingPlanes,M.state.camera)):M=null,w.pop(),w.length>0?P=w[w.length-1]:P=null,O!==null&&O.renderEnd()};function Gs(v,U,q,G){if(v.visible===!1)return;if(v.layers.test(U.layers)){if(v.isGroup)q=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(U);else if(v.isLightProbeGrid)M.pushLightProbeGrid(v);else if(v.isLight)M.pushLight(v),v.castShadow&&M.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Oe.intersectsSprite(v)){G&&Xe.setFromMatrixPosition(v.matrixWorld).applyMatrix4(rt);const ye=ce.update(v),ve=v.material;ve.visible&&P.push(v,ye,ve,q,Xe.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Oe.intersectsObject(v))){const ye=ce.update(v),ve=v.material;if(G&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Xe.copy(v.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),Xe.copy(ye.boundingSphere.center)),Xe.applyMatrix4(v.matrixWorld).applyMatrix4(rt)),Array.isArray(ve)){const we=ye.groups;for(let Fe=0,$e=we.length;Fe<$e;Fe++){const Ze=we[Fe],Pe=ve[Ze.materialIndex];Pe&&Pe.visible&&P.push(v,ye,Pe,q,Xe.z,Ze)}}else ve.visible&&P.push(v,ye,ve,q,Xe.z,null)}}const Se=v.children;for(let ye=0,ve=Se.length;ye<ve;ye++)Gs(Se[ye],U,q,G)}function ll(v,U,q,G){const{opaque:W,transmissive:Se,transparent:ye}=v;M.setupLightsView(q),ct===!0&&Ae.setGlobalState(L.clippingPlanes,q),G&&ge.viewport(k.copy(G)),W.length>0&&Cr(W,U,q),Se.length>0&&Cr(Se,U,q),ye.length>0&&Cr(ye,U,q),ge.buffers.depth.setTest(!0),ge.buffers.depth.setMask(!0),ge.buffers.color.setMask(!0),ge.setPolygonOffset(!1)}function cl(v,U,q,G){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;if(M.state.transmissionRenderTarget[G.id]===void 0){const Pe=tt.has("EXT_color_buffer_half_float")||tt.has("EXT_color_buffer_float");M.state.transmissionRenderTarget[G.id]=new yn(1,1,{generateMipmaps:!0,type:Pe?zn:an,minFilter:mi,samples:Math.max(4,_t.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:it.workingColorSpace})}const Se=M.state.transmissionRenderTarget[G.id],ye=G.viewport||k;Se.setSize(ye.z*L.transmissionResolutionScale,ye.w*L.transmissionResolutionScale);const ve=L.getRenderTarget(),we=L.getActiveCubeFace(),Fe=L.getActiveMipmapLevel();L.setRenderTarget(Se),L.getClearColor(re),xe=L.getClearAlpha(),xe<1&&L.setClearColor(16777215,.5),L.clear(),Mt&&ue.render(q);const $e=L.toneMapping;L.toneMapping=An;const Ze=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),M.setupLightsView(G),ct===!0&&Ae.setGlobalState(L.clippingPlanes,G),Cr(v,q,G),g.updateMultisampleRenderTarget(Se),g.updateRenderTargetMipmap(Se),tt.has("WEBGL_multisampled_render_to_texture")===!1){let Pe=!1;for(let mt=0,Ct=U.length;mt<Ct;mt++){const yt=U[mt],{object:xt,geometry:Ot,material:be,group:Jt}=yt;if(be.side===Un&&xt.layers.test(G.layers)){const st=be.side;be.side=Zt,be.needsUpdate=!0,ul(xt,q,G,Ot,be,Jt),be.side=st,be.needsUpdate=!0,Pe=!0}}Pe===!0&&(g.updateMultisampleRenderTarget(Se),g.updateRenderTargetMipmap(Se))}L.setRenderTarget(ve,we,Fe),L.setClearColor(re,xe),Ze!==void 0&&(G.viewport=Ze),L.toneMapping=$e}function Cr(v,U,q){const G=U.isScene===!0?U.overrideMaterial:null;for(let W=0,Se=v.length;W<Se;W++){const ye=v[W],{object:ve,geometry:we,group:Fe}=ye;let $e=ye.material;$e.allowOverride===!0&&G!==null&&($e=G),ve.layers.test(q.layers)&&ul(ve,U,q,we,$e,Fe)}}function ul(v,U,q,G,W,Se){v.onBeforeRender(L,U,q,G,W,Se),v.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),W.onBeforeRender(L,U,q,G,v,Se),W.transparent===!0&&W.side===Un&&W.forceSinglePass===!1?(W.side=Zt,W.needsUpdate=!0,L.renderBufferDirect(q,U,G,W,v,Se),W.side=ri,W.needsUpdate=!0,L.renderBufferDirect(q,U,G,W,v,Se),W.side=Un):L.renderBufferDirect(q,U,G,W,v,Se),v.onAfterRender(L,U,q,G,W,Se)}function wr(v,U,q){U.isScene!==!0&&(U=Ft);const G=b.get(v),W=M.state.lights,Se=M.state.shadowsArray,ye=W.state.version,ve=me.getParameters(v,W.state,Se,U,q,M.state.lightProbeGridArray),we=me.getProgramCacheKey(ve);let Fe=G.programs;G.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?U.environment:null,G.fog=U.fog;const $e=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;G.envMap=V.get(v.envMap||G.environment,$e),G.envMapRotation=G.environment!==null&&v.envMap===null?U.environmentRotation:v.envMapRotation,Fe===void 0&&(v.addEventListener("dispose",Tt),Fe=new Map,G.programs=Fe);let Ze=Fe.get(we);if(Ze!==void 0){if(G.currentProgram===Ze&&G.lightsStateVersion===ye)return fl(v,ve),Ze}else ve.uniforms=me.getUniforms(v),O!==null&&v.isNodeMaterial&&O.build(v,q,ve),v.onBeforeCompile(ve,L),Ze=me.acquireProgram(ve,we),Fe.set(we,Ze),G.uniforms=ve.uniforms;const Pe=G.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Pe.clippingPlanes=Ae.uniform),fl(v,ve),G.needsLights=Xu(v),G.lightsStateVersion=ye,G.needsLights&&(Pe.ambientLightColor.value=W.state.ambient,Pe.lightProbe.value=W.state.probe,Pe.directionalLights.value=W.state.directional,Pe.directionalLightShadows.value=W.state.directionalShadow,Pe.spotLights.value=W.state.spot,Pe.spotLightShadows.value=W.state.spotShadow,Pe.rectAreaLights.value=W.state.rectArea,Pe.ltc_1.value=W.state.rectAreaLTC1,Pe.ltc_2.value=W.state.rectAreaLTC2,Pe.pointLights.value=W.state.point,Pe.pointLightShadows.value=W.state.pointShadow,Pe.hemisphereLights.value=W.state.hemi,Pe.directionalShadowMatrix.value=W.state.directionalShadowMatrix,Pe.spotLightMatrix.value=W.state.spotLightMatrix,Pe.spotLightMap.value=W.state.spotLightMap,Pe.pointShadowMatrix.value=W.state.pointShadowMatrix),G.lightProbeGrid=M.state.lightProbeGridArray.length>0,G.currentProgram=Ze,G.uniformsList=null,Ze}function dl(v){if(v.uniformsList===null){const U=v.currentProgram.getUniforms();v.uniformsList=hs.seqWithValue(U.seq,v.uniforms)}return v.uniformsList}function fl(v,U){const q=b.get(v);q.outputColorSpace=U.outputColorSpace,q.batching=U.batching,q.batchingColor=U.batchingColor,q.instancing=U.instancing,q.instancingColor=U.instancingColor,q.instancingMorph=U.instancingMorph,q.skinning=U.skinning,q.morphTargets=U.morphTargets,q.morphNormals=U.morphNormals,q.morphColors=U.morphColors,q.morphTargetsCount=U.morphTargetsCount,q.numClippingPlanes=U.numClippingPlanes,q.numIntersection=U.numClipIntersection,q.vertexAlphas=U.vertexAlphas,q.vertexTangents=U.vertexTangents,q.toneMapping=U.toneMapping}function Hu(v,U){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;T.setFromMatrixPosition(U.matrixWorld);for(let q=0,G=v.length;q<G;q++){const W=v[q];if(W.texture!==null&&W.boundingBox.containsPoint(T))return W}return null}function Wu(v,U,q,G,W){U.isScene!==!0&&(U=Ft),g.resetTextureUnits();const Se=U.fog,ye=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?U.environment:null,ve=y===null?L.outputColorSpace:y.isXRRenderTarget===!0?y.texture.colorSpace:it.workingColorSpace,we=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Fe=V.get(G.envMap||ye,we),$e=G.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ze=!!q.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Pe=!!q.morphAttributes.position,mt=!!q.morphAttributes.normal,Ct=!!q.morphAttributes.color;let yt=An;G.toneMapped&&(y===null||y.isXRRenderTarget===!0)&&(yt=L.toneMapping);const xt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,Ot=xt!==void 0?xt.length:0,be=b.get(G),Jt=M.state.lights;if(ct===!0&&(Qe===!0||v!==F)){const vt=v===F&&G.id===N;Ae.setState(G,v,vt)}let st=!1;G.version===be.__version?(be.needsLights&&be.lightsStateVersion!==Jt.state.version||be.outputColorSpace!==ve||W.isBatchedMesh&&be.batching===!1||!W.isBatchedMesh&&be.batching===!0||W.isBatchedMesh&&be.batchingColor===!0&&W.colorTexture===null||W.isBatchedMesh&&be.batchingColor===!1&&W.colorTexture!==null||W.isInstancedMesh&&be.instancing===!1||!W.isInstancedMesh&&be.instancing===!0||W.isSkinnedMesh&&be.skinning===!1||!W.isSkinnedMesh&&be.skinning===!0||W.isInstancedMesh&&be.instancingColor===!0&&W.instanceColor===null||W.isInstancedMesh&&be.instancingColor===!1&&W.instanceColor!==null||W.isInstancedMesh&&be.instancingMorph===!0&&W.morphTexture===null||W.isInstancedMesh&&be.instancingMorph===!1&&W.morphTexture!==null||be.envMap!==Fe||G.fog===!0&&be.fog!==Se||be.numClippingPlanes!==void 0&&(be.numClippingPlanes!==Ae.numPlanes||be.numIntersection!==Ae.numIntersection)||be.vertexAlphas!==$e||be.vertexTangents!==Ze||be.morphTargets!==Pe||be.morphNormals!==mt||be.morphColors!==Ct||be.toneMapping!==yt||be.morphTargetsCount!==Ot||!!be.lightProbeGrid!=M.state.lightProbeGridArray.length>0)&&(st=!0):(st=!0,be.__version=G.version);let tn=be.currentProgram;st===!0&&(tn=wr(G,U,W),O&&G.isNodeMaterial&&O.onUpdateProgram(G,tn,be));let gn=!1,$n=!1,Ci=!1;const gt=tn.getUniforms(),wt=be.uniforms;if(ge.useProgram(tn.program)&&(gn=!0,$n=!0,Ci=!0),G.id!==N&&(N=G.id,$n=!0),be.needsLights){const vt=Hu(M.state.lightProbeGridArray,W);be.lightProbeGrid!==vt&&(be.lightProbeGrid=vt,$n=!0)}if(gn||F!==v){ge.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),gt.setValue(I,"projectionMatrix",v.projectionMatrix),gt.setValue(I,"viewMatrix",v.matrixWorldInverse);const qn=gt.map.cameraPosition;qn!==void 0&&qn.setValue(I,dt.setFromMatrixPosition(v.matrixWorld)),_t.logarithmicDepthBuffer&&gt.setValue(I,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&gt.setValue(I,"isOrthographic",v.isOrthographicCamera===!0),F!==v&&(F=v,$n=!0,Ci=!0)}if(be.needsLights&&(Jt.state.directionalShadowMap.length>0&&gt.setValue(I,"directionalShadowMap",Jt.state.directionalShadowMap,g),Jt.state.spotShadowMap.length>0&&gt.setValue(I,"spotShadowMap",Jt.state.spotShadowMap,g),Jt.state.pointShadowMap.length>0&&gt.setValue(I,"pointShadowMap",Jt.state.pointShadowMap,g)),W.isSkinnedMesh){gt.setOptional(I,W,"bindMatrix"),gt.setOptional(I,W,"bindMatrixInverse");const vt=W.skeleton;vt&&(vt.boneTexture===null&&vt.computeBoneTexture(),gt.setValue(I,"boneTexture",vt.boneTexture,g))}W.isBatchedMesh&&(gt.setOptional(I,W,"batchingTexture"),gt.setValue(I,"batchingTexture",W._matricesTexture,g),gt.setOptional(I,W,"batchingIdTexture"),gt.setValue(I,"batchingIdTexture",W._indirectTexture,g),gt.setOptional(I,W,"batchingColorTexture"),W._colorsTexture!==null&&gt.setValue(I,"batchingColorTexture",W._colorsTexture,g));const Xn=q.morphAttributes;if((Xn.position!==void 0||Xn.normal!==void 0||Xn.color!==void 0)&&Ge.update(W,q,tn),($n||be.receiveShadow!==W.receiveShadow)&&(be.receiveShadow=W.receiveShadow,gt.setValue(I,"receiveShadow",W.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&U.environment!==null&&(wt.envMapIntensity.value=U.environmentIntensity),wt.dfgLUT!==void 0&&(wt.dfgLUT.value=MM()),$n){if(gt.setValue(I,"toneMappingExposure",L.toneMappingExposure),be.needsLights&&$u(wt,Ci),Se&&G.fog===!0&&K.refreshFogUniforms(wt,Se),K.refreshMaterialUniforms(wt,G,Ie,Je,M.state.transmissionRenderTarget[v.id]),be.needsLights&&be.lightProbeGrid){const vt=be.lightProbeGrid;wt.probesSH.value=vt.texture,wt.probesMin.value.copy(vt.boundingBox.min),wt.probesMax.value.copy(vt.boundingBox.max),wt.probesResolution.value.copy(vt.resolution)}hs.upload(I,dl(be),wt,g)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(hs.upload(I,dl(be),wt,g),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&gt.setValue(I,"center",W.center),gt.setValue(I,"modelViewMatrix",W.modelViewMatrix),gt.setValue(I,"normalMatrix",W.normalMatrix),gt.setValue(I,"modelMatrix",W.matrixWorld),G.uniformsGroups!==void 0){const vt=G.uniformsGroups;for(let qn=0,wi=vt.length;qn<wi;qn++){const hl=vt[qn];Q.update(hl,tn),Q.bind(hl,tn)}}return tn}function $u(v,U){v.ambientLightColor.needsUpdate=U,v.lightProbe.needsUpdate=U,v.directionalLights.needsUpdate=U,v.directionalLightShadows.needsUpdate=U,v.pointLights.needsUpdate=U,v.pointLightShadows.needsUpdate=U,v.spotLights.needsUpdate=U,v.spotLightShadows.needsUpdate=U,v.rectAreaLights.needsUpdate=U,v.hemisphereLights.needsUpdate=U}function Xu(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return $},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return y},this.setRenderTargetTextures=function(v,U,q){const G=b.get(v);G.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),b.get(v.texture).__webglTexture=U,b.get(v.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:q,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,U){const q=b.get(v);q.__webglFramebuffer=U,q.__useDefaultFramebuffer=U===void 0};const qu=I.createFramebuffer();this.setRenderTarget=function(v,U=0,q=0){y=v,$=U,Y=q;let G=null,W=!1,Se=!1;if(v){const ve=b.get(v);if(ve.__useDefaultFramebuffer!==void 0){ge.bindFramebuffer(I.FRAMEBUFFER,ve.__webglFramebuffer),k.copy(v.viewport),H.copy(v.scissor),J=v.scissorTest,ge.viewport(k),ge.scissor(H),ge.setScissorTest(J),N=-1;return}else if(ve.__webglFramebuffer===void 0)g.setupRenderTarget(v);else if(ve.__hasExternalTextures)g.rebindTextures(v,b.get(v.texture).__webglTexture,b.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const $e=v.depthTexture;if(ve.__boundDepthTexture!==$e){if($e!==null&&b.has($e)&&(v.width!==$e.image.width||v.height!==$e.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");g.setupDepthRenderbuffer(v)}}const we=v.texture;(we.isData3DTexture||we.isDataArrayTexture||we.isCompressedArrayTexture)&&(Se=!0);const Fe=b.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Fe[U])?G=Fe[U][q]:G=Fe[U],W=!0):v.samples>0&&g.useMultisampledRTT(v)===!1?G=b.get(v).__webglMultisampledFramebuffer:Array.isArray(Fe)?G=Fe[q]:G=Fe,k.copy(v.viewport),H.copy(v.scissor),J=v.scissorTest}else k.copy(le).multiplyScalar(Ie).floor(),H.copy(Be).multiplyScalar(Ie).floor(),J=ze;if(q!==0&&(G=qu),ge.bindFramebuffer(I.FRAMEBUFFER,G)&&ge.drawBuffers(v,G),ge.viewport(k),ge.scissor(H),ge.setScissorTest(J),W){const ve=b.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+U,ve.__webglTexture,q)}else if(Se){const ve=U;for(let we=0;we<v.textures.length;we++){const Fe=b.get(v.textures[we]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+we,Fe.__webglTexture,q,ve)}}else if(v!==null&&q!==0){const ve=b.get(v.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ve.__webglTexture,q)}N=-1},this.readRenderTargetPixels=function(v,U,q,G,W,Se,ye,ve=0){if(!(v&&v.isWebGLRenderTarget)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=b.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ye!==void 0&&(we=we[ye]),we){ge.bindFramebuffer(I.FRAMEBUFFER,we);try{const Fe=v.textures[ve],$e=Fe.format,Ze=Fe.type;if(v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+ve),!_t.textureFormatReadable($e)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!_t.textureTypeReadable(Ze)){at("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=v.width-G&&q>=0&&q<=v.height-W&&I.readPixels(U,q,G,W,D.convert($e),D.convert(Ze),Se)}finally{const Fe=y!==null?b.get(y).__webglFramebuffer:null;ge.bindFramebuffer(I.FRAMEBUFFER,Fe)}}},this.readRenderTargetPixelsAsync=async function(v,U,q,G,W,Se,ye,ve=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let we=b.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ye!==void 0&&(we=we[ye]),we)if(U>=0&&U<=v.width-G&&q>=0&&q<=v.height-W){ge.bindFramebuffer(I.FRAMEBUFFER,we);const Fe=v.textures[ve],$e=Fe.format,Ze=Fe.type;if(v.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+ve),!_t.textureFormatReadable($e))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!_t.textureTypeReadable(Ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Pe=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Pe),I.bufferData(I.PIXEL_PACK_BUFFER,Se.byteLength,I.STREAM_READ),I.readPixels(U,q,G,W,D.convert($e),D.convert(Ze),0);const mt=y!==null?b.get(y).__webglFramebuffer:null;ge.bindFramebuffer(I.FRAMEBUFFER,mt);const Ct=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await C0(I,Ct,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Pe),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,Se),I.deleteBuffer(Pe),I.deleteSync(Ct),Se}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,U=null,q=0){const G=Math.pow(2,-q),W=Math.floor(v.image.width*G),Se=Math.floor(v.image.height*G),ye=U!==null?U.x:0,ve=U!==null?U.y:0;g.setTexture2D(v,0),I.copyTexSubImage2D(I.TEXTURE_2D,q,0,0,ye,ve,W,Se),ge.unbindTexture()};const Yu=I.createFramebuffer(),Ku=I.createFramebuffer();this.copyTextureToTexture=function(v,U,q=null,G=null,W=0,Se=0){let ye,ve,we,Fe,$e,Ze,Pe,mt,Ct;const yt=v.isCompressedTexture?v.mipmaps[Se]:v.image;if(q!==null)ye=q.max.x-q.min.x,ve=q.max.y-q.min.y,we=q.isBox3?q.max.z-q.min.z:1,Fe=q.min.x,$e=q.min.y,Ze=q.isBox3?q.min.z:0;else{const wt=Math.pow(2,-W);ye=Math.floor(yt.width*wt),ve=Math.floor(yt.height*wt),v.isDataArrayTexture?we=yt.depth:v.isData3DTexture?we=Math.floor(yt.depth*wt):we=1,Fe=0,$e=0,Ze=0}G!==null?(Pe=G.x,mt=G.y,Ct=G.z):(Pe=0,mt=0,Ct=0);const xt=D.convert(U.format),Ot=D.convert(U.type);let be;U.isData3DTexture?(g.setTexture3D(U,0),be=I.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(g.setTexture2DArray(U,0),be=I.TEXTURE_2D_ARRAY):(g.setTexture2D(U,0),be=I.TEXTURE_2D),ge.activeTexture(I.TEXTURE0),ge.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,U.flipY),ge.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),ge.pixelStorei(I.UNPACK_ALIGNMENT,U.unpackAlignment);const Jt=ge.getParameter(I.UNPACK_ROW_LENGTH),st=ge.getParameter(I.UNPACK_IMAGE_HEIGHT),tn=ge.getParameter(I.UNPACK_SKIP_PIXELS),gn=ge.getParameter(I.UNPACK_SKIP_ROWS),$n=ge.getParameter(I.UNPACK_SKIP_IMAGES);ge.pixelStorei(I.UNPACK_ROW_LENGTH,yt.width),ge.pixelStorei(I.UNPACK_IMAGE_HEIGHT,yt.height),ge.pixelStorei(I.UNPACK_SKIP_PIXELS,Fe),ge.pixelStorei(I.UNPACK_SKIP_ROWS,$e),ge.pixelStorei(I.UNPACK_SKIP_IMAGES,Ze);const Ci=v.isDataArrayTexture||v.isData3DTexture,gt=U.isDataArrayTexture||U.isData3DTexture;if(v.isDepthTexture){const wt=b.get(v),Xn=b.get(U),vt=b.get(wt.__renderTarget),qn=b.get(Xn.__renderTarget);ge.bindFramebuffer(I.READ_FRAMEBUFFER,vt.__webglFramebuffer),ge.bindFramebuffer(I.DRAW_FRAMEBUFFER,qn.__webglFramebuffer);for(let wi=0;wi<we;wi++)Ci&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,b.get(v).__webglTexture,W,Ze+wi),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,b.get(U).__webglTexture,Se,Ct+wi)),I.blitFramebuffer(Fe,$e,ye,ve,Pe,mt,ye,ve,I.DEPTH_BUFFER_BIT,I.NEAREST);ge.bindFramebuffer(I.READ_FRAMEBUFFER,null),ge.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(W!==0||v.isRenderTargetTexture||b.has(v)){const wt=b.get(v),Xn=b.get(U);ge.bindFramebuffer(I.READ_FRAMEBUFFER,Yu),ge.bindFramebuffer(I.DRAW_FRAMEBUFFER,Ku);for(let vt=0;vt<we;vt++)Ci?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,wt.__webglTexture,W,Ze+vt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,wt.__webglTexture,W),gt?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Xn.__webglTexture,Se,Ct+vt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Xn.__webglTexture,Se),W!==0?I.blitFramebuffer(Fe,$e,ye,ve,Pe,mt,ye,ve,I.COLOR_BUFFER_BIT,I.NEAREST):gt?I.copyTexSubImage3D(be,Se,Pe,mt,Ct+vt,Fe,$e,ye,ve):I.copyTexSubImage2D(be,Se,Pe,mt,Fe,$e,ye,ve);ge.bindFramebuffer(I.READ_FRAMEBUFFER,null),ge.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else gt?v.isDataTexture||v.isData3DTexture?I.texSubImage3D(be,Se,Pe,mt,Ct,ye,ve,we,xt,Ot,yt.data):U.isCompressedArrayTexture?I.compressedTexSubImage3D(be,Se,Pe,mt,Ct,ye,ve,we,xt,yt.data):I.texSubImage3D(be,Se,Pe,mt,Ct,ye,ve,we,xt,Ot,yt):v.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,Se,Pe,mt,ye,ve,xt,Ot,yt.data):v.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,Se,Pe,mt,yt.width,yt.height,xt,yt.data):I.texSubImage2D(I.TEXTURE_2D,Se,Pe,mt,ye,ve,xt,Ot,yt);ge.pixelStorei(I.UNPACK_ROW_LENGTH,Jt),ge.pixelStorei(I.UNPACK_IMAGE_HEIGHT,st),ge.pixelStorei(I.UNPACK_SKIP_PIXELS,tn),ge.pixelStorei(I.UNPACK_SKIP_ROWS,gn),ge.pixelStorei(I.UNPACK_SKIP_IMAGES,$n),Se===0&&U.generateMipmaps&&I.generateMipmap(be),ge.unbindTexture()},this.initRenderTarget=function(v){b.get(v).__webglFramebuffer===void 0&&g.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?g.setTextureCube(v,0):v.isData3DTexture?g.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?g.setTexture2DArray(v,0):g.setTexture2D(v,0),ge.unbindTexture()},this.resetState=function(){$=0,Y=0,y=null,ge.reset(),de.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Mn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=it._getDrawingBufferColorSpace(e),t.unpackColorSpace=it._getUnpackColorSpace()}}const bM={class:"relay-bridge__state","aria-hidden":"true"},AM={class:"relay-bridge__state-label"},yM={key:0,class:"relay-bridge__fallback"},rs=40,ui=3.5,Kt=1.2,fn=-1.2,xr=-3.5,zt=0,ss=7.2,di=.45,TM=5.2,bc=.32,CM=Ce({__name:"RelayBridge",props:{width:{default:800},height:{default:500}},setup(n){const e=n,t=et(null),i=et(null),r=et(!1),s=et(!1),a=et("idle"),o=Ve(()=>({idle:"idle",receiving:"receiving request",normalizing:"normalizing stream",forwarding:"forwarding upstream",responding:"returning response"})[a.value]||"idle");let l=null,c=null,d=null,f=0,u=null;const p=[],x=[],S=[];let m=null,h=0;const E=new Ke("#568dd0"),A=new Ke("#75a7df"),T=new Ke("#467ec2");new Ke("#4ec9b0"),new Ke("#6a9955");const P=new Ke("#0a0a0c");new Ke("#111115"),new Ke("#568dd0");function M(){try{const y=document.createElement("canvas");return!!(y.getContext("webgl2")||y.getContext("webgl"))}catch{return!1}}function w(y,N,F){const k=y/2,H=N/2,J=[];for(let Re=-k;Re<=k;Re+=F)J.push(Re,-H,0,Re,H,0);for(let Re=-H;Re<=H;Re+=F)J.push(-k,Re,0,k,Re,0);const re=new Wt;re.setAttribute("position",new bt(J,3));const xe=new fs({color:E,transparent:!0,opacity:.04,depthWrite:!1});return{geometry:re,material:xe}}function _(y,N=ss,F=di,k=!1){const H=new qi,J=new er(N,F),re=new In({color:k?new Ke("#1a1d28"):new Ke("#111115"),transparent:!0,opacity:k?.85:.7,depthWrite:!1}),xe=new Ut(J,re);xe.position.y=y,xe.position.z=-.05,H.add(xe);const Re=new gx(J),Je=new fs({color:k?E:new Ke("#1e1e24"),transparent:!0,opacity:k?.6:.3,depthWrite:!1}),Ie=new Zr(Re,Je);return Ie.position.y=y,Ie.position.z=-.04,H.add(Ie),H}function C(y){const N=new qi,F=.55,k=new As(F,6),H=new In({color:E,transparent:!0,opacity:.3,depthWrite:!1}),J=new Ut(k,H);J.position.set(0,y,.1),N.add(J);const re=new As(F*.55,32),xe=new In({color:A,transparent:!0,opacity:.5,depthWrite:!1}),Re=new Ut(re,xe);Re.position.set(0,y,.12),N.add(Re);const Je=new ys(F*.65,F*.85,64),Ie=new In({color:A,transparent:!0,opacity:.4,side:2,depthWrite:!1});m=new Ut(Je,Ie),m.position.set(0,y,.11),m.scale.set(1,1,1),N.add(m),h=performance.now();const ee=new ys(F*.88,F*.92,64),pe=new In({color:T,transparent:!0,opacity:.6,side:2,depthWrite:!1}),le=new Ut(ee,pe);return le.position.set(0,y,.09),N.add(le),N}function L(){const y=[],N=[{x:zt-.15,top:ui,bot:Kt},{x:zt+.15,top:ui,bot:Kt},{x:zt-.15,top:Kt,bot:fn},{x:zt+.15,top:Kt,bot:fn},{x:zt-.12,top:fn,bot:xr},{x:zt+.12,top:fn,bot:xr}];for(const H of N){const J=H.top-di/2,re=H.bot+di/2;y.push(H.x,J,.05,H.x,re,.05)}const F=new Wt;F.setAttribute("position",new bt(y,3));const k=new fs({color:E,transparent:!0,opacity:.15,depthWrite:!1});return new Zr(F,k)}function R(){const y=[],N=di/2,F=bc/2,k=[{x:zt-.18,from:ui-N,to:Kt+N},{x:zt+.18,from:ui-N,to:Kt+N},{x:zt-.18,from:Kt-N,to:fn+N},{x:zt+.18,from:Kt-N,to:fn+N},{x:zt-.12,from:fn-N,to:xr+F},{x:zt+.12,from:fn-N,to:xr+F},{x:zt-.18,from:Kt+N,to:ui-N},{x:zt+.18,from:Kt+N,to:ui-N},{x:zt-.18,from:fn+N,to:Kt-N},{x:zt+.18,from:fn+N,to:Kt-N}];for(const H of k){const J=new z(H.x,H.from,.15),re=new z(H.x,H.to,.15);y.push([J,re])}return y}function O(){const y=i.value,N=t.value;if(!y||!N)return;if(!M()){r.value=!0;return}const F=N.getBoundingClientRect(),k=F.width||e.width,H=F.height||e.height;l=new EM({canvas:y,alpha:!0,antialias:!0,powerPreference:"low-power"}),l.setPixelRatio(Math.min(window.devicePixelRatio,2)),l.setSize(k,H,!1),l.setClearColor(0,0),c=new sx,d=new sn(44,k/Math.max(H,1),.1,30),d.position.set(0,0,10),d.lookAt(0,0,0);const J=w(14,10,.6),re=new Zr(J.geometry,J.material);re.position.z=-.5,c.add(re);const xe=new er(20,20),Re=new In({color:P,transparent:!0,opacity:1,depthWrite:!1}),Je=new Ut(xe,Re);Je.position.z=-1,c.add(Je);const Ie=_(ui,ss,di);c.add(Ie);const ee=_(Kt,ss,di+.12,!0);c.add(ee);const pe=_(fn,ss,di);c.add(pe);const le=_(xr,TM,bc);c.add(le);const Be=C(Kt);c.add(Be);const ze=L();c.add(ze);const Oe=R();for(const ct of Oe)p.push(ct);for(let ct=0;ct<rs;ct++)x.push(Math.random()),S.push(.08+Math.random()*.25);{const ct=new Ko(.04,6,6),Qe=new In({color:A,transparent:!0,opacity:.85,depthWrite:!1}),rt=new Wl(ct,Qe,rs);rt.instanceMatrix.setUsage(2);const dt=new Ht;for(let Xe=0;Xe<rs;Xe++)dt.position.set(0,-10,0),dt.updateMatrix(),rt.setMatrixAt(Xe,dt.matrix);rt.instanceMatrix.needsUpdate=!0,c.add(rt)}f=requestAnimationFrame($)}function $(y){if(!c||!d||!l)return;const N=y*.001;if(s.value||(d.position.x=Math.sin(N*.3)*1.2,d.position.y=Math.cos(N*.25)*.6,d.lookAt(0,0,0)),m&&!s.value){const F=(y-h)*.001,k=F%6.5;k<1?a.value="idle":k<2.2?a.value="receiving":k<3.4?a.value="normalizing":k<4.6?a.value="forwarding":a.value="responding";const H=k%1.5/1.5;let J=1,re=.35;switch(a.value){case"receiving":J=1+Math.sin(H*Math.PI)*.35,re=.35+Math.sin(H*Math.PI)*.4;break;case"normalizing":J=1+Math.sin(H*Math.PI*2)*.2,re=.45+Math.sin(H*Math.PI*3)*.25;break;case"forwarding":J=1+Math.sin(H*Math.PI)*.25,re=.35+Math.sin(H*Math.PI)*.35;break;case"responding":J=1+Math.sin(H*Math.PI)*.2,re=.3+Math.sin(H*Math.PI)*.3;break;default:J=1+Math.sin(F*1.2)*.08,re=.3+Math.sin(F*1.2)*.08}m.scale.set(J,J,1),m.material.opacity=$0.clamp(re,.18,.8),m.position.z=.11+Math.sin(F*1.5)*.015}if(!s.value){const F=c.children;let k=null;for(let H=F.length-1;H>=0;H--){const J=F[H];if(J instanceof Wl){k=J;break}}if(k){const H=new Ht,J=p.length;for(let re=0;re<rs;re++){const xe=re%J,Re=p[xe];if(!Re||Re.length<2)continue;x[re]+=S[re]*.008,x[re]>1&&(x[re]-=1,S[re]=.08+Math.random()*.25);const Je=x[re],Ie=Re[0],ee=Re[1];H.position.lerpVectors(Ie,ee,Je);const pe=Math.sin(N*4+re*1.7)*.04;H.position.x+=pe,xe<6?H.scale.set(1,1,1):H.scale.set(.85,.85,.85),H.updateMatrix(),k.setMatrixAt(re,H.matrix)}k.instanceMatrix.needsUpdate=!0}}l.render(c,d),f=requestAnimationFrame($)}function Y(){const y=t.value;if(!y||!l||!d)return;const N=y.getBoundingClientRect(),F=N.width||e.width,k=N.height||e.height;F<=0||k<=0||(l.setSize(F,k,!1),d.aspect=F/Math.max(k,1),d.updateProjectionMatrix())}return wn(()=>{s.value=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const y=window.matchMedia("(prefers-reduced-motion: reduce)"),N=k=>{s.value=k.matches};y.addEventListener("change",N),No(()=>{setTimeout(()=>{O()},50)}),t.value&&(u=new ResizeObserver(()=>{Y()}),u.observe(t.value));const F=N;br(()=>{f&&cancelAnimationFrame(f),u&&u.disconnect(),y.removeEventListener("change",F),l&&(l.dispose(),l=null),c&&(c.traverse(k=>{var H;(k instanceof Ut||k instanceof Zr)&&((H=k.geometry)==null||H.dispose(),Array.isArray(k.material)?k.material.forEach(J=>J.dispose()):k.material&&k.material.dispose())}),c.clear(),c=null),m=null,p.length=0,x.length=0,S.length=0})}),(y,N)=>(B(),j("div",{ref_key:"containerEl",ref:t,class:lt(["relay-bridge",{"relay-bridge--reduced":s.value}]),role:"img","aria-label":"Relay protocol bridge diagram: clients connect through Relay to local inference servers"},[Z("canvas",{ref_key:"canvasEl",ref:i,class:"relay-bridge__canvas"},null,512),N[1]||(N[1]=ps('<div class="relay-bridge__labels" aria-hidden="true" data-v-dbfc8e3d><span class="relay-bridge__label relay-bridge__label--tl" data-v-dbfc8e3d>OpenAI SDK</span><span class="relay-bridge__label relay-bridge__label--tr" data-v-dbfc8e3d>Anthropic SDK</span><span class="relay-bridge__label relay-bridge__label--ml" data-v-dbfc8e3d>SSE normalize</span><span class="relay-bridge__label relay-bridge__label--mr" data-v-dbfc8e3d>tool_calls</span><span class="relay-bridge__label relay-bridge__label--bl" data-v-dbfc8e3d>llama.cpp</span><span class="relay-bridge__label relay-bridge__label--br" data-v-dbfc8e3d>Cloud API</span></div>',1)),Z("div",bM,[Z("span",{class:lt(["relay-bridge__state-dot",`relay-bridge__state-dot--${a.value}`])},null,2),Z("span",AM,ht(o.value),1)]),r.value?(B(),j("div",yM,[...N[0]||(N[0]=[ps('<svg width="420" height="248" viewBox="0 0 420 248" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-dbfc8e3d><rect width="420" height="248" fill="#0a0a0c" rx="8" data-v-dbfc8e3d></rect><rect x="0.5" y="0.5" width="419" height="247" rx="7.5" stroke="rgba(86,141,208,0.10)" stroke-width="1" data-v-dbfc8e3d></rect><rect x="44" y="10" width="332" height="34" rx="4" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" data-v-dbfc8e3d></rect><text x="210" y="22" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10" data-v-dbfc8e3d>OpenAI SDK  ·  Anthropic SDK</text><text x="210" y="36" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10" data-v-dbfc8e3d>Coding Agents  ·  Cursor  ·  Claude Code</text><rect x="64" y="72" width="292" height="52" rx="5" fill="rgba(86,141,208,0.16)" stroke="#568dd0" stroke-width="1" data-v-dbfc8e3d></rect><text x="210" y="96" text-anchor="middle" fill="#75a7df" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="13" font-weight="700" data-v-dbfc8e3d>Relay</text><text x="210" y="114" text-anchor="middle" fill="#568dd0" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="9" data-v-dbfc8e3d>normalize · stream · tools · errors</text><rect x="44" y="152" width="332" height="34" rx="4" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" data-v-dbfc8e3d></rect><text x="210" y="165" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10" data-v-dbfc8e3d>llama.cpp  ·  vLLM  ·  Ollama</text><text x="210" y="179" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10" data-v-dbfc8e3d>OpenAI  ·  Anthropic  ·  DeepSeek  ·  Groq</text><rect x="84" y="212" width="252" height="26" rx="3" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.035)" stroke-width="0.5" data-v-dbfc8e3d></rect><text x="210" y="229" text-anchor="middle" fill="#52525b" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="9.5" data-v-dbfc8e3d>GGUF / local model · cloud API endpoint</text><line x1="210" y1="48" x2="210" y2="69" stroke="rgba(86,141,208,0.28)" stroke-width="1" data-v-dbfc8e3d></line><line x1="210" y1="128" x2="210" y2="149" stroke="rgba(86,141,208,0.28)" stroke-width="1" data-v-dbfc8e3d></line><line x1="210" y1="190" x2="210" y2="209" stroke="rgba(86,141,208,0.18)" stroke-width="1" data-v-dbfc8e3d></line></svg>',1)])])):Te("",!0)],2))}}),wM=Le(CM,[["__scopeId","data-v-dbfc8e3d"]]),RM={class:"compat-visual","aria-label":"Relay translation pipeline"},NM={key:0,class:"compat-caption"},FM=Ce({__name:"CompatibilityVisual",props:{caption:{default:"Gateway mode manages local llama.cpp models. Cloud mode proxies OpenAI, Anthropic, DeepSeek, or Groq. Same API surface either way."}},setup(n){return(e,t)=>(B(),j("figure",RM,[t[0]||(t[0]=ps('<div class="compat-flow" data-v-3ec191d3><div class="compat-node compat-node-client" data-v-3ec191d3><span class="compat-label" data-v-3ec191d3>Clients</span><strong data-v-3ec191d3>OpenAI / Anthropic</strong><code data-v-3ec191d3>SDK requests, tools, streams</code></div><div class="compat-arrow" aria-hidden="true" data-v-3ec191d3>→</div><div class="compat-node compat-node-relay" data-v-3ec191d3><span class="compat-label" data-v-3ec191d3>Relay</span><strong data-v-3ec191d3>Normalize boundary</strong><code data-v-3ec191d3>messages, SSE, tools, errors</code></div><div class="compat-arrow" aria-hidden="true" data-v-3ec191d3>→</div><div class="compat-node compat-node-upstream" data-v-3ec191d3><span class="compat-label" data-v-3ec191d3>Backend</span><strong data-v-3ec191d3>llama.cpp or Cloud API</strong><code data-v-3ec191d3>local GPU or hosted inference</code></div></div><div class="compat-return" aria-hidden="true" data-v-3ec191d3><span data-v-3ec191d3></span><code data-v-3ec191d3>canonical response back to the agent</code><span data-v-3ec191d3></span></div>',2)),n.caption?(B(),j("figcaption",NM,ht(n.caption),1)):Te("",!0)]))}}),PM=Le(FM,[["__scopeId","data-v-3ec191d3"]]),LM=["BN","BN","BN","BN","BN","BN","BN","BN","BN","S","B","S","WS","B","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","B","B","B","S","WS","ON","ON","ET","ET","ET","ON","ON","ON","ON","ON","ES","CS","ES","CS","CS","EN","EN","EN","EN","EN","EN","EN","EN","EN","EN","CS","ON","ON","ON","ON","ON","ON","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","ON","ON","ON","ON","ON","ON","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","ON","ON","ON","ON","BN","BN","BN","BN","BN","BN","B","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","BN","CS","ON","ET","ET","ET","ET","ON","ON","ON","ON","L","ON","ON","BN","ON","ON","ET","ET","EN","EN","ON","L","ON","ON","ON","EN","L","ON","ON","ON","ON","ON","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","ON","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","L","ON","L","L","L","L","L","L","L","L"],Ac=[[697,698,"ON"],[706,719,"ON"],[722,735,"ON"],[741,749,"ON"],[751,767,"ON"],[768,879,"NSM"],[884,885,"ON"],[894,894,"ON"],[900,901,"ON"],[903,903,"ON"],[1014,1014,"ON"],[1155,1161,"NSM"],[1418,1418,"ON"],[1421,1422,"ON"],[1423,1423,"ET"],[1424,1424,"R"],[1425,1469,"NSM"],[1470,1470,"R"],[1471,1471,"NSM"],[1472,1472,"R"],[1473,1474,"NSM"],[1475,1475,"R"],[1476,1477,"NSM"],[1478,1478,"R"],[1479,1479,"NSM"],[1480,1535,"R"],[1536,1541,"AN"],[1542,1543,"ON"],[1544,1544,"AL"],[1545,1546,"ET"],[1547,1547,"AL"],[1548,1548,"CS"],[1549,1549,"AL"],[1550,1551,"ON"],[1552,1562,"NSM"],[1563,1610,"AL"],[1611,1631,"NSM"],[1632,1641,"AN"],[1642,1642,"ET"],[1643,1644,"AN"],[1645,1647,"AL"],[1648,1648,"NSM"],[1649,1749,"AL"],[1750,1756,"NSM"],[1757,1757,"AN"],[1758,1758,"ON"],[1759,1764,"NSM"],[1765,1766,"AL"],[1767,1768,"NSM"],[1769,1769,"ON"],[1770,1773,"NSM"],[1774,1775,"AL"],[1776,1785,"EN"],[1786,1808,"AL"],[1809,1809,"NSM"],[1810,1839,"AL"],[1840,1866,"NSM"],[1867,1957,"AL"],[1958,1968,"NSM"],[1969,1983,"AL"],[1984,2026,"R"],[2027,2035,"NSM"],[2036,2037,"R"],[2038,2041,"ON"],[2042,2044,"R"],[2045,2045,"NSM"],[2046,2069,"R"],[2070,2073,"NSM"],[2074,2074,"R"],[2075,2083,"NSM"],[2084,2084,"R"],[2085,2087,"NSM"],[2088,2088,"R"],[2089,2093,"NSM"],[2094,2136,"R"],[2137,2139,"NSM"],[2140,2143,"R"],[2144,2191,"AL"],[2192,2193,"AN"],[2194,2198,"AL"],[2199,2207,"NSM"],[2208,2249,"AL"],[2250,2273,"NSM"],[2274,2274,"AN"],[2275,2306,"NSM"],[2362,2362,"NSM"],[2364,2364,"NSM"],[2369,2376,"NSM"],[2381,2381,"NSM"],[2385,2391,"NSM"],[2402,2403,"NSM"],[2433,2433,"NSM"],[2492,2492,"NSM"],[2497,2500,"NSM"],[2509,2509,"NSM"],[2530,2531,"NSM"],[2546,2547,"ET"],[2555,2555,"ET"],[2558,2558,"NSM"],[2561,2562,"NSM"],[2620,2620,"NSM"],[2625,2626,"NSM"],[2631,2632,"NSM"],[2635,2637,"NSM"],[2641,2641,"NSM"],[2672,2673,"NSM"],[2677,2677,"NSM"],[2689,2690,"NSM"],[2748,2748,"NSM"],[2753,2757,"NSM"],[2759,2760,"NSM"],[2765,2765,"NSM"],[2786,2787,"NSM"],[2801,2801,"ET"],[2810,2815,"NSM"],[2817,2817,"NSM"],[2876,2876,"NSM"],[2879,2879,"NSM"],[2881,2884,"NSM"],[2893,2893,"NSM"],[2901,2902,"NSM"],[2914,2915,"NSM"],[2946,2946,"NSM"],[3008,3008,"NSM"],[3021,3021,"NSM"],[3059,3064,"ON"],[3065,3065,"ET"],[3066,3066,"ON"],[3072,3072,"NSM"],[3076,3076,"NSM"],[3132,3132,"NSM"],[3134,3136,"NSM"],[3142,3144,"NSM"],[3146,3149,"NSM"],[3157,3158,"NSM"],[3170,3171,"NSM"],[3192,3198,"ON"],[3201,3201,"NSM"],[3260,3260,"NSM"],[3276,3277,"NSM"],[3298,3299,"NSM"],[3328,3329,"NSM"],[3387,3388,"NSM"],[3393,3396,"NSM"],[3405,3405,"NSM"],[3426,3427,"NSM"],[3457,3457,"NSM"],[3530,3530,"NSM"],[3538,3540,"NSM"],[3542,3542,"NSM"],[3633,3633,"NSM"],[3636,3642,"NSM"],[3647,3647,"ET"],[3655,3662,"NSM"],[3761,3761,"NSM"],[3764,3772,"NSM"],[3784,3790,"NSM"],[3864,3865,"NSM"],[3893,3893,"NSM"],[3895,3895,"NSM"],[3897,3897,"NSM"],[3898,3901,"ON"],[3953,3966,"NSM"],[3968,3972,"NSM"],[3974,3975,"NSM"],[3981,3991,"NSM"],[3993,4028,"NSM"],[4038,4038,"NSM"],[4141,4144,"NSM"],[4146,4151,"NSM"],[4153,4154,"NSM"],[4157,4158,"NSM"],[4184,4185,"NSM"],[4190,4192,"NSM"],[4209,4212,"NSM"],[4226,4226,"NSM"],[4229,4230,"NSM"],[4237,4237,"NSM"],[4253,4253,"NSM"],[4957,4959,"NSM"],[5008,5017,"ON"],[5120,5120,"ON"],[5760,5760,"WS"],[5787,5788,"ON"],[5906,5908,"NSM"],[5938,5939,"NSM"],[5970,5971,"NSM"],[6002,6003,"NSM"],[6068,6069,"NSM"],[6071,6077,"NSM"],[6086,6086,"NSM"],[6089,6099,"NSM"],[6107,6107,"ET"],[6109,6109,"NSM"],[6128,6137,"ON"],[6144,6154,"ON"],[6155,6157,"NSM"],[6158,6158,"BN"],[6159,6159,"NSM"],[6277,6278,"NSM"],[6313,6313,"NSM"],[6432,6434,"NSM"],[6439,6440,"NSM"],[6450,6450,"NSM"],[6457,6459,"NSM"],[6464,6464,"ON"],[6468,6469,"ON"],[6622,6655,"ON"],[6679,6680,"NSM"],[6683,6683,"NSM"],[6742,6742,"NSM"],[6744,6750,"NSM"],[6752,6752,"NSM"],[6754,6754,"NSM"],[6757,6764,"NSM"],[6771,6780,"NSM"],[6783,6783,"NSM"],[6832,6877,"NSM"],[6880,6891,"NSM"],[6912,6915,"NSM"],[6964,6964,"NSM"],[6966,6970,"NSM"],[6972,6972,"NSM"],[6978,6978,"NSM"],[7019,7027,"NSM"],[7040,7041,"NSM"],[7074,7077,"NSM"],[7080,7081,"NSM"],[7083,7085,"NSM"],[7142,7142,"NSM"],[7144,7145,"NSM"],[7149,7149,"NSM"],[7151,7153,"NSM"],[7212,7219,"NSM"],[7222,7223,"NSM"],[7376,7378,"NSM"],[7380,7392,"NSM"],[7394,7400,"NSM"],[7405,7405,"NSM"],[7412,7412,"NSM"],[7416,7417,"NSM"],[7616,7679,"NSM"],[8125,8125,"ON"],[8127,8129,"ON"],[8141,8143,"ON"],[8157,8159,"ON"],[8173,8175,"ON"],[8189,8190,"ON"],[8192,8202,"WS"],[8203,8205,"BN"],[8207,8207,"R"],[8208,8231,"ON"],[8232,8232,"WS"],[8233,8233,"B"],[8234,8238,"BN"],[8239,8239,"CS"],[8240,8244,"ET"],[8245,8259,"ON"],[8260,8260,"CS"],[8261,8286,"ON"],[8287,8287,"WS"],[8288,8303,"BN"],[8304,8304,"EN"],[8308,8313,"EN"],[8314,8315,"ES"],[8316,8318,"ON"],[8320,8329,"EN"],[8330,8331,"ES"],[8332,8334,"ON"],[8352,8399,"ET"],[8400,8432,"NSM"],[8448,8449,"ON"],[8451,8454,"ON"],[8456,8457,"ON"],[8468,8468,"ON"],[8470,8472,"ON"],[8478,8483,"ON"],[8485,8485,"ON"],[8487,8487,"ON"],[8489,8489,"ON"],[8494,8494,"ET"],[8506,8507,"ON"],[8512,8516,"ON"],[8522,8525,"ON"],[8528,8543,"ON"],[8585,8587,"ON"],[8592,8721,"ON"],[8722,8722,"ES"],[8723,8723,"ET"],[8724,9013,"ON"],[9083,9108,"ON"],[9110,9257,"ON"],[9280,9290,"ON"],[9312,9351,"ON"],[9352,9371,"EN"],[9450,9899,"ON"],[9901,10239,"ON"],[10496,11123,"ON"],[11126,11263,"ON"],[11493,11498,"ON"],[11503,11505,"NSM"],[11513,11519,"ON"],[11647,11647,"NSM"],[11744,11775,"NSM"],[11776,11869,"ON"],[11904,11929,"ON"],[11931,12019,"ON"],[12032,12245,"ON"],[12272,12287,"ON"],[12288,12288,"WS"],[12289,12292,"ON"],[12296,12320,"ON"],[12330,12333,"NSM"],[12336,12336,"ON"],[12342,12343,"ON"],[12349,12351,"ON"],[12441,12442,"NSM"],[12443,12444,"ON"],[12448,12448,"ON"],[12539,12539,"ON"],[12736,12773,"ON"],[12783,12783,"ON"],[12829,12830,"ON"],[12880,12895,"ON"],[12924,12926,"ON"],[12977,12991,"ON"],[13004,13007,"ON"],[13175,13178,"ON"],[13278,13279,"ON"],[13311,13311,"ON"],[19904,19967,"ON"],[42128,42182,"ON"],[42509,42511,"ON"],[42607,42610,"NSM"],[42611,42611,"ON"],[42612,42621,"NSM"],[42622,42623,"ON"],[42654,42655,"NSM"],[42736,42737,"NSM"],[42752,42785,"ON"],[42888,42888,"ON"],[43010,43010,"NSM"],[43014,43014,"NSM"],[43019,43019,"NSM"],[43045,43046,"NSM"],[43048,43051,"ON"],[43052,43052,"NSM"],[43064,43065,"ET"],[43124,43127,"ON"],[43204,43205,"NSM"],[43232,43249,"NSM"],[43263,43263,"NSM"],[43302,43309,"NSM"],[43335,43345,"NSM"],[43392,43394,"NSM"],[43443,43443,"NSM"],[43446,43449,"NSM"],[43452,43453,"NSM"],[43493,43493,"NSM"],[43561,43566,"NSM"],[43569,43570,"NSM"],[43573,43574,"NSM"],[43587,43587,"NSM"],[43596,43596,"NSM"],[43644,43644,"NSM"],[43696,43696,"NSM"],[43698,43700,"NSM"],[43703,43704,"NSM"],[43710,43711,"NSM"],[43713,43713,"NSM"],[43756,43757,"NSM"],[43766,43766,"NSM"],[43882,43883,"ON"],[44005,44005,"NSM"],[44008,44008,"NSM"],[44013,44013,"NSM"],[64285,64285,"R"],[64286,64286,"NSM"],[64287,64296,"R"],[64297,64297,"ES"],[64298,64335,"R"],[64336,64450,"AL"],[64451,64466,"ON"],[64467,64829,"AL"],[64830,64847,"ON"],[64848,64911,"AL"],[64912,64913,"ON"],[64914,64967,"AL"],[64968,64975,"ON"],[64976,65007,"BN"],[65008,65020,"AL"],[65021,65023,"ON"],[65024,65039,"NSM"],[65040,65049,"ON"],[65056,65071,"NSM"],[65072,65103,"ON"],[65104,65104,"CS"],[65105,65105,"ON"],[65106,65106,"CS"],[65108,65108,"ON"],[65109,65109,"CS"],[65110,65118,"ON"],[65119,65119,"ET"],[65120,65121,"ON"],[65122,65123,"ES"],[65124,65126,"ON"],[65128,65128,"ON"],[65129,65130,"ET"],[65131,65131,"ON"],[65136,65278,"AL"],[65279,65279,"BN"],[65281,65282,"ON"],[65283,65285,"ET"],[65286,65290,"ON"],[65291,65291,"ES"],[65292,65292,"CS"],[65293,65293,"ES"],[65294,65295,"CS"],[65296,65305,"EN"],[65306,65306,"CS"],[65307,65312,"ON"],[65339,65344,"ON"],[65371,65381,"ON"],[65504,65505,"ET"],[65506,65508,"ON"],[65509,65510,"ET"],[65512,65518,"ON"],[65520,65528,"BN"],[65529,65533,"ON"],[65534,65535,"BN"],[65793,65793,"ON"],[65856,65932,"ON"],[65936,65948,"ON"],[65952,65952,"ON"],[66045,66045,"NSM"],[66272,66272,"NSM"],[66273,66299,"EN"],[66422,66426,"NSM"],[67584,67870,"R"],[67871,67871,"ON"],[67872,68096,"R"],[68097,68099,"NSM"],[68100,68100,"R"],[68101,68102,"NSM"],[68103,68107,"R"],[68108,68111,"NSM"],[68112,68151,"R"],[68152,68154,"NSM"],[68155,68158,"R"],[68159,68159,"NSM"],[68160,68324,"R"],[68325,68326,"NSM"],[68327,68408,"R"],[68409,68415,"ON"],[68416,68863,"R"],[68864,68899,"AL"],[68900,68903,"NSM"],[68904,68911,"AL"],[68912,68921,"AN"],[68922,68927,"AL"],[68928,68937,"AN"],[68938,68968,"R"],[68969,68973,"NSM"],[68974,68974,"ON"],[68975,69215,"R"],[69216,69246,"AN"],[69247,69290,"R"],[69291,69292,"NSM"],[69293,69311,"R"],[69312,69327,"AL"],[69328,69336,"ON"],[69337,69369,"AL"],[69370,69375,"NSM"],[69376,69423,"R"],[69424,69445,"AL"],[69446,69456,"NSM"],[69457,69487,"AL"],[69488,69505,"R"],[69506,69509,"NSM"],[69510,69631,"R"],[69633,69633,"NSM"],[69688,69702,"NSM"],[69714,69733,"ON"],[69744,69744,"NSM"],[69747,69748,"NSM"],[69759,69761,"NSM"],[69811,69814,"NSM"],[69817,69818,"NSM"],[69826,69826,"NSM"],[69888,69890,"NSM"],[69927,69931,"NSM"],[69933,69940,"NSM"],[70003,70003,"NSM"],[70016,70017,"NSM"],[70070,70078,"NSM"],[70089,70092,"NSM"],[70095,70095,"NSM"],[70191,70193,"NSM"],[70196,70196,"NSM"],[70198,70199,"NSM"],[70206,70206,"NSM"],[70209,70209,"NSM"],[70367,70367,"NSM"],[70371,70378,"NSM"],[70400,70401,"NSM"],[70459,70460,"NSM"],[70464,70464,"NSM"],[70502,70508,"NSM"],[70512,70516,"NSM"],[70587,70592,"NSM"],[70606,70606,"NSM"],[70608,70608,"NSM"],[70610,70610,"NSM"],[70625,70626,"NSM"],[70712,70719,"NSM"],[70722,70724,"NSM"],[70726,70726,"NSM"],[70750,70750,"NSM"],[70835,70840,"NSM"],[70842,70842,"NSM"],[70847,70848,"NSM"],[70850,70851,"NSM"],[71090,71093,"NSM"],[71100,71101,"NSM"],[71103,71104,"NSM"],[71132,71133,"NSM"],[71219,71226,"NSM"],[71229,71229,"NSM"],[71231,71232,"NSM"],[71264,71276,"ON"],[71339,71339,"NSM"],[71341,71341,"NSM"],[71344,71349,"NSM"],[71351,71351,"NSM"],[71453,71453,"NSM"],[71455,71455,"NSM"],[71458,71461,"NSM"],[71463,71467,"NSM"],[71727,71735,"NSM"],[71737,71738,"NSM"],[71995,71996,"NSM"],[71998,71998,"NSM"],[72003,72003,"NSM"],[72148,72151,"NSM"],[72154,72155,"NSM"],[72160,72160,"NSM"],[72193,72198,"NSM"],[72201,72202,"NSM"],[72243,72248,"NSM"],[72251,72254,"NSM"],[72263,72263,"NSM"],[72273,72278,"NSM"],[72281,72283,"NSM"],[72330,72342,"NSM"],[72344,72345,"NSM"],[72544,72544,"NSM"],[72546,72548,"NSM"],[72550,72550,"NSM"],[72752,72758,"NSM"],[72760,72765,"NSM"],[72850,72871,"NSM"],[72874,72880,"NSM"],[72882,72883,"NSM"],[72885,72886,"NSM"],[73009,73014,"NSM"],[73018,73018,"NSM"],[73020,73021,"NSM"],[73023,73029,"NSM"],[73031,73031,"NSM"],[73104,73105,"NSM"],[73109,73109,"NSM"],[73111,73111,"NSM"],[73459,73460,"NSM"],[73472,73473,"NSM"],[73526,73530,"NSM"],[73536,73536,"NSM"],[73538,73538,"NSM"],[73562,73562,"NSM"],[73685,73692,"ON"],[73693,73696,"ET"],[73697,73713,"ON"],[78912,78912,"NSM"],[78919,78933,"NSM"],[90398,90409,"NSM"],[90413,90415,"NSM"],[92912,92916,"NSM"],[92976,92982,"NSM"],[94031,94031,"NSM"],[94095,94098,"NSM"],[94178,94178,"ON"],[94180,94180,"NSM"],[113821,113822,"NSM"],[113824,113827,"BN"],[117760,117973,"ON"],[118e3,118009,"EN"],[118010,118012,"ON"],[118016,118451,"ON"],[118458,118480,"ON"],[118496,118512,"ON"],[118528,118573,"NSM"],[118576,118598,"NSM"],[119143,119145,"NSM"],[119155,119162,"BN"],[119163,119170,"NSM"],[119173,119179,"NSM"],[119210,119213,"NSM"],[119273,119274,"ON"],[119296,119361,"ON"],[119362,119364,"NSM"],[119365,119365,"ON"],[119552,119638,"ON"],[120513,120513,"ON"],[120539,120539,"ON"],[120571,120571,"ON"],[120597,120597,"ON"],[120629,120629,"ON"],[120655,120655,"ON"],[120687,120687,"ON"],[120713,120713,"ON"],[120745,120745,"ON"],[120771,120771,"ON"],[120782,120831,"EN"],[121344,121398,"NSM"],[121403,121452,"NSM"],[121461,121461,"NSM"],[121476,121476,"NSM"],[121499,121503,"NSM"],[121505,121519,"NSM"],[122880,122886,"NSM"],[122888,122904,"NSM"],[122907,122913,"NSM"],[122915,122916,"NSM"],[122918,122922,"NSM"],[123023,123023,"NSM"],[123184,123190,"NSM"],[123566,123566,"NSM"],[123628,123631,"NSM"],[123647,123647,"ET"],[124140,124143,"NSM"],[124398,124399,"NSM"],[124643,124643,"NSM"],[124646,124646,"NSM"],[124654,124655,"NSM"],[124661,124661,"NSM"],[124928,125135,"R"],[125136,125142,"NSM"],[125143,125251,"R"],[125252,125258,"NSM"],[125259,126063,"R"],[126064,126143,"AL"],[126144,126207,"R"],[126208,126287,"AL"],[126288,126463,"R"],[126464,126703,"AL"],[126704,126705,"ON"],[126706,126719,"AL"],[126720,126975,"R"],[126976,127019,"ON"],[127024,127123,"ON"],[127136,127150,"ON"],[127153,127167,"ON"],[127169,127183,"ON"],[127185,127221,"ON"],[127232,127242,"EN"],[127243,127247,"ON"],[127279,127279,"ON"],[127338,127343,"ON"],[127405,127405,"ON"],[127584,127589,"ON"],[127744,128728,"ON"],[128732,128748,"ON"],[128752,128764,"ON"],[128768,128985,"ON"],[128992,129003,"ON"],[129008,129008,"ON"],[129024,129035,"ON"],[129040,129095,"ON"],[129104,129113,"ON"],[129120,129159,"ON"],[129168,129197,"ON"],[129200,129211,"ON"],[129216,129217,"ON"],[129232,129240,"ON"],[129280,129623,"ON"],[129632,129645,"ON"],[129648,129660,"ON"],[129664,129674,"ON"],[129678,129734,"ON"],[129736,129736,"ON"],[129741,129756,"ON"],[129759,129770,"ON"],[129775,129784,"ON"],[129792,129938,"ON"],[129940,130031,"ON"],[130032,130041,"EN"],[130042,130042,"ON"],[131070,131071,"BN"],[196606,196607,"BN"],[262142,262143,"BN"],[327678,327679,"BN"],[393214,393215,"BN"],[458750,458751,"BN"],[524286,524287,"BN"],[589822,589823,"BN"],[655358,655359,"BN"],[720894,720895,"BN"],[786430,786431,"BN"],[851966,851967,"BN"],[917502,917759,"BN"],[917760,917999,"NSM"],[918e3,921599,"BN"],[983038,983039,"BN"],[1048574,1048575,"BN"],[1114110,1114111,"BN"]];function DM(n){if(n<=255)return LM[n];let e=0,t=Ac.length-1;for(;e<=t;){const i=e+t>>1,r=Ac[i];if(n<r[0]){t=i-1;continue}if(n>r[1]){e=i+1;continue}return r[2]}return"L"}function IM(n){const e=n.length;if(e===0)return null;const t=new Array(e);let i=!1;for(let c=0;c<e;){const d=n.charCodeAt(c);let f=d,u=1;if(d>=55296&&d<=56319&&c+1<e){const x=n.charCodeAt(c+1);x>=56320&&x<=57343&&(f=(d-55296<<10)+(x-56320)+65536,u=2)}const p=DM(f);(p==="R"||p==="AL"||p==="AN")&&(i=!0);for(let x=0;x<u;x++)t[c+x]=p;c+=u}if(!i)return null;let r=0;for(let c=0;c<e;c++){const d=t[c];if(d==="L"){r=0;break}if(d==="R"||d==="AL"){r=1;break}}const s=new Int8Array(e);for(let c=0;c<e;c++)s[c]=r;const a=r&1?"R":"L",o=a;let l=o;for(let c=0;c<e;c++)t[c]==="NSM"?t[c]=l:l=t[c];l=o;for(let c=0;c<e;c++){const d=t[c];d==="EN"?t[c]=l==="AL"?"AN":"EN":(d==="R"||d==="L"||d==="AL")&&(l=d)}for(let c=0;c<e;c++)t[c]==="AL"&&(t[c]="R");for(let c=1;c<e-1;c++)t[c]==="ES"&&t[c-1]==="EN"&&t[c+1]==="EN"&&(t[c]="EN"),t[c]==="CS"&&(t[c-1]==="EN"||t[c-1]==="AN")&&t[c+1]===t[c-1]&&(t[c]=t[c-1]);for(let c=0;c<e;c++){if(t[c]!=="EN")continue;let d;for(d=c-1;d>=0&&t[d]==="ET";d--)t[d]="EN";for(d=c+1;d<e&&t[d]==="ET";d++)t[d]="EN"}for(let c=0;c<e;c++){const d=t[c];(d==="WS"||d==="ES"||d==="ET"||d==="CS")&&(t[c]="ON")}l=o;for(let c=0;c<e;c++){const d=t[c];d==="EN"?t[c]=l==="L"?"L":"EN":(d==="R"||d==="L")&&(l=d)}for(let c=0;c<e;c++){if(t[c]!=="ON")continue;let d=c+1;for(;d<e&&t[d]==="ON";)d++;const f=c>0?t[c-1]:o,u=d<e?t[d]:o,p=f!=="L"?"R":"L";if(p===(u!=="L"?"R":"L"))for(let S=c;S<d;S++)t[S]=p;c=d-1}for(let c=0;c<e;c++)t[c]==="ON"&&(t[c]=a);for(let c=0;c<e;c++){const d=t[c];s[c]&1?(d==="L"||d==="AN"||d==="EN")&&s[c]++:d==="R"?s[c]++:(d==="AN"||d==="EN")&&(s[c]+=2)}return s}function UM(n,e){const t=IM(n);if(t===null)return null;const i=new Int8Array(e.length);for(let r=0;r<e.length;r++)i[r]=t[e[r]];return i}const BM=/[ \t\n\r\f]+/g,OM=/[\t\n\r\f]| {2,}|^ | $/;function kM(n){const e=n??"normal";return e==="pre-wrap"?{mode:e,preserveOrdinarySpaces:!0,preserveHardBreaks:!0}:{mode:e,preserveOrdinarySpaces:!1,preserveHardBreaks:!1}}function VM(n){if(!OM.test(n))return n;let e=n.replace(BM," ");return e.charCodeAt(0)===32&&(e=e.slice(1)),e.length>0&&e.charCodeAt(e.length-1)===32&&(e=e.slice(0,-1)),e}function zM(n){return/[\r\f]/.test(n)?n.replace(/\r\n/g,`
`).replace(/[\r\f]/g,`
`):n}let ba=null,GM;function HM(){return ba===null&&(ba=new Intl.Segmenter(GM,{granularity:"word"})),ba}const WM=new RegExp("\\p{Script=Arabic}","u"),Bs=new RegExp("\\p{M}","u"),Iu=new RegExp("\\p{Nd}","u");function yc(n){return WM.test(n)}function Tc(n){return n>=19968&&n<=40959||n>=13312&&n<=19903||n>=131072&&n<=173791||n>=173824&&n<=177983||n>=177984&&n<=178207||n>=178208&&n<=183983||n>=183984&&n<=191471||n>=191472&&n<=192093||n>=194560&&n<=195103||n>=196608&&n<=201551||n>=201552&&n<=205743||n>=205744&&n<=210041||n>=63744&&n<=64255||n>=12288&&n<=12351||n>=12352&&n<=12447||n>=12448&&n<=12543||n>=12592&&n<=12687||n>=44032&&n<=55215||n>=65280&&n<=65519}function Hn(n){for(let e=0;e<n.length;e++){const t=n.charCodeAt(e);if(!(t<12288)){if(t>=55296&&t<=56319&&e+1<n.length){const i=n.charCodeAt(e+1);if(i>=56320&&i<=57343){const r=(t-55296<<10)+(i-56320)+65536;if(Tc(r))return!0;e++;continue}}if(Tc(t))return!0}}return!1}function $M(n){const e=ks(n);return e!==null&&(Zo.has(e)||bi.has(e))}const XM=new Set([" "," ","⁠","\uFEFF"]);function qM(n){return Hn(n)}function YM(n){const e=ks(n);return e!==null&&XM.has(e)}function bo(n){return!$M(n)&&!YM(n)}const Zo=new Set(["，","．","！","：","；","？","、","。","・","）","〕","〉","》","」","』","】","〗","〙","〛","ー","々","〻","ゝ","ゞ","ヽ","ヾ"]),Os=new Set(['"',"(","[","{","“","‘","«","‹","（","〔","〈","《","「","『","【","〖","〘","〚"]),jo=new Set(["'","’"]),bi=new Set([".",",","!","?",":",";","،","؛","؟","।","॥","၊","။","၌","၍","၏",")","]","}","%",'"',"”","’","»","›","…"]),KM=new Set([":",".","،","؛"]),ZM=new Set(["၏"]),jM=new Set(["”","’","»","›","」","』","】","》","〉","〕","）"]);function JM(n){if(Jo(n))return!0;let e=!1;for(const t of n){if(bi.has(t)){e=!0;continue}if(!(e&&Bs.test(t)))return!1}return e}function QM(n){for(const e of n)if(!Zo.has(e)&&!bi.has(e))return!1;return n.length>0}function e1(n){if(Jo(n))return!0;for(const e of n)if(!Os.has(e)&&!jo.has(e)&&!Bs.test(e))return!1;return n.length>0}function Jo(n){let e=!1;for(const t of n)if(!(t==="\\"||Bs.test(t))){if(Os.has(t)||bi.has(t)||jo.has(t)){e=!0;continue}return!1}return e}function Uu(n,e){const t=e-1;if(t<=0)return Math.max(t,0);const i=n.charCodeAt(t);if(i<56320||i>57343)return t;const r=t-1;if(r<0)return t;const s=n.charCodeAt(r);return s>=55296&&s<=56319?r:t}function ks(n){if(n.length===0)return null;const e=Uu(n,n.length);return n.slice(e)}function t1(n){const e=Array.from(n);let t=e.length;for(;t>0;){const i=e[t-1];if(Bs.test(i)){t--;continue}if(Os.has(i)||jo.has(i)){t--;continue}break}return t<=0||t===e.length?null:{head:e.slice(0,t).join(""),tail:e.slice(t).join("")}}function n1(n,e,t){return t==="text"&&!e&&n.length===1&&n!=="-"&&n!=="—"?n:null}function Cc(n,e,t,i){const r=e[i],s=n[i];if(r==null)return s;const a=t[i];if(s.length===a)return s;const o=r.repeat(a);return n[i]=o,o}function wc(n,e){return n&&e!==null&&KM.has(e)}function i1(n){const e=ks(n);return e!==null&&ZM.has(e)}function r1(n){if(n.length<2||n[0]!==" ")return null;const e=n.slice(1);return new RegExp("^\\p{M}+$","u").test(e)?{space:" ",marks:e}:null}function Ao(n){let e=n.length;for(;e>0;){const t=Uu(n,e),i=n.slice(t,e);if(jM.has(i))return!0;if(!bi.has(i))return!1;e=t}return!1}function s1(n,e){if(e.preserveOrdinarySpaces||e.preserveHardBreaks){if(n===" ")return"preserved-space";if(n==="	")return"tab";if(e.preserveHardBreaks&&n===`
`)return"hard-break"}return n===" "?"space":n===" "||n===" "||n==="⁠"||n==="\uFEFF"?"glue":n==="​"?"zero-width-break":n==="­"?"soft-hyphen":"text"}const a1=/[\x20\t\n\xA0\xAD\u200B\u202F\u2060\uFEFF]/;function ln(n){return n.length===1?n[0]:n.join("")}function o1(n,e){const t=[];for(let i=n.length-1;i>=0;i--)t.push(n[i]);return t.push(e),ln(t)}function l1(n,e,t,i){if(!a1.test(n))return[{text:n,isWordLike:e,kind:"text",start:t}];const r=[];let s=null,a=[],o=t,l=!1,c=0;for(const d of n){const f=s1(d,i),u=f==="text"&&e;if(s!==null&&f===s&&u===l){a.push(d),c+=d.length;continue}s!==null&&r.push({text:ln(a),isWordLike:l,kind:s,start:o}),s=f,a=[d],o=t+c,l=u,c+=d.length}return s!==null&&r.push({text:ln(a),isWordLike:l,kind:s,start:o}),r}function yo(n){return n==="space"||n==="preserved-space"||n==="zero-width-break"||n==="hard-break"}const c1=/^[A-Za-z][A-Za-z0-9+.-]*:$/;function u1(n,e){const t=n.texts[e];return t.startsWith("www.")?!0:c1.test(t)&&e+1<n.len&&n.kinds[e+1]==="text"&&n.texts[e+1]==="//"}function d1(n){return n.includes("?")&&(n.includes("://")||n.startsWith("www."))}function f1(n){const e=n.texts.slice(),t=n.isWordLike.slice(),i=n.kinds.slice(),r=n.starts.slice();for(let a=0;a<n.len;a++){if(i[a]!=="text"||!u1(n,a))continue;const o=[e[a]];let l=a+1;for(;l<n.len&&!yo(i[l]);){o.push(e[l]),t[a]=!0;const c=e[l].includes("?");if(i[l]="text",e[l]="",l++,c)break}e[a]=ln(o)}let s=0;for(let a=0;a<e.length;a++){const o=e[a];o.length!==0&&(s!==a&&(e[s]=o,t[s]=t[a],i[s]=i[a],r[s]=r[a]),s++)}return e.length=s,t.length=s,i.length=s,r.length=s,{len:s,texts:e,isWordLike:t,kinds:i,starts:r}}function h1(n){const e=[],t=[],i=[],r=[];for(let s=0;s<n.len;s++){const a=n.texts[s];if(e.push(a),t.push(n.isWordLike[s]),i.push(n.kinds[s]),r.push(n.starts[s]),!d1(a))continue;const o=s+1;if(o>=n.len||yo(n.kinds[o]))continue;const l=[],c=n.starts[o];let d=o;for(;d<n.len&&!yo(n.kinds[d]);)l.push(n.texts[d]),d++;l.length>0&&(e.push(ln(l)),t.push(!0),i.push("text"),r.push(c),s=d-1)}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}const p1=new Set([":","-","/","×",",",".","+","–","—"]),Rc=/^[A-Za-z0-9_]+[,:;]*$/,Nc=/[,:;]+$/;function Bu(n){for(const e of n)if(Iu.test(e))return!0;return!1}function Ts(n){if(n.length===0)return!1;for(const e of n)if(!(Iu.test(e)||p1.has(e)))return!1;return!0}function m1(n){const e=[],t=[],i=[],r=[];for(let s=0;s<n.len;s++){const a=n.texts[s],o=n.kinds[s];if(o==="text"&&Ts(a)&&Bu(a)){const l=[a];let c=s+1;for(;c<n.len&&n.kinds[c]==="text"&&Ts(n.texts[c]);)l.push(n.texts[c]),c++;e.push(ln(l)),t.push(!0),i.push("text"),r.push(n.starts[s]),s=c-1;continue}e.push(a),t.push(n.isWordLike[s]),i.push(o),r.push(n.starts[s])}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function x1(n){const e=[],t=[],i=[],r=[];for(let s=0;s<n.len;s++){const a=n.texts[s],o=n.kinds[s],l=n.isWordLike[s];if(o==="text"&&l&&Rc.test(a)){const c=[a];let d=Nc.test(a),f=s+1;for(;d&&f<n.len&&n.kinds[f]==="text"&&n.isWordLike[f]&&Rc.test(n.texts[f]);){const u=n.texts[f];c.push(u),d=Nc.test(u),f++}e.push(ln(c)),t.push(!0),i.push("text"),r.push(n.starts[s]),s=f-1;continue}e.push(a),t.push(l),i.push(o),r.push(n.starts[s])}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function g1(n){const e=[],t=[],i=[],r=[];for(let s=0;s<n.len;s++){const a=n.texts[s];if(n.kinds[s]==="text"&&a.includes("-")){const o=a.split("-");let l=o.length>1;for(let c=0;c<o.length;c++){const d=o[c];if(!l)break;(d.length===0||!Bu(d)||!Ts(d))&&(l=!1)}if(l){let c=0;for(let d=0;d<o.length;d++){const f=o[d],u=d<o.length-1?`${f}-`:f;e.push(u),t.push(!0),i.push("text"),r.push(n.starts[s]+c),c+=u.length}continue}}e.push(a),t.push(n.isWordLike[s]),i.push(n.kinds[s]),r.push(n.starts[s])}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function _1(n){const e=[],t=[],i=[],r=[];let s=0;for(;s<n.len;){const a=[n.texts[s]];let o=n.isWordLike[s],l=n.kinds[s],c=n.starts[s];if(l==="glue"){const d=[a[0]],f=c;for(s++;s<n.len&&n.kinds[s]==="glue";)d.push(n.texts[s]),s++;const u=ln(d);if(s<n.len&&n.kinds[s]==="text")a[0]=u,a.push(n.texts[s]),o=n.isWordLike[s],l="text",c=f,s++;else{e.push(u),t.push(!1),i.push("glue"),r.push(f);continue}}else s++;if(l==="text")for(;s<n.len&&n.kinds[s]==="glue";){const d=[];for(;s<n.len&&n.kinds[s]==="glue";)d.push(n.texts[s]),s++;const f=ln(d);if(s<n.len&&n.kinds[s]==="text"){a.push(f,n.texts[s]),o=o||n.isWordLike[s],s++;continue}a.push(f)}e.push(ln(a)),t.push(o),i.push(l),r.push(c)}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function v1(n){const e=n.texts.slice(),t=n.isWordLike.slice(),i=n.kinds.slice(),r=n.starts.slice();for(let s=0;s<e.length-1;s++){if(i[s]!=="text"||i[s+1]!=="text"||!Hn(e[s])||!Hn(e[s+1]))continue;const a=t1(e[s]);a!==null&&(e[s]=a.head,e[s+1]=a.tail+e[s+1],r[s+1]=r[s]+a.head.length)}return{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function Fc(n,e,t){const i=HM();let r=0;const s=[],a=[],o=[],l=[],c=[],d=[],f=[],u=[],p=[],x=[],S=[],m=[];for(const M of i.segment(n))for(const w of l1(M.segment,M.isWordLike??!1,M.index,t)){let N=function(){d[y]!==null&&(a[y]=[Cc(s,d,f,y)],d[y]=null),a[y].push(w.text),o[y]=o[y]||w.isWordLike,u[y]=u[y]||L,p[y]=p[y]||R,x[y]=$,S[y]=Y,m[y]=wc(p[y],O)};const _=w.kind==="text",C=n1(w.text,w.isWordLike,w.kind),L=Hn(w.text),R=yc(w.text),O=ks(w.text),$=Ao(w.text),Y=i1(w.text),y=r-1;e.carryCJKAfterClosingQuote&&_&&r>0&&l[y]==="text"&&L&&u[y]&&x[y]||_&&r>0&&l[y]==="text"&&QM(w.text)&&u[y]||_&&r>0&&l[y]==="text"&&S[y]?N():_&&r>0&&l[y]==="text"&&w.isWordLike&&R&&m[y]?(N(),o[y]=!0):C!==null&&r>0&&l[y]==="text"&&d[y]===C?f[y]=(f[y]??1)+1:_&&!w.isWordLike&&r>0&&l[y]==="text"&&!u[y]&&(JM(w.text)||w.text==="-"&&o[y])?N():(s[r]=w.text,a[r]=[w.text],o[r]=w.isWordLike,l[r]=w.kind,c[r]=w.start,d[r]=C,f[r]=C===null?0:1,u[r]=L,p[r]=R,x[r]=$,S[r]=Y,m[r]=wc(R,O),r++)}for(let M=0;M<r;M++){if(d[M]!==null){s[M]=Cc(s,d,f,M);continue}s[M]=ln(a[M])}for(let M=1;M<r;M++)l[M]==="text"&&!o[M]&&Jo(s[M])&&l[M-1]==="text"&&!u[M-1]&&(s[M-1]+=s[M],o[M-1]=o[M-1]||o[M],s[M]="");const h=Array.from({length:r},()=>null);let E=-1;for(let M=r-1;M>=0;M--){const w=s[M];if(w.length!==0){if(l[M]==="text"&&!o[M]&&e1(w)&&E>=0&&l[E]==="text"){const _=h[E]??[];_.push(w),h[E]=_,c[E]=c[M],s[M]="";continue}E=M}}for(let M=0;M<r;M++){const w=h[M];w!=null&&(s[M]=o1(w,s[M]))}let A=0;for(let M=0;M<r;M++){const w=s[M];w.length!==0&&(A!==M&&(s[A]=w,o[A]=o[M],l[A]=l[M],c[A]=c[M]),A++)}s.length=A,o.length=A,l.length=A,c.length=A;const T=_1({len:A,texts:s,isWordLike:o,kinds:l,starts:c}),P=v1(x1(g1(m1(h1(f1(T))))));for(let M=0;M<P.len-1;M++){const w=r1(P.texts[M]);w!==null&&(P.kinds[M]!=="space"&&P.kinds[M]!=="preserved-space"||P.kinds[M+1]!=="text"||!yc(P.texts[M+1])||(P.texts[M]=w.space,P.isWordLike[M]=!1,P.kinds[M]=P.kinds[M]==="preserved-space"?"preserved-space":"space",P.texts[M+1]=w.marks+P.texts[M+1],P.starts[M+1]=P.starts[M]+w.space.length))}return P}function S1(n,e){if(n.len===0)return[];if(!e.preserveHardBreaks)return[{startSegmentIndex:0,endSegmentIndex:n.len,consumedEndSegmentIndex:n.len}];const t=[];let i=0;for(let r=0;r<n.len;r++)n.kinds[r]==="hard-break"&&(t.push({startSegmentIndex:i,endSegmentIndex:r,consumedEndSegmentIndex:r+1}),i=r+1);return i<n.len&&t.push({startSegmentIndex:i,endSegmentIndex:n.len,consumedEndSegmentIndex:n.len}),t}function M1(n){if(n.len<=1)return n;const e=[],t=[],i=[],r=[];let s=null,a=!1,o=0,l=!1,c=!1;function d(){s!==null&&(e.push(ln(s)),t.push(a),i.push("text"),r.push(o),s=null)}for(let f=0;f<n.len;f++){const u=n.texts[f],p=n.kinds[f],x=n.isWordLike[f],S=n.starts[f];if(p==="text"){const m=qM(u),h=bo(u);if(s!==null&&l&&c){s.push(u),a=a||x,l=l||m,c=h;continue}d(),s=[u],a=x,o=S,l=m,c=h;continue}d(),e.push(u),t.push(x),i.push(p),r.push(S)}return d(),{len:e.length,texts:e,isWordLike:t,kinds:i,starts:r}}function E1(n,e,t="normal",i="normal"){const r=kM(t),s=r.mode==="pre-wrap"?zM(n):VM(n);if(s.length===0)return{normalized:s,chunks:[],len:0,texts:[],isWordLike:[],kinds:[],starts:[]};const a=i==="keep-all"?M1(Fc(s,e,r)):Fc(s,e,r);return{normalized:s,chunks:S1(a,r),...a}}let Wi=null;const Pc=new Map;let $i=null;const b1=96,A1=new RegExp("\\p{Emoji_Presentation}","u"),y1=/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;let Aa=null;const Lc=new Map;function Qo(){if(Wi!==null)return Wi;if(typeof OffscreenCanvas<"u")return Wi=new OffscreenCanvas(1,1).getContext("2d"),Wi;if(typeof document<"u")return Wi=document.createElement("canvas").getContext("2d"),Wi;throw new Error("Text measurement requires OffscreenCanvas or a DOM canvas context.")}function T1(n){let e=Pc.get(n);return e||(e=new Map,Pc.set(n,e)),e}function ni(n,e){let t=e.get(n);return t===void 0&&(t={width:Qo().measureText(n).width,containsCJK:Hn(n)},e.set(n,t)),t}function Vs(){if($i!==null)return $i;if(typeof navigator>"u")return $i={lineFitEpsilon:.005,carryCJKAfterClosingQuote:!1,preferPrefixWidthsForBreakableRuns:!1,preferEarlySoftHyphenBreak:!1},$i;const n=navigator.userAgent,t=navigator.vendor==="Apple Computer, Inc."&&n.includes("Safari/")&&!n.includes("Chrome/")&&!n.includes("Chromium/")&&!n.includes("CriOS/")&&!n.includes("FxiOS/")&&!n.includes("EdgiOS/"),i=n.includes("Chrome/")||n.includes("Chromium/")||n.includes("CriOS/")||n.includes("Edg/");return $i={lineFitEpsilon:t?1/64:.005,carryCJKAfterClosingQuote:i,preferPrefixWidthsForBreakableRuns:t,preferEarlySoftHyphenBreak:t},$i}function C1(n){const e=n.match(/(\d+(?:\.\d+)?)\s*px/);return e?parseFloat(e[1]):16}function Ou(){return Aa===null&&(Aa=new Intl.Segmenter(void 0,{granularity:"grapheme"})),Aa}function w1(n){return A1.test(n)||n.includes("️")}function R1(n){return y1.test(n)}function N1(n,e){let t=Lc.get(n);if(t!==void 0)return t;const i=Qo();i.font=n;const r=i.measureText("😀").width;if(t=0,r>e+.5&&typeof document<"u"&&document.body!==null){const s=document.createElement("span");s.style.font=n,s.style.display="inline-block",s.style.visibility="hidden",s.style.position="absolute",s.textContent="😀",document.body.appendChild(s);const a=s.getBoundingClientRect().width;document.body.removeChild(s),r-a>.5&&(t=r-a)}return Lc.set(n,t),t}function F1(n){let e=0;const t=Ou();for(const i of t.segment(n))w1(i.segment)&&e++;return e}function P1(n,e){return e.emojiCount===void 0&&(e.emojiCount=F1(n)),e.emojiCount}function gi(n,e,t){return t===0?e.width:e.width-P1(n,e)*t}function L1(n,e,t,i,r){if(e.breakableFitAdvances!==void 0&&e.breakableFitMode===r)return e.breakableFitAdvances;e.breakableFitMode=r;const s=Ou(),a=[];for(const d of s.segment(n))a.push(d.segment);if(a.length<=1)return e.breakableFitAdvances=null,e.breakableFitAdvances;if(r==="sum-graphemes"){const d=[];for(const f of a){const u=ni(f,t);d.push(gi(f,u,i))}return e.breakableFitAdvances=d,e.breakableFitAdvances}if(r==="pair-context"||a.length>b1){const d=[];let f=null,u=0;for(const p of a){const x=ni(p,t),S=gi(p,x,i);if(f===null)d.push(S);else{const m=f+p,h=ni(m,t);d.push(gi(m,h,i)-u)}f=p,u=S}return e.breakableFitAdvances=d,e.breakableFitAdvances}const o=[];let l="",c=0;for(const d of a){l+=d;const f=ni(l,t),u=gi(l,f,i);o.push(u-c),c=u}return e.breakableFitAdvances=o,e.breakableFitAdvances}function D1(n,e){const t=Qo();t.font=n;const i=T1(n),r=C1(n),s=e?N1(n,r):0;return{cache:i,fontSize:r,emojiCorrection:s}}function I1(n){return n==="space"||n==="zero-width-break"||n==="soft-hyphen"}function ku(n){return n==="space"||n==="preserved-space"||n==="tab"||n==="zero-width-break"||n==="soft-hyphen"}function Vu(n,e,t=n.widths.length){for(;e<t;){const i=n.kinds[e];if(!I1(i))break;e++}return e}function U1(n,e){if(e<=0)return 0;const t=n%e;return Math.abs(t)<=1e-6?e:e-t}function B1(n,e,t){return n.letterSpacing!==0&&e&&n.spacingGraphemeCounts[t]>0?n.letterSpacing:0}function el(n,e){return e===0?0:n+e}function O1(n,e){return n.letterSpacing!==0&&n.spacingGraphemeCounts[e]>0?n.letterSpacing:0}function k1(n,e,t,i,r){const s=e==="tab"?r+O1(n,t):n.lineEndFitAdvances[t];return el(i,s)}function Dc(n,e,t,i){const r=e==="tab"?0:n.lineEndFitAdvances[t];return el(i,r)}function Ic(n,e,t,i,r){const s=e==="tab"?r:n.lineEndPaintAdvances[t];return el(i,s)}function V1(n,e,t){return n.letterSpacing!==0&&e?t+n.letterSpacing:t}function z1(n,e){return n.letterSpacing===0?e:e+n.letterSpacing}function G1(n,e,t,i,r,s){let a=0,o=e;for(;a<n.length;){const l=o+n[a]+s;if((a+1<n.length?l+r:l)>t+i)break;o=l,a++}return{fitCount:a,fittedWidth:o}}function H1(n,e,t){const{widths:i,kinds:r,breakableFitAdvances:s}=n;if(i.length===0)return 0;const o=Vs().lineFitEpsilon,l=e+o;let c=0,d=0,f=!1,u=0,p=0,x=0,S=0,m=-1,h=0;function E(){m=-1,h=0}function A(C=x,L=S,R=d){c++,t==null||t(R,u,p,C,L),d=0,f=!1,E()}function T(C,L){f=!0,u=C,p=0,x=C+1,S=0,d=L}function P(C,L,R){f=!0,u=C,p=L,x=C,S=L+1,d=R}function M(C,L){if(!f){T(C,L);return}d+=L,x=C+1,S=0}function w(C,L){const R=s[C];for(let O=L;O<R.length;O++){const $=R[O];f?d+$>l?(A(),P(C,O,$)):(d+=$,x=C,S=O+1):P(C,O,$)}f&&x===C&&S===R.length&&(x=C+1,S=0)}let _=0;for(;_<i.length&&!(!f&&(_=Vu(n,_),_>=i.length));){const C=i[_],L=r[_],R=ku(L);if(!f){C>l&&s[_]!==null?w(_,0):T(_,C),R&&(m=_+1,h=d-C),_++;continue}if(d+C>l){if(R){M(_,C),A(_+1,0,d-C),_++;continue}if(m>=0){if(x>m||x===m&&S>0){A();continue}A(m,0,h);continue}if(C>l&&s[_]!==null){A(),w(_,0),_++;continue}A();continue}M(_,C),R&&(m=_+1,h=d-C),_++}return f&&A(),c}function W1(n,e,t){if(n.simpleLineWalkFastPath)return H1(n,e,t);const{widths:i,kinds:r,breakableFitAdvances:s,discretionaryHyphenWidth:a,chunks:o}=n;if(i.length===0||o.length===0)return 0;const l=Vs(),c=l.lineFitEpsilon,d=e+c;let f=0,u=0,p=!1,x=0,S=0,m=0,h=0,E=-1,A=0,T=0,P=null;function M(){E=-1,A=0,T=0,P=null}function w(y=m,N=h,F=u){f++,t==null||t(F,x,S,y,N),u=0,p=!1,M()}function _(y,N){p=!0,x=y,S=0,m=y+1,h=0,u=N}function C(y,N,F){p=!0,x=y,S=N,m=y,h=N+1,u=F}function L(y,N){if(!p){_(y,N);return}u+=N,m=y+1,h=0}function R(y,N,F,k,H,J){if(!N)return;const re=Dc(n,y,F,H),xe=Ic(n,y,F,H,k);E=F+1,A=u-J+re,T=u-J+xe,P=y}function O(y,N){const F=s[y];for(let k=N;k<F.length;k++){const H=F[k];if(!p)C(y,k,H);else{const J=V1(n,!0,H),re=u+J;z1(n,re)>d?(w(),C(y,k,H)):(u=re,m=y,h=k+1)}}p&&m===y&&h===F.length&&(m=y+1,h=0)}function $(y){if(P!=="soft-hyphen")return!1;const N=s[y];if(N==null)return!1;const{fitCount:F,fittedWidth:k}=G1(N,u,e,c,a,n.letterSpacing);return F===0?!1:(u=k,m=y,h=F,M(),F===N.length?(m=y+1,h=0,!0):(w(y,F,k+a),O(y,F),!0))}function Y(y){f++,t==null||t(0,y.startSegmentIndex,0,y.consumedEndSegmentIndex,0),M()}for(let y=0;y<o.length;y++){const N=o[y];if(N.startSegmentIndex===N.endSegmentIndex){Y(N);continue}p=!1,u=0,x=N.startSegmentIndex,S=0,m=N.startSegmentIndex,h=0,M();let F=N.startSegmentIndex;for(;F<N.endSegmentIndex&&!(!p&&(F=Vu(n,F,N.endSegmentIndex),F>=N.endSegmentIndex));){const k=r[F],H=ku(k),J=B1(n,p,F),re=k==="tab"?U1(u+J,n.tabStopAdvance):i[F],xe=J+re,Re=k1(n,k,F,J,re);if(k==="soft-hyphen"){p&&(m=F+1,h=0,E=F+1,A=u+a,T=u+a,P=k),F++;continue}if(!p){Re>d&&s[F]!==null?O(F,0):_(F,re),R(k,H,F,re,J,xe),F++;continue}if(u+Re>d){const Ie=u+Dc(n,k,F,J),ee=u+Ic(n,k,F,J,re);if(P==="soft-hyphen"&&l.preferEarlySoftHyphenBreak&&A<=d){w(E,0,T);continue}if(P==="soft-hyphen"&&$(F)){F++;continue}if(H&&Ie<=d){L(F,xe),w(F+1,0,ee),F++;continue}if(E>=0&&A<=d){if(m>E||m===E&&h>0){w();continue}const pe=E;w(pe,0,T),F=pe;continue}if(Re>d&&s[F]!==null){w(),O(F,0),F++;continue}w();continue}L(F,xe),R(k,H,F,re,J,xe),F++}if(p){const k=E===N.consumedEndSegmentIndex?T:u;w(N.consumedEndSegmentIndex,0,k)}}return f}let ya=null,Uc=new WeakMap;function $1(){return ya===null&&(ya=new Intl.Segmenter(void 0,{granularity:"grapheme"})),ya}function Bc(n,e,t){let i=t.get(n);if(i!==void 0)return i;i=[];const r=$1();for(const s of r.segment(e[n]))i.push(s.segment);return t.set(n,i),i}function X1(n,e,t,i){return i>0&&n[i-1]==="soft-hyphen"&&!(e===i&&t>0)}function Oc(n,e,t,i){for(let r=t;r<i;r++)n+=e[r];return n}function q1(n){let e=Uc.get(n);return e!==void 0||(e=new Map,Uc.set(n,e)),e}function Y1(n,e,t,i,r,s){let a="";const o=X1(n.kinds,t,i,r);for(let l=t;l<r;l++)if(!(n.kinds[l]==="soft-hyphen"||n.kinds[l]==="hard-break"))if(l===t&&i>0){const c=Bc(l,n.segments,e);a=Oc(a,c,i,c.length)}else a+=n.segments[l];if(s>0){o&&(a+="-");const l=Bc(r,n.segments,e);a=Oc(a,l,t===r?i:0,s)}else o&&(a+="-");return a}let Ta=null;function zu(){return Ta===null&&(Ta=new Intl.Segmenter(void 0,{granularity:"grapheme"})),Ta}function K1(n){return{widths:[],lineEndFitAdvances:[],lineEndPaintAdvances:[],kinds:[],simpleLineWalkFastPath:!0,segLevels:null,breakableFitAdvances:[],letterSpacing:0,spacingGraphemeCounts:[],discretionaryHyphenWidth:0,tabStopAdvance:0,chunks:[],segments:[]}}function Z1(n,e){const t=[];let i=[],r=0,s=!1,a=!1,o=!1;function l(){i.length!==0&&(t.push({text:i.length===1?i[0]:i.join(""),start:r}),i=[],s=!1,a=!1,o=!1)}function c(f,u,p){i=[f],r=u,s=p,a=Ao(f),o=Os.has(f)}function d(f,u){i.push(f),s=s||u;const p=Ao(f);f.length===1&&bi.has(f)?a=a||p:a=p,o=!1}for(const f of zu().segment(n)){const u=f.segment,p=Hn(u);if(i.length===0){c(u,f.index,p);continue}if(o||Zo.has(u)||bi.has(u)||e.carryCJKAfterClosingQuote&&p&&a){d(u,p);continue}if(!s&&!p){d(u,p);continue}l(),c(u,f.index,p)}return l(),t}function j1(n){if(n.length<=1)return n;const e=[];let t=[n[0].text],i=n[0].start,r=Hn(n[0].text),s=bo(n[0].text);function a(){e.push({text:t.length===1?t[0]:t.join(""),start:i})}for(let o=1;o<n.length;o++){const l=n[o],c=Hn(l.text),d=bo(l.text);if(r&&s){t.push(l.text),r=r||c,s=d;continue}a(),t=[l.text],i=l.start,r=c,s=d}return a(),e}function kc(n,e){if(e==="zero-width-break"||e==="soft-hyphen"||e==="hard-break")return 0;if(e==="tab")return 1;let t=0;const i=zu();for(const r of i.segment(n))t++;return t}function J1(n,e,t){return e>1?n+(e-1)*t:n}function Q1(n,e,t,i,r){const s=Vs(),{cache:a,emojiCorrection:o}=D1(e,R1(n.normalized)),l=gi("-",ni("-",a),o)+(r===0?0:r),d=gi(" ",ni(" ",a),o)*8,f=r!==0;if(n.len===0)return K1();const u=[],p=[],x=[],S=[];let m=n.chunks.length<=1&&!f;const h=[],E=[],A=[],T=t?[]:null,P=Array.from({length:n.len});function M(L,R,O,$,Y,y,N,F){Y!=="text"&&Y!=="space"&&Y!=="zero-width-break"&&(m=!1),u.push(R),p.push(O),x.push($),S.push(Y),h==null||h.push(y),E.push(N),f&&A.push(F),T!==null&&T.push(L)}function w(L,R,O,$,Y){const y=ni(L,a),N=f?kc(L,R):0,F=J1(gi(L,y,o),N,r),k=R==="space"||R==="preserved-space"||R==="zero-width-break"?0:F,H=k===0?0:k+(N>0?r:0),J=R==="space"||R==="zero-width-break"?0:F;if(Y&&$&&L.length>1){let re="sum-graphemes";r!==0?re="segment-prefixes":Ts(L)?re="pair-context":s.preferPrefixWidthsForBreakableRuns&&(re="segment-prefixes");const xe=L1(L,y,a,o,re);M(L,F,H,J,R,O,xe,N);return}M(L,F,H,J,R,O,null,N)}for(let L=0;L<n.len;L++){P[L]=u.length;const R=n.texts[L],O=n.isWordLike[L],$=n.kinds[L],Y=n.starts[L];if($==="soft-hyphen"){M(R,0,l,l,$,Y,null,0);continue}if($==="hard-break"){M(R,0,0,0,$,Y,null,0);continue}if($==="tab"){M(R,0,0,0,$,Y,null,f?kc(R,$):0);continue}const y=ni(R,a);if($==="text"&&y.containsCJK){const N=Z1(R,s),F=i==="keep-all"?j1(N):N;for(let k=0;k<F.length;k++){const H=F[k];w(H.text,"text",Y+H.start,O,i==="keep-all"||!Hn(H.text))}continue}w(R,$,Y,O,!0)}const _=eE(n.chunks,P,u.length),C=h===null?null:UM(n.normalized,h);return T!==null?{widths:u,lineEndFitAdvances:p,lineEndPaintAdvances:x,kinds:S,simpleLineWalkFastPath:m,segLevels:C,breakableFitAdvances:E,letterSpacing:r,spacingGraphemeCounts:A,discretionaryHyphenWidth:l,tabStopAdvance:d,chunks:_,segments:T}:{widths:u,lineEndFitAdvances:p,lineEndPaintAdvances:x,kinds:S,simpleLineWalkFastPath:m,segLevels:C,breakableFitAdvances:E,letterSpacing:r,spacingGraphemeCounts:A,discretionaryHyphenWidth:l,tabStopAdvance:d,chunks:_}}function eE(n,e,t){const i=[];for(let r=0;r<n.length;r++){const s=n[r],a=s.startSegmentIndex<e.length?e[s.startSegmentIndex]:t,o=s.endSegmentIndex<e.length?e[s.endSegmentIndex]:t,l=s.consumedEndSegmentIndex<e.length?e[s.consumedEndSegmentIndex]:t;i.push({startSegmentIndex:a,endSegmentIndex:o,consumedEndSegmentIndex:l})}return i}function tE(n,e,t,i){const r=(i==null?void 0:i.wordBreak)??"normal",s=(i==null?void 0:i.letterSpacing)??0,a=E1(n,Vs(),i==null?void 0:i.whiteSpace,r);return Q1(a,e,t,r,s)}function nE(n,e,t){return tE(n,e,!0,t)}function iE(n,e,t,i,r,s,a){return{text:Y1(n,e,i,r,s,a),width:t,start:{segmentIndex:i,graphemeIndex:r},end:{segmentIndex:s,graphemeIndex:a}}}function rE(n,e,t){const i=[];if(n.widths.length===0)return{lineCount:0,height:0,lines:i};const r=q1(n),s=W1(n,e,(a,o,l,c,d)=>{i.push(iE(n,r,a,o,l,c,d))});return{lineCount:s,height:s*t,lines:i}}function sE(){return typeof document>"u"||typeof HTMLCanvasElement>"u"}const Vc=new Map;function aE(n,e,t){return JSON.stringify({t:n,f:e,o:t??{}})}function oE(n,e,t){if(sE())return null;const i=aE(n,e,t);let r=Vc.get(i);return r||(r={plain:null,segmented:null},Vc.set(i,r)),r.segmented||(r.segmented=nE(n,e,t)),r.segmented}function lE(n,e,t){return n?rE(n,e,t):{height:0,lineCount:0,lines:[]}}const cE={class:"problem-visual","aria-labelledby":"problem-title"},uE={class:"problem-stage"},dE=Ce({__name:"ProblemVisual",setup(n){const e=et(null);let t=0,i=null;const r=["your GPU can run this","one command setup","detects hardware","sizes every model","writes start scripts","agent-ready API","no config wrangling","streaming normalized","tool calls translated","just code"];function s(o=0){const l=e.value;if(!l)return;const c=l.getContext("2d");if(!c)return;const d=l.getBoundingClientRect(),f=window.devicePixelRatio||1,u=Math.max(1,Math.floor(d.width)),p=Math.max(1,Math.floor(d.height));(l.width!==u*f||l.height!==p*f)&&(l.width=u*f,l.height=p*f),c.setTransform(f,0,0,f,0,0),c.clearRect(0,0,u,p),c.font="12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",c.lineWidth=1;const x=oE("one gateway · any model · local or cloud","12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",{whiteSpace:"pre-wrap"}),m=lE(x,Math.max(220,u*.46),18).lines.length>1?18:0;for(let h=0;h<r.length;h++){const E=h%5,T=(h*137+o*(.012+E*.002))%(u+180)-140,P=28+E*((p-56)/4),M=.14+Math.sin(o*.002+h)*.06;c.fillStyle=`rgba(117, 167, 223, ${M})`,c.fillText(r[h],T,P+m),c.strokeStyle=`rgba(86, 141, 208, ${M*.75})`,c.beginPath(),c.moveTo(T-28,P+6),c.lineTo(T-8,P+6),c.stroke()}c.strokeStyle="rgba(86, 141, 208, 0.12)";for(let h=18;h<p;h+=26)c.beginPath(),c.moveTo(0,h),c.lineTo(u,h),c.stroke()}function a(o=0){s(o),t=window.requestAnimationFrame(a)}return wn(()=>{e.value&&(i=new ResizeObserver(()=>s()),i.observe(e.value)),s(),window.matchMedia("(prefers-reduced-motion: reduce)").matches||(t=window.requestAnimationFrame(a))}),br(()=>{t&&window.cancelAnimationFrame(t),i&&i.disconnect()}),(o,l)=>(B(),j("section",cE,[Z("div",uE,[Z("canvas",{ref_key:"canvasEl",ref:e,class:"problem-canvas","aria-hidden":"true"},null,512),l[0]||(l[0]=Z("div",{class:"problem-copy"},[Z("p",{class:"relay-section-label"},"The Problem"),Z("h2",{id:"problem-title",class:"problem-title"},[Z("span",null,"Almost compatible"),Z("strong",null,"is where agents break.")]),Z("p",{class:"problem-lede"}," Local model servers and cloud APIs speak familiar protocols until the details matter: stream events, tool calls, fields, errors, and capability metadata. Relay makes the boundary actually compatible — same API surface whether your model runs on your GPU or someone else's. ")],-1))]),l[1]||(l[1]=ps('<div class="problem-ticker" aria-hidden="true" data-v-ac9c3c7e><span data-v-ac9c3c7e>headers drift</span><span data-v-ac9c3c7e>tool calls fork</span><span data-v-ac9c3c7e>SSE chunks wobble</span><span data-v-ac9c3c7e>model IDs lie</span><span data-v-ac9c3c7e>errors change shape</span><span data-v-ac9c3c7e>agents need one contract</span></div><div class="relay-pain-grid" data-v-ac9c3c7e><div class="relay-pain-card" data-v-ac9c3c7e><p data-v-ac9c3c7e>OpenAI-compatible endpoints differ subtly across backends — header conventions, field presence, and error shapes don&#39;t match what SDKs expect.</p></div><div class="relay-pain-card" data-v-ac9c3c7e><p data-v-ac9c3c7e>Anthropic clients expect specific message shapes, streaming event orders, and tool-call structures different from what upstream servers return.</p></div><div class="relay-pain-card" data-v-ac9c3c7e><p data-v-ac9c3c7e>Tool calls, model IDs, SSE chunk framing, and capability metadata often cause agent loops to break or silently degrade across providers.</p></div><div class="relay-pain-card relay-pain-card-accent" data-v-ac9c3c7e><p data-v-ac9c3c7e>Relay normalizes the boundary — local GPU or cloud API, same contract. No special-casing per backend, no agent-side workarounds.</p></div></div>',2))]))}}),fE=Le(dE,[["__scopeId","data-v-ac9c3c7e"]]),hE={class:"relay-terminal",ref:"terminalEl"},pE={class:"relay-terminal-bar"},mE=["aria-label","title"],xE={key:0},gE={key:1},_E=Ce({__name:"TerminalBlock",setup(n){const e=et(!1);let t=null;function i(){const s=document.querySelector(".relay-terminal pre code");if(!s)return;const a=s.childNodes;let o="";for(const l of a)l.nodeType===Node.TEXT_NODE&&(o+=l.textContent||"");navigator.clipboard.writeText(o).then(()=>{r()}).catch(()=>{const l=document.createElement("textarea");l.value=o,l.style.position="fixed",l.style.opacity="0",document.body.appendChild(l),l.select();try{document.execCommand("copy")}catch{}document.body.removeChild(l),r()})}function r(){e.value=!0,t&&clearTimeout(t),t=setTimeout(()=>{e.value=!1},2e3)}return(s,a)=>(B(),j("div",hE,[Z("div",pE,[a[0]||(a[0]=Z("span",{class:"relay-terminal-dot"},null,-1)),a[1]||(a[1]=Z("span",{class:"relay-terminal-dot"},null,-1)),a[2]||(a[2]=Z("span",{class:"relay-terminal-dot"},null,-1)),a[3]||(a[3]=Z("span",{class:"relay-terminal-label"},"terminal",-1)),Z("button",{class:lt(["relay-terminal-copy",{"relay-terminal-copy--copied":e.value}]),"aria-label":e.value?"Copied":"Copy to clipboard",title:e.value?"Copied":"Copy to clipboard",onClick:i},[e.value?(B(),j("span",xE,"✓")):(B(),j("span",gE,"⧙"))],10,mE)]),Z("pre",null,[Z("code",null,[te(s.$slots,"default",{},void 0,!0),a[4]||(a[4]=Z("span",{class:"relay-cursor","aria-hidden":"true"}," ",-1))])])],512))}}),vE=Le(_E,[["__scopeId","data-v-8f721c20"]]),ME={extends:ml,Layout(){return ar(ml.Layout,null,{"nav-bar-title-before":()=>ar("div",{class:"relay-nav-logo"},[ar(Xm,{size:24}),ar("span",{class:"relay-nav-text"},"Relay")]),"home-hero-image":()=>ar(wM,{width:800,height:420})})},enhanceApp({app:n}){n.component("CompatibilityVisual",PM),n.component("ProblemVisual",fE),n.component("TerminalBlock",vE)}};export{ME as R,Tp as c,je as u};
