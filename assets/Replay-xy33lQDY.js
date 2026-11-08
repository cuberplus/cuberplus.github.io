const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/main-Ck5o6K0Y.css","assets/DiscoverAlgorithms-BQnpZFD9.css","assets/Database-CzPzwu-W.css"])))=>i.map(i=>d[i]);
import{r as S,j as o,ac as vr,ad as wr,u as Ct,I as yr}from"./main-xu7ODFyg.js";import{s as Et,l as xr,j as Mr,f as te,t as br,m as Sr,o as ke,q as Tr,u as zr,i as Ir}from"./storage-DQPQgtry.js";import{crossRotation as kr,movesOf as Lr}from"./puzzle-CJOlooja.js";import{L as Nt,M as G,A as H,a as Ar,b as Dr,p as Pt,d as Cr,c as Er,o as Nr,T as Oe,f as Fe,h as et,i as Pr,j as Rr,G as Pe,C as it,k as jr,N as Or,l as at,s as le,m as ge,n as Fr,P as st}from"./cubing-core-CIxi9GK6.js";import{_ as tt}from"./preload-helper-bFjQlsqE.js";import{c as Vr,a as Br,b as Ur}from"./chunk-UEUJSZTX-BeuSS03m.js";import{c as Rt,C as Re,a as jt,b as qr,e as Wr,d as Hr,f as $r}from"./algorithmMatching-C7A6BAmr.js";import{p as Qr}from"./f2l-B2ItKnj_.js";import{p as Yr}from"./CsvParser-Cb3uMD94.js";import{r as _r,m as We,M as Gr,a as ot,f as Xr}from"./MistakeAnalysis-DiA_IbPT.js";import{u as Zr,b as Kr}from"./caseImages-CSaaEXvJ.js";import{nonFavoriteAlgorithms as Jr,unlearnAlgorithms as en}from"./favoriteAlgorithms-CC7z4Pfv.js";var Ve=class{#e=0;#t=0;queue(e){return new Promise(async(t,r)=>{try{const n=++this.#e,i=await e;n>this.#t&&(this.#t=n,t(i))}catch(n){r(n)}})}},Ot=0,Ft=class{canReuse(e,t){return e===t||this.canReuseValue(e,t)}canReuseValue(e,t){return!1}debugGetChildren(){return Array.from(this.#e.values())}#e=new Set;addChild(e){this.#e.add(e)}removeChild(e){this.#e.delete(e)}lastSourceGeneration=0;markStale(e){if(e.detail.generation!==Ot)throw new Error("A TwistyProp was marked stale too late!");if(this.lastSourceGeneration!==e.detail.generation){this.lastSourceGeneration=e.detail.generation;for(const t of this.#e)t.markStale(e);this.#r()}}#t=new Set;addRawListener(e,t){this.#t.add(e),t?.initial&&e()}removeRawListener(e){this.#t.delete(e)}#r(){this.#n||(this.#n=!0,setTimeout(()=>this.#a(),0))}#n=!1;#a(){if(!this.#n)throw new Error("Invalid dispatch state!");for(const e of this.#t)e();this.#n=!1}#i=new Map;addFreshListener(e){const t=new Ve;let r=null;const n=async()=>{const i=await t.queue(this.get());r!==null&&this.canReuse(r,i)||(r=i,e(i))};this.#i.set(e,n),this.addRawListener(n,{initial:!0})}removeFreshListener(e){this.removeRawListener(this.#i.get(e)),this.#i.delete(e)}},ie=class extends Ft{#e;constructor(e){super(),this.#e=new Nt(async()=>this.getDefaultValue()),e&&(this.#e=this.deriveFromPromiseOrValue(e,this.#e))}set(e){this.#e=this.deriveFromPromiseOrValue(e,this.#e);const t={sourceProp:this,value:this.#e,generation:++Ot};this.markStale(new CustomEvent("stale",{detail:t}))}async get(){return this.#e}async deriveFromPromiseOrValue(e,t){return this.derive(await e,t)}},k=class extends ie{derive(e){return e}},ve=Symbol("no value"),D=class extends Ft{constructor(e,t){super(),this.userVisibleErrorTracker=t,this.#e=e;for(const r of Object.values(e))r.addChild(this)}userVisibleErrorTracker;#e;#t=null;#r=null;async get(){const e=this.lastSourceGeneration;if(this.#r?.generation===e)return this.#r.output;const t={generation:e,output:this.#a(this.#n(),e,this.#t)};return this.#r=t,this.userVisibleErrorTracker?.reset(),t.output}async#n(){const e={};for(const[r,n]of Object.entries(this.#e))e[r]=n.get();const t={};for(const r in this.#e)t[r]=await e[r];return t}async#a(e,t,r=null){const n=await e,i=s=>(this.#t={inputs:n,output:Promise.resolve(s),generation:t},s);if(!r)return i(await this.derive(n));const a=r.inputs;for(const s in this.#e)if(!this.#e[s].canReuse(n[s],a[s]))return i(await this.derive(n));return r.output}},Me=class{#e=[];addListener(e,t){let r=!1;const n=i=>{r||t(i)};e.addFreshListener(n),this.#e.push(()=>{e.removeFreshListener(n),r=!0})}addMultiListener3(e,t){this.addMultiListener(e,t)}addMultiListener(e,t){let r=!1,n=e.length-1;const i=async a=>{if(n>0){n--;return}if(r)return;const s=e.map(u=>u.get()),c=await Promise.all(s);t(c)};for(const a of e)a.addFreshListener(i);this.#e.push(()=>{for(const a of e)a.removeFreshListener(i);r=!0})}disconnect(){for(const e of this.#e)e()}},tn=class{},we;globalThis.HTMLElement?we=globalThis.HTMLElement:we=tn;var rn=class{define(){}},B;globalThis.customElements?B=globalThis.customElements:B=new rn;var Q,nn=class{replaceSync(){}};globalThis.CSSStyleSheet?Q=globalThis.CSSStyleSheet:Q=nn;var Y=class extends we{shadow;contentWrapper;constructor(e){super(),this.shadow=this.attachShadow({mode:e?.mode??"closed"}),this.contentWrapper=document.createElement("div"),this.contentWrapper.classList.add("wrapper"),this.shadow.appendChild(this.contentWrapper)}addCSS(e){this.shadow.adoptedStyleSheets.push(e)}removeCSS(e){const t=this.shadow.adoptedStyleSheets.indexOf(e);typeof t<"u"&&this.shadow.adoptedStyleSheets.splice(t,t+1)}addElement(e){return this.contentWrapper.appendChild(e)}prependElement(e){this.contentWrapper.prepend(e)}removeElement(e){return this.contentWrapper.removeChild(e)}};B.define("twisty-managed-custom-element",Y);var me=class{constructor(e){this.callback=e}callback;animFrameID=null;animFrame=this.animFrameWrapper.bind(this);requestIsPending(){return!!this.animFrameID}requestAnimFrame(){this.animFrameID||(this.animFrameID=requestAnimationFrame(this.animFrame))}cancelAnimFrame(){this.animFrameID&&(cancelAnimationFrame(this.animFrameID),this.animFrameID=0)}animFrameWrapper(e){this.animFrameID=0,this.callback(e)}},an={floating:!0,none:!0},sn=class extends k{getDefaultValue(){return"auto"}},on=Math.PI*2,ye=360/on,X=new Nt(()=>tt(()=>import("./twisty-dynamic-3d-4BEQ76PB-Df1MGeX2.js"),__vite__mapDeps([0])));function _e(){return devicePixelRatio||1}var lt=.1,ln=class extends EventTarget{constructor(e){super(),this.target=e}target;#e=new Map;start(){this.addTargetListener("pointerdown",this.onPointerDown.bind(this)),this.addTargetListener("contextmenu",e=>{e.preventDefault()}),this.addTargetListener("touchmove",e=>e.preventDefault()),this.addTargetListener("dblclick",e=>e.preventDefault())}stop(){for(const[e,t]of this.#t.entries())this.target.removeEventListener(e,t);this.#t.clear(),this.#r=!1}#t=new Map;addTargetListener(e,t){this.#t.has(e)||(this.target.addEventListener(e,t),this.#t.set(e,t))}#r=!1;#n(){this.#r||(this.addTargetListener("pointermove",this.onPointerMove.bind(this)),this.addTargetListener("pointerup",this.onPointerUp.bind(this)),this.#r=!0)}#a(e){this.#e.delete(e.pointerId)}#i(e){const t=this.#e.get(e.pointerId);if(!t)return{movementInfo:null,hasMoved:!1};let r;return(e.movementX??0)!==0||(e.movementY??0)!==0?r={attachedInfo:t.attachedInfo,movementX:e.movementX,movementY:e.movementY,elapsedMs:e.timeStamp-t.lastTimeStamp}:r={attachedInfo:t.attachedInfo,movementX:e.clientX-t.lastClientX,movementY:e.clientY-t.lastClientY,elapsedMs:e.timeStamp-t.lastTimeStamp},t.lastClientX=e.clientX,t.lastClientY=e.clientY,t.lastTimeStamp=e.timeStamp,Math.abs(r.movementX)<lt&&Math.abs(r.movementY)<lt?{movementInfo:null,hasMoved:t.hasMoved}:(t.hasMoved=!0,{movementInfo:r,hasMoved:t.hasMoved})}onPointerDown(e){this.#n();const t={attachedInfo:{},hasMoved:!1,lastClientX:e.clientX,lastClientY:e.clientY,lastTimeStamp:e.timeStamp};this.#e.set(e.pointerId,t),this.target.setPointerCapture(e.pointerId)}onPointerMove(e){const t=this.#i(e).movementInfo;t&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("move",{detail:t})))}onPointerUp(e){const t=this.#i(e),r=this.#e.get(e.pointerId);this.#a(e),this.target.releasePointerCapture(e.pointerId);let n;if(t.hasMoved)n=new CustomEvent("up",{detail:{attachedInfo:r.attachedInfo}});else{const{altKey:i,ctrlKey:a,metaKey:s,shiftKey:c}=e;n=new CustomEvent("press",{detail:{normalizedX:e.offsetX/this.target.offsetWidth*2-1,normalizedY:1-e.offsetY/this.target.offsetHeight*2,rightClick:!!(e.button&2),keys:{altKey:i,ctrlOrMetaKey:a||s,shiftKey:c}}})}this.dispatchEvent(n)}},fe=[];async function Vt(e,t,r,n){fe.length===0&&fe.push(rt());const i=await fe[0];return i.setSize(e,t),i.render(r,n),i.domElement}async function cn(e,t,r,n,i){if(e===0||t===0)return;fe.length===0&&fe.push(rt());const a=await Vt(e,t,n,i),s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.drawImage(a,0,0)}var dn="srgb-linear";async function rt(){const e=(await X).ThreeWebGLRenderer,t=new e({antialias:!0,alpha:!0});return t.outputColorSpace=dn,t.setPixelRatio(_e()),t}var Bt=new Q;Bt.replaceSync(`
:host {
  width: 384px;
  height: 256px;
  display: grid;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  overflow: hidden;
  place-content: center;
  contain: strict;
}

.loading {
  width: 4em;
  height: 4em;
  border-radius: 2.5em;
  border: 0.5em solid rgba(0, 0, 0, 0);
  border-top: 0.5em solid rgba(0, 0, 0, 0.7);
  border-right: 0.5em solid rgba(0, 0, 0, 0.7);
  animation: fade-in-delayed 4s, rotate 1s linear infinite;
}

@keyframes fade-in-delayed {
  0% { opacity: 0; }
  25% {opacity: 0; }
  100% { opacity: 1; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* TODO: This is due to stats hack. Replace with \`canvas\`. */
.wrapper > canvas {
  max-width: 100%;
  max-height: 100%;
  animation: fade-in 0.25s ease-in;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.wrapper.invisible {
  opacity: 0;
}

.wrapper.drag-input-enabled > canvas {
  cursor: grab;
}

.wrapper.drag-input-enabled > canvas:active {
  cursor: grabbing;
}
`);var un=!0,He=500,hn=50,mn=.75;function ct(e){return(Math.exp(1-e)-(1-e))/(1-Math.E)+1}var pn=class{constructor(e,t,r,n){this.startTimestamp=e,this.momentumX=t,this.momentumY=r,this.callback=n,this.scheduler.requestAnimFrame(),this.lastTimestamp=e}startTimestamp;momentumX;momentumY;callback;scheduler=new me(this.render.bind(this));lastTimestamp;render(e){const t=(this.lastTimestamp-this.startTimestamp)/He,r=Math.min(1,(e-this.startTimestamp)/He);if(t===0&&r>hn/He)return;const n=ct(r)-ct(t);this.callback(this.momentumX*n*1e3,this.momentumY*n*1e3),r<1&&this.scheduler.requestAnimFrame(),this.lastTimestamp=e}},gn=class{constructor(e,t,r,n){this.model=e,this.mirror=t,this.canvas=r,this.dragTracker=n,this.dragTracker.addEventListener("move",this.onMove.bind(this)),this.dragTracker.addEventListener("up",this.onUp.bind(this))}model;mirror;canvas;dragTracker;experimentalInertia=un;onMovementBound=this.onMovement.bind(this);experimentalHasBeenMoved=!1;temperMovement(e){return Math.sign(e)*Math.log(Math.abs(e*10)+1)/6}onMove(e){e.detail.attachedInfo??={};const{temperedX:t,temperedY:r}=this.onMovement(e.detail.movementX,e.detail.movementY),n=e.detail.attachedInfo;n.lastTemperedX=t*10,n.lastTemperedY=r*10,n.timestamp=e.timeStamp}onMovement(e,t){const r=this.mirror?-1:1,n=Math.min(this.canvas.offsetWidth,this.canvas.offsetHeight),i=this.temperMovement(e/n),a=this.temperMovement(t/n*mn);return this.model.twistySceneModel.orbitCoordinatesRequest.set((async()=>{const s=await this.model.twistySceneModel.orbitCoordinates.get();return{latitude:s.latitude+2*a*ye*r,longitude:s.longitude-2*i*ye}})()),{temperedX:i,temperedY:a}}onUp(e){e.preventDefault(),"lastTemperedX"in e.detail.attachedInfo&&"lastTemperedY"in e.detail.attachedInfo&&"timestamp"in e.detail.attachedInfo&&e.timeStamp-e.detail.attachedInfo.timestamp<60&&new pn(e.timeStamp,e.detail.attachedInfo.lastTemperedX,e.detail.attachedInfo.lastTemperedY,this.onMovementBound)}};async function Ut(e,t,r=!1){const n=new(await X).ThreeSpherical(t.distance,(90-(r?-1:1)*t.latitude)/ye,((r?180:0)+t.longitude)/ye);n.makeSafe(),e.position.setFromSpherical(n),e.lookAt(0,0,0)}var dt=0,fn=2,qt=!1;function vn(){return dt<fn?(dt++,!1):(qt=!0,!0)}function Ya(){return qt}var Ge=class extends Y{constructor(e,t,r){super(),this.model=e,this.options=r,this.scene=t??null,this.loadingElement=this.addElement(document.createElement("div")),this.loadingElement.classList.add("loading")}model;options;scene=null;stats=null;rendererIsShared=vn();loadingElement=null;async connectedCallback(){this.addCSS(Bt),this.addElement((await this.canvasInfo()).canvas),this.#a(),new ResizeObserver(this.#a.bind(this)).observe(this.contentWrapper),this.orbitControls(),this.#e(),this.scheduleRender()}async#e(){(await this.#l()).addEventListener("press",(async t=>{await this.model.twistySceneModel.movePressInput.get()==="basic"&&this.dispatchEvent(new CustomEvent("press",{detail:{pressInfo:t.detail,cameraPromise:this.camera()}}))}))}#t=new Ve;async clearCanvas(){if(this.rendererIsShared){const e=await this.canvasInfo();e.context.clearRect(0,0,e.canvas.width,e.canvas.height)}else{const t=(await this.renderer()).getContext();t.clear(t.COLOR_BUFFER_BIT)}}#r=0;#n=0;async#a(){const e=await this.#t.queue(this.camera()),t=this.contentWrapper.clientWidth,r=this.contentWrapper.clientHeight;this.#r=t,this.#n=r;const n=0;let i=0,a=0;if(r>t&&(a=r-t,i=-Math.floor(.5*a)),e.aspect=t/r,e.setViewOffset(t,r-a,n,i,t,r),e.updateProjectionMatrix(),this.clearCanvas(),this.rendererIsShared){const s=await this.canvasInfo();s.canvas.width=t*_e(),s.canvas.height=r*_e(),s.canvas.style.width=`${t.toString()}px`,s.canvas.style.height=`${r.toString()}px`}else(await this.renderer()).setSize(t,r,!0);this.scheduleRender()}#i=null;async renderer(){if(this.rendererIsShared)throw new Error("renderer expected to be shared.");return this.#i??=rt()}#s=null;async canvasInfo(){return this.#s??=(async()=>{let e;if(this.rendererIsShared)e=this.addElement(document.createElement("canvas"));else{const r=await this.renderer();e=this.addElement(r.domElement)}this.loadingElement?.remove();const t=e.getContext("2d");return{canvas:e,context:t}})()}#o=null;async#l(){return this.#o??=(async()=>{const e=new ln((await this.canvasInfo()).canvas);return this.model?.twistySceneModel.dragInput.addFreshListener(t=>{let r=!1;switch(t){case"auto":{e.start(),r=!0;break}case"none":{e.stop();break}}this.contentWrapper.classList.toggle("drag-input-enabled",r)}),e})()}#d=null;async camera(){return this.#d??=(async()=>{const e=new(await X).ThreePerspectiveCamera(20,1,.1,20);return e.position.copy(new(await X).ThreeVector3(2,4,4).multiplyScalar(this.options?.backView?-1:1)),e.lookAt(0,0,0),e})()}#u=null;async orbitControls(){return this.#u??=(async()=>{const e=new gn(this.model,!!this.options?.backView,(await this.canvasInfo()).canvas,await this.#l());return this.model&&this.addListener(this.model.twistySceneModel.orbitCoordinates,async t=>{const r=await this.camera();Ut(r,t,this.options?.backView),this.scheduleRender()}),e})()}addListener(e,t){e.addFreshListener(t),this.#c.push(()=>{e.removeFreshListener(t)})}#c=[];disconnect(){for(const e of this.#c)e();this.#c=[]}#h=null;experimentalNextRenderFinishedCallback(e){this.#h=e}async render(){if(!this.scene)throw new Error("Attempted to render without a scene");this.stats?.begin();const[e,t,r]=await Promise.all([this.scene.scene(),this.camera(),this.canvasInfo()]);this.rendererIsShared?await cn(this.#r,this.#n,r.canvas,e,t):(await this.renderer()).render(e,t),this.stats?.end(),this.#h?.(),this.#h=null}#m=new me(this.render.bind(this));scheduleRender(){this.#m.requestAnimFrame()}};B.define("twisty-3d-vantage",Ge);function oe(e){switch(Math.abs(e)){case 0:return 0;case 1:return 1e3;case 2:return 1500;default:return 2e3}}var Wt=class extends Oe{constructor(e=oe){super(),this.durationForAmount=e}durationForAmount;traverseAlg(e){let t=0;for(const r of e.childAlgNodes())t+=this.traverseAlgNode(r);return t}traverseGrouping(e){return e.amount*this.traverseAlg(e.alg)}traverseMove(e){return this.durationForAmount(e.amount)}traverseCommutator(e){return 2*(this.traverseAlg(e.A)+this.traverseAlg(e.B))}traverseConjugate(e){return 2*this.traverseAlg(e.A)+this.traverseAlg(e.B)}traversePause(e){return this.durationForAmount(1)}traverseNewline(e){return this.durationForAmount(1)}traverseLineComment(e){return this.durationForAmount(0)}},wn=class{constructor(e,t){this.kpuzzle=e,this.moves=new H(t.experimentalExpand())}kpuzzle;moves;durationFn=new Wt(oe);getAnimLeaf(e){return Array.from(this.moves.childAlgNodes())[e]}indexToMoveStartTimestamp(e){const t=new H(Array.from(this.moves.childAlgNodes()).slice(0,e));return this.durationFn.traverseAlg(t)}timestampToIndex(e){let t=0,r;for(r=0;r<this.numAnimatedLeaves();r++)if(t+=this.durationFn.traverseMove(this.getAnimLeaf(r)),t>=e)return r;return r}patternAtIndex(e){return this.kpuzzle.defaultPattern().applyTransformation(this.transformationAtIndex(e))}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of Array.from(this.moves.childAlgNodes()).slice(0,e))t=t.applyMove(r);return t}algDuration(){return this.durationFn.traverseAlg(this.moves)}numAnimatedLeaves(){return Br(this.moves)}moveDuration(e){return this.durationFn.traverseMove(this.getAnimLeaf(e))}},se=class{constructor(e,t,r,n,i=[]){this.moveCount=e,this.duration=t,this.forward=r,this.backward=n,this.children=i}moveCount;duration;forward;backward;children},yn=class extends Oe{constructor(e){super(),this.kpuzzle=e,this.identity=e.identityTransformation(),this.dummyLeaf=new se(0,0,this.identity,this.identity,[])}kpuzzle;identity;dummyLeaf;durationFn=new Wt(oe);cache={};traverseAlg(e){let t=0,r=0,n=this.identity;const i=[];for(const a of e.childAlgNodes()){const s=this.traverseAlgNode(a);t+=s.moveCount,r+=s.duration,n===this.identity?n=s.forward:n=n.applyTransformation(s.forward),i.push(s)}return new se(t,r,n,n.invert(),i)}traverseGrouping(e){const t=this.traverseAlg(e.alg);return this.mult(t,e.amount,[t])}traverseMove(e){const t=e.toString();let r=this.cache[t];if(r)return r;const n=this.kpuzzle.moveToTransformation(e);return r=new se(1,this.durationFn.traverseAlgNode(e),n,n.invert()),this.cache[t]=r,r}traverseCommutator(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),n=t.forward.applyTransformation(r.forward),i=t.backward.applyTransformation(r.backward),a=n.applyTransformation(i),s=new se(2*(t.moveCount+r.moveCount),2*(t.duration+r.duration),a,a.invert(),[t,r]);return this.mult(s,1,[s,t,r])}traverseConjugate(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),i=t.forward.applyTransformation(r.forward).applyTransformation(t.backward),a=new se(2*t.moveCount+r.moveCount,2*t.duration+r.duration,i,i.invert(),[t,r]);return this.mult(a,1,[a,t,r])}traversePause(e){return e.experimentalNISSGrouping?this.dummyLeaf:new se(1,this.durationFn.traverseAlgNode(e),this.identity,this.identity)}traverseNewline(e){return this.dummyLeaf}traverseLineComment(e){return this.dummyLeaf}mult(e,t,r){const n=Math.abs(t),i=e.forward.selfMultiply(t);return new se(e.moveCount*n,e.duration*n,i,i.invert(),r)}},j=class{constructor(e,t){this.apd=e,this.back=t}apd;back},xn=class extends et{constructor(e,t,r){super(),this.kpuzzle=e,this.algOrAlgNode=t,this.apd=r,this.i=-1,this.dur=-1,this.goalIndex=-1,this.goalDuration=-1,this.move=void 0,this.back=!1,this.moveDuration=0,this.st=this.kpuzzle.identityTransformation(),this.root=new j(this.apd,!1)}kpuzzle;algOrAlgNode;apd;move;moveDuration;back;st;root;i;dur;goalIndex;goalDuration;moveByIndex(e){return this.i>=0&&this.i===e?this.move!==void 0:this.dosearch(e,1/0)}moveByDuration(e){return this.dur>=0&&this.dur<e&&this.dur+this.moveDuration>=e?this.move!==void 0:this.dosearch(1/0,e)}dosearch(e,t){return this.goalIndex=e,this.goalDuration=t,this.i=0,this.dur=0,this.move=void 0,this.moveDuration=0,this.back=!1,this.st=this.kpuzzle.identityTransformation(),this.algOrAlgNode.is(H)?this.traverseAlg(this.algOrAlgNode,this.root):this.traverseAlgNode(this.algOrAlgNode,this.root)}traverseAlg(e,t){if(!this.firstcheck(t))return!1;let r=t.back?e.experimentalNumChildAlgNodes()-1:0;for(const n of Pr(e.childAlgNodes(),t.back?-1:1)){if(this.traverseAlgNode(n,new j(t.apd.children[r],t.back)))return!0;r+=t.back?-1:1}return!1}traverseGrouping(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,e.amount);return this.traverseAlg(e.alg,new j(t.apd.children[0],r))}traverseMove(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseCommutator(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.B,new j(t.apd.children[2],!r))||this.traverseAlg(e.A,new j(t.apd.children[1],!r))||this.traverseAlg(e.B,new j(t.apd.children[2],r))||this.traverseAlg(e.A,new j(t.apd.children[1],r)):this.traverseAlg(e.A,new j(t.apd.children[1],r))||this.traverseAlg(e.B,new j(t.apd.children[2],r))||this.traverseAlg(e.A,new j(t.apd.children[1],!r))||this.traverseAlg(e.B,new j(t.apd.children[2],!r))}traverseConjugate(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.A,new j(t.apd.children[1],!r))||this.traverseAlg(e.B,new j(t.apd.children[2],r))||this.traverseAlg(e.A,new j(t.apd.children[1],r)):this.traverseAlg(e.A,new j(t.apd.children[1],r))||this.traverseAlg(e.B,new j(t.apd.children[2],r))||this.traverseAlg(e.A,new j(t.apd.children[1],!r))}traversePause(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseNewline(e,t){return!1}traverseLineComment(e,t){return!1}firstcheck(e){return e.apd.moveCount+this.i<=this.goalIndex&&e.apd.duration+this.dur<this.goalDuration?this.keepgoing(e):!0}domult(e,t){let r=e.back;if(t===0)return r;t<0&&(r=!r,t=-t);const n=e.apd.children[0],i=Math.min(Math.floor((this.goalIndex-this.i)/n.moveCount),Math.ceil((this.goalDuration-this.dur)/n.duration-1));return i>0&&this.keepgoing(new j(n,r),i),r}keepgoing(e,t=1){return this.i+=t*e.apd.moveCount,this.dur+=t*e.apd.duration,t!==1?e.back?this.st=this.st.applyTransformation(e.apd.backward.selfMultiply(t)):this.st=this.st.applyTransformation(e.apd.forward.selfMultiply(t)):e.back?this.st=this.st.applyTransformation(e.apd.backward):this.st=this.st.applyTransformation(e.apd.forward),!1}},Mn=16;function bn(e,t){const r=new at,n=new at;for(const i of e.childAlgNodes())n.push(i),n.experimentalNumAlgNodes()>=t&&(r.push(new Pe(n.toAlg())),n.reset());return r.push(new Pe(n.toAlg())),r.toAlg()}var Sn=class extends Oe{traverseAlg(e){const t=e.experimentalNumChildAlgNodes();return t<Mn?e:bn(e,Math.ceil(Math.sqrt(t)))}traverseGrouping(e){return new Pe(this.traverseAlg(e.alg),e.amount)}traverseMove(e){return e}traverseCommutator(e){return new it(this.traverseAlg(e.A),this.traverseAlg(e.B))}traverseConjugate(e){return new it(this.traverseAlg(e.A),this.traverseAlg(e.B))}traversePause(e){return e}traverseNewline(e){return e}traverseLineComment(e){return e}},Tn=Fe(Sn),ut=class{constructor(e,t){this.kpuzzle=e;const r=new yn(this.kpuzzle),n=Tn(t);this.decoration=r.traverseAlg(n),this.walker=new xn(this.kpuzzle,n,this.decoration)}kpuzzle;decoration;walker;getAnimLeaf(e){if(this.walker.moveByIndex(e)){if(!this.walker.move)throw new Error("`this.walker.mv` missing");const t=this.walker.move;return this.walker.back?t.invert():t}return null}indexToMoveStartTimestamp(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}indexToMovesInProgress(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}patternAtIndex(e,t){return this.walker.moveByIndex(e),(t??this.kpuzzle.defaultPattern()).applyTransformation(this.walker.st)}transformationAtIndex(e){return this.walker.moveByIndex(e),this.walker.st}numAnimatedLeaves(){return this.decoration.moveCount}timestampToIndex(e){return this.walker.moveByDuration(e),this.walker.i}algDuration(){return this.decoration.duration}moveDuration(e){return this.walker.moveByIndex(e),this.walker.moveDuration}},zn=class extends k{getDefaultValue(){return"auto"}},Le="http://www.w3.org/2000/svg",ht="data-copy-id",mt=0;function In(){return mt+=1,`svg${mt.toString()}`}var kn={dim:{white:"#dddddd",orange:"#884400",limegreen:"#008800",red:"#660000","rgb(34, 102, 255)":"#000088",yellow:"#888800","rgb(102, 0, 153)":"rgb(50, 0, 76)",purple:"#3f003f"},oriented:"#44ddcc",ignored:"#555555",invisible:"#00000000"},Ln=class{constructor(e,t,r,n=!1){if(this.kpuzzle=e,this.showUnknownOrientations=n,!t)throw new Error(`No SVG definition for puzzle type: ${e.name()}`);this.svgID=In(),this.wrapperElement=document.createElement("div"),this.wrapperElement.classList.add("svg-wrapper"),this.wrapperElement.innerHTML=t;const i=this.wrapperElement.querySelector("svg");if(!i)throw new Error("Could not get SVG element");if(this.svgElement=i,Le!==i.namespaceURI)throw new Error("Unexpected XML namespace");i.style.maxWidth="100%",i.style.maxHeight="100%",this.gradientDefs=document.createElementNS(Le,"defs"),i.insertBefore(this.gradientDefs,i.firstChild);for(const a of e.definition.orbits)for(let s=0;s<a.numPieces;s++)for(let c=0;c<a.numOrientations;c++){const u=this.elementID(a.orbitName,s,c),l=this.elementByID(u);let w=l?.style.fill;r?(()=>{const d=r.orbits;if(!d)return;const x=d[a.orbitName];if(!x)return;const f=x.pieces[s];if(!f)return;const p=f.facelets[c];if(!p)return;const y=typeof p=="string"?p:p?.mask,A=kn[y];typeof A=="string"?w=A:A&&(w=A[w])})():w=l?.style.fill,this.originalColors[u]=w,this.gradients[u]=this.newGradient(u,w),this.gradientDefs.appendChild(this.gradients[u]),l?.setAttribute("style",`fill: url(#grad-${this.svgID}-${u})`)}for(const a of Array.from(i.querySelectorAll(`[${ht}]`))){const s=a.getAttribute(ht);a.setAttribute("style",`fill: url(#grad-${this.svgID}-${s})`)}this.showUnknownOrientations&&this.drawPattern(this.kpuzzle.defaultPattern())}kpuzzle;showUnknownOrientations;wrapperElement;svgElement;gradientDefs;originalColors={};gradients={};svgID;drawPattern(e,t,r){this.draw(e,t,r)}draw(e,t,r){const n=t?.experimentalToTransformation();if(!e)throw new Error("Distinguishable pieces are not handled for SVG yet!");for(const i of e.kpuzzle.definition.orbits){const a=e.patternData[i.orbitName],s=n?n.transformationData[i.orbitName]:null;for(let c=0;c<i.numPieces;c++)for(let u=0;u<i.numOrientations;u++){const l=this.elementID(i.orbitName,c,u),w=this.elementID(i.orbitName,a.pieces[c],(i.numOrientations-a.orientation[c]+u)%i.numOrientations);let d=!1;if(s){const x=this.elementID(i.orbitName,s.permutation[c],(i.numOrientations-s.orientationDelta[c]+u)%i.numOrientations);w===x&&(d=!0),r=r||0;const f=100*(1-r*r*(2-r*r));this.gradients[l].children[0].setAttribute("stop-color",this.originalColors[w]),this.gradients[l].children[0].setAttribute("offset",`${Math.max(f-5,0)}%`),this.gradients[l].children[1].setAttribute("offset",`${Math.max(f-5,0)}%`),this.gradients[l].children[2].setAttribute("offset",`${f}%`),this.gradients[l].children[3].setAttribute("offset",`${f}%`),this.gradients[l].children[3].setAttribute("stop-color",this.originalColors[x])}else d=!0;d&&(this.showUnknownOrientations&&a.orientationMod?.[c]===1?(this.gradients[l].children[0].setAttribute("stop-color","#000"),this.gradients[l].children[0].setAttribute("offset","5%"),this.gradients[l].children[1].setAttribute("offset","5%"),this.gradients[l].children[2].setAttribute("offset","20%"),this.gradients[l].children[3].setAttribute("offset","20%"),this.gradients[l].children[3].setAttribute("stop-color",this.originalColors[w])):(this.gradients[l].children[0].setAttribute("stop-color",this.originalColors[w]),this.gradients[l].children[0].setAttribute("offset","100%"),this.gradients[l].children[1].setAttribute("offset","100%"),this.gradients[l].children[2].setAttribute("offset","100%"),this.gradients[l].children[3].setAttribute("offset","100%")))}}}newGradient(e,t){const r=document.createElementNS(Le,"radialGradient");r.setAttribute("id",`grad-${this.svgID}-${e}`),r.setAttribute("r","70.7107%");const n=[{offset:0,color:t},{offset:0,color:"black"},{offset:0,color:"black"},{offset:0,color:t}];for(const i of n){const a=document.createElementNS(Le,"stop");a.setAttribute("offset",`${i.offset}%`),a.setAttribute("stop-color",i.color),a.setAttribute("stop-opacity","1"),r.appendChild(a)}return r}elementID(e,t,r){return`${e}-l${t}-o${r}`}elementByID(e){return this.wrapperElement.querySelector(`#${e}`)}},be=class{constructor(e,t,r){this.elem=e,this.prefix=t,this.validSuffixes=r}elem;prefix;validSuffixes;#e=null;clearValue(){this.#e&&this.elem.contentWrapper.classList.remove(this.#e),this.#e=null}setValue(e){if(!this.validSuffixes.includes(e))throw new Error(`Invalid suffix: ${e}`);const t=`${this.prefix}${e}`,r=this.#e!==t;return r&&(this.clearValue(),this.elem.contentWrapper.classList.add(t),this.#e=t),r}};function Xe(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0}function pt(e,t,r){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(!r(e[n],t[n]))return!1;return!0}function Ze(e,t,r){return Nr(e,r-t,t)}var An=class{constructor(e){this.model=e,e.tempoScale.addFreshListener(t=>{this.tempoScale=t})}model;catchingUp=!1;pendingFrame=!1;tempoScale=1;scheduler=new me(this.animFrame.bind(this));start(){this.catchingUp||(this.lastTimestamp=performance.now()),this.catchingUp=!0,this.pendingFrame=!0,this.scheduler.requestAnimFrame()}stop(){this.catchingUp=!1,this.scheduler.cancelAnimFrame()}catchUpMs=500;lastTimestamp=0;animFrame(e){this.scheduler.requestAnimFrame();const t=this.tempoScale*(e-this.lastTimestamp)/this.catchUpMs;this.lastTimestamp=e,this.model.catchUpMove.set((async()=>{const r=await this.model.catchUpMove.get();if(r.move===null)return r;const n=r.amount+t;return n>=1?(this.pendingFrame=!0,this.stop(),this.model.timestampRequest.set("end"),{move:null,amount:0}):(this.pendingFrame=!1,{move:r.move,amount:n})})())}},Dn=class{constructor(e,t){this.delegate=t,this.model=e,this.lastTimestampPromise=this.#e(),this.model.playingInfo.addFreshListener(this.onPlayingProp.bind(this)),this.catchUpHelper=new An(this.model),this.model.catchUpMove.addFreshListener(this.onCatchUpMoveProp.bind(this))}delegate;playing=!1;direction=1;catchUpHelper;model;lastDatestamp=0;lastTimestampPromise;scheduler=new me(this.animFrame.bind(this));async onPlayingProp(e){e.playing!==this.playing&&(e.playing?this.play(e):this.pause())}async onCatchUpMoveProp(e){const t=e.move!==null;t!==this.catchUpHelper.catchingUp&&(t?this.catchUpHelper.start():this.catchUpHelper.stop()),this.scheduler.requestAnimFrame()}async#e(){return(await this.model.detailedTimelineInfo.get()).timestamp}jumpToStart(e){this.model.timestampRequest.set("start"),this.pause(),e?.flash&&this.delegate.flash()}jumpToEnd(e){this.model.timestampRequest.set("end"),this.pause(),e?.flash&&this.delegate.flash()}playPause(){this.playing?this.pause():this.play()}play(e){(async()=>{const t=e?.direction??1,r=await this.model.coarseTimelineInfo.get();(e?.autoSkipToOtherEndIfStartingAtBoundary??!0)&&(t===1&&r.atEnd&&(this.model.timestampRequest.set("start"),this.delegate.flash()),t===-1&&r.atStart&&(this.model.timestampRequest.set("end"),this.delegate.flash())),this.model.playingInfo.set({playing:!0,direction:t,untilBoundary:e?.untilBoundary??"entire-timeline",loop:e?.loop??!1}),this.playing=!0,this.lastDatestamp=performance.now(),this.lastTimestampPromise=this.#e(),this.scheduler.requestAnimFrame()})()}pause(){this.playing=!1,this.scheduler.cancelAnimFrame(),this.model.playingInfo.set({playing:!1,untilBoundary:"entire-timeline"})}#t=new Ve;async animFrame(e){this.playing&&this.scheduler.requestAnimFrame();const t=this.lastDatestamp,r=await this.#t.queue(Promise.all([this.model.playingInfo.get(),this.lastTimestampPromise,this.model.timeRange.get(),this.model.tempoScale.get(),this.model.currentMoveInfo.get()])),[n,i,a,s,c]=r;if(!n.playing){this.playing=!1;return}let u=c.earliestEnd;(c.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(u=a.end);let l=c.latestStart;(c.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(l=a.start);let w=(e-t)*this.direction*s;w=Math.max(w,1),w*=n.direction;let d=i+w,x=null;d>=u?n.loop?d=Ze(d,a.start,a.end):(d===a.end?x="end":d=u,this.playing=!1,this.model.playingInfo.set({playing:!1})):d<=l&&(n.loop?d=Ze(d,a.start,a.end):(d===a.start?x="start":d=l,this.playing=!1,this.model.playingInfo.set({playing:!1}))),this.lastDatestamp=e,this.lastTimestampPromise=Promise.resolve(d),this.model.timestampRequest.set(x??d)}},Cn=class{constructor(e,t){this.model=e,this.animationController=new Dn(e,t)}model;animationController;jumpToStart(e){this.animationController.jumpToStart(e)}jumpToEnd(e){this.animationController.jumpToEnd(e)}togglePlay(e){typeof e>"u"&&this.animationController.playPause(),e?this.animationController.play():this.animationController.pause()}async visitTwizzleLink(){const e=document.createElement("a");e.href=await this.model.twizzleLink(),e.target="_blank",e.click()}},En={"bottom-row":!0,none:!0},Nn=class extends k{getDefaultValue(){return"auto"}},nt=new Q;nt.replaceSync(`
:host {
  width: 384px;
  height: 256px;
  display: grid;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  overflow: hidden;
}

.wrapper > * {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.wrapper.back-view-side-by-side {
  grid-template-columns: 1fr 1fr;
}

.wrapper.back-view-top-right {
  grid-template-columns: 3fr 1fr;
  grid-template-rows: 1fr 3fr;
}

.wrapper.back-view-top-right > :nth-child(1) {
  grid-row: 1 / 3;
  grid-column: 1 / 3;
}

.wrapper.back-view-top-right > :nth-child(2) {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
}
`);var Ht=new Q;Ht.replaceSync(`
:host {
  width: 384px;
  height: 256px;
  display: grid;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  overflow: hidden;
}

.svg-wrapper,
twisty-2d-svg,
svg {
  width: 100%;
  height: 100%;
  display: grid;
  min-height: 0;
}

svg {
  animation: fade-in 0.25s ease-in;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hint-facelets-none .hint-facelet {
  display: none;
}
`);var $t=class extends Y{constructor(e,t,r,n,i){super(),this.model=e,this.kpuzzle=t,this.svgSource=r,this.options=n,this.puzzleLoader=i,this.addCSS(Ht),this.resetSVG(),this.#t.addListener(this.model.puzzleID,a=>{i?.id!==a&&this.disconnect()}),this.#t.addListener(this.model.twistySceneModel.hintFacelet,a=>{this.setHintFacelet(a)}),this.#t.addListener(this.model.legacyPosition,this.onPositionChange.bind(this)),this.options?.experimentalStickeringMask&&this.experimentalSetStickeringMask(this.options.experimentalStickeringMask)}model;kpuzzle;svgSource;options;puzzleLoader;svgWrapper;scheduler=new me(this.render.bind(this));#e=null;#t=new Me;disconnect(){this.#t.disconnect()}onPositionChange(e){try{if(e.movesInProgress.length>0){const t=e.movesInProgress[0].move;let r=t;e.movesInProgress[0].direction===-1&&(r=t.invert());const n=e.pattern.applyMove(r);this.svgWrapper?.draw(e.pattern,n,e.movesInProgress[0].fraction)}else this.svgWrapper?.draw(e.pattern),this.#e=e}catch(t){console.warn("Bad position (this doesn't necessarily mean something is wrong). Pre-emptively disconnecting:",this.puzzleLoader?.id,t),this.disconnect()}}scheduleRender(){this.scheduler.requestAnimFrame()}experimentalSetStickeringMask(e){this.resetSVG(e)}resetSVG(e){this.svgWrapper&&this.removeElement(this.svgWrapper.wrapperElement),this.kpuzzle&&(this.svgWrapper=new Ln(this.kpuzzle,this.svgSource,e),this.addElement(this.svgWrapper.wrapperElement),this.#e&&this.onPositionChange(this.#e))}hintFaceletsClassListManager=new be(this,"hint-facelets-",Object.keys(an));setHintFacelet(e){this.hintFaceletsClassListManager.setValue(e==="auto"?"floating":e)}render(){}};B.define("twisty-2d-puzzle",$t);var Pn=class{constructor(e,t,r,n){this.model=e,this.schedulable=t,this.puzzleLoader=r,this.effectiveVisualization=n,this.twisty2DPuzzle(),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async i=>{(await this.twisty2DPuzzle()).experimentalSetStickeringMask(i)})}model;schedulable;puzzleLoader;effectiveVisualization;#e=new Me;disconnect(){this.#e.disconnect()}scheduleRender(){}#t=null;async twisty2DPuzzle(){return this.#t??=(async()=>{const e=this.effectiveVisualization==="experimental-2D-LL-face"?this.puzzleLoader.llFaceSVG():this.effectiveVisualization==="experimental-2D-LL"?this.puzzleLoader.llSVG():this.puzzleLoader.svg();return new $t(this.model,await this.puzzleLoader.kpuzzle(),await e,{},this.puzzleLoader)})()}},Qt=class extends Y{constructor(e,t){super(),this.model=e,this.effectiveVisualization=t}model;effectiveVisualization;#e=new Me;disconnect(){this.#e.disconnect()}async connectedCallback(){this.addCSS(nt),this.model&&this.#e.addListener(this.model.twistyPlayerModel.puzzleLoader,this.onPuzzleLoader.bind(this))}#t;async scene(){return this.#t??=(async()=>new(await X).ThreeScene)()}scheduleRender(){this.#r?.scheduleRender()}#r;currentTwisty2DPuzzleWrapper(){return this.#r}async setCurrentTwisty2DPuzzleWrapper(e){const t=this.#r;this.#r=e,t?.disconnect();const r=e.twisty2DPuzzle();this.contentWrapper.textContent="",this.addElement(await r)}async onPuzzleLoader(e){this.#r?.disconnect();const t=new Pn(this.model.twistyPlayerModel,this,e,this.effectiveVisualization);this.setCurrentTwisty2DPuzzleWrapper(t)}};B.define("twisty-2d-scene-wrapper",Qt);var Yt=class{#e;reject;promise;constructor(){this.promise=new Promise((e,t)=>{this.#e=e,this.reject=t})}handleNewValue(e){this.#e(e)}},_t=class extends EventTarget{constructor(e,t,r,n){super(),this.model=e,this.schedulable=t,this.puzzleLoader=r,this.visualizationStrategy=n,this.twisty3DPuzzle(),this.#e.addListener(this.model.puzzleLoader,i=>{this.puzzleLoader.id!==i.id&&this.disconnect()}),this.#e.addListener(this.model.legacyPosition,async i=>{try{(await this.twisty3DPuzzle()).onPositionChange(i),this.scheduleRender()}catch{this.disconnect()}}),this.#e.addListener(this.model.twistySceneModel.hintFacelet,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFacelets:i==="auto"?"floating":i}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.foundationDisplay,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({showFoundation:i!=="none"}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async i=>{(await this.twisty3DPuzzle()).setStickeringMask(i),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.faceletScale,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({faceletScale:i}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.hintFaceletsElevation,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFaceletsElevation:i}),this.scheduleRender()}),this.#e.addMultiListener3([this.model.twistySceneModel.stickeringMask,this.model.twistySceneModel.foundationStickerSprite,this.model.twistySceneModel.hintStickerSprite],async i=>{"experimentalUpdateTexture"in await this.twisty3DPuzzle()&&((await this.twisty3DPuzzle()).experimentalUpdateTexture(i[0].specialBehaviour==="picture",i[1],i[2]),this.scheduleRender())})}model;schedulable;puzzleLoader;visualizationStrategy;#e=new Me;disconnect(){this.#e.disconnect()}scheduleRender(){this.schedulable.scheduleRender(),this.dispatchEvent(new CustomEvent("render-scheduled"))}#t=null;async twisty3DPuzzle(){return this.#t??=(async()=>{if(this.puzzleLoader.id==="3x3x3"&&this.visualizationStrategy==="Cube3D"){const[e,t,r,n,i,a]=await Promise.all([this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.stickeringMask.get(),this.model.twistySceneModel.initialHintFaceletsAnimation.get(),this.model.twistySceneModel.faceletScale.get(),this.model.twistySceneModel.hintFaceletsElevation.get()]);return(await X).cube3DShim(()=>this.schedulable.scheduleRender(),{foundationSprite:e,hintSprite:t,experimentalStickeringMask:r,initialHintFaceletsAnimation:n,faceletScale:i,hintFaceletsElevation:a})}else{const[e,t,r,n]=await Promise.all([this.model.twistySceneModel.hintFacelet.get(),this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.faceletScale.get()]),i=(await X).pg3dShim(()=>this.schedulable.scheduleRender(),this.puzzleLoader,e==="auto"?"floating":e,n,this.puzzleLoader.id==="kilominx");return i.then(a=>a.experimentalUpdateTexture(!0,t??void 0,r??void 0)),i}})()}async raycastMove(e,t){const r=await this.twisty3DPuzzle();if(!("experimentalGetControlTargets"in r)){console.info("not PG3D! skipping raycast");return}const n=r.experimentalGetControlTargets(),[i,a]=await Promise.all([e,this.model.twistySceneModel.movePressCancelOptions.get()]),s=i.intersectObjects(n);if(s.length>0){const c=r.getClosestMoveToAxis(s[0].point,t);c?this.model.experimentalAddMove(c.move,{cancel:a}):console.info("Skipping move!")}}},Ke=class extends Y{constructor(e){super(),this.model=e}model;#e=new be(this,"back-view-",["auto","none","side-by-side","top-right"]);#t=new Me;disconnect(){this.#t.disconnect()}async connectedCallback(){this.addCSS(nt);const e=new Ge(this.model,this);this.addVantage(e),this.model&&(this.#t.addMultiListener([this.model.puzzleLoader,this.model.visualizationStrategy],this.onPuzzle.bind(this)),this.#t.addListener(this.model.backView,this.setBackView.bind(this))),this.scheduleRender()}#r=null;setBackView(e){const t=["side-by-side","top-right"].includes(e),r=this.#r!==null;this.#e.setValue(e),t?r||(this.#r=new Ge(this.model,this,{backView:!0}),this.addVantage(this.#r),this.scheduleRender()):this.#r&&(this.removeVantage(this.#r),this.#r=null)}async onPress(e){const t=this.#i;if(!t){console.info("no wrapper; skipping scene wrapper press!");return}const r=(async()=>{const[n,{ThreeRaycaster:i,ThreeVector2:a}]=await Promise.all([e.detail.cameraPromise,(async()=>{const{ThreeRaycaster:u,ThreeVector2:l}=await X;return{ThreeRaycaster:u,ThreeVector2:l}})()]),s=new i,c=new a(e.detail.pressInfo.normalizedX,e.detail.pressInfo.normalizedY);return s.setFromCamera(c,n),s})();await t.raycastMove(r,{invert:!e.detail.pressInfo.rightClick,depth:e.detail.pressInfo.keys.ctrlOrMetaKey?"rotation":e.detail.pressInfo.keys.shiftKey?"secondSlice":"none"})}#n;async scene(){return this.#n??=(async()=>new(await X).ThreeScene)()}#a=new Set;addVantage(e){e.addEventListener("press",this.onPress.bind(this)),this.#a.add(e),this.contentWrapper.appendChild(e)}removeVantage(e){this.#a.delete(e),e.remove(),e.disconnect(),this.#i?.disconnect()}experimentalVantages(){return this.#a.values()}scheduleRender(){for(const e of this.#a)e.scheduleRender()}#i=null;async setCurrentTwisty3DPuzzleWrapper(e,t){const r=this.#i;try{this.#i=t,r?.disconnect(),e.add(await t.twisty3DPuzzle())}finally{r&&e.remove(await r.twisty3DPuzzle())}this.#s.handleNewValue(t)}#s=new Yt;async experimentalTwisty3DPuzzleWrapper(){return this.#i||this.#s.promise}#o=new Ve;async onPuzzle(e){if(e[1]==="2D")return;this.#i?.disconnect();const[t,r]=await this.#o.queue(Promise.all([this.scene(),new _t(this.model,this,e[0],e[1])]));this.setCurrentTwisty3DPuzzleWrapper(t,r)}};B.define("twisty-3d-scene-wrapper",Ke);var ne=typeof document>"u"?null:document,Rn=ne?.fullscreenEnabled||!!ne?.webkitFullscreenEnabled;function jn(){return document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen()}function gt(){return document.fullscreenElement?document.fullscreenElement:document.webkitFullscreenElement??null}function On(e){return e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen()}var Fn=["skip-to-start","skip-to-end","step-forward","step-backward","pause","play","enter-fullscreen","exit-fullscreen","twizzle-tw"],Vn=class extends D{derive(e){return{fullscreen:{enabled:Rn,icon:document.fullscreenElement===null?"enter-fullscreen":"exit-fullscreen",title:"Enter fullscreen"},"jump-to-start":{enabled:!e.coarseTimelineInfo.atStart,icon:"skip-to-start",title:"Restart"},"play-step-backwards":{enabled:!e.coarseTimelineInfo.atStart,icon:"step-backward",title:"Step backward"},"play-pause":{enabled:!(e.coarseTimelineInfo.atStart&&e.coarseTimelineInfo.atEnd),icon:e.coarseTimelineInfo.playing?"pause":"play",title:e.coarseTimelineInfo.playing?"Pause":"Play"},"play-step":{enabled:!e.coarseTimelineInfo.atEnd,icon:"step-forward",title:"Step forward"},"jump-to-end":{enabled:!e.coarseTimelineInfo.atEnd,icon:"skip-to-end",title:"Skip to End"},"twizzle-link":{enabled:!0,icon:"twizzle-tw",title:"View at Twizzle",hidden:e.viewerLink==="none"}}}},Gt=new Q;Gt.replaceSync(`
:host {
  width: 384px;
  height: 24px;
  display: grid;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.wrapper {
  grid-auto-flow: column;
}

.viewer-link-none .twizzle-link-button {
  display: none;
}

.wrapper twisty-button,
.wrapper twisty-control-button {
  width: inherit;
  height: inherit;
}
`);var Xt=new Q;Xt.replaceSync(`
:host:not([hidden]) {
  display: grid;
}

:host {
  width: 48px;
  height: 24px;
}

.wrapper {
  width: 100%;
  height: 100%;
}

button {
  width: 100%;
  height: 100%;
  border: none;
  
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;

  background-color: rgba(196, 196, 196, 0.75);
}

button:enabled {
  background-color: rgba(196, 196, 196, 0.75)
}

.dark-mode button:enabled {
  background-color: #88888888;
}

button:disabled {
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0.25;
  pointer-events: none;
}

.dark-mode button:disabled {
  background-color: #ffffff44;
}

button:enabled:hover {
  background-color: rgba(255, 255, 255, 0.75);
  box-shadow: 0 0 1em rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

/* TODO: fullscreen icons have too much padding?? */
.svg-skip-to-start button,
button.svg-skip-to-start {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik0yNjQzIDEwMzdxMTktMTkgMzItMTN0MTMgMzJ2MTQ3MnEwIDI2LTEzIDMydC0zMi0xM2wtNzEwLTcxMHEtOS05LTEzLTE5djcxMHEwIDI2LTEzIDMydC0zMi0xM2wtNzEwLTcxMHEtOS05LTEzLTE5djY3OHEwIDI2LTE5IDQ1dC00NSAxOUg5NjBxLTI2IDAtNDUtMTl0LTE5LTQ1VjEwODhxMC0yNiAxOS00NXQ0NS0xOWgxMjhxMjYgMCA0NSAxOXQxOSA0NXY2NzhxNC0xMSAxMy0xOWw3MTAtNzEwcTE5LTE5IDMyLTEzdDEzIDMydjcxMHE0LTExIDEzLTE5eiIvPjwvc3ZnPg==");
}

.svg-skip-to-end button,
button.svg-skip-to-end {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik05NDEgMjU0N3EtMTkgMTktMzIgMTN0LTEzLTMyVjEwNTZxMC0yNiAxMy0zMnQzMiAxM2w3MTAgNzEwcTggOCAxMyAxOXYtNzEwcTAtMjYgMTMtMzJ0MzIgMTNsNzEwIDcxMHE4IDggMTMgMTl2LTY3OHEwLTI2IDE5LTQ1dDQ1LTE5aDEyOHEyNiAwIDQ1IDE5dDE5IDQ1djE0MDhxMCAyNi0xOSA0NXQtNDUgMTloLTEyOHEtMjYgMC00NS0xOXQtMTktNDV2LTY3OHEtNSAxMC0xMyAxOWwtNzEwIDcxMHEtMTkgMTktMzIgMTN0LTEzLTMydi03MTBxLTUgMTAtMTMgMTl6Ii8+PC9zdmc+");
}

.svg-step-forward button,
button.svg-step-forward {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik0yNjg4IDE1NjhxMCAyNi0xOSA0NWwtNTEyIDUxMnEtMTkgMTktNDUgMTl0LTQ1LTE5cS0xOS0xOS0xOS00NXYtMjU2aC0yMjRxLTk4IDAtMTc1LjUgNnQtMTU0IDIxLjVxLTc2LjUgMTUuNS0xMzMgNDIuNXQtMTA1LjUgNjkuNXEtNDkgNDIuNS04MCAxMDF0LTQ4LjUgMTM4LjVxLTE3LjUgODAtMTcuNSAxODEgMCA1NSA1IDEyMyAwIDYgMi41IDIzLjV0Mi41IDI2LjVxMCAxNS04LjUgMjV0LTIzLjUgMTBxLTE2IDAtMjgtMTctNy05LTEzLTIydC0xMy41LTMwcS03LjUtMTctMTAuNS0yNC0xMjctMjg1LTEyNy00NTEgMC0xOTkgNTMtMzMzIDE2Mi00MDMgODc1LTQwM2gyMjR2LTI1NnEwLTI2IDE5LTQ1dDQ1LTE5cTI2IDAgNDUgMTlsNTEyIDUxMnExOSAxOSAxOSA0NXoiLz48L3N2Zz4=");
}

.svg-step-backward button,
button.svg-step-backward {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik0yNjg4IDIwNDhxMCAxNjYtMTI3IDQ1MS0zIDctMTAuNSAyNHQtMTMuNSAzMHEtNiAxMy0xMyAyMi0xMiAxNy0yOCAxNy0xNSAwLTIzLjUtMTB0LTguNS0yNXEwLTkgMi41LTI2LjV0Mi41LTIzLjVxNS02OCA1LTEyMyAwLTEwMS0xNy41LTE4MXQtNDguNS0xMzguNXEtMzEtNTguNS04MC0xMDF0LTEwNS41LTY5LjVxLTU2LjUtMjctMTMzLTQyLjV0LTE1NC0yMS41cS03Ny41LTYtMTc1LjUtNmgtMjI0djI1NnEwIDI2LTE5IDQ1dC00NSAxOXEtMjYgMC00NS0xOWwtNTEyLTUxMnEtMTktMTktMTktNDV0MTktNDVsNTEyLTUxMnExOS0xOSA0NS0xOXQ0NSAxOXExOSAxOSAxOSA0NXYyNTZoMjI0cTcxMyAwIDg3NSA0MDMgNTMgMTM0IDUzIDMzM3oiLz48L3N2Zz4=");
}

.svg-pause button,
button.svg-pause {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik0yNTYwIDEwODh2MTQwOHEwIDI2LTE5IDQ1dC00NSAxOWgtNTEycS0yNiAwLTQ1LTE5dC0xOS00NVYxMDg4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6bS04OTYgMHYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1VjEwODhxMC0yNiAxOS00NXQ0NS0xOWg1MTJxMjYgMCA0NSAxOXQxOSA0NXoiLz48L3N2Zz4=");
}

.svg-play button,
button.svg-play {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNTg0IiBoZWlnaHQ9IjM1ODQiIHZpZXdCb3g9IjAgMCAzNTg0IDM1ODQiPjxwYXRoIGQ9Ik0yNDcyLjUgMTgyM2wtMTMyOCA3MzhxLTIzIDEzLTM5LjUgM3QtMTYuNS0zNlYxMDU2cTAtMjYgMTYuNS0zNnQzOS41IDNsMTMyOCA3MzhxMjMgMTMgMjMgMzF0LTIzIDMxeiIvPjwvc3ZnPg==");
}

.svg-enter-fullscreen button,
button.svg-enter-fullscreen {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI4Ij48cGF0aCBkPSJNMiAyaDI0djI0SDJ6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTkgMTZIN3Y1aDV2LTJIOXYtM3ptLTItNGgyVjloM1Y3SDd2NXptMTIgN2gtM3YyaDV2LTVoLTJ2M3pNMTYgN3YyaDN2M2gyVjdoLTV6Ii8+PC9zdmc+");
}

.svg-exit-fullscreen button,
button.svg-exit-fullscreen {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgd2lkdGg9IjI4Ij48cGF0aCBkPSJNMiAyaDI0djI0SDJ6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTcgMThoM3YzaDJ2LTVIN3Yyem0zLThIN3YyaDVWN2gtMnYzem02IDExaDJ2LTNoM3YtMmgtNXY1em0yLTExVjdoLTJ2NWg1di0yaC0zeiIvPjwvc3ZnPg==");
}

.svg-twizzle-tw button,
button.svg-twizzle-tw {
  background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODY0IiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzk3LjU4MSAxNTEuMTh2NTcuMDg0aC04OS43MDN2MjQwLjM1MmgtNjYuOTU1VjIwOC4yNjRIMTUxLjIydi01Ny4wODNoMjQ2LjM2MXptNTQuMzEgNzEuNjc3bDcuNTEyIDMzLjY5MmMyLjcxOCAxMi4xNiA1LjU4IDI0LjY4IDguNTg0IDM3LjU1NWEyMTgwLjc3NSAyMTgwLjc3NSAwIDAwOS40NDIgMzguODQzIDEyNjYuMyAxMjY2LjMgMCAwMDEwLjA4NiAzNy41NTVjMy43Mi0xMi41OSA3LjM2OC0yNS40NjYgMTAuOTQ1LTM4LjYyOCAzLjU3Ni0xMy4xNjIgNy4wMS0yNi4xMSAxMC4zLTM4Ljg0M2w1Ljc2OS0yMi40NTZjMS4yNDgtNC44ODcgMi40NzItOS43MDUgMy42NzQtMTQuNDU1IDMuMDA0LTExLjg3NSA1LjY1MS0yMi45NjIgNy45NC0zMy4yNjNoNDYuMzU0bDIuMzg0IDEwLjU2M2EyMDAwLjc3IDIwMDAuNzcgMCAwMDMuOTM1IDE2LjgyOGw2LjcxMSAyNy43MWMxLjIxMyA0Ljk1NiAyLjQ1IDkuOTggMy43MDkgMTUuMDczYTMxMTkuNzc3IDMxMTkuNzc3IDAgMDA5Ljg3MSAzOC44NDMgMTI0OS4yMjcgMTI0OS4yMjcgMCAwMDEwLjczIDM4LjYyOCAxOTA3LjYwNSAxOTA3LjYwNSAwIDAwMTAuMzAxLTM3LjU1NSAxMzk3Ljk0IDEzOTcuOTQgMCAwMDkuNjU3LTM4Ljg0M2w0LjQtMTkuMDQ2Yy43MTUtMy4xMyAxLjQyMS02LjIzNiAyLjExOC05LjMyMWw5LjU3Ny00Mi44OGg2Ni41MjZhMjk4OC43MTggMjk4OC43MTggMCAwMS0xOS41MjkgNjYuMzExbC01LjcyOCAxOC40ODJhMzIzNy40NiAzMjM3LjQ2IDAgMDEtMTQuMDE1IDQzLjc1MmMtNi40MzggMTkuNi0xMi43MzMgMzcuNjk4LTE4Ljg4NSA1NC4yOTRsLTMuMzA2IDguODI1Yy00Ljg4NCAxMi44OTgtOS40MzMgMjQuMjYzLTEzLjY0NyAzNC4wOTVoLTQ5Ljc4N2E4NDE3LjI4OSA4NDE3LjI4OSAwIDAxLTIxLjAzMS02NC44MDkgMTI4OC42ODYgMTI4OC42ODYgMCAwMS0xOC44ODUtNjQuODEgMTk3Mi40NDQgMTk3Mi40NDQgMCAwMS0xOC4yNCA2NC44MSAyNTc5LjQxMiAyNTc5LjQxMiAwIDAxLTIwLjM4OCA2NC44MWgtNDkuNzg3Yy00LjY4Mi0xMC45MjYtOS43Mi0yMy43NDMtMTUuMTEtMzguNDUxbC0xLjYyOS00LjQ3Yy01LjI1OC0xNC41MjEtMTAuNjgtMzAuMTkyLTE2LjI2Ni00Ny4wMTRsLTIuNDA0LTcuMjhjLTYuNDM4LTE5LjYtMTMuMDItNDAuMzQ0LTE5Ljc0My02Mi4yMzRhMjk4OC43MDcgMjk4OC43MDcgMCAwMS0xOS41MjktNjYuMzExaDY3LjM4NXoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==");
}
`);var ft={fullscreen:!0,"jump-to-start":!0,"play-step-backwards":!0,"play-pause":!0,"play-step":!0,"jump-to-end":!0,"twizzle-link":!0},Zt=class extends Y{constructor(e,t,r){super(),this.model=e,this.controller=t,this.defaultFullscreenElement=r}model;controller;defaultFullscreenElement;buttons=null;connectedCallback(){this.addCSS(Gt);const e={};for(const t in ft){const r=new Kt;e[t]=r,r.htmlButton.addEventListener("click",()=>this.#e(t)),this.addElement(r)}this.buttons=e,this.model?.buttonAppearance.addFreshListener(this.update.bind(this)),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}#e(e){switch(e){case"fullscreen":{this.onFullscreenButton();break}case"jump-to-start":{this.controller?.jumpToStart({flash:!0});break}case"play-step-backwards":{this.controller?.animationController.play({direction:-1,untilBoundary:"move"});break}case"play-pause":{this.controller?.togglePlay();break}case"play-step":{this.controller?.animationController.play({direction:1,untilBoundary:"move"});break}case"jump-to-end":{this.controller?.jumpToEnd({flash:!0});break}case"twizzle-link":{this.controller?.visitTwizzleLink();break}default:throw new Error("Missing command")}}async onFullscreenButton(){if(!this.defaultFullscreenElement)throw new Error("Attempted to go fullscreen without an element.");if(gt()===this.defaultFullscreenElement)jn();else{this.buttons?.fullscreen.setIcon("exit-fullscreen"),On(await this.model?.twistySceneModel.fullscreenElement.get()??this.defaultFullscreenElement);const e=()=>{gt()!==this.defaultFullscreenElement&&(this.buttons?.fullscreen.setIcon("enter-fullscreen"),globalThis.removeEventListener("fullscreenchange",e))};globalThis.addEventListener("fullscreenchange",e)}}async update(e){for(const t in ft){const r=this.buttons[t],n=e[t];r.htmlButton.disabled=!n.enabled,r.htmlButton.title=n.title,r.setIcon(n.icon),r.hidden=!!n.hidden}}updateColorScheme(e){for(const t of Object.values(this.buttons??{}))t.updateColorScheme(e)}};B.define("twisty-buttons",Zt);var Kt=class extends Y{htmlButton=document.createElement("button");updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}connectedCallback(){this.addCSS(Xt),this.addElement(this.htmlButton)}#e=new be(this,"svg-",Fn);setIcon(e){this.#e.setValue(e)}};B.define("twisty-button",Kt);var Jt=new Q;Jt.replaceSync(`
:host {
  width: 384px;
  height: 16px;
  display: grid;
}

.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(196, 196, 196, 0.75);
}

input:not(:disabled) {
  cursor: ew-resize;
}

.wrapper.dark-mode {
  background: #666666;
}
`);ne?.addEventListener("mousedown",e=>{e.which},!0);ne?.addEventListener("mouseup",e=>{e.which},!0);ne?.addEventListener("mousedown",()=>{},!1);ne?.addEventListener("mousemove",er,!1);ne?.addEventListener("mouseenter",er,!1);function er(e){e.pageY}var tr=class extends Y{constructor(e,t){super(),this.model=e,this.controller=t}model;controller;async onDetailedTimelineInfo(e){const t=await this.inputElem();t.min=e.timeRange.start.toString(),t.max=e.timeRange.end.toString(),t.disabled=t.min===t.max,t.value=e.timestamp.toString()}async connectedCallback(){this.addCSS(Jt),this.addElement(await this.inputElem()),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}#e=null;async inputElem(){return this.#e??=(async()=>{const e=document.createElement("input");return e.type="range",e.disabled=!0,this.model?.detailedTimelineInfo.addFreshListener(this.onDetailedTimelineInfo.bind(this)),e.addEventListener("input",this.onInput.bind(this)),e.addEventListener("keydown",this.onKeypress.bind(this)),e})()}async onInput(e){const t=await this.inputElem();await this.slowDown(e,t);const r=parseInt(t.value,10);this.model?.playingInfo.set({playing:!1}),this.model?.timestampRequest.set(r)}onKeypress(e){switch(e.key){case"ArrowLeft":case"ArrowRight":{this.controller?.animationController.play({direction:e.key==="ArrowLeft"?-1:1,untilBoundary:"move"}),e.preventDefault();break}case" ":{this.controller?.togglePlay(),e.preventDefault();break}}}async slowDown(e,t){}};B.define("twisty-scrubber",tr);var Bn=null;async function vt(e,t){const[{ThreePerspectiveCamera:r,ThreeScene:n},i,a,s,c,u,l]=await Promise.all([(async()=>{const{ThreePerspectiveCamera:E,ThreeScene:F}=await X;return{ThreePerspectiveCamera:E,ThreeScene:F}})(),await e.puzzleLoader.get(),await e.visualizationStrategy.get(),await e.twistySceneModel.stickeringRequest.get(),await e.twistySceneModel.stickeringMaskRequest.get(),await e.legacyPosition.get(),await e.twistySceneModel.orbitCoordinates.get()]),w=t?.width??2048,d=t?.height??2048,x=w/d,f=Bn??=await(async()=>new r(20,x,.1,20))(),p=new n,y=new _t(e,{scheduleRender:()=>{}},i,a);p.add(await y.twisty3DPuzzle()),await Ut(f,l);const I=(await Vt(w,d,p,f)).toDataURL(),g=await rr(e);return{dataURL:I,download:async E=>{nr(I,E??g)}}}async function rr(e){const[t,r]=await Promise.all([e.puzzleID.get(),e.alg.get()]);return`[${t}]${r.alg.experimentalNumChildAlgNodes()===0?"":` ${r.alg.toString()}`}`}function nr(e,t,r="png"){const n=document.createElement("a");n.href=e,n.download=`${t}.${r}`,n.click()}var ir=new Q;ir.replaceSync(`
:host {
  width: 384px;
  height: 256px;
  display: grid;

  -webkit-user-select: none;
  user-select: none;
}

.wrapper {
  display: grid;
  overflow: hidden;
  contain: size;
  grid-template-rows: 7fr minmax(1.5em, 0.5fr) minmax(2em, 1fr);
}

.wrapper > * {
  width: inherit;
  height: inherit;
  overflow: hidden;
}

.wrapper.controls-none {
  grid-template-rows: 7fr;
}

.wrapper.controls-none twisty-scrubber,
.wrapper.controls-none twisty-control-button-panel ,
.wrapper.controls-none twisty-scrubber,
.wrapper.controls-none twisty-buttons {
  display: none;
}

twisty-scrubber {
  background: rgba(196, 196, 196, 0.5);
}

.wrapper.checkered,
.wrapper.checkered-transparent {
  background-color: #EAEAEA;
  background-image: linear-gradient(45deg, #DDD 25%, transparent 25%, transparent 75%, #DDD 75%, #DDD),
    linear-gradient(45deg, #DDD 25%, transparent 25%, transparent 75%, #DDD 75%, #DDD);
  background-size: 32px 32px;
  background-position: 0 0, 16px 16px;
}

.wrapper.checkered-transparent {
  background-color: #F4F4F4;
  background-image: linear-gradient(45deg, #DDDDDD88 25%, transparent 25%, transparent 75%, #DDDDDD88 75%, #DDDDDD88),
    linear-gradient(45deg, #DDDDDD88 25%, transparent 25%, transparent 75%, #DDDDDD88 75%, #DDDDDD88);
}

.wrapper.dark-mode {
  background-color: #444;
  background-image: linear-gradient(45deg, #DDDDDD0b 25%, transparent 25%, transparent 75%, #DDDDDD0b 75%, #DDDDDD0b),
    linear-gradient(45deg, #DDDDDD0b 25%, transparent 25%, transparent 75%, #DDDDDD0b 75%, #DDDDDD0b);
}

.visualization-wrapper > * {
  width: 100%;
  height: 100%;
}

.error-elem {
  width: 100%;
  height: 100%;
  display: none;
  place-content: center;
  font-family: sans-serif;
  box-shadow: inset 0 0 2em rgb(255, 0, 0);
  color: red;
  text-shadow: 0 0 0.2em white;
  background: rgba(255, 255, 255, 0.25);
}

.wrapper.error .visualization-wrapper {
  display: none;
}

.wrapper.error .error-elem {
  display: grid;
}
`);var wt=class extends k{getDefaultValue(){return null}},Je=class extends ie{getDefaultValue(){return null}derive(e){return typeof e=="string"?new URL(e,location.href):e}},xe=class ar{warnings;errors;constructor(t){this.warnings=Object.freeze(t?.warnings??[]),this.errors=Object.freeze(t?.errors??[]),Object.freeze(this)}add(t){return new ar({warnings:this.warnings.concat(t?.warnings??[]),errors:this.errors.concat(t?.errors??[])})}log(){this.errors.length>0?console.error(`🚨 ${this.errors[0]}`):this.warnings.length>0?console.warn(`⚠️ ${this.warnings[0]}`):console.info("😎 No issues!")}};function sr(e){try{const t=H.fromString(e),r=[];return t.toString()!==e&&r.push("Alg is non-canonical!"),{alg:t,issues:new xe({warnings:r})}}catch(t){return{alg:new H,issues:new xe({errors:[`Malformed alg: ${t.toString()}`]})}}}function Un(e,t){return e.alg.isIdentical(t.alg)&&Xe(e.issues.warnings,t.issues.warnings)&&Xe(e.issues.errors,t.issues.errors)}var yt=class extends ie{getDefaultValue(){return{alg:new H,issues:new xe}}canReuseValue(e,t){return Un(e,t)}async derive(e){return typeof e=="string"?sr(e):{alg:e,issues:new xe}}},qn=class extends D{derive(e){return e.kpuzzle.algToTransformation(e.setupAlg.alg)}},Wn=class extends D{derive(e){if(e.setupTransformation)return e.setupTransformation;switch(e.setupAnchor){case"start":return e.setupAlgTransformation;case"end":{const r=e.indexer.transformationAtIndex(e.indexer.numAnimatedLeaves()).invert();return e.setupAlgTransformation.applyTransformation(r)}default:throw new Error("Unimplemented!")}}},Hn=class extends k{getDefaultValue(){return null}},$n=class extends k{getDefaultValue(){return{move:null,amount:0}}canReuseValue(e,t){return e.move===t.move&&e.amount===t.amount}},Qn=class extends D{derive(e){return{patternIndex:e.currentMoveInfo.patternIndex,movesFinishing:e.currentMoveInfo.movesFinishing.map(t=>t.move),movesFinished:e.currentMoveInfo.movesFinished.map(t=>t.move)}}canReuseValue(e,t){return e.patternIndex===t.patternIndex&&pt(e.movesFinishing,t.movesFinishing,(r,n)=>r.isIdentical(n))&&pt(e.movesFinished,t.movesFinished,(r,n)=>r.isIdentical(n))}},Yn=class extends D{derive(e){function t(r){return e.detailedTimelineInfo.atEnd&&e.catchUpMove.move!==null&&r.currentMoves.push({move:e.catchUpMove.move,direction:-1,fraction:1-e.catchUpMove.amount,startTimestamp:-1,endTimestamp:-1}),r}if(e.indexer.currentMoveInfo)return t(e.indexer.currentMoveInfo(e.detailedTimelineInfo.timestamp));{const r=e.indexer.timestampToIndex(e.detailedTimelineInfo.timestamp),n={patternIndex:r,currentMoves:[],movesFinishing:[],movesFinished:[],movesStarting:[],latestStart:-1/0,earliestEnd:1/0};if(e.indexer.numAnimatedLeaves()>0){const i=e.indexer.getAnimLeaf(r)?.as(G);if(!i)return t(n);const a=e.indexer.indexToMoveStartTimestamp(r),s=e.indexer.moveDuration(r),c=s?(e.detailedTimelineInfo.timestamp-a)/s:0,u=a+s,l={move:i,direction:1,fraction:c,startTimestamp:a,endTimestamp:u};c===0?n.movesStarting.push(l):c===1?n.movesFinishing.push(l):(n.currentMoves.push(l),n.latestStart=Math.max(n.latestStart,a),n.earliestEnd=Math.min(n.earliestEnd,u))}return t(n)}}},_n=class extends D{derive(e){let t=e.indexer.transformationAtIndex(e.currentLeavesSimplified.patternIndex);t=e.anchoredStart.applyTransformation(t);for(const r of e.currentLeavesSimplified.movesFinishing)t=t.applyMove(r);for(const r of e.currentLeavesSimplified.movesFinished)t=t.applyMove(r);return t.toKPattern()}},xt={u:"y",l:"x",f:"z",r:"x",b:"z",d:"y",m:"x",e:"y",s:"z",x:"x",y:"y",z:"z"};function Gn(e,t){return xt[e.family[0].toLowerCase()]===xt[t.family[0].toLowerCase()]}var Xn=class extends Oe{traverseAlg(e){const t=[];for(const r of e.childAlgNodes())t.push(this.traverseAlgNode(r));return Array.prototype.concat(...t)}traverseGroupingOnce(e){if(e.experimentalIsEmpty())return[];const t=[];for(const i of e.childAlgNodes()){if(!(i.is(G)||i.is(jr)||i.is(Or)))return this.traverseAlg(e);const a=i.as(G);a&&t.push(a)}let r=oe(t[0].amount);for(let i=0;i<t.length-1;i++){for(let a=1;a<t.length;a++)if(!Gn(t[i],t[a]))return this.traverseAlg(e);r=Math.max(r,oe(t[i].amount))}const n=t.map(i=>({animLeafAlgNode:i,msUntilNext:0,duration:r}));return n[n.length-1].msUntilNext=r,n}traverseGrouping(e){const t=[],r=e.amount>0?e.alg:e.alg.invert();for(let n=0;n<Math.abs(e.amount);n++)t.push(this.traverseGroupingOnce(r));return Array.prototype.concat(...t)}traverseMove(e){const t=oe(e.amount);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseCommutator(e){const t=[],r=[e.A,e.B,e.A.invert(),e.B.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traverseConjugate(e){const t=[],r=[e.A,e.B,e.A.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traversePause(e){if(e.experimentalNISSGrouping)return[];const t=oe(1);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseNewline(e){return[]}traverseLineComment(e){return[]}},Zn=Fe(Xn);function Kn(e){let t=0;return Zn(e).map(n=>{const i={animLeaf:n.animLeafAlgNode,start:t,end:t+n.duration};return t+=n.msUntilNext,i})}var $e=class{constructor(e,t,r){this.kpuzzle=e,this.animLeaves=r?.animationTimelineLeaves??Kn(t)}kpuzzle;animLeaves;getAnimLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]?.animLeaf??null}getAnimationTimelineLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]}indexToMoveStartTimestamp(e){let t=0;return this.animLeaves.length>0&&(t=this.animLeaves[Math.min(e,this.animLeaves.length-1)].start),t}timestampToIndex(e){let t=0;for(t=0;t<this.animLeaves.length;t++)if(this.animLeaves[t].start>=e)return Math.max(0,t-1);return Math.max(0,t-1)}timestampToPosition(e,t){const r=this.currentMoveInfo(e);let n=t??this.kpuzzle.identityTransformation().toKPattern();for(const i of this.animLeaves.slice(0,r.patternIndex)){const a=i.animLeaf.as(G);a!==null&&(n=n.applyMove(a))}return{pattern:n,movesInProgress:r.currentMoves}}currentMoveInfo(e){let t=1/0;for(const l of this.animLeaves)if(l.start<=e&&l.end>=e)t=Math.min(t,l.start);else if(l.start>e)break;const r=[],n=[],i=[],a=[];let s=-1/0,c=1/0,u=0;for(const l of this.animLeaves)if(l.end<=t){if(!isFinite(t)&&l.start>e)break;u++}else{if(l.start>e)break;{const w=l.animLeaf.as(G);if(w!==null){let d=(e-l.start)/(l.end-l.start),x=!1;d>1&&(d=1,x=!0);const f={move:w,direction:1,fraction:d,startTimestamp:l.start,endTimestamp:l.end};switch(d){case 0:{n.push(f);break}case 1:{x?a.push(f):i.push(f);break}default:r.push(f),s=Math.max(s,l.start),c=Math.min(c,l.end)}}}}return{patternIndex:u,currentMoves:r,latestStart:s,earliestEnd:c,movesStarting:n,movesFinishing:i,movesFinished:a}}patternAtIndex(e,t){let r=t??this.kpuzzle.defaultPattern();for(let n=0;n<this.animLeaves.length&&n<e;n++){const a=this.animLeaves[n].animLeaf.as(G);a!==null&&(r=r.applyMove(a))}return r}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of this.animLeaves.slice(0,e)){const n=r.animLeaf.as(G);n!==null&&(t=t.applyMove(n))}return t}algDuration(){let e=0;for(const t of this.animLeaves)e=Math.max(e,t.end);return e}numAnimatedLeaves(){return this.animLeaves.length}moveDuration(e){const t=this.getAnimationTimelineLeaf(e);return t.end-t.start}},Jn=1024,ei=class extends D{derive(e){switch(e.indexerConstructorRequest){case"auto":return e.animationTimelineLeaves!==null||Vr(e.alg.alg)<=Jn&&e.puzzle==="3x3x3"&&e.visualizationStrategy==="Cube3D"?$e:ut;case"tree":return ut;case"simple":return wn;case"simultaneous":return $e;default:throw new Error("Invalid indexer request!")}}},ti=class extends k{getDefaultValue(){return"auto"}},ri=class extends D{derive(e){return new e.indexerConstructor(e.kpuzzle,e.algWithIssues.alg,{animationTimelineLeaves:e.animationTimelineLeaves})}},ni=class extends D{derive(e){return{pattern:e.currentPattern,movesInProgress:e.currentMoveInfo.currentMoves}}},ii=!0,Mt=class extends D{async derive(e){try{return ii&&e.kpuzzle.algToTransformation(e.algWithIssues.alg),e.algWithIssues}catch(t){return{alg:new H,issues:new xe({errors:[`Invalid alg for puzzle: ${t.toString()}`]})}}}},ai=class extends k{getDefaultValue(){return"start"}},si=class extends k{getDefaultValue(){return null}},oi=class extends D{async derive(e){return e.puzzleLoader.kpuzzle()}},li=class extends k{getDefaultValue(){return ve}},ci=class extends D{async derive(e){return e.puzzleLoader.id}},di=class extends k{getDefaultValue(){return ve}},ui=class extends D{derive(e){if(e.puzzleIDRequest&&e.puzzleIDRequest!==ve){const t=Pt[e.puzzleIDRequest];return t||this.userVisibleErrorTracker.set({errors:[`Invalid puzzle ID: ${e.puzzleIDRequest}`]}),t}return e.puzzleDescriptionRequest&&e.puzzleDescriptionRequest!==ve?Cr(e.puzzleDescriptionRequest):Er}},hi=class extends D{derive(e){return{playing:e.playingInfo.playing,atStart:e.detailedTimelineInfo.atStart,atEnd:e.detailedTimelineInfo.atEnd}}canReuseValue(e,t){return e.playing===t.playing&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},mi=class extends D{derive(e){let t=this.#e(e),r=!1,n=!1;return t>=e.timeRange.end&&(n=!0,t=Math.min(e.timeRange.end,t)),t<=e.timeRange.start&&(r=!0,t=Math.max(e.timeRange.start,t)),{timestamp:t,timeRange:e.timeRange,atStart:r,atEnd:n}}#e(e){switch(e.timestampRequest){case"auto":return e.setupAnchor==="start"&&e.setupAlg.alg.experimentalIsEmpty()?e.timeRange.end:e.timeRange.start;case"start":return e.timeRange.start;case"end":return e.timeRange.end;case"anchor":return e.setupAnchor==="start"?e.timeRange.start:e.timeRange.end;case"opposite-anchor":return e.setupAnchor==="start"?e.timeRange.end:e.timeRange.start;default:return e.timestampRequest}}canReuseValue(e,t){return e.timestamp===t.timestamp&&e.timeRange.start===t.timeRange.start&&e.timeRange.end===t.timeRange.end&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},pi=class extends ie{async getDefaultValue(){return{direction:1,playing:!1,untilBoundary:"entire-timeline",loop:!1}}async derive(e,t){const r=await t,n=Object.assign({},r);return Object.assign(n,e),n}canReuseValue(e,t){return e.direction===t.direction&&e.playing===t.playing&&e.untilBoundary===t.untilBoundary&&e.loop===t.loop}},gi=class extends ie{getDefaultValue(){return 1}derive(e){return e<0?1:e}},fi={auto:!0,start:!0,end:!0,anchor:!0,"opposite-anchor":!0},vi=class extends k{getDefaultValue(){return"auto"}set(e){const t=this.get();super.set((async()=>this.validInput(await e)?e:t)())}validInput(e){return!!(typeof e=="number"||fi[e])}},wi=class extends D{derive(e){return{start:0,end:e.indexer.algDuration()}}},yi=class extends k{getDefaultValue(){return"auto"}},xi=class extends k{getDefaultValue(){return"auto"}},Mi=class extends D{derive(e){switch(e.puzzleID){case"clock":case"square1":case"redi_cube":case"melindas2x2x2x2":case"tri_quad":case"loopover":return"2D";case"3x3x3":switch(e.visualizationRequest){case"auto":case"3D":return"Cube3D";default:return e.visualizationRequest}default:switch(e.visualizationRequest){case"auto":case"3D":return"PG3D";case"experimental-2D-LL":case"experimental-2D-LL-face":return["2x2x2","4x4x4","megaminx"].includes(e.puzzleID)?"experimental-2D-LL":"2D";default:return e.visualizationRequest}}}},bi=class extends k{getDefaultValue(){return"auto"}},Si=class extends k{getDefaultValue(){return"auto"}},Ti=class extends k{getDefaultValue(){return"auto"}},zi=class extends k{getDefaultValue(){return"auto"}},Ii=null;async function ki(){return Ii??=new(await X).ThreeTextureLoader}var bt=class extends D{async derive(e){const{spriteURL:t}=e;return t===null?null:new Promise(async(r,n)=>{const i=()=>{console.warn("Could not load sprite:",t.toString()),r(null)};try{(await ki()).load(t.toString(),r,i,i)}catch{i()}})}},Li={facelets:["regular","regular","regular","regular","regular"]};async function Ai(e){const{definition:t}=await e.kpuzzle(),r={orbits:{}};for(const n of t.orbits)r.orbits[n.orbitName]={pieces:new Array(n.numPieces).fill(Li)};return r}var Di=class extends D{getDefaultValue(){return{orbits:{}}}async derive(e){return e.stickeringMaskRequest?e.stickeringMaskRequest:e.stickeringRequest==="picture"?{specialBehaviour:"picture",orbits:{}}:e.puzzleLoader.stickeringMask?.(e.stickeringRequest??"full")??Ai(e.puzzleLoader)}},Ci={"-":"Regular",D:"Dim",I:"Ignored",X:"Invisible",O:"IgnoreNonPrimary",P:"PermuteNonPrimary",o:"Ignoriented","?":"OrientationWithoutPermutation",M:"Mystery","@":"Regular"};function Ei(e){const t={orbits:{}},r=e.split(",");for(const n of r){const[i,a,...s]=n.split(":");if(s.length>0)throw new Error(`Invalid serialized orbit stickering mask (too many colons): \`${n}\``);const c=[];t.orbits[i]={pieces:c};for(const u of a){const l=Ci[u];c.push(Rr(l))}}return t}var Ni=class extends ie{getDefaultValue(){return null}derive(e){return e===null?null:typeof e=="string"?Ei(e):e}},Pi=class extends k{getDefaultValue(){return null}},Ri=class extends k{getDefaultValue(){return"auto"}},ji=class extends k{getDefaultValue(){return{}}},Oi=class extends k{getDefaultValue(){return"auto"}},Fi=class extends k{getDefaultValue(){return"auto"}},Vi=class extends D{derive(e){return e.colorSchemeRequest==="dark"?"dark":"light"}},Bi=class extends k{getDefaultValue(){return"auto"}},Ui=class extends k{getDefaultValue(){return null}},qi=35,Wi=class extends k{getDefaultValue(){return qi}};function or(e,t){return e.latitude===t.latitude&&e.longitude===t.longitude&&e.distance===t.distance}var Hi=class extends ie{getDefaultValue(){return"auto"}canReuseValue(e,t){return e===t||or(e,t)}async derive(e,t){if(e==="auto")return"auto";let r=await t;r==="auto"&&(r={});const n=Object.assign({},r);return Object.assign(n,e),typeof n.latitude<"u"&&(n.latitude=Math.min(Math.max(n.latitude,-90),90)),typeof n.longitude<"u"&&(n.longitude=Ze(n.longitude,180,-180)),n}},$i=class extends D{canReuseValue(e,t){return or(e,t)}async derive(e){if(e.orbitCoordinatesRequest==="auto")return Tt(e.puzzleID,e.strategy);const t=Object.assign(Object.assign({},Tt(e.puzzleID,e.strategy),e.orbitCoordinatesRequest));if(Math.abs(t.latitude)<=e.latitudeLimit)return t;{const{latitude:r,longitude:n,distance:i}=t;return{latitude:e.latitudeLimit*Math.sign(r),longitude:n,distance:i}}}},Qi={latitude:31.717474411461005,longitude:0,distance:5.877852522924731},Yi={latitude:35,longitude:30,distance:6},St={latitude:35,longitude:30,distance:6.25},_i={latitude:Math.atan(1/2)*ye,longitude:0,distance:6.7},Gi={latitude:26.56505117707799,longitude:0,distance:6};function Tt(e,t){if(e[1]==="x")return t==="Cube3D"?Yi:St;switch(e){case"megaminx":case"gigaminx":return _i;case"pyraminx":case"master_tetraminx":return Gi;case"skewb":return St;default:return Qi}}var Xi=class{constructor(e){this.twistyPlayerModel=e,this.orbitCoordinates=new $i({orbitCoordinatesRequest:this.orbitCoordinatesRequest,latitudeLimit:this.latitudeLimit,puzzleID:e.puzzleID,strategy:e.visualizationStrategy}),this.stickeringMask=new Di({stickeringMaskRequest:this.stickeringMaskRequest,stickeringRequest:this.stickeringRequest,puzzleLoader:e.puzzleLoader})}twistyPlayerModel;background=new Fi;colorSchemeRequest=new Bi;dragInput=new Ri;foundationDisplay=new Si;foundationStickerSpriteURL=new Je;fullscreenElement=new Ui;hintFacelet=new sn;hintStickerSpriteURL=new Je;initialHintFaceletsAnimation=new zi;hintFaceletsElevation=new Ti;latitudeLimit=new Wi;movePressInput=new Oi;movePressCancelOptions=new ji;orbitCoordinatesRequest=new Hi;stickeringMaskRequest=new Ni;stickeringRequest=new Pi;faceletScale=new bi;colorScheme=new Vi({colorSchemeRequest:this.colorSchemeRequest});foundationStickerSprite=new bt({spriteURL:this.foundationStickerSpriteURL});hintStickerSprite=new bt({spriteURL:this.hintStickerSpriteURL});orbitCoordinates;stickeringMask},Zi={errors:[]},Ki=class extends k{getDefaultValue(){return Zi}reset(){this.set(this.getDefaultValue())}canReuseValue(e,t){return Xe(e.errors,t.errors)}},Ji=class{userVisibleErrorTracker=new Ki;alg=new yt;backView=new zn;controlPanel=new Nn;catchUpMove=new $n;indexerConstructorRequest=new ti;playingInfo=new pi;puzzleDescriptionRequest=new li;puzzleIDRequest=new di;setupAnchor=new ai;setupAlg=new yt;setupTransformation=new si;tempoScale=new gi;timestampRequest=new vi;viewerLink=new yi;visualizationFormat=new xi;title=new wt;videoURL=new Je;competitionID=new wt;animationTimelineLeavesRequest=new Hn;puzzleLoader=new ui({puzzleIDRequest:this.puzzleIDRequest,puzzleDescriptionRequest:this.puzzleDescriptionRequest},this.userVisibleErrorTracker);kpuzzle=new oi({puzzleLoader:this.puzzleLoader});puzzleID=new ci({puzzleLoader:this.puzzleLoader});puzzleAlg=new Mt({algWithIssues:this.alg,kpuzzle:this.kpuzzle});puzzleSetupAlg=new Mt({algWithIssues:this.setupAlg,kpuzzle:this.kpuzzle});visualizationStrategy=new Mi({visualizationRequest:this.visualizationFormat,puzzleID:this.puzzleID});indexerConstructor=new ei({alg:this.alg,puzzle:this.puzzleID,visualizationStrategy:this.visualizationStrategy,indexerConstructorRequest:this.indexerConstructorRequest,animationTimelineLeaves:this.animationTimelineLeavesRequest});setupAlgTransformation=new qn({setupAlg:this.puzzleSetupAlg,kpuzzle:this.kpuzzle});indexer=new ri({indexerConstructor:this.indexerConstructor,algWithIssues:this.puzzleAlg,kpuzzle:this.kpuzzle,animationTimelineLeaves:this.animationTimelineLeavesRequest});anchorTransformation=new Wn({setupTransformation:this.setupTransformation,setupAnchor:this.setupAnchor,setupAlgTransformation:this.setupAlgTransformation,indexer:this.indexer});timeRange=new wi({indexer:this.indexer});detailedTimelineInfo=new mi({timestampRequest:this.timestampRequest,timeRange:this.timeRange,setupAnchor:this.setupAnchor,setupAlg:this.setupAlg});coarseTimelineInfo=new hi({detailedTimelineInfo:this.detailedTimelineInfo,playingInfo:this.playingInfo});currentMoveInfo=new Yn({indexer:this.indexer,detailedTimelineInfo:this.detailedTimelineInfo,catchUpMove:this.catchUpMove});buttonAppearance=new Vn({coarseTimelineInfo:this.coarseTimelineInfo,viewerLink:this.viewerLink});currentLeavesSimplified=new Qn({currentMoveInfo:this.currentMoveInfo});currentPattern=new _n({anchoredStart:this.anchorTransformation,currentLeavesSimplified:this.currentLeavesSimplified,indexer:this.indexer});legacyPosition=new ni({currentMoveInfo:this.currentMoveInfo,currentPattern:this.currentPattern});twistySceneModel=new Xi(this);async twizzleLink(){const[e,t,r,n,i,a,s,c]=await Promise.all([this.viewerLink.get(),this.puzzleID.get(),this.puzzleDescriptionRequest.get(),this.alg.get(),this.setupAlg.get(),this.setupAnchor.get(),this.twistySceneModel.stickeringRequest.get(),this.twistySceneModel.twistyPlayerModel.title.get()]),u=e==="experimental-twizzle-explorer",l=new URL(`https://alpha.twizzle.net/${u?"explore":"edit"}/`);return n.alg.experimentalIsEmpty()||l.searchParams.set("alg",n.alg.toString()),i.alg.experimentalIsEmpty()||l.searchParams.set("setup-alg",i.alg.toString()),a!=="start"&&l.searchParams.set("setup-anchor",a),s!=="full"&&s!==null&&l.searchParams.set("experimental-stickering",s),u&&r!==ve?l.searchParams.set("puzzle-description",r):t!=="3x3x3"&&l.searchParams.set("puzzle",t),c&&l.searchParams.set("title",c),l.toString()}experimentalAddAlgLeaf(e,t){const r=e.as(G);r?this.experimentalAddMove(r,t):this.alg.set((async()=>{const i=(await this.alg.get()).alg.concat(new H([e]));return this.timestampRequest.set("end"),i})())}experimentalAddMove(e,t){const r=typeof e=="string"?new G(e):e;this.alg.set((async()=>{const[{alg:n},i]=await Promise.all([this.alg.get(),this.puzzleLoader.get()]),a=Ar(n,r,{...t,...await Dr(i)});return this.timestampRequest.set("end"),this.catchUpMove.set({move:r,amount:0}),a})())}experimentalRemoveFinalChild(){this.alg.set((async()=>{const e=(await this.alg.get()).alg,t=Array.from(e.childAlgNodes()),[r]=t.splice(-1);if(!r)return e;this.timestampRequest.set("end");const n=r.as(G);return n&&this.catchUpMove.set({move:n.invert(),amount:0}),new H(t)})())}};function b(e){return new Error(`Cannot get \`.${e}\` directly from a \`TwistyPlayer\`.`)}var ea=class extends Y{experimentalModel=new Ji;set alg(e){this.experimentalModel.alg.set(e)}get alg(){throw b("alg")}set experimentalSetupAlg(e){this.experimentalModel.setupAlg.set(e)}get experimentalSetupAlg(){throw b("setup")}set experimentalSetupAnchor(e){this.experimentalModel.setupAnchor.set(e)}get experimentalSetupAnchor(){throw b("anchor")}set puzzle(e){this.experimentalModel.puzzleIDRequest.set(e)}get puzzle(){throw b("puzzle")}set experimentalPuzzleDescription(e){this.experimentalModel.puzzleDescriptionRequest.set(e)}get experimentalPuzzleDescription(){throw b("experimentalPuzzleDescription")}set timestamp(e){this.experimentalModel.timestampRequest.set(e)}get timestamp(){throw b("timestamp")}set hintFacelets(e){this.experimentalModel.twistySceneModel.hintFacelet.set(e)}get hintFacelets(){throw b("hintFacelets")}set experimentalStickering(e){this.experimentalModel.twistySceneModel.stickeringRequest.set(e)}get experimentalStickering(){throw b("experimentalStickering")}set experimentalStickeringMaskOrbits(e){this.experimentalModel.twistySceneModel.stickeringMaskRequest.set(e)}get experimentalStickeringMaskOrbits(){throw b("experimentalStickeringMaskOrbits")}set experimentalFaceletScale(e){this.experimentalModel.twistySceneModel.faceletScale.set(e)}get experimentalFaceletScale(){throw b("experimentalFaceletScale")}set backView(e){this.experimentalModel.backView.set(e)}get backView(){throw b("backView")}set background(e){this.experimentalModel.twistySceneModel.background.set(e)}get background(){throw b("background")}set colorScheme(e){this.experimentalModel.twistySceneModel.colorSchemeRequest.set(e)}get colorScheme(){throw b("colorScheme")}set controlPanel(e){this.experimentalModel.controlPanel.set(e)}get controlPanel(){throw b("controlPanel")}set visualization(e){this.experimentalModel.visualizationFormat.set(e)}get visualization(){throw b("visualization")}set experimentalTitle(e){this.experimentalModel.title.set(e)}get experimentalTitle(){throw b("experimentalTitle")}set experimentalVideoURL(e){this.experimentalModel.videoURL.set(e)}get experimentalVideoURL(){throw b("experimentalVideoURL")}set experimentalCompetitionID(e){this.experimentalModel.competitionID.set(e)}get experimentalCompetitionID(){throw b("experimentalCompetitionID")}set viewerLink(e){this.experimentalModel.viewerLink.set(e)}get viewerLink(){throw b("viewerLink")}set experimentalMovePressInput(e){this.experimentalModel.twistySceneModel.movePressInput.set(e)}get experimentalMovePressInput(){throw b("experimentalMovePressInput")}set experimentalMovePressCancelOptions(e){this.experimentalModel.twistySceneModel.movePressCancelOptions.set(e)}get experimentalMovePressCancelOptions(){throw b("experimentalMovePressCancelOptions")}set cameraLatitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({latitude:e})}get cameraLatitude(){throw b("cameraLatitude")}set cameraLongitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({longitude:e})}get cameraLongitude(){throw b("cameraLongitude")}set cameraDistance(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({distance:e})}get cameraDistance(){throw b("cameraDistance")}set cameraLatitudeLimit(e){this.experimentalModel.twistySceneModel.latitudeLimit.set(e)}get cameraLatitudeLimit(){throw b("cameraLatitudeLimit")}set indexer(e){this.experimentalModel.indexerConstructorRequest.set(e)}get indexer(){throw b("indexer")}set tempoScale(e){this.experimentalModel.tempoScale.set(e)}get tempoScale(){throw b("tempoScale")}set experimentalSprite(e){this.experimentalModel.twistySceneModel.foundationStickerSpriteURL.set(e)}get experimentalSprite(){throw b("experimentalSprite")}set experimentalHintSprite(e){this.experimentalModel.twistySceneModel.hintStickerSpriteURL.set(e)}get experimentalHintSprite(){throw b("experimentalHintSprite")}set fullscreenElement(e){this.experimentalModel.twistySceneModel.fullscreenElement.set(e)}get fullscreenElement(){throw b("fullscreenElement")}set experimentalInitialHintFaceletsAnimation(e){this.experimentalModel.twistySceneModel.initialHintFaceletsAnimation.set(e)}get experimentalInitialHintFaceletsAnimation(){throw b("experimentalInitialHintFaceletsAnimation")}set experimentalHintFaceletsElevation(e){this.experimentalModel.twistySceneModel.hintFaceletsElevation.set(e)}get experimentalHintFaceletsElevation(){throw b("experimentalHintFaceletsElevation")}set experimentalDragInput(e){this.experimentalModel.twistySceneModel.dragInput.set(e)}get experimentalDragInput(){throw b("experimentalDragInput")}experimentalGet=new ta(this.experimentalModel)},ta=class{constructor(e){this.model=e}model;async alg(){return(await this.model.alg.get()).alg}async setupAlg(){return(await this.model.setupAlg.get()).alg}puzzleID(){return this.model.puzzleID.get()}async timestamp(){return(await this.model.detailedTimelineInfo.get()).timestamp}},Qe="data-",je={alg:"alg","experimental-setup-alg":"experimentalSetupAlg","experimental-setup-anchor":"experimentalSetupAnchor",puzzle:"puzzle","experimental-puzzle-description":"experimentalPuzzleDescription",visualization:"visualization","hint-facelets":"hintFacelets","experimental-stickering":"experimentalStickering","experimental-stickering-mask-orbits":"experimentalStickeringMaskOrbits",background:"background","color-scheme":"colorScheme","control-panel":"controlPanel","back-view":"backView","experimental-facelet-scale":"experimentalFaceletScale","experimental-initial-hint-facelets-animation":"experimentalInitialHintFaceletsAnimation","experimental-hint-facelets-elevation":"experimentalHintFaceletsElevation","viewer-link":"viewerLink","experimental-move-press-input":"experimentalMovePressInput","experimental-drag-input":"experimentalDragInput","experimental-title":"experimentalTitle","experimental-video-url":"experimentalVideoURL","experimental-competition-id":"experimentalCompetitionID","camera-latitude":"cameraLatitude","camera-longitude":"cameraLongitude","camera-distance":"cameraDistance","camera-latitude-limit":"cameraLatitudeLimit","tempo-scale":"tempoScale","experimental-sprite":"experimentalSprite","experimental-hint-sprite":"experimentalHintSprite"},ra=Object.fromEntries(Object.values(je).map(e=>[e,!0])),na={experimentalMovePressCancelOptions:!0},zt,lr=Symbol("intersectedCallback");function ia(e){zt??=new IntersectionObserver((t,r)=>{for(const n of t)n.isIntersecting&&n.intersectionRect.height>0&&(n.target[lr](),r.unobserve(n.target))}),zt.observe(e)}var Se=class extends ea{controller=new Cn(this.experimentalModel,this);buttons;experimentalCanvasClickCallback=()=>{};constructor(e={}){super();for(const[t,r]of Object.entries(e)){if(!(ra[t]||na[t])){console.warn(`Invalid config passed to TwistyPlayer: ${t}`);break}this[t]=r}}#e=new be(this,"controls-",["auto"].concat(Object.keys(En)));#t=document.createElement("div");#r=document.createElement("div");#n=!1;connectedCallback(){this.addCSS(ir),ia(this)}async[lr](){if(this.#n)return;this.#n=!0,this.addElement(this.#t).classList.add("visualization-wrapper"),this.addElement(this.#r).classList.add("error-elem"),this.#r.textContent="Error",this.experimentalModel.userVisibleErrorTracker.addFreshListener(t=>{const r=t.errors[0]??null;this.contentWrapper.classList.toggle("error",!!r),r&&(this.#r.textContent=r)});const e=new tr(this.experimentalModel,this.controller);this.contentWrapper.appendChild(e),this.buttons=new Zt(this.experimentalModel,this.controller,this),this.contentWrapper.appendChild(this.buttons),this.experimentalModel.twistySceneModel.background.addFreshListener(t=>{this.contentWrapper.classList.toggle("checkered",["auto","checkered"].includes(t)),this.contentWrapper.classList.toggle("checkered-transparent",t==="checkered-transparent")}),this.experimentalModel.twistySceneModel.colorScheme.addFreshListener(t=>{this.contentWrapper.classList.toggle("dark-mode",["dark"].includes(t))}),this.experimentalModel.controlPanel.addFreshListener(t=>{this.#e.setValue(t)}),this.experimentalModel.visualizationStrategy.addFreshListener(this.#l.bind(this)),this.experimentalModel.puzzleID.addFreshListener(this.flash.bind(this))}#a="auto";experimentalSetFlashLevel(e){this.#a=e}flash(){this.#a==="auto"&&this.#i?.animate([{opacity:.25},{opacity:1}],{duration:250,easing:"ease-out"})}#i=null;#s=new Yt;#o=null;#l(e){if(e!==this.#o){this.#i?.remove(),this.#i?.disconnect();let t;switch(e){case"2D":case"experimental-2D-LL":case"experimental-2D-LL-face":{t=new Qt(this.experimentalModel.twistySceneModel,e);break}case"Cube3D":case"PG3D":{t=new Ke(this.experimentalModel),this.#s.handleNewValue(t);break}default:throw new Error("Invalid visualization")}this.#t.appendChild(t),this.#i=t,this.#o=e}}async experimentalCurrentVantages(){this.connectedCallback();const e=this.#i;return e instanceof Ke?e.experimentalVantages():[]}async experimentalCurrentCanvases(){const e=await this.experimentalCurrentVantages(),t=[];for(const r of e)t.push((await r.canvasInfo()).canvas);return t}async experimentalCurrentThreeJSPuzzleObject(e){this.connectedCallback();const r=await(await this.#s.promise).experimentalTwisty3DPuzzleWrapper(),n=r.twisty3DPuzzle(),i=(async()=>{await n,await new Promise(a=>setTimeout(a,0))})();if(e){const a=new me(async()=>{});r.addEventListener("render-scheduled",async()=>{a.requestIsPending()||(a.requestAnimFrame(),await i,e())})}return n}jumpToStart(e){this.controller.jumpToStart(e)}jumpToEnd(e){this.controller.jumpToEnd(e)}play(){this.controller.togglePlay(!0)}pause(){this.controller.togglePlay(!1)}togglePlay(e){this.controller.togglePlay(e)}experimentalAddMove(e,t){this.experimentalModel.experimentalAddMove(e,t)}experimentalAddAlgLeaf(e,t){this.experimentalModel.experimentalAddAlgLeaf(e,t)}static get observedAttributes(){const e=[];for(const t of Object.keys(je))e.push(t,Qe+t);return e}experimentalRemoveFinalChild(){this.experimentalModel.experimentalRemoveFinalChild()}attributeChangedCallback(e,t,r){e.startsWith(Qe)&&(e=e.slice(Qe.length));const n=je[e];n&&(this[n]=r)}async experimentalScreenshot(e){return(await vt(this.experimentalModel,e)).dataURL}async experimentalDownloadScreenshot(e){if(["2D","experimental-2D-LL","experimental-2D-LL-face"].includes(await this.experimentalModel.visualizationStrategy.get())){const r=await this.#i.currentTwisty2DPuzzleWrapper().twisty2DPuzzle(),n=new XMLSerializer().serializeToString(r.svgWrapper.svgElement),i=URL.createObjectURL(new Blob([n]));nr(i,e??await rr(this.experimentalModel),"svg")}else await(await vt(this.experimentalModel)).download(e)}};B.define("twisty-player",Se);var aa=class extends et{traverseAlg(e,t){const r=[];let n=0;for(const i of e.childAlgNodes()){const a=this.traverseAlgNode(i,{numMovesSoFar:t.numMovesSoFar+n});r.push(a.tokens),n+=a.numLeavesInside}return{tokens:Array.prototype.concat(...r),numLeavesInside:n}}traverseGrouping(e,t){const r=this.traverseAlg(e.alg,t);return{tokens:r.tokens,numLeavesInside:r.numLeavesInside*e.amount}}traverseMove(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseCommutator(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside}}traverseConjugate(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside*2}}traversePause(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseNewline(e,t){return{tokens:[],numLeavesInside:0}}traverseLineComment(e,t){return{tokens:[],numLeavesInside:0}}},sa=Fe(aa),oa=class extends k{getDefaultValue(){return""}},la=class extends D{derive(e){return sr(e.value)}},ca=class extends ie{getDefaultValue(){return{selectionStart:0,selectionEnd:0,endChangedMostRecently:!1}}async derive(e,t){const{selectionStart:r,selectionEnd:n}=e,i=await t,a=e.selectionStart===i.selectionStart&&e.selectionEnd!==(await t).selectionEnd;return{selectionStart:r,selectionEnd:n,endChangedMostRecently:a}}},da=class extends D{derive(e){return e.selectionInfo.endChangedMostRecently?e.selectionInfo.selectionEnd:e.selectionInfo.selectionStart}},ua=class extends D{derive(e){return sa(e.algWithIssues.alg,{numMovesSoFar:0}).tokens}},ha=class extends D{derive(e){function t(n){if(n===null)return null;let i;return e.targetChar<n.leaf[le]?i="before":e.targetChar===n.leaf[le]?i="start":e.targetChar<n.leaf[ge]?i="inside":e.targetChar===n.leaf[ge]?i="end":i="after",{leafInfo:n,where:i}}let r=null;for(const n of e.leafTokens){if(e.targetChar<n.leaf[le]&&r!==null)return t(r);if(e.targetChar<=n.leaf[ge])return t(n);r=n}return t(r)}},ma=class{valueProp=new oa;selectionProp=new ca;targetCharProp=new da({selectionInfo:this.selectionProp});algEditorAlgWithIssues=new la({value:this.valueProp});leafTokensProp=new ua({algWithIssues:this.algEditorAlgWithIssues});leafToHighlight=new ha({leafTokens:this.leafTokensProp,targetChar:this.targetCharProp})},pa="//";function ga(e){try{return H.fromString(e)}catch{return null}}function cr(e,t){const r=e.indexOf(t);return r===-1?[e,""]:[e.slice(0,r),e.slice(r)]}function It(e){const t=[];for(const r of e.split(`
`)){let[n,i]=cr(r,pa);n=n.replaceAll("’","'"),t.push(n+i)}return t.join(`
`)}function fa(e,t){const{value:r}=e,{selectionStart:n,selectionEnd:i}=e,a=r.slice(0,n),s=r.slice(i);t=t.replaceAll(`\r
`,`
`);const c=a.match(/\/\/[^\n]*$/),u=r[n-1]==="/"&&t[0]==="/",l=c||u,w=t.match(/\/\/[^\n]*$/);let d=t;if(l){const[A,I]=cr(t,`
`);d=A+It(I)}else d=It(t);const x=!l&&n!==0&&![`
`," "].includes(d[0])&&![`
`," "].includes(r[n-1]),f=!w&&i!==r.length&&![`
`," "].includes(d.at(-1))&&![`
`," "].includes(r[i]);function p(A,I){const g=A+d+I,E=!!ga(a+g+s);return E&&(d=g),E}x&&f&&p(" "," ")||x&&p(" ","")||f&&p(""," "),ne?.execCommand("insertText",!1,d)||e.setRangeText(d,n,i,"end")}var dr=new Q;dr.replaceSync(`
:host {
  width: 384px;
  display: grid;
}

.wrapper {
  /*overflow: hidden;
  resize: horizontal;*/

  background: var(--background, none);
  display: grid;
}

textarea, .carbon-copy {
  grid-area: 1 / 1 / 2 / 2;

  width: 100%;
  font-family: sans-serif;
  line-height: 1.2em;

  font-size: var(--font-size, inherit);
  font-family: var(--font-family, sans-serif);

  box-sizing: border-box;

  padding: var(--padding, 0.5em);
  /* Prevent horizontal growth. */
  overflow-x: hidden;
}

textarea {
  resize: none;
  background: none;
  z-index: 2;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.25));
  overflow: hidden;
}

.carbon-copy {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  user-select: none;
  pointer-events: none;

  z-index: 1;
}

.carbon-copy .highlight {
  background: var(--highlight-color, rgba(255, 128, 0, 0.5));
  padding: 0.1em 0.2em;
  margin: -0.1em -0.2em;
  border-radius: 0.2em;
}

.wrapper.issue-warning textarea,
.wrapper.valid-for-puzzle-warning textarea {
  outline: none;
  border: 1px solid rgba(200, 200, 0, 0.5);
  background: rgba(255, 255, 0, 0.1);
}

.wrapper.issue-error textarea,
.wrapper.valid-for-puzzle-error textarea {
  outline: none;
  border: 1px solid red;
  background: rgba(255, 0, 0, 0.1);
}
`);var Ae="for-twisty-player",kt="placeholder",Lt="twisty-player-prop",va=class extends Y{model=new ma;#e=document.createElement("textarea");#t=document.createElement("div");#r=document.createElement("span");#n=document.createElement("span");#a=document.createElement("span");#i=new be(this,"valid-for-puzzle-",["none","warning","error"]);#s=null;#o;get#l(){return this.#s===null?null:this.#s.experimentalModel[this.#o]}debugNeverRequestTimestamp=!1;constructor(e){super(),this.#t.classList.add("carbon-copy"),this.addElement(this.#t),this.#e.rows=1,this.addElement(this.#e),this.#r.classList.add("prefix"),this.#t.appendChild(this.#r),this.#n.classList.add("highlight"),this.#t.appendChild(this.#n),this.#a.classList.add("suffix"),this.#t.appendChild(this.#a),this.#e.placeholder="Alg",this.#e.setAttribute("spellcheck","false"),this.addCSS(dr),this.#e.addEventListener("input",()=>{this.#d=!0,this.onInput()}),this.#e.addEventListener("blur",()=>this.onBlur()),document.addEventListener("selectionchange",()=>this.onSelectionChange()),e?.twistyPlayer&&(this.twistyPlayer=e.twistyPlayer),this.#o=e?.twistyPlayerProp??"alg",e?.twistyPlayerProp==="alg"&&this.model.leafToHighlight.addFreshListener(t=>{t&&this.highlightLeaf(t.leafInfo.leaf)})}connectedCallback(){this.#e.addEventListener("paste",e=>{const t=e.clipboardData?.getData("text");t&&(fa(this.#e,t),e.preventDefault(),this.onInput())})}set algString(e){this.#e.value=e,this.onInput()}get algString(){return this.#e.value}set placeholder(e){this.#e.placeholder=e}#d=!1;onInput(){this.#n.hidden=!0,this.highlightLeaf(null);const e=this.#e.value.trimEnd();this.model.valueProp.set(e),this.#l?.set(e)}async onSelectionChange(){if(document.activeElement!==this||this.shadow.activeElement!==this.#e||this.#o!=="alg")return;const{selectionStart:e,selectionEnd:t}=this.#e;this.model.selectionProp.set({selectionStart:e,selectionEnd:t})}async onBlur(){}setAlgIssueClassForPuzzle(e){this.#i.setValue(e)}#u(e){return e.endsWith(`
`)?`${e} `:e}#c=null;highlightLeaf(e){if(e===null){this.#r.textContent="",this.#n.textContent="",this.#a.textContent=this.#u(this.#e.value);return}e!==this.#c&&(this.#c=e,this.#r.textContent=this.#e.value.slice(0,e[le]),this.#n.textContent=this.#e.value.slice(e[le],e[ge]),this.#a.textContent=this.#u(this.#e.value.slice(e[ge])),this.#n.hidden=!1)}get twistyPlayer(){return this.#s}set twistyPlayer(e){if(this.#s){console.warn("twisty-player reassignment/clearing is not supported");return}this.#s=e,e&&((async()=>this.algString=this.#l?(await this.#l.get()).alg.toString():"")(),this.#o==="alg"&&(this.#s?.experimentalModel.puzzleAlg.addFreshListener(t=>{if(t.issues.errors.length===0){this.setAlgIssueClassForPuzzle(t.issues.warnings.length===0?"none":"warning");const r=t.alg,n=H.fromString(this.algString);r.isIdentical(n)||(this.algString=r.toString(),this.onInput())}else this.setAlgIssueClassForPuzzle("error")}),this.model.leafToHighlight.addFreshListener(async t=>{if(t===null)return;const[r,n]=await Promise.all([await e.experimentalModel.indexer.get(),await e.experimentalModel.timestampRequest.get()]);if(n==="auto"&&!this.#d)return;const i=r.indexToMoveStartTimestamp(t.leafInfo.idx),a=r.moveDuration(t.leafInfo.idx);let s;switch(t.where){case"before":{s=i;break}case"start":case"inside":{s=i+a/4;break}case"end":case"after":{s=i+a;break}default:throw console.log("invalid where"),new Error("Invalid where!")}this.debugNeverRequestTimestamp||e.experimentalModel.timestampRequest.set(s)}),e.experimentalModel.currentLeavesSimplified.addFreshListener(async t=>{const n=(await e.experimentalModel.indexer.get()).getAnimLeaf(t.patternIndex);this.highlightLeaf(n)})))}attributeChangedCallback(e,t,r){switch(e){case Ae:{const n=document.getElementById(r);if(!n){console.warn(`${Ae}= elem does not exist`);return}if(!(n instanceof Se)){console.warn(`${Ae}=is not a twisty-player`);return}this.twistyPlayer=n;return}case kt:{this.placeholder=r;return}case Lt:{if(this.#s)throw console.log("cannot set prop"),new Error("cannot set prop after twisty player");this.#o=r;return}}}static get observedAttributes(){return[Ae,kt,Lt]}};B.define("twisty-alg-editor",va);async function wa(e){return new Promise((t,r)=>{try{const n=document.getElementById(e);n&&t(n);const i=new MutationObserver(a=>{for(const s of a)s.attributeName==="id"&&s.target instanceof Element&&s.target.getAttribute("id")===e&&(t(s.target),i.disconnect())});i.observe(document.body,{attributeFilter:["id"],subtree:!0})}catch(n){r(n)}})}var ur=new Q;ur.replaceSync(`
:host {
  display: inline;
  --comment-opacity: 0.4;
  --active-background-shade: rgba(66, 133, 244);
}

.wrapper {
  display: inline;
  --current-color: currentColor
}

a {
  color: currentColor;

  &:not(:hover) {
    text-decoration: none;
  }

  &:hover {
    background: color-mix(in oklab, currentColor 20%, transparent);
  }

  &:active {
    color: currentColor;
    animation: 1s linear flash;
  }
}

@keyframes flash {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

twisty-alg-leaf-elem.twisty-alg-line-comment {
  opacity: var(--comment-opacity);
}

.current-move {
  background: color-mix(in oklab, var(--active-background-shade) 30%, transparent);
  margin-left: -0.1em;
  margin-right: -0.1em;
  padding-left: 0.1em;
  padding-right: 0.1em;
  border-radius: 0.1em;
}
`);var ya=.25,ue=class extends we{constructor(e,t,r,n,i,a){if(super(),this.algOrAlgNode=n,this.classList.add(e),a){const s=this.appendChild(document.createElement("a"));s.href="#",s.textContent=t,s.addEventListener("click",c=>{c.preventDefault(),r.twistyAlgViewer.jumpToIndex(r.earliestMoveIndex,i)})}else this.appendChild(document.createElement("span")).textContent=t}algOrAlgNode;pathToIndex(e){return[]}setCurrentMove(e){this.classList.toggle("current-move",e)}};B.define("twisty-alg-leaf-elem",ue);var he=class extends we{constructor(e,t){super(),this.algOrAlgNode=t,this.classList.add(e)}algOrAlgNode;queue=[];addString(e){const t=document.createElement("span");t.textContent=e,this.queue.push(t)}addElem(e){return this.queue.push(e.element),e.moveCount}flushQueue(e=1){for(const t of hr(this.queue,e))this.append(t);this.queue=[]}pathToIndex(e){return[]}};B.define("twisty-alg-wrapper-elem",he);function xa(e){return e===1?-1:1}function Ma(e,t){return t<0?xa(e):e}function hr(e,t){if(t===1)return e;const r=Array.from(e);return r.reverse(),r}var ba=class extends et{traverseAlg(e,t){let r=0;const n=new he("twisty-alg-alg",e);let i=!0;for(const a of Fr(e.childAlgNodes(),t.direction))i||n.addString(" "),i=!1,a.as(st)?.experimentalNISSGrouping&&n.addString("^("),a.as(Pe)?.experimentalNISSPlaceholder||(r+=n.addElem(this.traverseAlgNode(a,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}))),a.as(st)?.experimentalNISSGrouping&&n.addString(")");return n.flushQueue(t.direction),{moveCount:r,element:n}}traverseGrouping(e,t){const r=e.experimentalAsSquare1Tuple(),n=Ma(t.direction,e.amount);let i=0;const a=new he("twisty-alg-grouping",e);return a.addString("("),r?(i+=a.addElem({moveCount:1,element:new ue("twisty-alg-move",r[0].amount.toString(),t,r[0],!0,!0)}),a.addString(", "),i+=a.addElem({moveCount:1,element:new ue("twisty-alg-move",r[1].amount.toString(),t,r[1],!0,!0)})):i+=a.addElem(this.traverseAlg(e.alg,{earliestMoveIndex:t.earliestMoveIndex+i,twistyAlgViewer:t.twistyAlgViewer,direction:n})),a.addString(`)${e.experimentalRepetitionSuffix}`),a.flushQueue(),{moveCount:i*Math.abs(e.amount),element:a}}traverseMove(e,t){const r=new ue("twisty-alg-move",e.toString(),t,e,!0,!0);return t.twistyAlgViewer.highlighter.addMove(e[le],r),{moveCount:1,element:r}}traverseCommutator(e,t){let r=0;const n=new he("twisty-alg-commutator",e);n.addString("["),n.flushQueue();const[i,a]=hr([e.A,e.B],t.direction);return r+=n.addElem(this.traverseAlg(i,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString(", "),r+=n.addElem(this.traverseAlg(a,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.flushQueue(t.direction),n.addString("]"),n.flushQueue(),{moveCount:r*2,element:n}}traverseConjugate(e,t){let r=0;const n=new he("twisty-alg-conjugate",e);n.addString("[");const i=n.addElem(this.traverseAlg(e.A,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}));return r+=i,n.addString(": "),r+=n.addElem(this.traverseAlg(e.B,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString("]"),n.flushQueue(),{moveCount:r+i,element:n}}traversePause(e,t){return e.experimentalNISSGrouping?this.traverseAlg(e.experimentalNISSGrouping.alg,t):{moveCount:1,element:new ue("twisty-alg-pause",".",t,e,!0,!0)}}traverseNewline(e,t){const r=new he("twisty-alg-newline",e);return r.append(document.createElement("br")),{moveCount:0,element:r}}traverseLineComment(e,t){return{moveCount:0,element:new ue("twisty-alg-line-comment",`//${e.text}`,t,e,!1,!1)}}},Sa=Fe(ba),Ta=class{moveCharIndexMap=new Map;currentElem=null;addMove(e,t){this.moveCharIndexMap.set(e,t)}set(e){const t=e?this.moveCharIndexMap.get(e[le])??null:null;this.currentElem!==t&&(this.currentElem?.setCurrentMove(!1),t?.setCurrentMove(!0),this.currentElem=t)}},mr=class extends Y{highlighter=new Ta;#e;#t;#r=null;lastClickTimestamp=null;constructor(e){super({mode:"open"}),this.addCSS(ur),e?.twistyPlayer&&(this.twistyPlayer=e?.twistyPlayer)}connectedCallback(){}setAlg(e){this.#t?.isIdentical(e)||(this.#e=Sa(e,{earliestMoveIndex:0,twistyAlgViewer:this,direction:1}).element,this.#t=e,this.contentWrapper.textContent="",this.contentWrapper.appendChild(this.#e))}get twistyPlayer(){return this.#r}set twistyPlayer(e){this.#n(e)}async#n(e){if(this.#r){console.warn("twisty-player reassignment is not supported");return}if(e===null)throw new Error("clearing twistyPlayer is not supported");this.#r=e,this.#r.experimentalModel.alg.addFreshListener(t=>{this.setAlg(t.alg)}),e.experimentalModel.currentMoveInfo.addFreshListener(t=>{let r=t.currentMoves[0];if(r??=t.movesStarting[0],r??=t.movesFinishing[0],!r)this.highlighter.set(null);else{const n=r.move;this.highlighter.set(n)}}),e.experimentalModel.detailedTimelineInfo.addFreshListener(t=>{t.timestamp!==this.lastClickTimestamp&&(this.lastClickTimestamp=null)})}async jumpToIndex(e,t){const r=this.#r;if(r){r.pause();const n=(async()=>{const i=await r.experimentalModel.indexer.get(),a=t?i.moveDuration(e)*ya:0;return i.indexToMoveStartTimestamp(e)+i.moveDuration(e)-a})();r.experimentalModel.timestampRequest.set(await n),this.lastClickTimestamp===await n?(r.play(),this.lastClickTimestamp=null):this.lastClickTimestamp=await n}}async attributeChangedCallback(e,t,r){if(e==="for"){let n=document.getElementById(r);if(n||console.info("for= elem does not exist, waiting for one"),await customElements.whenDefined("twisty-player"),n=await wa(r),!(n instanceof Se)){console.warn("for= elem is not a twisty-player");return}this.twistyPlayer=n}}static get observedAttributes(){return["for"]}};B.define("twisty-alg-viewer",mr);var Ne=new Q;Ne.replaceSync(`
.wrapper {
  background: rgb(255, 245, 235);
  border: 1px solid rgba(0, 0, 0, 0.25);

  /* Workaround from https://stackoverflow.com/questions/40010597/how-do-i-apply-opacity-to-a-css-color-variable */
  --text-color: 0, 0, 0;
  --heading-background: 255, 230, 210;

  color: rgb(var(--text-color));
}

.setup-alg, twisty-alg-viewer {
  padding: 0.5em 1em;
}

.heading {
  background: rgba(var(--heading-background), 1);
  color: rgba(var(--text-color), 1);
  font-weight: bold;
  padding: 0.25em 0.5em;
  display: grid;
  grid-template-columns: auto 1fr;

  /* For the move count hover elems. */
  position: sticky;
}

.heading.title {
  background: rgb(255, 245, 235);
  font-size: 150%;
  white-space: pre-wrap;
}

.heading .move-count {
  font-weight: initial;
  text-align: right;
  color: rgba(var(--text-color), 0.4);
}

.wrapper.dark-mode .heading .move-count {
  color: rgba(var(--text-color), 0.7);
}

.heading a {
  text-decoration: none;
  color: inherit;
}

twisty-player {
  width: 100%;
  min-height: 128px;
  height: 288px;
  resize: vertical;
  overflow-y: hidden;
}

twisty-player + .heading {
  padding-top: 0.5em;
}

twisty-alg-viewer {
  display: inline-block;
}

.wrapper {
  container-type: inline-size;
}

.scrollable-region {
  border-top: 1px solid rgba(0, 0, 0, 0.25);
}

.scrollable-region {
  max-height: 18em;
  overflow-y: auto;
}

@container (min-width: 512px) {
  .responsive-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  twisty-player {
    height: 320px
  }
  .scrollable-region {
    border-top: none;
    border-left: 1px solid rgba(0, 0, 0, 0.25);
    contain: strict;
    max-height: 100cqh;
  }
}

.wrapper:fullscreen,
.wrapper:fullscreen .responsive-wrapper {
  width: 100%;
  height: 100%;
}

.wrapper:fullscreen twisty-player,
.wrapper:fullscreen .scrollable-region {
  height: 50%;
}

@container (min-width: 512px) {
  .wrapper:fullscreen twisty-player,
  .wrapper:fullscreen .scrollable-region {
    height: 100%;
  }
}

/* TODO: dedup with Twizzle Editor */
.move-count > span:hover:before {
  background-color: rgba(var(--heading-background), 1);
  color: rgba(var(--text-color), 1);
  backdrop-filter: blur(4px);
  z-index: 100;
  position: absolute;
  padding: 0.5em;
  top: 1.5em;
  right: 0;
  content: attr(data-before);
  white-space: pre-wrap;
  text-align: left;
}

.move-count > span:hover {
  color: rgba(var(--text-color), 1);
  cursor: help;
}
`);var pr=new Q;pr.replaceSync(`
.wrapper {
  background: white;
  --heading-background: 232, 239, 253
}

.wrapper.dark-mode {
  --text-color: 236, 236, 236;
  --heading-background: 29, 29, 29;
}

.scrollable-region {
  overflow-y: auto;
}

.wrapper.dark-mode {
  background: #262626;
  --text-color: 142, 142, 142;
  border-color: #FFFFFF44;
}

.wrapper.dark-mode .heading:not(.title) {
  background: #1d1d1d;
}

.heading.title {
  background: none;
}
`);function za(e="",t=location.href){const r={alg:"alg","setup-alg":"experimental-setup-alg","setup-anchor":"experimental-setup-anchor",puzzle:"puzzle",stickering:"experimental-stickering","puzzle-description":"experimental-puzzle-description",title:"experimental-title","video-url":"experimental-video-url",competition:"experimental-competition-id"},n=new URL(t).searchParams,i={};for(const[a,s]of Object.entries(r)){const c=n.get(e+a);if(c!==null){const u=je[s];i[u]=c}}return i}var De="outer block moves (e.g. R, Rw, or 4r)",Ce="inner block moves (e.g. M or 2-5r)",At={OBTM:`HTM = OBTM ("Outer Block Turn Metric"):
• ${Ce} count as 2 turns
• ${De} count as 1 turn
• rotations (e.g. x) count as 0 turns`,OBQTM:`QTM = OBQTM ("Outer Block Quantum Turn Metric"):
• ${Ce} count as 2 turns per quantum (e.g. M2 counts as 4)
• ${De} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,RBTM:`STM = RBTM ("Range Block Turn Metric"):
• ${Ce} count as 1 turn
• ${De} count as 1 turn
• rotations (e.g. x) count as 0 turns`,RBQTM:`SQTM = RBQTM ("Range Block Quantum Turn Metric"):
• ${Ce} count as 1 turn per quantum (e.g. M2 counts as 2)
• ${De} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,ETM:`ETM ("Execution Turn Metric"):
• all moves (including rotations) count as 1 turn`},Ia={OBTM:"OB",OBQTM:"OBQ",RBTM:"RB",RBQTM:"RBQ",ETM:"E"},ka=class extends Y{constructor(e){super({mode:"open"}),this.options=e}options;twistyPlayer=null;a=null;#e(){if(this.contentWrapper.textContent="",this.a){const t=this.contentWrapper.appendChild(document.createElement("span"));t.textContent="❗️",t.title="Could not show a player for link",this.addElement(this.a)}this.removeCSS(Ne);const e=this.shadow.adoptedStyleSheets.indexOf(Ne);typeof e<"u"&&this.shadow.adoptedStyleSheets.splice(e,e+1),this.#t?.remove()}#t;#r;#n;#a;async connectedCallback(){if(this.#n=this.addElement(document.createElement("div")),this.#n.classList.add("responsive-wrapper"),this.options?.colorScheme==="dark"&&this.contentWrapper.classList.add("dark-mode"),this.addCSS(Ne),this.options?.cdnForumTweaks&&this.addCSS(pr),this.a=this.querySelector("a"),!this.a)return;const e=za("",this.a.href),t=this.a?.href,{hostname:r,pathname:n}=new URL(t);if(r!=="alpha.twizzle.net"){this.#e();return}if(["/edit/","/explore/"].includes(n)){const i=n==="/explore/";if(e.puzzle&&!(e.puzzle in Pt)){const c=(await tt(async()=>{const{getPuzzleDescriptionString:u}=await import("./index-Oozf9bYC.js");return{getPuzzleDescriptionString:u}},[])).getPuzzleDescriptionString(e.puzzle);delete e.puzzle,e.experimentalPuzzleDescription=c}if(this.twistyPlayer=this.#n.appendChild(new Se({background:this.options?.cdnForumTweaks?"checkered-transparent":"checkered",colorScheme:this.options?.colorScheme==="dark"?"dark":"light",...e,viewerLink:i?"experimental-twizzle-explorer":"auto"})),this.twistyPlayer.fullscreenElement=this.contentWrapper,e.experimentalTitle&&(this.twistyPlayer.experimentalTitle=e.experimentalTitle),this.#r=this.#n.appendChild(document.createElement("div")),this.#r.classList.add("scrollable-region"),e.experimentalTitle&&this.#i(e.experimentalTitle).classList.add("title"),e.experimentalSetupAlg){this.#i("Setup",async()=>(await this.twistyPlayer?.experimentalModel.setupAlg.get())?.alg.toString()??null);const c=this.#r.appendChild(document.createElement("div"));c.classList.add("setup-alg"),c.textContent=new H(e.experimentalSetupAlg).toString()}const a=this.#i("Moves",async()=>(await this.twistyPlayer?.experimentalModel.alg.get())?.alg.toString()??null);this.#a=a.appendChild(La(this.twistyPlayer.experimentalModel)),this.#a.classList.add("move-count"),this.#r.appendChild(new mr({twistyPlayer:this.twistyPlayer})).part.add("twisty-alg-viewer")}else this.#e()}#i(e,t){const r=this.#r.appendChild(document.createElement("div"));r.classList.add("heading");const n=r.appendChild(document.createElement("span"));if(n.textContent=e,t){n.textContent+=" ";const i=n.appendChild(document.createElement("a"));i.textContent="📋",i.href="#",i.title="Copy to clipboard";async function a(s){i.textContent=s,await new Promise(c=>setTimeout(c,2e3)),i.textContent===s&&(i.textContent="📋")}i.addEventListener("click",async s=>{s.preventDefault(),i.textContent="📋…";const c=await t();if(c)try{await navigator.clipboard.writeText(c),a("📋✅")}catch(u){throw a("📋❌"),u}else a("📋❌")})}return r}};B.define("twizzle-link",ka);function La(e,t=document.createElement("span")){async function r(){const[n,i]=await Promise.all([e.puzzleAlg.get(),e.puzzleLoader.get()]);if(n.issues.errors.length!==0){t.textContent="";return}let a=!0;function s(c){a?a=!1:t.append(")(");const u=t.appendChild(document.createElement("span")),l=Ur(i,c,n.alg);u.append(`${Ia[c]}: `);const w=u.appendChild(document.createElement("span"));w.textContent=l.toString(),w.classList.add("move-number"),u.setAttribute("data-before",At[c]??""),u.setAttribute("title",At[c]??"")}t.textContent="(",i.id==="3x3x3"?(s("OBTM"),s("OBQTM"),s("RBTM")):i.pg&&(s("RBTM"),s("RBQTM")),s("ETM"),t.append(")")}return e.puzzleAlg.addFreshListener(r),e.puzzleID.addFreshListener(r),t}const Ee=e=>e*1e3;function Aa({cube:e,facelets:t,moves:r,position:n=r.length,speed:i=1,animateSeeks:a=!1,playback:s=!1,seekVersion:c=0,cross:u=null,rotation:l=kr(u)}){const w=S.useRef(null),d=S.useRef(null),x=S.useRef(null);return S.useEffect(()=>{const f=new Se({puzzle:"3x3x3",visualization:"3D",background:"none",controlPanel:"none",hintFacelets:"none"});return f.style.width="100%",f.style.height="280px",w.current?.appendChild(f),d.current=f,()=>{x.current&&cancelAnimationFrame(x.current.frame),x.current=null,f.pause(),f.remove(),d.current=null}},[]),S.useEffect(()=>{const f=d.current;if(!f)return;let p=x.current;if(!p||p.cube!==e||p.moves!==r||p.rotation!==l){p&&cancelAnimationFrame(p.frame);const I=new H(r.slice(0,n).join(" "));f.experimentalModel.setupTransformation.set(e.parse(t).applyAlg(I.invert()).applyAlg(l).experimentalToTransformation()),p={cube:e,moves:r,rotation:l,length:-1,cursor:n,target:n,speed:i,playback:s,seekVersion:c,time:0,frame:0},x.current=p}if(p.length!==r.length){const I=r.map(Rt(e,l)).map(g=>new G(g));f.alg=new H(I),f.experimentalModel.animationTimelineLeavesRequest.set(I.map((g,E)=>({animLeaf:g,start:Ee(E),end:Ee(E+1)}))),p.length=r.length}if((c!==p.seekVersion||!a&&!s)&&Math.abs(n-p.target)>1&&(cancelAnimationFrame(p.frame),p.frame=0,p.cursor=n),p.target=n,p.speed=i,p.playback=s,p.seekVersion=c,f.timestamp=Ee(p.cursor),p.frame||p.cursor===p.target)return;const y=p;y.time=performance.now();const A=I=>{const g=Math.abs(y.target-y.cursor),E=y.playback?Math.max(1,g)/80:1/100,F=Math.min(.95,Math.max(0,I-y.time)*y.speed*E);y.time=I,y.cursor+=Math.sign(y.target-y.cursor)*Math.min(Math.abs(y.target-y.cursor),F),f.timestamp=Ee(y.cursor),y.frame=y.cursor===y.target?0:requestAnimationFrame(A)};y.frame=requestAnimationFrame(A)},[e,t,r,r.length,n,i,a,s,c,l]),o.jsx("div",{ref:w,role:"img","aria-label":"Live 3x3 cube state"})}const Dt=new WeakMap,Da=[];function Ca({solve:e,cube:t,history:r=Da,brief:n=!1}){const i=S.useRef(null),{favorites:a,unlearn:s,enabled:c,categories:u}=Zr(),[l,w]=S.useState(null),[d,x]=S.useState(null),f=l?.solve===e?l.analysis:null,p=l?.solve===e?l.nonFavorites:[],y=l?.solve===e?l.unlearned:[],A=g=>`${Re[g.step]}: Non-favorite algorithm (${g.caseKey.replace("-"," ")})`;S.useEffect(()=>{if(e.status!=="complete")return;let g=!0;x(null),w(null);const E=()=>new Promise(Z=>setTimeout(Z,0));async function F(){await E();let Z=Dt.get(t);Z||Dt.set(t,Z=new WeakMap);const N=[],h=[...r.filter(M=>M.id!==e.id),e].filter(M=>M.session===e.session&&M.status!=="active");for(let M=0;M<h.length;M++){if(!g)return;const T=h[M];let V=Z.get(T);(!V||V.dnf!==(T.status!=="complete")||V.time!==Math.round(Et(T))/1e3)&&(V=T.imported?xr(T):{...Yr(Mr([T],t),",")[0],source:"timer",isCorrupt:!1},Z.set(T,V)),N.push(V),M%20===19&&await E()}if(!g)return;N.sort((M,T)=>M.date.getTime()-T.date.getTime()),Xr(N,100);const v=c&&!e.imported?Jr(e,t,a,u):[],L=e.imported?[]:en(e,t,s);g&&w({solve:e,analysis:N.find(M=>M.id===e.id),nonFavorites:v,unlearned:L})}return F().catch(()=>{g&&x(e)}),()=>{g=!1}},[e,e.status,e.penalty,t,r,a,c,u,s]);const I=f?_r(f):[];return o.jsxs("section",{ref:i,className:"mt-3","aria-label":"Solve mistakes","aria-live":"polite",children:[o.jsx("p",{className:"mb-1",children:e.status!=="complete"?"Incomplete solve - mistakes could not be fully assessed.":d===e?"Solve mistakes could not be assessed.":f?y.length||p.length||I.length?o.jsxs(o.Fragment,{children:[o.jsx("strong",{children:"Biggest mistake: "}),y.length?`Unlearn algorithm (${y[0].caseKey.replace("-"," ")})`:p.length?A(p[0]):We(I[0])]}):"No clear mistakes detected.":"Analyzing solve mistakes..."}),!n&&!!(y.length||p.length||I.length)&&o.jsxs("ul",{children:[y.map(g=>o.jsx("li",{children:o.jsxs("strong",{children:[Re[g.step],": Unlearn algorithm (",g.caseKey.replace("-"," "),")"]})},`unlearn-${g.step}`)),p.map(g=>o.jsxs("li",{children:[o.jsx("strong",{children:A(g)})," ",o.jsx("a",{href:`/database/#${g.caseKey}`,target:"_blank",rel:"noopener noreferrer",children:"Choose favorites"})]},`favorite-${g.step}`)),I.map(g=>o.jsxs("li",{children:[o.jsx("strong",{children:We(g)})," ",o.jsx(vr,{placement:"top",container:i,overlay:o.jsx(wr,{id:`replay-mistake-${ot(g)}`,children:Gr[g.kind].rule}),children:o.jsx("button",{type:"button",className:"btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none","aria-label":`About ${We(g)}`,children:"ⓘ"})})]},ot(g)))]})]})}const Ye=["rgb(100, 200, 255)","rgb(156, 115, 220)","rgb(156, 115, 220)","rgb(156, 115, 220)","rgb(156, 115, 220)","rgb(255, 230, 150)","rgb(80, 220, 220)"];function Ea({cube:e,solve:t,elapsed:r,precision:n,open:i,seek:a,seekMove:s,position:c,cursor:u}){const l=S.useRef(null),[w,d]=S.useState(1e3);S.useEffect(()=>{if(!l.current||typeof ResizeObserver>"u")return;const h=new ResizeObserver(([v])=>d(v.contentRect.width));return h.observe(l.current),()=>h.disconnect()},[]);const x=jt(t,e),f=Math.round(Math.max(t.duration,r)),p=!t.imported||t.imported.method.startsWith("CFOP"),y=(p?Re:t.imported.steps.map(h=>h.name)).map((h,v)=>{const L=t.imported?.steps.find(T=>T.name===h),M=t.imported?t.imported.steps.slice(0,t.imported.steps.findIndex(T=>T.name===h)).reduce((T,V)=>T+V.time*1e3,0):0;return{name:h.replace("Slot","Pair"),i:v,timing:t.imported?L?{start:M,end:M+L.time*1e3,time:L.time*1e3,recognition:L.recognitionTime*1e3,execution:L.executionTime*1e3}:null:v<=x.ends.length?qr(t,x.ends,v,f):null}}),A=t.status==="active"?Math.max(1e4,f*1.2):Math.max(1,f),I=y.flatMap(({name:h,i:v,timing:L})=>L?[{name:h,i:v,phase:"recognition",start:L.start,end:L.start+L.recognition},{name:h,i:v,phase:"execution",start:L.start+L.recognition,end:L.end}]:[]).filter(h=>h.end>h.start),g=y.slice(1,5).flatMap(h=>h.timing?[h.timing]:[]),E=g.length?{start:g[0].start,end:g[g.length-1].end,time:g.reduce((h,v)=>h+v.time,0),recognition:g.reduce((h,v)=>h+v.recognition,0),execution:g.reduce((h,v)=>h+v.execution,0)}:null,F=h=>({...y[h],key:String(h),done:!!t.imported||h<x.ends.length}),Z=p?[F(0),{name:"F2L",key:"f2l",i:1,timing:E,done:!!t.imported||x.ends[4]!==void 0},F(5),F(6)]:y.map((h,v)=>F(v));function N(h,v=!1){const L=h.map(z=>({...z,caption:v?z.name.replace("Pair ",""):z.name,text:z.timing?`${te(z.timing.time,n)}s`:"--"})),M=Math.max(64,...L.map(z=>(z.caption.length+z.text.length+1)*7+12)),T=Math.max(w,M),V=Math.ceil(h.length/Math.max(1,Math.floor(T/(M+8)))),K=V*24+12,re=L.map((z,W)=>({...z,row:W%V,anchor:z.timing?(z.timing.start+z.timing.end)/2/A*T:(W+.5)/h.length*T,position:0}));for(let z=0;z<V;z++){const W=re.filter(P=>P.row===z);let U=M/2;for(const P of W)P.position=Math.max(P.anchor,U),U=P.position+M+8;U=T-M/2;for(const P of[...W].reverse())P.position=Math.min(P.position,U),U=P.position-M-8}return o.jsxs("div",{className:`trail-labels${v?" trail-labels-bottom":""}`,role:"group","aria-label":v?"F2L sub-times":"CFOP steps",style:{height:K},children:[o.jsx("svg",{"aria-hidden":"true",viewBox:`0 0 ${T} ${K}`,preserveAspectRatio:"none",children:re.filter(z=>z.timing).map(({key:z,i:W,row:U,anchor:P,position:_})=>o.jsx("line",{x1:_,y1:v?U*24+12:(U+1)*24,x2:P,y2:v?0:K,stroke:Ye[W]},z))}),re.map(({key:z,name:W,caption:U,i:P,timing:_,done:J,text:ee,row:ae,position:Be})=>o.jsxs("span",{className:"trail-duration","data-step":z,"data-duration":_?.time,"data-status":_?J?"done":"pending":"unreached",role:"img","aria-label":`${W}: ${ee} (${_?J?"complete":"in progress":"not reached"})`,title:_?`${W}: ${ee}; ${te(_.recognition,n)}s recognition / ${te(_.execution,n)}s execution`:`${W}: not reached`,style:{left:`${Be/T*100}%`,top:ae*24+(v?12:0),width:M,[v?"borderTopColor":"borderBottomColor"]:Ye[P]},children:[o.jsx("strong",{children:U})," ",ee]},z))]})}return o.jsxs("div",{className:"mt-3 mb-3",role:i?"button":"group","aria-label":i?"View most recent solve":"Solve timeline",tabIndex:i?0:void 0,onClick:i,onKeyDown:h=>{i&&(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),i())},style:i?{cursor:"pointer"}:void 0,children:[N(Z),o.jsxs("div",{className:"solve-trail",ref:l,role:a?"slider":void 0,tabIndex:a?0:void 0,"aria-label":a?"Replay move":void 0,"aria-valuemin":a?0:void 0,"aria-valuemax":a?t.moves.length:void 0,"aria-valuenow":a?c:void 0,onClick:h=>{if(a){const v=h.currentTarget.getBoundingClientRect();a(Math.max(0,Math.min(1,(h.clientX-v.left)/v.width))*A)}},onKeyDown:h=>{if(!a)return;const v=h.key==="ArrowRight"?(c??0)+1:h.key==="ArrowLeft"?(c??0)-1:h.key==="Home"?0:h.key==="End"?t.moves.length:null;v!==null&&(h.preventDefault(),s?s(Math.max(0,Math.min(v,t.moves.length))):a(v<=0?-1:t.moves[Math.min(v,t.moves.length)-1].elapsed))},children:[I.map(({name:h,i:v,phase:L,start:M,end:T})=>o.jsx("span",{className:`trail-segment ${L}`,"data-step":v,"data-phase":L,"data-start":M,"data-end":T,role:"img","aria-label":`${h} ${L}: ${te(T-M,n)}s`,title:`${h} ${L}: ${te(T-M,n)}s`,style:{left:`${M/A*100}%`,width:`${(T-M)/A*100}%`,backgroundColor:Ye[v]}},`${v}-${L}`)),t.status==="active"&&o.jsx("span",{className:"trail-tip","aria-hidden":"true",style:{left:`${f/A*100}%`}}),a&&o.jsx("span",{className:"trail-tip","aria-hidden":"true",style:{left:`${(u??(c?t.moves[c-1].elapsed:0))/A*100}%`}})]}),p&&N([1,2,3,4].map(F),!0),o.jsxs("div",{className:"d-flex justify-content-between small text-secondary",children:[o.jsx("span",{children:"0s"}),o.jsxs("span",{children:[te(A,n),"s"]})]})]})}const Na=S.lazy(()=>tt(()=>import("./Database-Cbiqp-bS.js"),__vite__mapDeps([0,1,2])));function Pa({caseKey:e,close:t}){const r=S.useRef(null);return Ct(r),o.jsxs("dialog",{ref:r,className:"panel replay-dialog case-dialog","aria-label":`Algorithm case ${e.replace("-"," ")}`,onCancel:n=>{n.preventDefault(),t()},children:[o.jsxs("div",{className:"d-flex justify-content-between align-items-center mb-3",children:[o.jsx("h2",{className:"h5 mb-0",children:"Algorithm case"}),o.jsx("button",{autoFocus:!0,className:"btn-close","aria-label":"Close algorithm case",onClick:t})]}),o.jsx(S.Suspense,{fallback:o.jsx("p",{role:"status",children:"Loading case..."}),children:o.jsx(Na,{caseKey:e})})]})}function _a({cube:e,solve:t,history:r,close:n,change:i,remove:a,retry:s,retryDisabled:c=!1,precision:u=2,saveError:l}){const w=S.useRef(null),[d,x]=S.useState(0),[f,p]=S.useState(0),[y,A]=S.useState(0),I=S.useRef(0),[g,E]=S.useState(!1),[F,Z]=S.useState(1),[N,h]=S.useState(!1),[v,L]=S.useState(""),[M,T]=S.useState(""),V=S.useMemo(()=>t.moves.map(m=>m.move),[t]),K=S.useMemo(()=>t.moves.map((m,$)=>Wr(t,$+1)),[t]),{cross:re,ends:z,cases:W,pairs:U}=S.useMemo(()=>jt(t,e),[t,e]),P=S.useMemo(()=>Hr(e,re,U[0]),[e,re,U]),_=Ct(w),J=!t.imported||t.moves.length>0,ee=m=>{E(!1),x(m),A($=>$+1),I.current=m?K[m-1]:0,p(I.current)},ae=()=>{w.current?.close(),n()};async function Be(){if(window.confirm("Are you sure you want to delete this solve? This cannot be undone.")){h(!0),L("");try{await(a?a(t):Ir(t.id)),ae()}catch(m){L(m instanceof Error?m.message:"Unable to delete solve."),h(!1)}}}const gr=S.useMemo(()=>{const m=Rt(e,P);let $=0,C=0;return(t.imported?t.imported.steps.map(O=>O.name):Re).map((O,R)=>{const pe=t.imported?$:R?z[R-1]??t.moves.length:0;C+=(t.imported?.steps[R]?.time??0)*1e3;const Te=t.imported?R===t.imported.steps.length-1?t.moves.length:t.moves.reduce((q,de,Ie)=>de.elapsed<=C+1?Ie+1:q,pe):R===6?t.moves.length:z[R]??t.moves.length;$=Te;const Ue=[];for(let q=pe;q<Te;q++){const de=m(t.moves[q].move),Ie=de.includes("2")?2:de.endsWith("'")?-1:1,qe=Ue.at(-1);qe?.notation===de?(qe.end=q+1,qe.amount+=Ie):Ue.push({notation:de,start:q,end:q+1,amount:Ie})}const ce=t.imported?.steps[R]?.case??W[R],ze=O==="PLL"?"PLL":O==="OLL"?"OLL":"F2L";return{name:O.replace("Slot","Pair"),pair:R>0&&R<5?$r(U[R-1],re):"",case:ce?ce==="Solved"?"Solved":ze==="PLL"?`${ce} perm`:`${ze} ${ce}`:"",caseKey:(O==="PLL"||O==="OLL"||O.startsWith("F2L Slot"))&&Kr.some(q=>q.category===ze&&q.id===ce)?`${ze}-${ce}`:"",importedMoves:t.imported?.steps[R]?.moves,empty:R>z.length?"Not reached":z[R]===void 0?"No moves recorded":"Skipped",groups:Ue.map(q=>({...q,move:q.notation[0]+["4","","2","'"][(q.amount%4+4)%4]}))}})},[z,W,t,e,P,U,re]);S.useEffect(()=>{const m=()=>{document.hidden&&E(!1)};return document.addEventListener("visibilitychange",m),()=>document.removeEventListener("visibilitychange",m)},[]),S.useEffect(()=>{if(!_||!g||!t.moves.length){E(!1);return}const m=performance.now(),$=I.current;let C;const O=R=>{I.current=Math.min(t.duration,$+(R-m)*F),p(I.current),x(K.reduce((pe,Te)=>Te<=I.current?pe+1:pe,0)),I.current>=t.duration?E(!1):C=requestAnimationFrame(O)};return C=requestAnimationFrame(O),()=>cancelAnimationFrame(C)},[g,F,t,K,_]);const fr=S.useMemo(()=>e.facelets(e.parse(t.startFacelets).applyAlg(V.slice(0,d).join(" "))),[e,t.startFacelets,V,d]);return o.jsxs("dialog",{ref:w,className:"panel replay-dialog","aria-label":"Solve replay",onCancel:m=>{m.preventDefault(),N||ae()},children:[o.jsxs("div",{className:"replay-header",children:[o.jsxs("div",{className:"replay-summary",children:[o.jsxs("strong",{className:"replay-time","aria-label":"Solve time",children:[te(Et(t),u),"s"]}),o.jsxs("span",{className:"d-inline-flex align-items-baseline gap-3 flex-wrap",children:[o.jsxs("span",{children:[br(t)," turns"]}),o.jsxs("span",{className:"small text-secondary","aria-label":"Inspection time",children:["Inspection: ",t.inspection===void 0?"Not recorded":`${te(t.inspection,u)}s`]}),o.jsx("span",{className:"small text-secondary","aria-label":"Solve date",children:new Date(t.createdAt).toLocaleString()})]})]}),o.jsx("div",{className:"d-flex gap-2",children:o.jsx("button",{autoFocus:!0,className:"btn-close","aria-label":"Close replay",disabled:N,onClick:ae})}),o.jsxs("div",{className:"d-flex gap-2 mb-3",role:"group","aria-label":"Solve penalties and deletion",children:[i&&o.jsxs(o.Fragment,{children:[o.jsx("button",{className:`btn ${ke(t).includes("manual")?"btn-warning":"btn-outline-warning"}`,"aria-pressed":ke(t).includes("manual"),disabled:N||t.status!=="complete"&&t.dnfReason!=="manual",onClick:()=>i(Sr({...t},"manual",!ke(t).includes("manual"))),children:"+2"}),o.jsx("button",{className:`btn ${t.dnfReason==="manual"?"btn-warning":"btn-outline-warning"}`,"aria-pressed":t.dnfReason==="manual",disabled:N||t.status!=="complete"&&t.dnfReason!=="manual",onClick:()=>i({...t,status:t.dnfReason==="manual"?"complete":"incomplete",dnfReason:t.dnfReason==="manual"?void 0:"manual"}),children:"DNF"})]}),o.jsx("button",{className:"btn btn-outline-danger",disabled:N,onClick:Be,children:N?"Deleting...":"Delete"})]})]}),v&&o.jsx("p",{className:"alert alert-danger",role:"alert",children:v}),l&&o.jsx("p",{className:"alert alert-danger",role:"alert",children:l}),o.jsxs("div",{className:"replay-scramble",children:[o.jsx("p",{className:"scramble mb-0",children:Lr(t.scramble).join(" ")}),J&&(s?o.jsx("button",{className:"btn btn-outline-primary",disabled:N||c,onClick:()=>{ae(),s(t)},children:"Retry"}):o.jsx("a",{className:`btn btn-outline-primary${N?" disabled":""}`,"aria-disabled":N||void 0,tabIndex:N?-1:void 0,href:`/timer/?retry=${encodeURIComponent(t.id)}`,onClick:m=>{N?m.preventDefault():ae()},children:"Retry"}))]}),J&&o.jsxs(o.Fragment,{children:[o.jsx(Aa,{cube:e,facelets:fr,moves:V,position:d,speed:F,playback:!0,seekVersion:y,cross:re,rotation:P}),o.jsxs("div",{className:"d-flex gap-2 align-items-center flex-wrap",children:[o.jsx("button",{className:"btn btn-primary",disabled:!t.moves.length,onClick:()=>{d>=t.moves.length&&ee(0),E(!g)},children:g?"Pause":"Play"}),o.jsx("button",{className:"btn btn-outline-secondary",disabled:d===0,onClick:()=>ee(d-1),children:"Previous move"}),o.jsx("button",{className:"btn btn-outline-secondary",disabled:d>=t.moves.length,onClick:()=>ee(d+1),children:"Next move"}),o.jsx("select",{className:"form-select replay-speed","aria-label":"Replay speed",value:F,onChange:m=>Z(Number(m.target.value)),children:[.25,.5,1,2,4].map(m=>o.jsxs("option",{value:m,children:[m,"x"]},m))}),o.jsxs("span",{children:[d,"/",t.moves.length," moves - ",te(f,u),"s"]})]})]}),o.jsx(Ea,{cube:e,solve:t,elapsed:t.duration,precision:u,position:d,cursor:f,seekMove:J?ee:void 0,seek:J&&t.moves.length?m=>ee(m<0?0:K.reduce(($,C,O)=>Math.abs(C-m)<=Math.abs((K[$-1]??0)-m)?O+1:$,0)):void 0}),o.jsx("div",{className:"move-timeline",role:"group","aria-label":"Solution steps",children:gr.map((m,$)=>o.jsxs("div",{role:"group","aria-label":`${m.name} solution`,className:"mb-2",children:[o.jsxs("div",{className:"d-flex align-items-baseline gap-2",children:[o.jsx("h3",{className:"replay-step-name",children:m.name}),m.case&&(m.caseKey?o.jsx("button",{className:"badge text-bg-secondary border-0","aria-label":`${m.name} case`,onClick:()=>{E(!1),T(m.caseKey)},children:m.case}):o.jsx("span",{className:"badge text-bg-secondary","aria-label":`${m.name} case`,children:m.case})),m.pair&&o.jsx("span",{role:"img","aria-label":`${m.pair.replace("/"," / ")} pair`,title:m.pair.replace("/"," / "),children:Qr(m.pair)})]}),J&&m.name==="Cross"&&P&&o.jsx("span",{className:"move","aria-label":"Initial rotation",children:P}),J?m.groups.length?m.groups.map(C=>{const O=d===0?C.start===0:C.start<d&&d<=C.end;return o.jsx("button",{className:`move ${C.end<=d?"done":""} ${O?"current":""} ${O&&d>C.start&&d<C.end?"partial":""}`,title:`${te(K[C.end-1],u)}s`,"aria-current":O?"step":void 0,"aria-label":`${C.move}, recorded moves ${C.start+1} to ${C.end}: ${t.moves.slice(C.start,C.end).map(R=>R.move).join(" ")}`,onClick:()=>ee(C.end),children:C.move},C.start)}):o.jsx("span",{className:"small text-secondary",children:m.empty}):o.jsx("span",{children:m.importedMoves||"No moves reported"})]},`${$}-${m.name}`))}),t.status==="incomplete"&&o.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["DNF reason: ",Tr(t)]}),!!t.penalty&&o.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["+",t.penalty/1e3," ",t.penalty===2e3?"reason":"reasons",": ",ke(t).join(", ")]}),t.reason&&t.reason!=="Solve aborted by user."&&o.jsx("p",{className:"text-secondary small mt-2",children:t.reason}),o.jsxs("div",{className:"d-flex align-items-baseline gap-3 flex-wrap small text-secondary text-break mt-3",children:[o.jsxs("span",{"aria-label":"Solve ID",children:["Solve ID: ",o.jsx("span",{className:"font-monospace",children:t.id})]}),o.jsxs("span",{"aria-label":"Solve source",children:[zr(t),t.imported&&o.jsx(yr,{children:J?"Replay rebuilt from exported moves and timestamps; original device clock data is not available. Imported step analysis is preserved.":"Imported step analysis is preserved. This CSV has no valid timed recording to replay."})]})]}),o.jsx(Ca,{cube:e,solve:t,history:r}),M&&o.jsx(Pa,{caseKey:M,close:()=>T("")})]})}export{Aa as C,_a as R,Ea as S,on as T,Ca as a,an as b,X as c,Ya as h};
