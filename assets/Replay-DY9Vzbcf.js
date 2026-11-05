const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BdhXpoQ7.css"])))=>i.map(i=>d[i]);
import{r as T,j as d,u as tr}from"./index-C5LDRMrh.js";import{y as mt,z as rr,s as pt,u as nr,a as ir,A as sr,C as ar,B as or,f as oe,t as lr,m as cr,D as dr,E as Ve,F as ur,p as hr}from"./storage-CZdPFfJM.js";import{L as gt,_ as ft,M as C,A as I,a as mr,b as pr,p as vt,d as gr,c as fr,o as vr,T as fe,f as ve,h as Pe,i as wr,j as yr,G as pe,C as Ue,k as Mr,N as xr,l as Be,s as U,m as X,n as br,P as qe}from"./cubing-core-BlVCN5VW.js";import{c as Sr,a as Tr,b as zr}from"./chunk-UEUJSZTX-CfQkmGpb.js";import{aq as kr,ak as Ir,ar as Lr,a6 as Te,a2 as Ar,a3 as Dr,a7 as Cr,a8 as We,as as Er}from"./MistakeAnalysis-5ZYe3Jmh.js";var we=class{#e=0;#t=0;queue(e){return new Promise(async(t,r)=>{try{const n=++this.#e,i=await e;n>this.#t&&(this.#t=n,t(i))}catch(n){r(n)}})}},wt=0,yt=class{canReuse(e,t){return e===t||this.canReuseValue(e,t)}canReuseValue(e,t){return!1}debugGetChildren(){return Array.from(this.#e.values())}#e=new Set;addChild(e){this.#e.add(e)}removeChild(e){this.#e.delete(e)}lastSourceGeneration=0;markStale(e){if(e.detail.generation!==wt)throw new Error("A TwistyProp was marked stale too late!");if(this.lastSourceGeneration!==e.detail.generation){this.lastSourceGeneration=e.detail.generation;for(const t of this.#e)t.markStale(e);this.#r()}}#t=new Set;addRawListener(e,t){this.#t.add(e),t?.initial&&e()}removeRawListener(e){this.#t.delete(e)}#r(){this.#n||(this.#n=!0,setTimeout(()=>this.#s(),0))}#n=!1;#s(){if(!this.#n)throw new Error("Invalid dispatch state!");for(const e of this.#t)e();this.#n=!1}#i=new Map;addFreshListener(e){const t=new we;let r=null;const n=async()=>{const i=await t.queue(this.get());r!==null&&this.canReuse(r,i)||(r=i,e(i))};this.#i.set(e,n),this.addRawListener(n,{initial:!0})}removeFreshListener(e){this.removeRawListener(this.#i.get(e)),this.#i.delete(e)}},j=class extends yt{#e;constructor(e){super(),this.#e=new gt(async()=>this.getDefaultValue()),e&&(this.#e=this.deriveFromPromiseOrValue(e,this.#e))}set(e){this.#e=this.deriveFromPromiseOrValue(e,this.#e);const t={sourceProp:this,value:this.#e,generation:++wt};this.markStale(new CustomEvent("stale",{detail:t}))}async get(){return this.#e}async deriveFromPromiseOrValue(e,t){return this.derive(await e,t)}},v=class extends j{derive(e){return e}},K=Symbol("no value"),M=class extends yt{constructor(e,t){super(),this.userVisibleErrorTracker=t,this.#e=e;for(const r of Object.values(e))r.addChild(this)}userVisibleErrorTracker;#e;#t=null;#r=null;async get(){const e=this.lastSourceGeneration;if(this.#r?.generation===e)return this.#r.output;const t={generation:e,output:this.#s(this.#n(),e,this.#t)};return this.#r=t,this.userVisibleErrorTracker?.reset(),t.output}async#n(){const e={};for(const[r,n]of Object.entries(this.#e))e[r]=n.get();const t={};for(const r in this.#e)t[r]=await e[r];return t}async#s(e,t,r=null){const n=await e,i=a=>(this.#t={inputs:n,output:Promise.resolve(a),generation:t},a);if(!r)return i(await this.derive(n));const s=r.inputs;for(const a in this.#e)if(!this.#e[a].canReuse(n[a],s[a]))return i(await this.derive(n));return r.output}},re=class{#e=[];addListener(e,t){let r=!1;const n=i=>{r||t(i)};e.addFreshListener(n),this.#e.push(()=>{e.removeFreshListener(n),r=!0})}addMultiListener3(e,t){this.addMultiListener(e,t)}addMultiListener(e,t){let r=!1,n=e.length-1;const i=async s=>{if(n>0){n--;return}if(r)return;const a=e.map(h=>h.get()),l=await Promise.all(a);t(l)};for(const s of e)s.addFreshListener(i);this.#e.push(()=>{for(const s of e)s.removeFreshListener(i);r=!0})}disconnect(){for(const e of this.#e)e()}},Nr=class{},J;globalThis.HTMLElement?J=globalThis.HTMLElement:J=Nr;var Pr=class{define(){}},z;globalThis.customElements?z=globalThis.customElements:z=new Pr;var L,Rr=class{replaceSync(){}};globalThis.CSSStyleSheet?L=globalThis.CSSStyleSheet:L=Rr;var D=class extends J{shadow;contentWrapper;constructor(e){super(),this.shadow=this.attachShadow({mode:e?.mode??"closed"}),this.contentWrapper=document.createElement("div"),this.contentWrapper.classList.add("wrapper"),this.shadow.appendChild(this.contentWrapper)}addCSS(e){this.shadow.adoptedStyleSheets.push(e)}removeCSS(e){const t=this.shadow.adoptedStyleSheets.indexOf(e);typeof t<"u"&&this.shadow.adoptedStyleSheets.splice(t,t+1)}addElement(e){return this.contentWrapper.appendChild(e)}prependElement(e){this.contentWrapper.prepend(e)}removeElement(e){return this.contentWrapper.removeChild(e)}};z.define("twisty-managed-custom-element",D);var H=class{constructor(e){this.callback=e}callback;animFrameID=null;animFrame=this.animFrameWrapper.bind(this);requestIsPending(){return!!this.animFrameID}requestAnimFrame(){this.animFrameID||(this.animFrameID=requestAnimationFrame(this.animFrame))}cancelAnimFrame(){this.animFrameID&&(cancelAnimationFrame(this.animFrameID),this.animFrameID=0)}animFrameWrapper(e){this.animFrameID=0,this.callback(e)}},jr={floating:!0,none:!0},Or=class extends v{getDefaultValue(){return"auto"}},Fr=Math.PI*2,ee=360/Fr,E=new gt(()=>ft(()=>import("./twisty-dynamic-3d-4BEQ76PB-8sjd3Rkg.js"),__vite__mapDeps([0])));function Le(){return devicePixelRatio||1}var He=.1,Vr=class extends EventTarget{constructor(e){super(),this.target=e}target;#e=new Map;start(){this.addTargetListener("pointerdown",this.onPointerDown.bind(this)),this.addTargetListener("contextmenu",e=>{e.preventDefault()}),this.addTargetListener("touchmove",e=>e.preventDefault()),this.addTargetListener("dblclick",e=>e.preventDefault())}stop(){for(const[e,t]of this.#t.entries())this.target.removeEventListener(e,t);this.#t.clear(),this.#r=!1}#t=new Map;addTargetListener(e,t){this.#t.has(e)||(this.target.addEventListener(e,t),this.#t.set(e,t))}#r=!1;#n(){this.#r||(this.addTargetListener("pointermove",this.onPointerMove.bind(this)),this.addTargetListener("pointerup",this.onPointerUp.bind(this)),this.#r=!0)}#s(e){this.#e.delete(e.pointerId)}#i(e){const t=this.#e.get(e.pointerId);if(!t)return{movementInfo:null,hasMoved:!1};let r;return(e.movementX??0)!==0||(e.movementY??0)!==0?r={attachedInfo:t.attachedInfo,movementX:e.movementX,movementY:e.movementY,elapsedMs:e.timeStamp-t.lastTimeStamp}:r={attachedInfo:t.attachedInfo,movementX:e.clientX-t.lastClientX,movementY:e.clientY-t.lastClientY,elapsedMs:e.timeStamp-t.lastTimeStamp},t.lastClientX=e.clientX,t.lastClientY=e.clientY,t.lastTimeStamp=e.timeStamp,Math.abs(r.movementX)<He&&Math.abs(r.movementY)<He?{movementInfo:null,hasMoved:t.hasMoved}:(t.hasMoved=!0,{movementInfo:r,hasMoved:t.hasMoved})}onPointerDown(e){this.#n();const t={attachedInfo:{},hasMoved:!1,lastClientX:e.clientX,lastClientY:e.clientY,lastTimeStamp:e.timeStamp};this.#e.set(e.pointerId,t),this.target.setPointerCapture(e.pointerId)}onPointerMove(e){const t=this.#i(e).movementInfo;t&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("move",{detail:t})))}onPointerUp(e){const t=this.#i(e),r=this.#e.get(e.pointerId);this.#s(e),this.target.releasePointerCapture(e.pointerId);let n;if(t.hasMoved)n=new CustomEvent("up",{detail:{attachedInfo:r.attachedInfo}});else{const{altKey:i,ctrlKey:s,metaKey:a,shiftKey:l}=e;n=new CustomEvent("press",{detail:{normalizedX:e.offsetX/this.target.offsetWidth*2-1,normalizedY:1-e.offsetY/this.target.offsetHeight*2,rightClick:!!(e.button&2),keys:{altKey:i,ctrlOrMetaKey:s||a,shiftKey:l}}})}this.dispatchEvent(n)}},Z=[];async function Mt(e,t,r,n){Z.length===0&&Z.push(Re());const i=await Z[0];return i.setSize(e,t),i.render(r,n),i.domElement}async function Ur(e,t,r,n,i){if(e===0||t===0)return;Z.length===0&&Z.push(Re());const s=await Mt(e,t,n,i),a=r.getContext("2d");a.clearRect(0,0,r.width,r.height),a.drawImage(s,0,0)}var Br="srgb-linear";async function Re(){const e=(await E).ThreeWebGLRenderer,t=new e({antialias:!0,alpha:!0});return t.outputColorSpace=Br,t.setPixelRatio(Le()),t}var xt=new L;xt.replaceSync(`
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
`);var qr=!0,ze=500,Wr=50,Hr=.75;function Qe(e){return(Math.exp(1-e)-(1-e))/(1-Math.E)+1}var Qr=class{constructor(e,t,r,n){this.startTimestamp=e,this.momentumX=t,this.momentumY=r,this.callback=n,this.scheduler.requestAnimFrame(),this.lastTimestamp=e}startTimestamp;momentumX;momentumY;callback;scheduler=new H(this.render.bind(this));lastTimestamp;render(e){const t=(this.lastTimestamp-this.startTimestamp)/ze,r=Math.min(1,(e-this.startTimestamp)/ze);if(t===0&&r>Wr/ze)return;const n=Qe(r)-Qe(t);this.callback(this.momentumX*n*1e3,this.momentumY*n*1e3),r<1&&this.scheduler.requestAnimFrame(),this.lastTimestamp=e}},Yr=class{constructor(e,t,r,n){this.model=e,this.mirror=t,this.canvas=r,this.dragTracker=n,this.dragTracker.addEventListener("move",this.onMove.bind(this)),this.dragTracker.addEventListener("up",this.onUp.bind(this))}model;mirror;canvas;dragTracker;experimentalInertia=qr;onMovementBound=this.onMovement.bind(this);experimentalHasBeenMoved=!1;temperMovement(e){return Math.sign(e)*Math.log(Math.abs(e*10)+1)/6}onMove(e){e.detail.attachedInfo??={};const{temperedX:t,temperedY:r}=this.onMovement(e.detail.movementX,e.detail.movementY),n=e.detail.attachedInfo;n.lastTemperedX=t*10,n.lastTemperedY=r*10,n.timestamp=e.timeStamp}onMovement(e,t){const r=this.mirror?-1:1,n=Math.min(this.canvas.offsetWidth,this.canvas.offsetHeight),i=this.temperMovement(e/n),s=this.temperMovement(t/n*Hr);return this.model.twistySceneModel.orbitCoordinatesRequest.set((async()=>{const a=await this.model.twistySceneModel.orbitCoordinates.get();return{latitude:a.latitude+2*s*ee*r,longitude:a.longitude-2*i*ee}})()),{temperedX:i,temperedY:s}}onUp(e){e.preventDefault(),"lastTemperedX"in e.detail.attachedInfo&&"lastTemperedY"in e.detail.attachedInfo&&"timestamp"in e.detail.attachedInfo&&e.timeStamp-e.detail.attachedInfo.timestamp<60&&new Qr(e.timeStamp,e.detail.attachedInfo.lastTemperedX,e.detail.attachedInfo.lastTemperedY,this.onMovementBound)}};async function bt(e,t,r=!1){const n=new(await E).ThreeSpherical(t.distance,(90-(r?-1:1)*t.latitude)/ee,((r?180:0)+t.longitude)/ee);n.makeSafe(),e.position.setFromSpherical(n),e.lookAt(0,0,0)}var Ye=0,_r=2,St=!1;function $r(){return Ye<_r?(Ye++,!1):(St=!0,!0)}function gs(){return St}var Ae=class extends D{constructor(e,t,r){super(),this.model=e,this.options=r,this.scene=t??null,this.loadingElement=this.addElement(document.createElement("div")),this.loadingElement.classList.add("loading")}model;options;scene=null;stats=null;rendererIsShared=$r();loadingElement=null;async connectedCallback(){this.addCSS(xt),this.addElement((await this.canvasInfo()).canvas),this.#s(),new ResizeObserver(this.#s.bind(this)).observe(this.contentWrapper),this.orbitControls(),this.#e(),this.scheduleRender()}async#e(){(await this.#l()).addEventListener("press",(async t=>{await this.model.twistySceneModel.movePressInput.get()==="basic"&&this.dispatchEvent(new CustomEvent("press",{detail:{pressInfo:t.detail,cameraPromise:this.camera()}}))}))}#t=new we;async clearCanvas(){if(this.rendererIsShared){const e=await this.canvasInfo();e.context.clearRect(0,0,e.canvas.width,e.canvas.height)}else{const t=(await this.renderer()).getContext();t.clear(t.COLOR_BUFFER_BIT)}}#r=0;#n=0;async#s(){const e=await this.#t.queue(this.camera()),t=this.contentWrapper.clientWidth,r=this.contentWrapper.clientHeight;this.#r=t,this.#n=r;const n=0;let i=0,s=0;if(r>t&&(s=r-t,i=-Math.floor(.5*s)),e.aspect=t/r,e.setViewOffset(t,r-s,n,i,t,r),e.updateProjectionMatrix(),this.clearCanvas(),this.rendererIsShared){const a=await this.canvasInfo();a.canvas.width=t*Le(),a.canvas.height=r*Le(),a.canvas.style.width=`${t.toString()}px`,a.canvas.style.height=`${r.toString()}px`}else(await this.renderer()).setSize(t,r,!0);this.scheduleRender()}#i=null;async renderer(){if(this.rendererIsShared)throw new Error("renderer expected to be shared.");return this.#i??=Re()}#a=null;async canvasInfo(){return this.#a??=(async()=>{let e;if(this.rendererIsShared)e=this.addElement(document.createElement("canvas"));else{const r=await this.renderer();e=this.addElement(r.domElement)}this.loadingElement?.remove();const t=e.getContext("2d");return{canvas:e,context:t}})()}#o=null;async#l(){return this.#o??=(async()=>{const e=new Vr((await this.canvasInfo()).canvas);return this.model?.twistySceneModel.dragInput.addFreshListener(t=>{let r=!1;switch(t){case"auto":{e.start(),r=!0;break}case"none":{e.stop();break}}this.contentWrapper.classList.toggle("drag-input-enabled",r)}),e})()}#d=null;async camera(){return this.#d??=(async()=>{const e=new(await E).ThreePerspectiveCamera(20,1,.1,20);return e.position.copy(new(await E).ThreeVector3(2,4,4).multiplyScalar(this.options?.backView?-1:1)),e.lookAt(0,0,0),e})()}#u=null;async orbitControls(){return this.#u??=(async()=>{const e=new Yr(this.model,!!this.options?.backView,(await this.canvasInfo()).canvas,await this.#l());return this.model&&this.addListener(this.model.twistySceneModel.orbitCoordinates,async t=>{const r=await this.camera();bt(r,t,this.options?.backView),this.scheduleRender()}),e})()}addListener(e,t){e.addFreshListener(t),this.#c.push(()=>{e.removeFreshListener(t)})}#c=[];disconnect(){for(const e of this.#c)e();this.#c=[]}#h=null;experimentalNextRenderFinishedCallback(e){this.#h=e}async render(){if(!this.scene)throw new Error("Attempted to render without a scene");this.stats?.begin();const[e,t,r]=await Promise.all([this.scene.scene(),this.camera(),this.canvasInfo()]);this.rendererIsShared?await Ur(this.#r,this.#n,r.canvas,e,t):(await this.renderer()).render(e,t),this.stats?.end(),this.#h?.(),this.#h=null}#m=new H(this.render.bind(this));scheduleRender(){this.#m.requestAnimFrame()}};z.define("twisty-3d-vantage",Ae);function V(e){switch(Math.abs(e)){case 0:return 0;case 1:return 1e3;case 2:return 1500;default:return 2e3}}var Tt=class extends fe{constructor(e=V){super(),this.durationForAmount=e}durationForAmount;traverseAlg(e){let t=0;for(const r of e.childAlgNodes())t+=this.traverseAlgNode(r);return t}traverseGrouping(e){return e.amount*this.traverseAlg(e.alg)}traverseMove(e){return this.durationForAmount(e.amount)}traverseCommutator(e){return 2*(this.traverseAlg(e.A)+this.traverseAlg(e.B))}traverseConjugate(e){return 2*this.traverseAlg(e.A)+this.traverseAlg(e.B)}traversePause(e){return this.durationForAmount(1)}traverseNewline(e){return this.durationForAmount(1)}traverseLineComment(e){return this.durationForAmount(0)}},Gr=class{constructor(e,t){this.kpuzzle=e,this.moves=new I(t.experimentalExpand())}kpuzzle;moves;durationFn=new Tt(V);getAnimLeaf(e){return Array.from(this.moves.childAlgNodes())[e]}indexToMoveStartTimestamp(e){const t=new I(Array.from(this.moves.childAlgNodes()).slice(0,e));return this.durationFn.traverseAlg(t)}timestampToIndex(e){let t=0,r;for(r=0;r<this.numAnimatedLeaves();r++)if(t+=this.durationFn.traverseMove(this.getAnimLeaf(r)),t>=e)return r;return r}patternAtIndex(e){return this.kpuzzle.defaultPattern().applyTransformation(this.transformationAtIndex(e))}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of Array.from(this.moves.childAlgNodes()).slice(0,e))t=t.applyMove(r);return t}algDuration(){return this.durationFn.traverseAlg(this.moves)}numAnimatedLeaves(){return Tr(this.moves)}moveDuration(e){return this.durationFn.traverseMove(this.getAnimLeaf(e))}},F=class{constructor(e,t,r,n,i=[]){this.moveCount=e,this.duration=t,this.forward=r,this.backward=n,this.children=i}moveCount;duration;forward;backward;children},Xr=class extends fe{constructor(e){super(),this.kpuzzle=e,this.identity=e.identityTransformation(),this.dummyLeaf=new F(0,0,this.identity,this.identity,[])}kpuzzle;identity;dummyLeaf;durationFn=new Tt(V);cache={};traverseAlg(e){let t=0,r=0,n=this.identity;const i=[];for(const s of e.childAlgNodes()){const a=this.traverseAlgNode(s);t+=a.moveCount,r+=a.duration,n===this.identity?n=a.forward:n=n.applyTransformation(a.forward),i.push(a)}return new F(t,r,n,n.invert(),i)}traverseGrouping(e){const t=this.traverseAlg(e.alg);return this.mult(t,e.amount,[t])}traverseMove(e){const t=e.toString();let r=this.cache[t];if(r)return r;const n=this.kpuzzle.moveToTransformation(e);return r=new F(1,this.durationFn.traverseAlgNode(e),n,n.invert()),this.cache[t]=r,r}traverseCommutator(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),n=t.forward.applyTransformation(r.forward),i=t.backward.applyTransformation(r.backward),s=n.applyTransformation(i),a=new F(2*(t.moveCount+r.moveCount),2*(t.duration+r.duration),s,s.invert(),[t,r]);return this.mult(a,1,[a,t,r])}traverseConjugate(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),i=t.forward.applyTransformation(r.forward).applyTransformation(t.backward),s=new F(2*t.moveCount+r.moveCount,2*t.duration+r.duration,i,i.invert(),[t,r]);return this.mult(s,1,[s,t,r])}traversePause(e){return e.experimentalNISSGrouping?this.dummyLeaf:new F(1,this.durationFn.traverseAlgNode(e),this.identity,this.identity)}traverseNewline(e){return this.dummyLeaf}traverseLineComment(e){return this.dummyLeaf}mult(e,t,r){const n=Math.abs(t),i=e.forward.selfMultiply(t);return new F(e.moveCount*n,e.duration*n,i,i.invert(),r)}},S=class{constructor(e,t){this.apd=e,this.back=t}apd;back},Zr=class extends Pe{constructor(e,t,r){super(),this.kpuzzle=e,this.algOrAlgNode=t,this.apd=r,this.i=-1,this.dur=-1,this.goalIndex=-1,this.goalDuration=-1,this.move=void 0,this.back=!1,this.moveDuration=0,this.st=this.kpuzzle.identityTransformation(),this.root=new S(this.apd,!1)}kpuzzle;algOrAlgNode;apd;move;moveDuration;back;st;root;i;dur;goalIndex;goalDuration;moveByIndex(e){return this.i>=0&&this.i===e?this.move!==void 0:this.dosearch(e,1/0)}moveByDuration(e){return this.dur>=0&&this.dur<e&&this.dur+this.moveDuration>=e?this.move!==void 0:this.dosearch(1/0,e)}dosearch(e,t){return this.goalIndex=e,this.goalDuration=t,this.i=0,this.dur=0,this.move=void 0,this.moveDuration=0,this.back=!1,this.st=this.kpuzzle.identityTransformation(),this.algOrAlgNode.is(I)?this.traverseAlg(this.algOrAlgNode,this.root):this.traverseAlgNode(this.algOrAlgNode,this.root)}traverseAlg(e,t){if(!this.firstcheck(t))return!1;let r=t.back?e.experimentalNumChildAlgNodes()-1:0;for(const n of wr(e.childAlgNodes(),t.back?-1:1)){if(this.traverseAlgNode(n,new S(t.apd.children[r],t.back)))return!0;r+=t.back?-1:1}return!1}traverseGrouping(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,e.amount);return this.traverseAlg(e.alg,new S(t.apd.children[0],r))}traverseMove(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseCommutator(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.B,new S(t.apd.children[2],!r))||this.traverseAlg(e.A,new S(t.apd.children[1],!r))||this.traverseAlg(e.B,new S(t.apd.children[2],r))||this.traverseAlg(e.A,new S(t.apd.children[1],r)):this.traverseAlg(e.A,new S(t.apd.children[1],r))||this.traverseAlg(e.B,new S(t.apd.children[2],r))||this.traverseAlg(e.A,new S(t.apd.children[1],!r))||this.traverseAlg(e.B,new S(t.apd.children[2],!r))}traverseConjugate(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.A,new S(t.apd.children[1],!r))||this.traverseAlg(e.B,new S(t.apd.children[2],r))||this.traverseAlg(e.A,new S(t.apd.children[1],r)):this.traverseAlg(e.A,new S(t.apd.children[1],r))||this.traverseAlg(e.B,new S(t.apd.children[2],r))||this.traverseAlg(e.A,new S(t.apd.children[1],!r))}traversePause(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseNewline(e,t){return!1}traverseLineComment(e,t){return!1}firstcheck(e){return e.apd.moveCount+this.i<=this.goalIndex&&e.apd.duration+this.dur<this.goalDuration?this.keepgoing(e):!0}domult(e,t){let r=e.back;if(t===0)return r;t<0&&(r=!r,t=-t);const n=e.apd.children[0],i=Math.min(Math.floor((this.goalIndex-this.i)/n.moveCount),Math.ceil((this.goalDuration-this.dur)/n.duration-1));return i>0&&this.keepgoing(new S(n,r),i),r}keepgoing(e,t=1){return this.i+=t*e.apd.moveCount,this.dur+=t*e.apd.duration,t!==1?e.back?this.st=this.st.applyTransformation(e.apd.backward.selfMultiply(t)):this.st=this.st.applyTransformation(e.apd.forward.selfMultiply(t)):e.back?this.st=this.st.applyTransformation(e.apd.backward):this.st=this.st.applyTransformation(e.apd.forward),!1}},Kr=16;function Jr(e,t){const r=new Be,n=new Be;for(const i of e.childAlgNodes())n.push(i),n.experimentalNumAlgNodes()>=t&&(r.push(new pe(n.toAlg())),n.reset());return r.push(new pe(n.toAlg())),r.toAlg()}var en=class extends fe{traverseAlg(e){const t=e.experimentalNumChildAlgNodes();return t<Kr?e:Jr(e,Math.ceil(Math.sqrt(t)))}traverseGrouping(e){return new pe(this.traverseAlg(e.alg),e.amount)}traverseMove(e){return e}traverseCommutator(e){return new Ue(this.traverseAlg(e.A),this.traverseAlg(e.B))}traverseConjugate(e){return new Ue(this.traverseAlg(e.A),this.traverseAlg(e.B))}traversePause(e){return e}traverseNewline(e){return e}traverseLineComment(e){return e}},tn=ve(en),_e=class{constructor(e,t){this.kpuzzle=e;const r=new Xr(this.kpuzzle),n=tn(t);this.decoration=r.traverseAlg(n),this.walker=new Zr(this.kpuzzle,n,this.decoration)}kpuzzle;decoration;walker;getAnimLeaf(e){if(this.walker.moveByIndex(e)){if(!this.walker.move)throw new Error("`this.walker.mv` missing");const t=this.walker.move;return this.walker.back?t.invert():t}return null}indexToMoveStartTimestamp(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}indexToMovesInProgress(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}patternAtIndex(e,t){return this.walker.moveByIndex(e),(t??this.kpuzzle.defaultPattern()).applyTransformation(this.walker.st)}transformationAtIndex(e){return this.walker.moveByIndex(e),this.walker.st}numAnimatedLeaves(){return this.decoration.moveCount}timestampToIndex(e){return this.walker.moveByDuration(e),this.walker.i}algDuration(){return this.decoration.duration}moveDuration(e){return this.walker.moveByIndex(e),this.walker.moveDuration}},rn=class extends v{getDefaultValue(){return"auto"}},le="http://www.w3.org/2000/svg",$e="data-copy-id",Ge=0;function nn(){return Ge+=1,`svg${Ge.toString()}`}var sn={dim:{white:"#dddddd",orange:"#884400",limegreen:"#008800",red:"#660000","rgb(34, 102, 255)":"#000088",yellow:"#888800","rgb(102, 0, 153)":"rgb(50, 0, 76)",purple:"#3f003f"},oriented:"#44ddcc",ignored:"#555555",invisible:"#00000000"},an=class{constructor(e,t,r,n=!1){if(this.kpuzzle=e,this.showUnknownOrientations=n,!t)throw new Error(`No SVG definition for puzzle type: ${e.name()}`);this.svgID=nn(),this.wrapperElement=document.createElement("div"),this.wrapperElement.classList.add("svg-wrapper"),this.wrapperElement.innerHTML=t;const i=this.wrapperElement.querySelector("svg");if(!i)throw new Error("Could not get SVG element");if(this.svgElement=i,le!==i.namespaceURI)throw new Error("Unexpected XML namespace");i.style.maxWidth="100%",i.style.maxHeight="100%",this.gradientDefs=document.createElementNS(le,"defs"),i.insertBefore(this.gradientDefs,i.firstChild);for(const s of e.definition.orbits)for(let a=0;a<s.numPieces;a++)for(let l=0;l<s.numOrientations;l++){const h=this.elementID(s.orbitName,a,l),o=this.elementByID(h);let c=o?.style.fill;r?(()=>{const u=r.orbits;if(!u)return;const p=u[s.orbitName];if(!p)return;const g=p.pieces[a];if(!g)return;const x=g.facelets[l];if(!x)return;const k=typeof x=="string"?x:x?.mask,w=sn[k];typeof w=="string"?c=w:w&&(c=w[c])})():c=o?.style.fill,this.originalColors[h]=c,this.gradients[h]=this.newGradient(h,c),this.gradientDefs.appendChild(this.gradients[h]),o?.setAttribute("style",`fill: url(#grad-${this.svgID}-${h})`)}for(const s of Array.from(i.querySelectorAll(`[${$e}]`))){const a=s.getAttribute($e);s.setAttribute("style",`fill: url(#grad-${this.svgID}-${a})`)}this.showUnknownOrientations&&this.drawPattern(this.kpuzzle.defaultPattern())}kpuzzle;showUnknownOrientations;wrapperElement;svgElement;gradientDefs;originalColors={};gradients={};svgID;drawPattern(e,t,r){this.draw(e,t,r)}draw(e,t,r){const n=t?.experimentalToTransformation();if(!e)throw new Error("Distinguishable pieces are not handled for SVG yet!");for(const i of e.kpuzzle.definition.orbits){const s=e.patternData[i.orbitName],a=n?n.transformationData[i.orbitName]:null;for(let l=0;l<i.numPieces;l++)for(let h=0;h<i.numOrientations;h++){const o=this.elementID(i.orbitName,l,h),c=this.elementID(i.orbitName,s.pieces[l],(i.numOrientations-s.orientation[l]+h)%i.numOrientations);let u=!1;if(a){const p=this.elementID(i.orbitName,a.permutation[l],(i.numOrientations-a.orientationDelta[l]+h)%i.numOrientations);c===p&&(u=!0),r=r||0;const g=100*(1-r*r*(2-r*r));this.gradients[o].children[0].setAttribute("stop-color",this.originalColors[c]),this.gradients[o].children[0].setAttribute("offset",`${Math.max(g-5,0)}%`),this.gradients[o].children[1].setAttribute("offset",`${Math.max(g-5,0)}%`),this.gradients[o].children[2].setAttribute("offset",`${g}%`),this.gradients[o].children[3].setAttribute("offset",`${g}%`),this.gradients[o].children[3].setAttribute("stop-color",this.originalColors[p])}else u=!0;u&&(this.showUnknownOrientations&&s.orientationMod?.[l]===1?(this.gradients[o].children[0].setAttribute("stop-color","#000"),this.gradients[o].children[0].setAttribute("offset","5%"),this.gradients[o].children[1].setAttribute("offset","5%"),this.gradients[o].children[2].setAttribute("offset","20%"),this.gradients[o].children[3].setAttribute("offset","20%"),this.gradients[o].children[3].setAttribute("stop-color",this.originalColors[c])):(this.gradients[o].children[0].setAttribute("stop-color",this.originalColors[c]),this.gradients[o].children[0].setAttribute("offset","100%"),this.gradients[o].children[1].setAttribute("offset","100%"),this.gradients[o].children[2].setAttribute("offset","100%"),this.gradients[o].children[3].setAttribute("offset","100%")))}}}newGradient(e,t){const r=document.createElementNS(le,"radialGradient");r.setAttribute("id",`grad-${this.svgID}-${e}`),r.setAttribute("r","70.7107%");const n=[{offset:0,color:t},{offset:0,color:"black"},{offset:0,color:"black"},{offset:0,color:t}];for(const i of n){const s=document.createElementNS(le,"stop");s.setAttribute("offset",`${i.offset}%`),s.setAttribute("stop-color",i.color),s.setAttribute("stop-opacity","1"),r.appendChild(s)}return r}elementID(e,t,r){return`${e}-l${t}-o${r}`}elementByID(e){return this.wrapperElement.querySelector(`#${e}`)}},ne=class{constructor(e,t,r){this.elem=e,this.prefix=t,this.validSuffixes=r}elem;prefix;validSuffixes;#e=null;clearValue(){this.#e&&this.elem.contentWrapper.classList.remove(this.#e),this.#e=null}setValue(e){if(!this.validSuffixes.includes(e))throw new Error(`Invalid suffix: ${e}`);const t=`${this.prefix}${e}`,r=this.#e!==t;return r&&(this.clearValue(),this.elem.contentWrapper.classList.add(t),this.#e=t),r}};function De(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0}function Xe(e,t,r){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(!r(e[n],t[n]))return!1;return!0}function Ce(e,t,r){return vr(e,r-t,t)}var on=class{constructor(e){this.model=e,e.tempoScale.addFreshListener(t=>{this.tempoScale=t})}model;catchingUp=!1;pendingFrame=!1;tempoScale=1;scheduler=new H(this.animFrame.bind(this));start(){this.catchingUp||(this.lastTimestamp=performance.now()),this.catchingUp=!0,this.pendingFrame=!0,this.scheduler.requestAnimFrame()}stop(){this.catchingUp=!1,this.scheduler.cancelAnimFrame()}catchUpMs=500;lastTimestamp=0;animFrame(e){this.scheduler.requestAnimFrame();const t=this.tempoScale*(e-this.lastTimestamp)/this.catchUpMs;this.lastTimestamp=e,this.model.catchUpMove.set((async()=>{const r=await this.model.catchUpMove.get();if(r.move===null)return r;const n=r.amount+t;return n>=1?(this.pendingFrame=!0,this.stop(),this.model.timestampRequest.set("end"),{move:null,amount:0}):(this.pendingFrame=!1,{move:r.move,amount:n})})())}},ln=class{constructor(e,t){this.delegate=t,this.model=e,this.lastTimestampPromise=this.#e(),this.model.playingInfo.addFreshListener(this.onPlayingProp.bind(this)),this.catchUpHelper=new on(this.model),this.model.catchUpMove.addFreshListener(this.onCatchUpMoveProp.bind(this))}delegate;playing=!1;direction=1;catchUpHelper;model;lastDatestamp=0;lastTimestampPromise;scheduler=new H(this.animFrame.bind(this));async onPlayingProp(e){e.playing!==this.playing&&(e.playing?this.play(e):this.pause())}async onCatchUpMoveProp(e){const t=e.move!==null;t!==this.catchUpHelper.catchingUp&&(t?this.catchUpHelper.start():this.catchUpHelper.stop()),this.scheduler.requestAnimFrame()}async#e(){return(await this.model.detailedTimelineInfo.get()).timestamp}jumpToStart(e){this.model.timestampRequest.set("start"),this.pause(),e?.flash&&this.delegate.flash()}jumpToEnd(e){this.model.timestampRequest.set("end"),this.pause(),e?.flash&&this.delegate.flash()}playPause(){this.playing?this.pause():this.play()}play(e){(async()=>{const t=e?.direction??1,r=await this.model.coarseTimelineInfo.get();(e?.autoSkipToOtherEndIfStartingAtBoundary??!0)&&(t===1&&r.atEnd&&(this.model.timestampRequest.set("start"),this.delegate.flash()),t===-1&&r.atStart&&(this.model.timestampRequest.set("end"),this.delegate.flash())),this.model.playingInfo.set({playing:!0,direction:t,untilBoundary:e?.untilBoundary??"entire-timeline",loop:e?.loop??!1}),this.playing=!0,this.lastDatestamp=performance.now(),this.lastTimestampPromise=this.#e(),this.scheduler.requestAnimFrame()})()}pause(){this.playing=!1,this.scheduler.cancelAnimFrame(),this.model.playingInfo.set({playing:!1,untilBoundary:"entire-timeline"})}#t=new we;async animFrame(e){this.playing&&this.scheduler.requestAnimFrame();const t=this.lastDatestamp,r=await this.#t.queue(Promise.all([this.model.playingInfo.get(),this.lastTimestampPromise,this.model.timeRange.get(),this.model.tempoScale.get(),this.model.currentMoveInfo.get()])),[n,i,s,a,l]=r;if(!n.playing){this.playing=!1;return}let h=l.earliestEnd;(l.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(h=s.end);let o=l.latestStart;(l.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(o=s.start);let c=(e-t)*this.direction*a;c=Math.max(c,1),c*=n.direction;let u=i+c,p=null;u>=h?n.loop?u=Ce(u,s.start,s.end):(u===s.end?p="end":u=h,this.playing=!1,this.model.playingInfo.set({playing:!1})):u<=o&&(n.loop?u=Ce(u,s.start,s.end):(u===s.start?p="start":u=o,this.playing=!1,this.model.playingInfo.set({playing:!1}))),this.lastDatestamp=e,this.lastTimestampPromise=Promise.resolve(u),this.model.timestampRequest.set(p??u)}},cn=class{constructor(e,t){this.model=e,this.animationController=new ln(e,t)}model;animationController;jumpToStart(e){this.animationController.jumpToStart(e)}jumpToEnd(e){this.animationController.jumpToEnd(e)}togglePlay(e){typeof e>"u"&&this.animationController.playPause(),e?this.animationController.play():this.animationController.pause()}async visitTwizzleLink(){const e=document.createElement("a");e.href=await this.model.twizzleLink(),e.target="_blank",e.click()}},dn={"bottom-row":!0,none:!0},un=class extends v{getDefaultValue(){return"auto"}},je=new L;je.replaceSync(`
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
`);var zt=new L;zt.replaceSync(`
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
`);var kt=class extends D{constructor(e,t,r,n,i){super(),this.model=e,this.kpuzzle=t,this.svgSource=r,this.options=n,this.puzzleLoader=i,this.addCSS(zt),this.resetSVG(),this.#t.addListener(this.model.puzzleID,s=>{i?.id!==s&&this.disconnect()}),this.#t.addListener(this.model.twistySceneModel.hintFacelet,s=>{this.setHintFacelet(s)}),this.#t.addListener(this.model.legacyPosition,this.onPositionChange.bind(this)),this.options?.experimentalStickeringMask&&this.experimentalSetStickeringMask(this.options.experimentalStickeringMask)}model;kpuzzle;svgSource;options;puzzleLoader;svgWrapper;scheduler=new H(this.render.bind(this));#e=null;#t=new re;disconnect(){this.#t.disconnect()}onPositionChange(e){try{if(e.movesInProgress.length>0){const t=e.movesInProgress[0].move;let r=t;e.movesInProgress[0].direction===-1&&(r=t.invert());const n=e.pattern.applyMove(r);this.svgWrapper?.draw(e.pattern,n,e.movesInProgress[0].fraction)}else this.svgWrapper?.draw(e.pattern),this.#e=e}catch(t){console.warn("Bad position (this doesn't necessarily mean something is wrong). Pre-emptively disconnecting:",this.puzzleLoader?.id,t),this.disconnect()}}scheduleRender(){this.scheduler.requestAnimFrame()}experimentalSetStickeringMask(e){this.resetSVG(e)}resetSVG(e){this.svgWrapper&&this.removeElement(this.svgWrapper.wrapperElement),this.kpuzzle&&(this.svgWrapper=new an(this.kpuzzle,this.svgSource,e),this.addElement(this.svgWrapper.wrapperElement),this.#e&&this.onPositionChange(this.#e))}hintFaceletsClassListManager=new ne(this,"hint-facelets-",Object.keys(jr));setHintFacelet(e){this.hintFaceletsClassListManager.setValue(e==="auto"?"floating":e)}render(){}};z.define("twisty-2d-puzzle",kt);var hn=class{constructor(e,t,r,n){this.model=e,this.schedulable=t,this.puzzleLoader=r,this.effectiveVisualization=n,this.twisty2DPuzzle(),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async i=>{(await this.twisty2DPuzzle()).experimentalSetStickeringMask(i)})}model;schedulable;puzzleLoader;effectiveVisualization;#e=new re;disconnect(){this.#e.disconnect()}scheduleRender(){}#t=null;async twisty2DPuzzle(){return this.#t??=(async()=>{const e=this.effectiveVisualization==="experimental-2D-LL-face"?this.puzzleLoader.llFaceSVG():this.effectiveVisualization==="experimental-2D-LL"?this.puzzleLoader.llSVG():this.puzzleLoader.svg();return new kt(this.model,await this.puzzleLoader.kpuzzle(),await e,{},this.puzzleLoader)})()}},It=class extends D{constructor(e,t){super(),this.model=e,this.effectiveVisualization=t}model;effectiveVisualization;#e=new re;disconnect(){this.#e.disconnect()}async connectedCallback(){this.addCSS(je),this.model&&this.#e.addListener(this.model.twistyPlayerModel.puzzleLoader,this.onPuzzleLoader.bind(this))}#t;async scene(){return this.#t??=(async()=>new(await E).ThreeScene)()}scheduleRender(){this.#r?.scheduleRender()}#r;currentTwisty2DPuzzleWrapper(){return this.#r}async setCurrentTwisty2DPuzzleWrapper(e){const t=this.#r;this.#r=e,t?.disconnect();const r=e.twisty2DPuzzle();this.contentWrapper.textContent="",this.addElement(await r)}async onPuzzleLoader(e){this.#r?.disconnect();const t=new hn(this.model.twistyPlayerModel,this,e,this.effectiveVisualization);this.setCurrentTwisty2DPuzzleWrapper(t)}};z.define("twisty-2d-scene-wrapper",It);var Lt=class{#e;reject;promise;constructor(){this.promise=new Promise((e,t)=>{this.#e=e,this.reject=t})}handleNewValue(e){this.#e(e)}},At=class extends EventTarget{constructor(e,t,r,n){super(),this.model=e,this.schedulable=t,this.puzzleLoader=r,this.visualizationStrategy=n,this.twisty3DPuzzle(),this.#e.addListener(this.model.puzzleLoader,i=>{this.puzzleLoader.id!==i.id&&this.disconnect()}),this.#e.addListener(this.model.legacyPosition,async i=>{try{(await this.twisty3DPuzzle()).onPositionChange(i),this.scheduleRender()}catch{this.disconnect()}}),this.#e.addListener(this.model.twistySceneModel.hintFacelet,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFacelets:i==="auto"?"floating":i}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.foundationDisplay,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({showFoundation:i!=="none"}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async i=>{(await this.twisty3DPuzzle()).setStickeringMask(i),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.faceletScale,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({faceletScale:i}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.hintFaceletsElevation,async i=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFaceletsElevation:i}),this.scheduleRender()}),this.#e.addMultiListener3([this.model.twistySceneModel.stickeringMask,this.model.twistySceneModel.foundationStickerSprite,this.model.twistySceneModel.hintStickerSprite],async i=>{"experimentalUpdateTexture"in await this.twisty3DPuzzle()&&((await this.twisty3DPuzzle()).experimentalUpdateTexture(i[0].specialBehaviour==="picture",i[1],i[2]),this.scheduleRender())})}model;schedulable;puzzleLoader;visualizationStrategy;#e=new re;disconnect(){this.#e.disconnect()}scheduleRender(){this.schedulable.scheduleRender(),this.dispatchEvent(new CustomEvent("render-scheduled"))}#t=null;async twisty3DPuzzle(){return this.#t??=(async()=>{if(this.puzzleLoader.id==="3x3x3"&&this.visualizationStrategy==="Cube3D"){const[e,t,r,n,i,s]=await Promise.all([this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.stickeringMask.get(),this.model.twistySceneModel.initialHintFaceletsAnimation.get(),this.model.twistySceneModel.faceletScale.get(),this.model.twistySceneModel.hintFaceletsElevation.get()]);return(await E).cube3DShim(()=>this.schedulable.scheduleRender(),{foundationSprite:e,hintSprite:t,experimentalStickeringMask:r,initialHintFaceletsAnimation:n,faceletScale:i,hintFaceletsElevation:s})}else{const[e,t,r,n]=await Promise.all([this.model.twistySceneModel.hintFacelet.get(),this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.faceletScale.get()]),i=(await E).pg3dShim(()=>this.schedulable.scheduleRender(),this.puzzleLoader,e==="auto"?"floating":e,n,this.puzzleLoader.id==="kilominx");return i.then(s=>s.experimentalUpdateTexture(!0,t??void 0,r??void 0)),i}})()}async raycastMove(e,t){const r=await this.twisty3DPuzzle();if(!("experimentalGetControlTargets"in r)){console.info("not PG3D! skipping raycast");return}const n=r.experimentalGetControlTargets(),[i,s]=await Promise.all([e,this.model.twistySceneModel.movePressCancelOptions.get()]),a=i.intersectObjects(n);if(a.length>0){const l=r.getClosestMoveToAxis(a[0].point,t);l?this.model.experimentalAddMove(l.move,{cancel:s}):console.info("Skipping move!")}}},Ee=class extends D{constructor(e){super(),this.model=e}model;#e=new ne(this,"back-view-",["auto","none","side-by-side","top-right"]);#t=new re;disconnect(){this.#t.disconnect()}async connectedCallback(){this.addCSS(je);const e=new Ae(this.model,this);this.addVantage(e),this.model&&(this.#t.addMultiListener([this.model.puzzleLoader,this.model.visualizationStrategy],this.onPuzzle.bind(this)),this.#t.addListener(this.model.backView,this.setBackView.bind(this))),this.scheduleRender()}#r=null;setBackView(e){const t=["side-by-side","top-right"].includes(e),r=this.#r!==null;this.#e.setValue(e),t?r||(this.#r=new Ae(this.model,this,{backView:!0}),this.addVantage(this.#r),this.scheduleRender()):this.#r&&(this.removeVantage(this.#r),this.#r=null)}async onPress(e){const t=this.#i;if(!t){console.info("no wrapper; skipping scene wrapper press!");return}const r=(async()=>{const[n,{ThreeRaycaster:i,ThreeVector2:s}]=await Promise.all([e.detail.cameraPromise,(async()=>{const{ThreeRaycaster:h,ThreeVector2:o}=await E;return{ThreeRaycaster:h,ThreeVector2:o}})()]),a=new i,l=new s(e.detail.pressInfo.normalizedX,e.detail.pressInfo.normalizedY);return a.setFromCamera(l,n),a})();await t.raycastMove(r,{invert:!e.detail.pressInfo.rightClick,depth:e.detail.pressInfo.keys.ctrlOrMetaKey?"rotation":e.detail.pressInfo.keys.shiftKey?"secondSlice":"none"})}#n;async scene(){return this.#n??=(async()=>new(await E).ThreeScene)()}#s=new Set;addVantage(e){e.addEventListener("press",this.onPress.bind(this)),this.#s.add(e),this.contentWrapper.appendChild(e)}removeVantage(e){this.#s.delete(e),e.remove(),e.disconnect(),this.#i?.disconnect()}experimentalVantages(){return this.#s.values()}scheduleRender(){for(const e of this.#s)e.scheduleRender()}#i=null;async setCurrentTwisty3DPuzzleWrapper(e,t){const r=this.#i;try{this.#i=t,r?.disconnect(),e.add(await t.twisty3DPuzzle())}finally{r&&e.remove(await r.twisty3DPuzzle())}this.#a.handleNewValue(t)}#a=new Lt;async experimentalTwisty3DPuzzleWrapper(){return this.#i||this.#a.promise}#o=new we;async onPuzzle(e){if(e[1]==="2D")return;this.#i?.disconnect();const[t,r]=await this.#o.queue(Promise.all([this.scene(),new At(this.model,this,e[0],e[1])]));this.setCurrentTwisty3DPuzzleWrapper(t,r)}};z.define("twisty-3d-scene-wrapper",Ee);var R=typeof document>"u"?null:document,mn=R?.fullscreenEnabled||!!R?.webkitFullscreenEnabled;function pn(){return document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen()}function Ze(){return document.fullscreenElement?document.fullscreenElement:document.webkitFullscreenElement??null}function gn(e){return e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen()}var fn=["skip-to-start","skip-to-end","step-forward","step-backward","pause","play","enter-fullscreen","exit-fullscreen","twizzle-tw"],vn=class extends M{derive(e){return{fullscreen:{enabled:mn,icon:document.fullscreenElement===null?"enter-fullscreen":"exit-fullscreen",title:"Enter fullscreen"},"jump-to-start":{enabled:!e.coarseTimelineInfo.atStart,icon:"skip-to-start",title:"Restart"},"play-step-backwards":{enabled:!e.coarseTimelineInfo.atStart,icon:"step-backward",title:"Step backward"},"play-pause":{enabled:!(e.coarseTimelineInfo.atStart&&e.coarseTimelineInfo.atEnd),icon:e.coarseTimelineInfo.playing?"pause":"play",title:e.coarseTimelineInfo.playing?"Pause":"Play"},"play-step":{enabled:!e.coarseTimelineInfo.atEnd,icon:"step-forward",title:"Step forward"},"jump-to-end":{enabled:!e.coarseTimelineInfo.atEnd,icon:"skip-to-end",title:"Skip to End"},"twizzle-link":{enabled:!0,icon:"twizzle-tw",title:"View at Twizzle",hidden:e.viewerLink==="none"}}}},Dt=new L;Dt.replaceSync(`
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
`);var Ct=new L;Ct.replaceSync(`
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
`);var Ke={fullscreen:!0,"jump-to-start":!0,"play-step-backwards":!0,"play-pause":!0,"play-step":!0,"jump-to-end":!0,"twizzle-link":!0},Et=class extends D{constructor(e,t,r){super(),this.model=e,this.controller=t,this.defaultFullscreenElement=r}model;controller;defaultFullscreenElement;buttons=null;connectedCallback(){this.addCSS(Dt);const e={};for(const t in Ke){const r=new Nt;e[t]=r,r.htmlButton.addEventListener("click",()=>this.#e(t)),this.addElement(r)}this.buttons=e,this.model?.buttonAppearance.addFreshListener(this.update.bind(this)),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}#e(e){switch(e){case"fullscreen":{this.onFullscreenButton();break}case"jump-to-start":{this.controller?.jumpToStart({flash:!0});break}case"play-step-backwards":{this.controller?.animationController.play({direction:-1,untilBoundary:"move"});break}case"play-pause":{this.controller?.togglePlay();break}case"play-step":{this.controller?.animationController.play({direction:1,untilBoundary:"move"});break}case"jump-to-end":{this.controller?.jumpToEnd({flash:!0});break}case"twizzle-link":{this.controller?.visitTwizzleLink();break}default:throw new Error("Missing command")}}async onFullscreenButton(){if(!this.defaultFullscreenElement)throw new Error("Attempted to go fullscreen without an element.");if(Ze()===this.defaultFullscreenElement)pn();else{this.buttons?.fullscreen.setIcon("exit-fullscreen"),gn(await this.model?.twistySceneModel.fullscreenElement.get()??this.defaultFullscreenElement);const e=()=>{Ze()!==this.defaultFullscreenElement&&(this.buttons?.fullscreen.setIcon("enter-fullscreen"),globalThis.removeEventListener("fullscreenchange",e))};globalThis.addEventListener("fullscreenchange",e)}}async update(e){for(const t in Ke){const r=this.buttons[t],n=e[t];r.htmlButton.disabled=!n.enabled,r.htmlButton.title=n.title,r.setIcon(n.icon),r.hidden=!!n.hidden}}updateColorScheme(e){for(const t of Object.values(this.buttons??{}))t.updateColorScheme(e)}};z.define("twisty-buttons",Et);var Nt=class extends D{htmlButton=document.createElement("button");updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}connectedCallback(){this.addCSS(Ct),this.addElement(this.htmlButton)}#e=new ne(this,"svg-",fn);setIcon(e){this.#e.setValue(e)}};z.define("twisty-button",Nt);var Pt=new L;Pt.replaceSync(`
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
`);R?.addEventListener("mousedown",e=>{e.which},!0);R?.addEventListener("mouseup",e=>{e.which},!0);R?.addEventListener("mousedown",()=>{},!1);R?.addEventListener("mousemove",Rt,!1);R?.addEventListener("mouseenter",Rt,!1);function Rt(e){e.pageY}var jt=class extends D{constructor(e,t){super(),this.model=e,this.controller=t}model;controller;async onDetailedTimelineInfo(e){const t=await this.inputElem();t.min=e.timeRange.start.toString(),t.max=e.timeRange.end.toString(),t.disabled=t.min===t.max,t.value=e.timestamp.toString()}async connectedCallback(){this.addCSS(Pt),this.addElement(await this.inputElem()),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}#e=null;async inputElem(){return this.#e??=(async()=>{const e=document.createElement("input");return e.type="range",e.disabled=!0,this.model?.detailedTimelineInfo.addFreshListener(this.onDetailedTimelineInfo.bind(this)),e.addEventListener("input",this.onInput.bind(this)),e.addEventListener("keydown",this.onKeypress.bind(this)),e})()}async onInput(e){const t=await this.inputElem();await this.slowDown(e,t);const r=parseInt(t.value,10);this.model?.playingInfo.set({playing:!1}),this.model?.timestampRequest.set(r)}onKeypress(e){switch(e.key){case"ArrowLeft":case"ArrowRight":{this.controller?.animationController.play({direction:e.key==="ArrowLeft"?-1:1,untilBoundary:"move"}),e.preventDefault();break}case" ":{this.controller?.togglePlay(),e.preventDefault();break}}}async slowDown(e,t){}};z.define("twisty-scrubber",jt);var wn=null;async function Je(e,t){const[{ThreePerspectiveCamera:r,ThreeScene:n},i,s,a,l,h,o]=await Promise.all([(async()=>{const{ThreePerspectiveCamera:P,ThreeScene:ye}=await E;return{ThreePerspectiveCamera:P,ThreeScene:ye}})(),await e.puzzleLoader.get(),await e.visualizationStrategy.get(),await e.twistySceneModel.stickeringRequest.get(),await e.twistySceneModel.stickeringMaskRequest.get(),await e.legacyPosition.get(),await e.twistySceneModel.orbitCoordinates.get()]),c=t?.width??2048,u=t?.height??2048,p=c/u,g=wn??=await(async()=>new r(20,p,.1,20))(),x=new n,k=new At(e,{scheduleRender:()=>{}},i,s);x.add(await k.twisty3DPuzzle()),await bt(g,o);const A=(await Mt(c,u,x,g)).toDataURL(),O=await Ot(e);return{dataURL:A,download:async P=>{Ft(A,P??O)}}}async function Ot(e){const[t,r]=await Promise.all([e.puzzleID.get(),e.alg.get()]);return`[${t}]${r.alg.experimentalNumChildAlgNodes()===0?"":` ${r.alg.toString()}`}`}function Ft(e,t,r="png"){const n=document.createElement("a");n.href=e,n.download=`${t}.${r}`,n.click()}var Vt=new L;Vt.replaceSync(`
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
`);var et=class extends v{getDefaultValue(){return null}},Ne=class extends j{getDefaultValue(){return null}derive(e){return typeof e=="string"?new URL(e,location.href):e}},te=class Ut{warnings;errors;constructor(t){this.warnings=Object.freeze(t?.warnings??[]),this.errors=Object.freeze(t?.errors??[]),Object.freeze(this)}add(t){return new Ut({warnings:this.warnings.concat(t?.warnings??[]),errors:this.errors.concat(t?.errors??[])})}log(){this.errors.length>0?console.error(`🚨 ${this.errors[0]}`):this.warnings.length>0?console.warn(`⚠️ ${this.warnings[0]}`):console.info("😎 No issues!")}};function Bt(e){try{const t=I.fromString(e),r=[];return t.toString()!==e&&r.push("Alg is non-canonical!"),{alg:t,issues:new te({warnings:r})}}catch(t){return{alg:new I,issues:new te({errors:[`Malformed alg: ${t.toString()}`]})}}}function yn(e,t){return e.alg.isIdentical(t.alg)&&De(e.issues.warnings,t.issues.warnings)&&De(e.issues.errors,t.issues.errors)}var tt=class extends j{getDefaultValue(){return{alg:new I,issues:new te}}canReuseValue(e,t){return yn(e,t)}async derive(e){return typeof e=="string"?Bt(e):{alg:e,issues:new te}}},Mn=class extends M{derive(e){return e.kpuzzle.algToTransformation(e.setupAlg.alg)}},xn=class extends M{derive(e){if(e.setupTransformation)return e.setupTransformation;switch(e.setupAnchor){case"start":return e.setupAlgTransformation;case"end":{const r=e.indexer.transformationAtIndex(e.indexer.numAnimatedLeaves()).invert();return e.setupAlgTransformation.applyTransformation(r)}default:throw new Error("Unimplemented!")}}},bn=class extends v{getDefaultValue(){return null}},Sn=class extends v{getDefaultValue(){return{move:null,amount:0}}canReuseValue(e,t){return e.move===t.move&&e.amount===t.amount}},Tn=class extends M{derive(e){return{patternIndex:e.currentMoveInfo.patternIndex,movesFinishing:e.currentMoveInfo.movesFinishing.map(t=>t.move),movesFinished:e.currentMoveInfo.movesFinished.map(t=>t.move)}}canReuseValue(e,t){return e.patternIndex===t.patternIndex&&Xe(e.movesFinishing,t.movesFinishing,(r,n)=>r.isIdentical(n))&&Xe(e.movesFinished,t.movesFinished,(r,n)=>r.isIdentical(n))}},zn=class extends M{derive(e){function t(r){return e.detailedTimelineInfo.atEnd&&e.catchUpMove.move!==null&&r.currentMoves.push({move:e.catchUpMove.move,direction:-1,fraction:1-e.catchUpMove.amount,startTimestamp:-1,endTimestamp:-1}),r}if(e.indexer.currentMoveInfo)return t(e.indexer.currentMoveInfo(e.detailedTimelineInfo.timestamp));{const r=e.indexer.timestampToIndex(e.detailedTimelineInfo.timestamp),n={patternIndex:r,currentMoves:[],movesFinishing:[],movesFinished:[],movesStarting:[],latestStart:-1/0,earliestEnd:1/0};if(e.indexer.numAnimatedLeaves()>0){const i=e.indexer.getAnimLeaf(r)?.as(C);if(!i)return t(n);const s=e.indexer.indexToMoveStartTimestamp(r),a=e.indexer.moveDuration(r),l=a?(e.detailedTimelineInfo.timestamp-s)/a:0,h=s+a,o={move:i,direction:1,fraction:l,startTimestamp:s,endTimestamp:h};l===0?n.movesStarting.push(o):l===1?n.movesFinishing.push(o):(n.currentMoves.push(o),n.latestStart=Math.max(n.latestStart,s),n.earliestEnd=Math.min(n.earliestEnd,h))}return t(n)}}},kn=class extends M{derive(e){let t=e.indexer.transformationAtIndex(e.currentLeavesSimplified.patternIndex);t=e.anchoredStart.applyTransformation(t);for(const r of e.currentLeavesSimplified.movesFinishing)t=t.applyMove(r);for(const r of e.currentLeavesSimplified.movesFinished)t=t.applyMove(r);return t.toKPattern()}},rt={u:"y",l:"x",f:"z",r:"x",b:"z",d:"y",m:"x",e:"y",s:"z",x:"x",y:"y",z:"z"};function In(e,t){return rt[e.family[0].toLowerCase()]===rt[t.family[0].toLowerCase()]}var Ln=class extends fe{traverseAlg(e){const t=[];for(const r of e.childAlgNodes())t.push(this.traverseAlgNode(r));return Array.prototype.concat(...t)}traverseGroupingOnce(e){if(e.experimentalIsEmpty())return[];const t=[];for(const i of e.childAlgNodes()){if(!(i.is(C)||i.is(Mr)||i.is(xr)))return this.traverseAlg(e);const s=i.as(C);s&&t.push(s)}let r=V(t[0].amount);for(let i=0;i<t.length-1;i++){for(let s=1;s<t.length;s++)if(!In(t[i],t[s]))return this.traverseAlg(e);r=Math.max(r,V(t[i].amount))}const n=t.map(i=>({animLeafAlgNode:i,msUntilNext:0,duration:r}));return n[n.length-1].msUntilNext=r,n}traverseGrouping(e){const t=[],r=e.amount>0?e.alg:e.alg.invert();for(let n=0;n<Math.abs(e.amount);n++)t.push(this.traverseGroupingOnce(r));return Array.prototype.concat(...t)}traverseMove(e){const t=V(e.amount);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseCommutator(e){const t=[],r=[e.A,e.B,e.A.invert(),e.B.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traverseConjugate(e){const t=[],r=[e.A,e.B,e.A.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traversePause(e){if(e.experimentalNISSGrouping)return[];const t=V(1);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseNewline(e){return[]}traverseLineComment(e){return[]}},An=ve(Ln);function Dn(e){let t=0;return An(e).map(n=>{const i={animLeaf:n.animLeafAlgNode,start:t,end:t+n.duration};return t+=n.msUntilNext,i})}var ke=class{constructor(e,t,r){this.kpuzzle=e,this.animLeaves=r?.animationTimelineLeaves??Dn(t)}kpuzzle;animLeaves;getAnimLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]?.animLeaf??null}getAnimationTimelineLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]}indexToMoveStartTimestamp(e){let t=0;return this.animLeaves.length>0&&(t=this.animLeaves[Math.min(e,this.animLeaves.length-1)].start),t}timestampToIndex(e){let t=0;for(t=0;t<this.animLeaves.length;t++)if(this.animLeaves[t].start>=e)return Math.max(0,t-1);return Math.max(0,t-1)}timestampToPosition(e,t){const r=this.currentMoveInfo(e);let n=t??this.kpuzzle.identityTransformation().toKPattern();for(const i of this.animLeaves.slice(0,r.patternIndex)){const s=i.animLeaf.as(C);s!==null&&(n=n.applyMove(s))}return{pattern:n,movesInProgress:r.currentMoves}}currentMoveInfo(e){let t=1/0;for(const o of this.animLeaves)if(o.start<=e&&o.end>=e)t=Math.min(t,o.start);else if(o.start>e)break;const r=[],n=[],i=[],s=[];let a=-1/0,l=1/0,h=0;for(const o of this.animLeaves)if(o.end<=t){if(!isFinite(t)&&o.start>e)break;h++}else{if(o.start>e)break;{const c=o.animLeaf.as(C);if(c!==null){let u=(e-o.start)/(o.end-o.start),p=!1;u>1&&(u=1,p=!0);const g={move:c,direction:1,fraction:u,startTimestamp:o.start,endTimestamp:o.end};switch(u){case 0:{n.push(g);break}case 1:{p?s.push(g):i.push(g);break}default:r.push(g),a=Math.max(a,o.start),l=Math.min(l,o.end)}}}}return{patternIndex:h,currentMoves:r,latestStart:a,earliestEnd:l,movesStarting:n,movesFinishing:i,movesFinished:s}}patternAtIndex(e,t){let r=t??this.kpuzzle.defaultPattern();for(let n=0;n<this.animLeaves.length&&n<e;n++){const s=this.animLeaves[n].animLeaf.as(C);s!==null&&(r=r.applyMove(s))}return r}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of this.animLeaves.slice(0,e)){const n=r.animLeaf.as(C);n!==null&&(t=t.applyMove(n))}return t}algDuration(){let e=0;for(const t of this.animLeaves)e=Math.max(e,t.end);return e}numAnimatedLeaves(){return this.animLeaves.length}moveDuration(e){const t=this.getAnimationTimelineLeaf(e);return t.end-t.start}},Cn=1024,En=class extends M{derive(e){switch(e.indexerConstructorRequest){case"auto":return e.animationTimelineLeaves!==null||Sr(e.alg.alg)<=Cn&&e.puzzle==="3x3x3"&&e.visualizationStrategy==="Cube3D"?ke:_e;case"tree":return _e;case"simple":return Gr;case"simultaneous":return ke;default:throw new Error("Invalid indexer request!")}}},Nn=class extends v{getDefaultValue(){return"auto"}},Pn=class extends M{derive(e){return new e.indexerConstructor(e.kpuzzle,e.algWithIssues.alg,{animationTimelineLeaves:e.animationTimelineLeaves})}},Rn=class extends M{derive(e){return{pattern:e.currentPattern,movesInProgress:e.currentMoveInfo.currentMoves}}},jn=!0,nt=class extends M{async derive(e){try{return jn&&e.kpuzzle.algToTransformation(e.algWithIssues.alg),e.algWithIssues}catch(t){return{alg:new I,issues:new te({errors:[`Invalid alg for puzzle: ${t.toString()}`]})}}}},On=class extends v{getDefaultValue(){return"start"}},Fn=class extends v{getDefaultValue(){return null}},Vn=class extends M{async derive(e){return e.puzzleLoader.kpuzzle()}},Un=class extends v{getDefaultValue(){return K}},Bn=class extends M{async derive(e){return e.puzzleLoader.id}},qn=class extends v{getDefaultValue(){return K}},Wn=class extends M{derive(e){if(e.puzzleIDRequest&&e.puzzleIDRequest!==K){const t=vt[e.puzzleIDRequest];return t||this.userVisibleErrorTracker.set({errors:[`Invalid puzzle ID: ${e.puzzleIDRequest}`]}),t}return e.puzzleDescriptionRequest&&e.puzzleDescriptionRequest!==K?gr(e.puzzleDescriptionRequest):fr}},Hn=class extends M{derive(e){return{playing:e.playingInfo.playing,atStart:e.detailedTimelineInfo.atStart,atEnd:e.detailedTimelineInfo.atEnd}}canReuseValue(e,t){return e.playing===t.playing&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},Qn=class extends M{derive(e){let t=this.#e(e),r=!1,n=!1;return t>=e.timeRange.end&&(n=!0,t=Math.min(e.timeRange.end,t)),t<=e.timeRange.start&&(r=!0,t=Math.max(e.timeRange.start,t)),{timestamp:t,timeRange:e.timeRange,atStart:r,atEnd:n}}#e(e){switch(e.timestampRequest){case"auto":return e.setupAnchor==="start"&&e.setupAlg.alg.experimentalIsEmpty()?e.timeRange.end:e.timeRange.start;case"start":return e.timeRange.start;case"end":return e.timeRange.end;case"anchor":return e.setupAnchor==="start"?e.timeRange.start:e.timeRange.end;case"opposite-anchor":return e.setupAnchor==="start"?e.timeRange.end:e.timeRange.start;default:return e.timestampRequest}}canReuseValue(e,t){return e.timestamp===t.timestamp&&e.timeRange.start===t.timeRange.start&&e.timeRange.end===t.timeRange.end&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},Yn=class extends j{async getDefaultValue(){return{direction:1,playing:!1,untilBoundary:"entire-timeline",loop:!1}}async derive(e,t){const r=await t,n=Object.assign({},r);return Object.assign(n,e),n}canReuseValue(e,t){return e.direction===t.direction&&e.playing===t.playing&&e.untilBoundary===t.untilBoundary&&e.loop===t.loop}},_n=class extends j{getDefaultValue(){return 1}derive(e){return e<0?1:e}},$n={auto:!0,start:!0,end:!0,anchor:!0,"opposite-anchor":!0},Gn=class extends v{getDefaultValue(){return"auto"}set(e){const t=this.get();super.set((async()=>this.validInput(await e)?e:t)())}validInput(e){return!!(typeof e=="number"||$n[e])}},Xn=class extends M{derive(e){return{start:0,end:e.indexer.algDuration()}}},Zn=class extends v{getDefaultValue(){return"auto"}},Kn=class extends v{getDefaultValue(){return"auto"}},Jn=class extends M{derive(e){switch(e.puzzleID){case"clock":case"square1":case"redi_cube":case"melindas2x2x2x2":case"tri_quad":case"loopover":return"2D";case"3x3x3":switch(e.visualizationRequest){case"auto":case"3D":return"Cube3D";default:return e.visualizationRequest}default:switch(e.visualizationRequest){case"auto":case"3D":return"PG3D";case"experimental-2D-LL":case"experimental-2D-LL-face":return["2x2x2","4x4x4","megaminx"].includes(e.puzzleID)?"experimental-2D-LL":"2D";default:return e.visualizationRequest}}}},ei=class extends v{getDefaultValue(){return"auto"}},ti=class extends v{getDefaultValue(){return"auto"}},ri=class extends v{getDefaultValue(){return"auto"}},ni=class extends v{getDefaultValue(){return"auto"}},ii=null;async function si(){return ii??=new(await E).ThreeTextureLoader}var it=class extends M{async derive(e){const{spriteURL:t}=e;return t===null?null:new Promise(async(r,n)=>{const i=()=>{console.warn("Could not load sprite:",t.toString()),r(null)};try{(await si()).load(t.toString(),r,i,i)}catch{i()}})}},ai={facelets:["regular","regular","regular","regular","regular"]};async function oi(e){const{definition:t}=await e.kpuzzle(),r={orbits:{}};for(const n of t.orbits)r.orbits[n.orbitName]={pieces:new Array(n.numPieces).fill(ai)};return r}var li=class extends M{getDefaultValue(){return{orbits:{}}}async derive(e){return e.stickeringMaskRequest?e.stickeringMaskRequest:e.stickeringRequest==="picture"?{specialBehaviour:"picture",orbits:{}}:e.puzzleLoader.stickeringMask?.(e.stickeringRequest??"full")??oi(e.puzzleLoader)}},ci={"-":"Regular",D:"Dim",I:"Ignored",X:"Invisible",O:"IgnoreNonPrimary",P:"PermuteNonPrimary",o:"Ignoriented","?":"OrientationWithoutPermutation",M:"Mystery","@":"Regular"};function di(e){const t={orbits:{}},r=e.split(",");for(const n of r){const[i,s,...a]=n.split(":");if(a.length>0)throw new Error(`Invalid serialized orbit stickering mask (too many colons): \`${n}\``);const l=[];t.orbits[i]={pieces:l};for(const h of s){const o=ci[h];l.push(yr(o))}}return t}var ui=class extends j{getDefaultValue(){return null}derive(e){return e===null?null:typeof e=="string"?di(e):e}},hi=class extends v{getDefaultValue(){return null}},mi=class extends v{getDefaultValue(){return"auto"}},pi=class extends v{getDefaultValue(){return{}}},gi=class extends v{getDefaultValue(){return"auto"}},fi=class extends v{getDefaultValue(){return"auto"}},vi=class extends M{derive(e){return e.colorSchemeRequest==="dark"?"dark":"light"}},wi=class extends v{getDefaultValue(){return"auto"}},yi=class extends v{getDefaultValue(){return null}},Mi=35,xi=class extends v{getDefaultValue(){return Mi}};function qt(e,t){return e.latitude===t.latitude&&e.longitude===t.longitude&&e.distance===t.distance}var bi=class extends j{getDefaultValue(){return"auto"}canReuseValue(e,t){return e===t||qt(e,t)}async derive(e,t){if(e==="auto")return"auto";let r=await t;r==="auto"&&(r={});const n=Object.assign({},r);return Object.assign(n,e),typeof n.latitude<"u"&&(n.latitude=Math.min(Math.max(n.latitude,-90),90)),typeof n.longitude<"u"&&(n.longitude=Ce(n.longitude,180,-180)),n}},Si=class extends M{canReuseValue(e,t){return qt(e,t)}async derive(e){if(e.orbitCoordinatesRequest==="auto")return at(e.puzzleID,e.strategy);const t=Object.assign(Object.assign({},at(e.puzzleID,e.strategy),e.orbitCoordinatesRequest));if(Math.abs(t.latitude)<=e.latitudeLimit)return t;{const{latitude:r,longitude:n,distance:i}=t;return{latitude:e.latitudeLimit*Math.sign(r),longitude:n,distance:i}}}},Ti={latitude:31.717474411461005,longitude:0,distance:5.877852522924731},zi={latitude:35,longitude:30,distance:6},st={latitude:35,longitude:30,distance:6.25},ki={latitude:Math.atan(1/2)*ee,longitude:0,distance:6.7},Ii={latitude:26.56505117707799,longitude:0,distance:6};function at(e,t){if(e[1]==="x")return t==="Cube3D"?zi:st;switch(e){case"megaminx":case"gigaminx":return ki;case"pyraminx":case"master_tetraminx":return Ii;case"skewb":return st;default:return Ti}}var Li=class{constructor(e){this.twistyPlayerModel=e,this.orbitCoordinates=new Si({orbitCoordinatesRequest:this.orbitCoordinatesRequest,latitudeLimit:this.latitudeLimit,puzzleID:e.puzzleID,strategy:e.visualizationStrategy}),this.stickeringMask=new li({stickeringMaskRequest:this.stickeringMaskRequest,stickeringRequest:this.stickeringRequest,puzzleLoader:e.puzzleLoader})}twistyPlayerModel;background=new fi;colorSchemeRequest=new wi;dragInput=new mi;foundationDisplay=new ti;foundationStickerSpriteURL=new Ne;fullscreenElement=new yi;hintFacelet=new Or;hintStickerSpriteURL=new Ne;initialHintFaceletsAnimation=new ni;hintFaceletsElevation=new ri;latitudeLimit=new xi;movePressInput=new gi;movePressCancelOptions=new pi;orbitCoordinatesRequest=new bi;stickeringMaskRequest=new ui;stickeringRequest=new hi;faceletScale=new ei;colorScheme=new vi({colorSchemeRequest:this.colorSchemeRequest});foundationStickerSprite=new it({spriteURL:this.foundationStickerSpriteURL});hintStickerSprite=new it({spriteURL:this.hintStickerSpriteURL});orbitCoordinates;stickeringMask},Ai={errors:[]},Di=class extends v{getDefaultValue(){return Ai}reset(){this.set(this.getDefaultValue())}canReuseValue(e,t){return De(e.errors,t.errors)}},Ci=class{userVisibleErrorTracker=new Di;alg=new tt;backView=new rn;controlPanel=new un;catchUpMove=new Sn;indexerConstructorRequest=new Nn;playingInfo=new Yn;puzzleDescriptionRequest=new Un;puzzleIDRequest=new qn;setupAnchor=new On;setupAlg=new tt;setupTransformation=new Fn;tempoScale=new _n;timestampRequest=new Gn;viewerLink=new Zn;visualizationFormat=new Kn;title=new et;videoURL=new Ne;competitionID=new et;animationTimelineLeavesRequest=new bn;puzzleLoader=new Wn({puzzleIDRequest:this.puzzleIDRequest,puzzleDescriptionRequest:this.puzzleDescriptionRequest},this.userVisibleErrorTracker);kpuzzle=new Vn({puzzleLoader:this.puzzleLoader});puzzleID=new Bn({puzzleLoader:this.puzzleLoader});puzzleAlg=new nt({algWithIssues:this.alg,kpuzzle:this.kpuzzle});puzzleSetupAlg=new nt({algWithIssues:this.setupAlg,kpuzzle:this.kpuzzle});visualizationStrategy=new Jn({visualizationRequest:this.visualizationFormat,puzzleID:this.puzzleID});indexerConstructor=new En({alg:this.alg,puzzle:this.puzzleID,visualizationStrategy:this.visualizationStrategy,indexerConstructorRequest:this.indexerConstructorRequest,animationTimelineLeaves:this.animationTimelineLeavesRequest});setupAlgTransformation=new Mn({setupAlg:this.puzzleSetupAlg,kpuzzle:this.kpuzzle});indexer=new Pn({indexerConstructor:this.indexerConstructor,algWithIssues:this.puzzleAlg,kpuzzle:this.kpuzzle,animationTimelineLeaves:this.animationTimelineLeavesRequest});anchorTransformation=new xn({setupTransformation:this.setupTransformation,setupAnchor:this.setupAnchor,setupAlgTransformation:this.setupAlgTransformation,indexer:this.indexer});timeRange=new Xn({indexer:this.indexer});detailedTimelineInfo=new Qn({timestampRequest:this.timestampRequest,timeRange:this.timeRange,setupAnchor:this.setupAnchor,setupAlg:this.setupAlg});coarseTimelineInfo=new Hn({detailedTimelineInfo:this.detailedTimelineInfo,playingInfo:this.playingInfo});currentMoveInfo=new zn({indexer:this.indexer,detailedTimelineInfo:this.detailedTimelineInfo,catchUpMove:this.catchUpMove});buttonAppearance=new vn({coarseTimelineInfo:this.coarseTimelineInfo,viewerLink:this.viewerLink});currentLeavesSimplified=new Tn({currentMoveInfo:this.currentMoveInfo});currentPattern=new kn({anchoredStart:this.anchorTransformation,currentLeavesSimplified:this.currentLeavesSimplified,indexer:this.indexer});legacyPosition=new Rn({currentMoveInfo:this.currentMoveInfo,currentPattern:this.currentPattern});twistySceneModel=new Li(this);async twizzleLink(){const[e,t,r,n,i,s,a,l]=await Promise.all([this.viewerLink.get(),this.puzzleID.get(),this.puzzleDescriptionRequest.get(),this.alg.get(),this.setupAlg.get(),this.setupAnchor.get(),this.twistySceneModel.stickeringRequest.get(),this.twistySceneModel.twistyPlayerModel.title.get()]),h=e==="experimental-twizzle-explorer",o=new URL(`https://alpha.twizzle.net/${h?"explore":"edit"}/`);return n.alg.experimentalIsEmpty()||o.searchParams.set("alg",n.alg.toString()),i.alg.experimentalIsEmpty()||o.searchParams.set("setup-alg",i.alg.toString()),s!=="start"&&o.searchParams.set("setup-anchor",s),a!=="full"&&a!==null&&o.searchParams.set("experimental-stickering",a),h&&r!==K?o.searchParams.set("puzzle-description",r):t!=="3x3x3"&&o.searchParams.set("puzzle",t),l&&o.searchParams.set("title",l),o.toString()}experimentalAddAlgLeaf(e,t){const r=e.as(C);r?this.experimentalAddMove(r,t):this.alg.set((async()=>{const i=(await this.alg.get()).alg.concat(new I([e]));return this.timestampRequest.set("end"),i})())}experimentalAddMove(e,t){const r=typeof e=="string"?new C(e):e;this.alg.set((async()=>{const[{alg:n},i]=await Promise.all([this.alg.get(),this.puzzleLoader.get()]),s=mr(n,r,{...t,...await pr(i)});return this.timestampRequest.set("end"),this.catchUpMove.set({move:r,amount:0}),s})())}experimentalRemoveFinalChild(){this.alg.set((async()=>{const e=(await this.alg.get()).alg,t=Array.from(e.childAlgNodes()),[r]=t.splice(-1);if(!r)return e;this.timestampRequest.set("end");const n=r.as(C);return n&&this.catchUpMove.set({move:n.invert(),amount:0}),new I(t)})())}};function f(e){return new Error(`Cannot get \`.${e}\` directly from a \`TwistyPlayer\`.`)}var Ei=class extends D{experimentalModel=new Ci;set alg(e){this.experimentalModel.alg.set(e)}get alg(){throw f("alg")}set experimentalSetupAlg(e){this.experimentalModel.setupAlg.set(e)}get experimentalSetupAlg(){throw f("setup")}set experimentalSetupAnchor(e){this.experimentalModel.setupAnchor.set(e)}get experimentalSetupAnchor(){throw f("anchor")}set puzzle(e){this.experimentalModel.puzzleIDRequest.set(e)}get puzzle(){throw f("puzzle")}set experimentalPuzzleDescription(e){this.experimentalModel.puzzleDescriptionRequest.set(e)}get experimentalPuzzleDescription(){throw f("experimentalPuzzleDescription")}set timestamp(e){this.experimentalModel.timestampRequest.set(e)}get timestamp(){throw f("timestamp")}set hintFacelets(e){this.experimentalModel.twistySceneModel.hintFacelet.set(e)}get hintFacelets(){throw f("hintFacelets")}set experimentalStickering(e){this.experimentalModel.twistySceneModel.stickeringRequest.set(e)}get experimentalStickering(){throw f("experimentalStickering")}set experimentalStickeringMaskOrbits(e){this.experimentalModel.twistySceneModel.stickeringMaskRequest.set(e)}get experimentalStickeringMaskOrbits(){throw f("experimentalStickeringMaskOrbits")}set experimentalFaceletScale(e){this.experimentalModel.twistySceneModel.faceletScale.set(e)}get experimentalFaceletScale(){throw f("experimentalFaceletScale")}set backView(e){this.experimentalModel.backView.set(e)}get backView(){throw f("backView")}set background(e){this.experimentalModel.twistySceneModel.background.set(e)}get background(){throw f("background")}set colorScheme(e){this.experimentalModel.twistySceneModel.colorSchemeRequest.set(e)}get colorScheme(){throw f("colorScheme")}set controlPanel(e){this.experimentalModel.controlPanel.set(e)}get controlPanel(){throw f("controlPanel")}set visualization(e){this.experimentalModel.visualizationFormat.set(e)}get visualization(){throw f("visualization")}set experimentalTitle(e){this.experimentalModel.title.set(e)}get experimentalTitle(){throw f("experimentalTitle")}set experimentalVideoURL(e){this.experimentalModel.videoURL.set(e)}get experimentalVideoURL(){throw f("experimentalVideoURL")}set experimentalCompetitionID(e){this.experimentalModel.competitionID.set(e)}get experimentalCompetitionID(){throw f("experimentalCompetitionID")}set viewerLink(e){this.experimentalModel.viewerLink.set(e)}get viewerLink(){throw f("viewerLink")}set experimentalMovePressInput(e){this.experimentalModel.twistySceneModel.movePressInput.set(e)}get experimentalMovePressInput(){throw f("experimentalMovePressInput")}set experimentalMovePressCancelOptions(e){this.experimentalModel.twistySceneModel.movePressCancelOptions.set(e)}get experimentalMovePressCancelOptions(){throw f("experimentalMovePressCancelOptions")}set cameraLatitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({latitude:e})}get cameraLatitude(){throw f("cameraLatitude")}set cameraLongitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({longitude:e})}get cameraLongitude(){throw f("cameraLongitude")}set cameraDistance(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({distance:e})}get cameraDistance(){throw f("cameraDistance")}set cameraLatitudeLimit(e){this.experimentalModel.twistySceneModel.latitudeLimit.set(e)}get cameraLatitudeLimit(){throw f("cameraLatitudeLimit")}set indexer(e){this.experimentalModel.indexerConstructorRequest.set(e)}get indexer(){throw f("indexer")}set tempoScale(e){this.experimentalModel.tempoScale.set(e)}get tempoScale(){throw f("tempoScale")}set experimentalSprite(e){this.experimentalModel.twistySceneModel.foundationStickerSpriteURL.set(e)}get experimentalSprite(){throw f("experimentalSprite")}set experimentalHintSprite(e){this.experimentalModel.twistySceneModel.hintStickerSpriteURL.set(e)}get experimentalHintSprite(){throw f("experimentalHintSprite")}set fullscreenElement(e){this.experimentalModel.twistySceneModel.fullscreenElement.set(e)}get fullscreenElement(){throw f("fullscreenElement")}set experimentalInitialHintFaceletsAnimation(e){this.experimentalModel.twistySceneModel.initialHintFaceletsAnimation.set(e)}get experimentalInitialHintFaceletsAnimation(){throw f("experimentalInitialHintFaceletsAnimation")}set experimentalHintFaceletsElevation(e){this.experimentalModel.twistySceneModel.hintFaceletsElevation.set(e)}get experimentalHintFaceletsElevation(){throw f("experimentalHintFaceletsElevation")}set experimentalDragInput(e){this.experimentalModel.twistySceneModel.dragInput.set(e)}get experimentalDragInput(){throw f("experimentalDragInput")}experimentalGet=new Ni(this.experimentalModel)},Ni=class{constructor(e){this.model=e}model;async alg(){return(await this.model.alg.get()).alg}async setupAlg(){return(await this.model.setupAlg.get()).alg}puzzleID(){return this.model.puzzleID.get()}async timestamp(){return(await this.model.detailedTimelineInfo.get()).timestamp}},Ie="data-",ge={alg:"alg","experimental-setup-alg":"experimentalSetupAlg","experimental-setup-anchor":"experimentalSetupAnchor",puzzle:"puzzle","experimental-puzzle-description":"experimentalPuzzleDescription",visualization:"visualization","hint-facelets":"hintFacelets","experimental-stickering":"experimentalStickering","experimental-stickering-mask-orbits":"experimentalStickeringMaskOrbits",background:"background","color-scheme":"colorScheme","control-panel":"controlPanel","back-view":"backView","experimental-facelet-scale":"experimentalFaceletScale","experimental-initial-hint-facelets-animation":"experimentalInitialHintFaceletsAnimation","experimental-hint-facelets-elevation":"experimentalHintFaceletsElevation","viewer-link":"viewerLink","experimental-move-press-input":"experimentalMovePressInput","experimental-drag-input":"experimentalDragInput","experimental-title":"experimentalTitle","experimental-video-url":"experimentalVideoURL","experimental-competition-id":"experimentalCompetitionID","camera-latitude":"cameraLatitude","camera-longitude":"cameraLongitude","camera-distance":"cameraDistance","camera-latitude-limit":"cameraLatitudeLimit","tempo-scale":"tempoScale","experimental-sprite":"experimentalSprite","experimental-hint-sprite":"experimentalHintSprite"},Pi=Object.fromEntries(Object.values(ge).map(e=>[e,!0])),Ri={experimentalMovePressCancelOptions:!0},ot,Wt=Symbol("intersectedCallback");function ji(e){ot??=new IntersectionObserver((t,r)=>{for(const n of t)n.isIntersecting&&n.intersectionRect.height>0&&(n.target[Wt](),r.unobserve(n.target))}),ot.observe(e)}var ie=class extends Ei{controller=new cn(this.experimentalModel,this);buttons;experimentalCanvasClickCallback=()=>{};constructor(e={}){super();for(const[t,r]of Object.entries(e)){if(!(Pi[t]||Ri[t])){console.warn(`Invalid config passed to TwistyPlayer: ${t}`);break}this[t]=r}}#e=new ne(this,"controls-",["auto"].concat(Object.keys(dn)));#t=document.createElement("div");#r=document.createElement("div");#n=!1;connectedCallback(){this.addCSS(Vt),ji(this)}async[Wt](){if(this.#n)return;this.#n=!0,this.addElement(this.#t).classList.add("visualization-wrapper"),this.addElement(this.#r).classList.add("error-elem"),this.#r.textContent="Error",this.experimentalModel.userVisibleErrorTracker.addFreshListener(t=>{const r=t.errors[0]??null;this.contentWrapper.classList.toggle("error",!!r),r&&(this.#r.textContent=r)});const e=new jt(this.experimentalModel,this.controller);this.contentWrapper.appendChild(e),this.buttons=new Et(this.experimentalModel,this.controller,this),this.contentWrapper.appendChild(this.buttons),this.experimentalModel.twistySceneModel.background.addFreshListener(t=>{this.contentWrapper.classList.toggle("checkered",["auto","checkered"].includes(t)),this.contentWrapper.classList.toggle("checkered-transparent",t==="checkered-transparent")}),this.experimentalModel.twistySceneModel.colorScheme.addFreshListener(t=>{this.contentWrapper.classList.toggle("dark-mode",["dark"].includes(t))}),this.experimentalModel.controlPanel.addFreshListener(t=>{this.#e.setValue(t)}),this.experimentalModel.visualizationStrategy.addFreshListener(this.#l.bind(this)),this.experimentalModel.puzzleID.addFreshListener(this.flash.bind(this))}#s="auto";experimentalSetFlashLevel(e){this.#s=e}flash(){this.#s==="auto"&&this.#i?.animate([{opacity:.25},{opacity:1}],{duration:250,easing:"ease-out"})}#i=null;#a=new Lt;#o=null;#l(e){if(e!==this.#o){this.#i?.remove(),this.#i?.disconnect();let t;switch(e){case"2D":case"experimental-2D-LL":case"experimental-2D-LL-face":{t=new It(this.experimentalModel.twistySceneModel,e);break}case"Cube3D":case"PG3D":{t=new Ee(this.experimentalModel),this.#a.handleNewValue(t);break}default:throw new Error("Invalid visualization")}this.#t.appendChild(t),this.#i=t,this.#o=e}}async experimentalCurrentVantages(){this.connectedCallback();const e=this.#i;return e instanceof Ee?e.experimentalVantages():[]}async experimentalCurrentCanvases(){const e=await this.experimentalCurrentVantages(),t=[];for(const r of e)t.push((await r.canvasInfo()).canvas);return t}async experimentalCurrentThreeJSPuzzleObject(e){this.connectedCallback();const r=await(await this.#a.promise).experimentalTwisty3DPuzzleWrapper(),n=r.twisty3DPuzzle(),i=(async()=>{await n,await new Promise(s=>setTimeout(s,0))})();if(e){const s=new H(async()=>{});r.addEventListener("render-scheduled",async()=>{s.requestIsPending()||(s.requestAnimFrame(),await i,e())})}return n}jumpToStart(e){this.controller.jumpToStart(e)}jumpToEnd(e){this.controller.jumpToEnd(e)}play(){this.controller.togglePlay(!0)}pause(){this.controller.togglePlay(!1)}togglePlay(e){this.controller.togglePlay(e)}experimentalAddMove(e,t){this.experimentalModel.experimentalAddMove(e,t)}experimentalAddAlgLeaf(e,t){this.experimentalModel.experimentalAddAlgLeaf(e,t)}static get observedAttributes(){const e=[];for(const t of Object.keys(ge))e.push(t,Ie+t);return e}experimentalRemoveFinalChild(){this.experimentalModel.experimentalRemoveFinalChild()}attributeChangedCallback(e,t,r){e.startsWith(Ie)&&(e=e.slice(Ie.length));const n=ge[e];n&&(this[n]=r)}async experimentalScreenshot(e){return(await Je(this.experimentalModel,e)).dataURL}async experimentalDownloadScreenshot(e){if(["2D","experimental-2D-LL","experimental-2D-LL-face"].includes(await this.experimentalModel.visualizationStrategy.get())){const r=await this.#i.currentTwisty2DPuzzleWrapper().twisty2DPuzzle(),n=new XMLSerializer().serializeToString(r.svgWrapper.svgElement),i=URL.createObjectURL(new Blob([n]));Ft(i,e??await Ot(this.experimentalModel),"svg")}else await(await Je(this.experimentalModel)).download(e)}};z.define("twisty-player",ie);var Oi=class extends Pe{traverseAlg(e,t){const r=[];let n=0;for(const i of e.childAlgNodes()){const s=this.traverseAlgNode(i,{numMovesSoFar:t.numMovesSoFar+n});r.push(s.tokens),n+=s.numLeavesInside}return{tokens:Array.prototype.concat(...r),numLeavesInside:n}}traverseGrouping(e,t){const r=this.traverseAlg(e.alg,t);return{tokens:r.tokens,numLeavesInside:r.numLeavesInside*e.amount}}traverseMove(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseCommutator(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside}}traverseConjugate(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside*2}}traversePause(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseNewline(e,t){return{tokens:[],numLeavesInside:0}}traverseLineComment(e,t){return{tokens:[],numLeavesInside:0}}},Fi=ve(Oi),Vi=class extends v{getDefaultValue(){return""}},Ui=class extends M{derive(e){return Bt(e.value)}},Bi=class extends j{getDefaultValue(){return{selectionStart:0,selectionEnd:0,endChangedMostRecently:!1}}async derive(e,t){const{selectionStart:r,selectionEnd:n}=e,i=await t,s=e.selectionStart===i.selectionStart&&e.selectionEnd!==(await t).selectionEnd;return{selectionStart:r,selectionEnd:n,endChangedMostRecently:s}}},qi=class extends M{derive(e){return e.selectionInfo.endChangedMostRecently?e.selectionInfo.selectionEnd:e.selectionInfo.selectionStart}},Wi=class extends M{derive(e){return Fi(e.algWithIssues.alg,{numMovesSoFar:0}).tokens}},Hi=class extends M{derive(e){function t(n){if(n===null)return null;let i;return e.targetChar<n.leaf[U]?i="before":e.targetChar===n.leaf[U]?i="start":e.targetChar<n.leaf[X]?i="inside":e.targetChar===n.leaf[X]?i="end":i="after",{leafInfo:n,where:i}}let r=null;for(const n of e.leafTokens){if(e.targetChar<n.leaf[U]&&r!==null)return t(r);if(e.targetChar<=n.leaf[X])return t(n);r=n}return t(r)}},Qi=class{valueProp=new Vi;selectionProp=new Bi;targetCharProp=new qi({selectionInfo:this.selectionProp});algEditorAlgWithIssues=new Ui({value:this.valueProp});leafTokensProp=new Wi({algWithIssues:this.algEditorAlgWithIssues});leafToHighlight=new Hi({leafTokens:this.leafTokensProp,targetChar:this.targetCharProp})},Yi="//";function _i(e){try{return I.fromString(e)}catch{return null}}function Ht(e,t){const r=e.indexOf(t);return r===-1?[e,""]:[e.slice(0,r),e.slice(r)]}function lt(e){const t=[];for(const r of e.split(`
`)){let[n,i]=Ht(r,Yi);n=n.replaceAll("’","'"),t.push(n+i)}return t.join(`
`)}function $i(e,t){const{value:r}=e,{selectionStart:n,selectionEnd:i}=e,s=r.slice(0,n),a=r.slice(i);t=t.replaceAll(`\r
`,`
`);const l=s.match(/\/\/[^\n]*$/),h=r[n-1]==="/"&&t[0]==="/",o=l||h,c=t.match(/\/\/[^\n]*$/);let u=t;if(o){const[w,A]=Ht(t,`
`);u=w+lt(A)}else u=lt(t);const p=!o&&n!==0&&![`
`," "].includes(u[0])&&![`
`," "].includes(r[n-1]),g=!c&&i!==r.length&&![`
`," "].includes(u.at(-1))&&![`
`," "].includes(r[i]);function x(w,A){const O=w+u+A,P=!!_i(s+O+a);return P&&(u=O),P}p&&g&&x(" "," ")||p&&x(" ","")||g&&x(""," "),R?.execCommand("insertText",!1,u)||e.setRangeText(u,n,i,"end")}var Qt=new L;Qt.replaceSync(`
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
`);var ce="for-twisty-player",ct="placeholder",dt="twisty-player-prop",Gi=class extends D{model=new Qi;#e=document.createElement("textarea");#t=document.createElement("div");#r=document.createElement("span");#n=document.createElement("span");#s=document.createElement("span");#i=new ne(this,"valid-for-puzzle-",["none","warning","error"]);#a=null;#o;get#l(){return this.#a===null?null:this.#a.experimentalModel[this.#o]}debugNeverRequestTimestamp=!1;constructor(e){super(),this.#t.classList.add("carbon-copy"),this.addElement(this.#t),this.#e.rows=1,this.addElement(this.#e),this.#r.classList.add("prefix"),this.#t.appendChild(this.#r),this.#n.classList.add("highlight"),this.#t.appendChild(this.#n),this.#s.classList.add("suffix"),this.#t.appendChild(this.#s),this.#e.placeholder="Alg",this.#e.setAttribute("spellcheck","false"),this.addCSS(Qt),this.#e.addEventListener("input",()=>{this.#d=!0,this.onInput()}),this.#e.addEventListener("blur",()=>this.onBlur()),document.addEventListener("selectionchange",()=>this.onSelectionChange()),e?.twistyPlayer&&(this.twistyPlayer=e.twistyPlayer),this.#o=e?.twistyPlayerProp??"alg",e?.twistyPlayerProp==="alg"&&this.model.leafToHighlight.addFreshListener(t=>{t&&this.highlightLeaf(t.leafInfo.leaf)})}connectedCallback(){this.#e.addEventListener("paste",e=>{const t=e.clipboardData?.getData("text");t&&($i(this.#e,t),e.preventDefault(),this.onInput())})}set algString(e){this.#e.value=e,this.onInput()}get algString(){return this.#e.value}set placeholder(e){this.#e.placeholder=e}#d=!1;onInput(){this.#n.hidden=!0,this.highlightLeaf(null);const e=this.#e.value.trimEnd();this.model.valueProp.set(e),this.#l?.set(e)}async onSelectionChange(){if(document.activeElement!==this||this.shadow.activeElement!==this.#e||this.#o!=="alg")return;const{selectionStart:e,selectionEnd:t}=this.#e;this.model.selectionProp.set({selectionStart:e,selectionEnd:t})}async onBlur(){}setAlgIssueClassForPuzzle(e){this.#i.setValue(e)}#u(e){return e.endsWith(`
`)?`${e} `:e}#c=null;highlightLeaf(e){if(e===null){this.#r.textContent="",this.#n.textContent="",this.#s.textContent=this.#u(this.#e.value);return}e!==this.#c&&(this.#c=e,this.#r.textContent=this.#e.value.slice(0,e[U]),this.#n.textContent=this.#e.value.slice(e[U],e[X]),this.#s.textContent=this.#u(this.#e.value.slice(e[X])),this.#n.hidden=!1)}get twistyPlayer(){return this.#a}set twistyPlayer(e){if(this.#a){console.warn("twisty-player reassignment/clearing is not supported");return}this.#a=e,e&&((async()=>this.algString=this.#l?(await this.#l.get()).alg.toString():"")(),this.#o==="alg"&&(this.#a?.experimentalModel.puzzleAlg.addFreshListener(t=>{if(t.issues.errors.length===0){this.setAlgIssueClassForPuzzle(t.issues.warnings.length===0?"none":"warning");const r=t.alg,n=I.fromString(this.algString);r.isIdentical(n)||(this.algString=r.toString(),this.onInput())}else this.setAlgIssueClassForPuzzle("error")}),this.model.leafToHighlight.addFreshListener(async t=>{if(t===null)return;const[r,n]=await Promise.all([await e.experimentalModel.indexer.get(),await e.experimentalModel.timestampRequest.get()]);if(n==="auto"&&!this.#d)return;const i=r.indexToMoveStartTimestamp(t.leafInfo.idx),s=r.moveDuration(t.leafInfo.idx);let a;switch(t.where){case"before":{a=i;break}case"start":case"inside":{a=i+s/4;break}case"end":case"after":{a=i+s;break}default:throw console.log("invalid where"),new Error("Invalid where!")}this.debugNeverRequestTimestamp||e.experimentalModel.timestampRequest.set(a)}),e.experimentalModel.currentLeavesSimplified.addFreshListener(async t=>{const n=(await e.experimentalModel.indexer.get()).getAnimLeaf(t.patternIndex);this.highlightLeaf(n)})))}attributeChangedCallback(e,t,r){switch(e){case ce:{const n=document.getElementById(r);if(!n){console.warn(`${ce}= elem does not exist`);return}if(!(n instanceof ie)){console.warn(`${ce}=is not a twisty-player`);return}this.twistyPlayer=n;return}case ct:{this.placeholder=r;return}case dt:{if(this.#a)throw console.log("cannot set prop"),new Error("cannot set prop after twisty player");this.#o=r;return}}}static get observedAttributes(){return[ce,ct,dt]}};z.define("twisty-alg-editor",Gi);async function Xi(e){return new Promise((t,r)=>{try{const n=document.getElementById(e);n&&t(n);const i=new MutationObserver(s=>{for(const a of s)a.attributeName==="id"&&a.target instanceof Element&&a.target.getAttribute("id")===e&&(t(a.target),i.disconnect())});i.observe(document.body,{attributeFilter:["id"],subtree:!0})}catch(n){r(n)}})}var Yt=new L;Yt.replaceSync(`
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
`);var Zi=.25,q=class extends J{constructor(e,t,r,n,i,s){if(super(),this.algOrAlgNode=n,this.classList.add(e),s){const a=this.appendChild(document.createElement("a"));a.href="#",a.textContent=t,a.addEventListener("click",l=>{l.preventDefault(),r.twistyAlgViewer.jumpToIndex(r.earliestMoveIndex,i)})}else this.appendChild(document.createElement("span")).textContent=t}algOrAlgNode;pathToIndex(e){return[]}setCurrentMove(e){this.classList.toggle("current-move",e)}};z.define("twisty-alg-leaf-elem",q);var W=class extends J{constructor(e,t){super(),this.algOrAlgNode=t,this.classList.add(e)}algOrAlgNode;queue=[];addString(e){const t=document.createElement("span");t.textContent=e,this.queue.push(t)}addElem(e){return this.queue.push(e.element),e.moveCount}flushQueue(e=1){for(const t of _t(this.queue,e))this.append(t);this.queue=[]}pathToIndex(e){return[]}};z.define("twisty-alg-wrapper-elem",W);function Ki(e){return e===1?-1:1}function Ji(e,t){return t<0?Ki(e):e}function _t(e,t){if(t===1)return e;const r=Array.from(e);return r.reverse(),r}var es=class extends Pe{traverseAlg(e,t){let r=0;const n=new W("twisty-alg-alg",e);let i=!0;for(const s of br(e.childAlgNodes(),t.direction))i||n.addString(" "),i=!1,s.as(qe)?.experimentalNISSGrouping&&n.addString("^("),s.as(pe)?.experimentalNISSPlaceholder||(r+=n.addElem(this.traverseAlgNode(s,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}))),s.as(qe)?.experimentalNISSGrouping&&n.addString(")");return n.flushQueue(t.direction),{moveCount:r,element:n}}traverseGrouping(e,t){const r=e.experimentalAsSquare1Tuple(),n=Ji(t.direction,e.amount);let i=0;const s=new W("twisty-alg-grouping",e);return s.addString("("),r?(i+=s.addElem({moveCount:1,element:new q("twisty-alg-move",r[0].amount.toString(),t,r[0],!0,!0)}),s.addString(", "),i+=s.addElem({moveCount:1,element:new q("twisty-alg-move",r[1].amount.toString(),t,r[1],!0,!0)})):i+=s.addElem(this.traverseAlg(e.alg,{earliestMoveIndex:t.earliestMoveIndex+i,twistyAlgViewer:t.twistyAlgViewer,direction:n})),s.addString(`)${e.experimentalRepetitionSuffix}`),s.flushQueue(),{moveCount:i*Math.abs(e.amount),element:s}}traverseMove(e,t){const r=new q("twisty-alg-move",e.toString(),t,e,!0,!0);return t.twistyAlgViewer.highlighter.addMove(e[U],r),{moveCount:1,element:r}}traverseCommutator(e,t){let r=0;const n=new W("twisty-alg-commutator",e);n.addString("["),n.flushQueue();const[i,s]=_t([e.A,e.B],t.direction);return r+=n.addElem(this.traverseAlg(i,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString(", "),r+=n.addElem(this.traverseAlg(s,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.flushQueue(t.direction),n.addString("]"),n.flushQueue(),{moveCount:r*2,element:n}}traverseConjugate(e,t){let r=0;const n=new W("twisty-alg-conjugate",e);n.addString("[");const i=n.addElem(this.traverseAlg(e.A,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}));return r+=i,n.addString(": "),r+=n.addElem(this.traverseAlg(e.B,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString("]"),n.flushQueue(),{moveCount:r+i,element:n}}traversePause(e,t){return e.experimentalNISSGrouping?this.traverseAlg(e.experimentalNISSGrouping.alg,t):{moveCount:1,element:new q("twisty-alg-pause",".",t,e,!0,!0)}}traverseNewline(e,t){const r=new W("twisty-alg-newline",e);return r.append(document.createElement("br")),{moveCount:0,element:r}}traverseLineComment(e,t){return{moveCount:0,element:new q("twisty-alg-line-comment",`//${e.text}`,t,e,!1,!1)}}},ts=ve(es),rs=class{moveCharIndexMap=new Map;currentElem=null;addMove(e,t){this.moveCharIndexMap.set(e,t)}set(e){const t=e?this.moveCharIndexMap.get(e[U])??null:null;this.currentElem!==t&&(this.currentElem?.setCurrentMove(!1),t?.setCurrentMove(!0),this.currentElem=t)}},$t=class extends D{highlighter=new rs;#e;#t;#r=null;lastClickTimestamp=null;constructor(e){super({mode:"open"}),this.addCSS(Yt),e?.twistyPlayer&&(this.twistyPlayer=e?.twistyPlayer)}connectedCallback(){}setAlg(e){this.#t?.isIdentical(e)||(this.#e=ts(e,{earliestMoveIndex:0,twistyAlgViewer:this,direction:1}).element,this.#t=e,this.contentWrapper.textContent="",this.contentWrapper.appendChild(this.#e))}get twistyPlayer(){return this.#r}set twistyPlayer(e){this.#n(e)}async#n(e){if(this.#r){console.warn("twisty-player reassignment is not supported");return}if(e===null)throw new Error("clearing twistyPlayer is not supported");this.#r=e,this.#r.experimentalModel.alg.addFreshListener(t=>{this.setAlg(t.alg)}),e.experimentalModel.currentMoveInfo.addFreshListener(t=>{let r=t.currentMoves[0];if(r??=t.movesStarting[0],r??=t.movesFinishing[0],!r)this.highlighter.set(null);else{const n=r.move;this.highlighter.set(n)}}),e.experimentalModel.detailedTimelineInfo.addFreshListener(t=>{t.timestamp!==this.lastClickTimestamp&&(this.lastClickTimestamp=null)})}async jumpToIndex(e,t){const r=this.#r;if(r){r.pause();const n=(async()=>{const i=await r.experimentalModel.indexer.get(),s=t?i.moveDuration(e)*Zi:0;return i.indexToMoveStartTimestamp(e)+i.moveDuration(e)-s})();r.experimentalModel.timestampRequest.set(await n),this.lastClickTimestamp===await n?(r.play(),this.lastClickTimestamp=null):this.lastClickTimestamp=await n}}async attributeChangedCallback(e,t,r){if(e==="for"){let n=document.getElementById(r);if(n||console.info("for= elem does not exist, waiting for one"),await customElements.whenDefined("twisty-player"),n=await Xi(r),!(n instanceof ie)){console.warn("for= elem is not a twisty-player");return}this.twistyPlayer=n}}static get observedAttributes(){return["for"]}};z.define("twisty-alg-viewer",$t);var me=new L;me.replaceSync(`
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
`);var Gt=new L;Gt.replaceSync(`
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
`);function ns(e="",t=location.href){const r={alg:"alg","setup-alg":"experimental-setup-alg","setup-anchor":"experimental-setup-anchor",puzzle:"puzzle",stickering:"experimental-stickering","puzzle-description":"experimental-puzzle-description",title:"experimental-title","video-url":"experimental-video-url",competition:"experimental-competition-id"},n=new URL(t).searchParams,i={};for(const[s,a]of Object.entries(r)){const l=n.get(e+s);if(l!==null){const h=ge[a];i[h]=l}}return i}var de="outer block moves (e.g. R, Rw, or 4r)",ue="inner block moves (e.g. M or 2-5r)",ut={OBTM:`HTM = OBTM ("Outer Block Turn Metric"):
• ${ue} count as 2 turns
• ${de} count as 1 turn
• rotations (e.g. x) count as 0 turns`,OBQTM:`QTM = OBQTM ("Outer Block Quantum Turn Metric"):
• ${ue} count as 2 turns per quantum (e.g. M2 counts as 4)
• ${de} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,RBTM:`STM = RBTM ("Range Block Turn Metric"):
• ${ue} count as 1 turn
• ${de} count as 1 turn
• rotations (e.g. x) count as 0 turns`,RBQTM:`SQTM = RBQTM ("Range Block Quantum Turn Metric"):
• ${ue} count as 1 turn per quantum (e.g. M2 counts as 2)
• ${de} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,ETM:`ETM ("Execution Turn Metric"):
• all moves (including rotations) count as 1 turn`},is={OBTM:"OB",OBQTM:"OBQ",RBTM:"RB",RBQTM:"RBQ",ETM:"E"},ss=class extends D{constructor(e){super({mode:"open"}),this.options=e}options;twistyPlayer=null;a=null;#e(){if(this.contentWrapper.textContent="",this.a){const t=this.contentWrapper.appendChild(document.createElement("span"));t.textContent="❗️",t.title="Could not show a player for link",this.addElement(this.a)}this.removeCSS(me);const e=this.shadow.adoptedStyleSheets.indexOf(me);typeof e<"u"&&this.shadow.adoptedStyleSheets.splice(e,e+1),this.#t?.remove()}#t;#r;#n;#s;async connectedCallback(){if(this.#n=this.addElement(document.createElement("div")),this.#n.classList.add("responsive-wrapper"),this.options?.colorScheme==="dark"&&this.contentWrapper.classList.add("dark-mode"),this.addCSS(me),this.options?.cdnForumTweaks&&this.addCSS(Gt),this.a=this.querySelector("a"),!this.a)return;const e=ns("",this.a.href),t=this.a?.href,{hostname:r,pathname:n}=new URL(t);if(r!=="alpha.twizzle.net"){this.#e();return}if(["/edit/","/explore/"].includes(n)){const i=n==="/explore/";if(e.puzzle&&!(e.puzzle in vt)){const l=(await ft(async()=>{const{getPuzzleDescriptionString:h}=await import("./index-CW5GorPG.js");return{getPuzzleDescriptionString:h}},[])).getPuzzleDescriptionString(e.puzzle);delete e.puzzle,e.experimentalPuzzleDescription=l}if(this.twistyPlayer=this.#n.appendChild(new ie({background:this.options?.cdnForumTweaks?"checkered-transparent":"checkered",colorScheme:this.options?.colorScheme==="dark"?"dark":"light",...e,viewerLink:i?"experimental-twizzle-explorer":"auto"})),this.twistyPlayer.fullscreenElement=this.contentWrapper,e.experimentalTitle&&(this.twistyPlayer.experimentalTitle=e.experimentalTitle),this.#r=this.#n.appendChild(document.createElement("div")),this.#r.classList.add("scrollable-region"),e.experimentalTitle&&this.#i(e.experimentalTitle).classList.add("title"),e.experimentalSetupAlg){this.#i("Setup",async()=>(await this.twistyPlayer?.experimentalModel.setupAlg.get())?.alg.toString()??null);const l=this.#r.appendChild(document.createElement("div"));l.classList.add("setup-alg"),l.textContent=new I(e.experimentalSetupAlg).toString()}const s=this.#i("Moves",async()=>(await this.twistyPlayer?.experimentalModel.alg.get())?.alg.toString()??null);this.#s=s.appendChild(as(this.twistyPlayer.experimentalModel)),this.#s.classList.add("move-count"),this.#r.appendChild(new $t({twistyPlayer:this.twistyPlayer})).part.add("twisty-alg-viewer")}else this.#e()}#i(e,t){const r=this.#r.appendChild(document.createElement("div"));r.classList.add("heading");const n=r.appendChild(document.createElement("span"));if(n.textContent=e,t){n.textContent+=" ";const i=n.appendChild(document.createElement("a"));i.textContent="📋",i.href="#",i.title="Copy to clipboard";async function s(a){i.textContent=a,await new Promise(l=>setTimeout(l,2e3)),i.textContent===a&&(i.textContent="📋")}i.addEventListener("click",async a=>{a.preventDefault(),i.textContent="📋…";const l=await t();if(l)try{await navigator.clipboard.writeText(l),s("📋✅")}catch(h){throw s("📋❌"),h}else s("📋❌")})}return r}};z.define("twizzle-link",ss);function as(e,t=document.createElement("span")){async function r(){const[n,i]=await Promise.all([e.puzzleAlg.get(),e.puzzleLoader.get()]);if(n.issues.errors.length!==0){t.textContent="";return}let s=!0;function a(l){s?s=!1:t.append(")(");const h=t.appendChild(document.createElement("span")),o=zr(i,l,n.alg);h.append(`${is[l]}: `);const c=h.appendChild(document.createElement("span"));c.textContent=o.toString(),c.classList.add("move-number"),h.setAttribute("data-before",ut[l]??""),h.setAttribute("title",ut[l]??"")}t.textContent="(",i.id==="3x3x3"?(a("OBTM"),a("OBQTM"),a("RBTM")):i.pg&&(a("RBTM"),a("RBQTM")),a("ETM"),t.append(")")}return e.puzzleAlg.addFreshListener(r),e.puzzleID.addFreshListener(r),t}const he=e=>e*1e3;function os({cube:e,facelets:t,moves:r,position:n=r.length,speed:i=1,animateSeeks:s=!1,cross:a=null,rotation:l=rr(a)}){const h=T.useRef(null),o=T.useRef(null),c=T.useRef(null);return T.useEffect(()=>{const u=new ie({puzzle:"3x3x3",visualization:"3D",background:"none",controlPanel:"none",hintFacelets:"none"});return u.style.width="100%",u.style.height="280px",h.current?.appendChild(u),o.current=u,()=>{c.current&&cancelAnimationFrame(c.current.frame),c.current=null,u.pause(),u.remove(),o.current=null}},[]),T.useEffect(()=>{const u=o.current;if(!u)return;let p=c.current;if(!p||p.cube!==e||p.moves!==r||p.rotation!==l){p&&cancelAnimationFrame(p.frame);const k=new I(r.slice(0,n).join(" "));u.experimentalModel.setupTransformation.set(e.parse(t).applyAlg(k.invert()).applyAlg(l).experimentalToTransformation()),p={cube:e,moves:r,rotation:l,length:-1,cursor:n,target:n,speed:i,time:0,frame:0},c.current=p}if(p.length!==r.length){const k=r.map(mt(e,l)).map(w=>new C(w));u.alg=new I(k),u.experimentalModel.animationTimelineLeavesRequest.set(k.map((w,A)=>({animLeaf:w,start:he(A),end:he(A+1)}))),p.length=r.length}if(!s&&Math.abs(n-p.target)>1&&(cancelAnimationFrame(p.frame),p.frame=0,p.cursor=n),p.target=n,p.speed=i,u.timestamp=he(p.cursor),p.frame||p.cursor===p.target)return;const g=p;g.time=performance.now();const x=k=>{const w=Math.min(.95,Math.max(0,k-g.time)*g.speed/100);g.time=k,g.cursor+=Math.sign(g.target-g.cursor)*Math.min(Math.abs(g.target-g.cursor),w),u.timestamp=he(g.cursor),g.frame=g.cursor===g.target?0:requestAnimationFrame(x)};g.frame=requestAnimationFrame(x)},[e,t,r,r.length,n,i,s,l]),d.jsx("div",{ref:h,role:"img","aria-label":"Live 3x3 cube state"})}const ht=new WeakMap,ls=[];function cs({solve:e,cube:t,history:r=ls,brief:n=!1}){const i=T.useRef(null),s=T.useMemo(()=>{if(e.status!=="complete")return null;let l=ht.get(t);l||ht.set(t,l=new WeakMap);const h=[...r.filter(o=>o.id!==e.id),e].filter(o=>o.session===e.session&&o.status!=="active").map(o=>{let c=l.get(o);return(!c||c.dnf!==(o.status!=="complete")||c.time!==Math.round(pt(o))/1e3)&&(c={...kr(nr([o],t),",")[0],source:"timer",isCorrupt:!1},l.set(o,c)),c}).sort((o,c)=>o.date.getTime()-c.date.getTime());return Ir(h,100),h.find(o=>o.id===e.id)},[e,e.status,e.penalty,t,r]),a=s?Lr(s):[];return d.jsxs("section",{ref:i,className:"mt-3","aria-label":"Solve mistakes","aria-live":"polite",children:[d.jsx("p",{className:"mb-1",children:s?a.length?d.jsxs(d.Fragment,{children:[d.jsx("strong",{children:"Biggest mistake: "}),Te(a[0])]}):"No clear mistakes detected.":"Incomplete solve - mistakes could not be fully assessed."}),!n&&!!a.length&&d.jsx("ul",{children:a.map(l=>d.jsxs("li",{children:[d.jsx("strong",{children:Te(l)})," ",d.jsx(Ar,{placement:"top",container:i,overlay:d.jsx(Dr,{id:`replay-mistake-${We(l)}`,children:Cr[l.kind].rule}),children:d.jsx("button",{type:"button",className:"btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none","aria-label":`About ${Te(l)}`,children:"ⓘ"})})]},We(l)))})]})}function fs({cube:e,solve:t,history:r,close:n,change:i,remove:s,retry:a,retryDisabled:l=!1,precision:h=2}){const o=T.useRef(null),[c,u]=T.useState(0),[p,g]=T.useState(!1),[x,k]=T.useState(1),[w,A]=T.useState(!1),[O,P]=T.useState(""),ye=T.useMemo(()=>t.moves.map(m=>m.move),[t]),{cross:Q,ends:Y,cases:B,pairs:se}=T.useMemo(()=>ir(t,e),[t,e]),_=T.useMemo(()=>sr(e,Q,se[0]),[e,Q,se]),Oe=tr(o),$=()=>{o.current?.close(),n()};async function Xt(){if(window.confirm("Are you sure you want to delete this solve? This cannot be undone.")){A(!0),P("");try{await(s?s(t):hr(t.id)),$()}catch(m){P(m instanceof Error?m.message:"Unable to delete solve."),A(!1)}}}const Zt=T.useMemo(()=>{const m=mt(e,_);return ar.map((b,y)=>{const G=y?Y[y-1]??t.moves.length:0,er=y===6?t.moves.length:Y[y]??t.moves.length,Me=[];for(let N=G;N<er;N++){const ae=m(t.moves[N].move),Fe=ae.includes("2")?2:ae.endsWith("'")?-1:1,Se=Me.at(-1);Se?.notation===ae?(Se.end=N+1,Se.amount+=Fe):Me.push({notation:ae,start:N,end:N+1,amount:Fe})}const xe=B[y],be=y===6?"PLL":y===5?"OLL":"F2L";return{name:b.replace("Slot","Pair"),pair:y>0&&y<5?or(se[y-1],Q):"",case:B[y]?B[y]==="Solved"?"Solved":y===6?`${B[y]} perm`:`${y===5?"OLL":"F2L"} ${B[y]}`:"",caseUrl:xe&&xe!=="Solved"&&y>0?`https://speedcubedb.com/a/3x3/${be}/${be==="PLL"?"":`${be}_`}${encodeURIComponent(xe)}`:"",empty:y>Y.length?"Not reached":Y[y]===void 0?"No moves recorded":"Skipped",groups:Me.map(N=>({...N,move:N.notation[0]+["4","","2","'"][(N.amount%4+4)%4]}))}})},[Y,B,t,e,_,se,Q]);T.useEffect(()=>{if(!Oe||!p||c>=t.moves.length){g(!1);return}const m=c?t.moves[c-1].elapsed:0,b=Math.max(20,(t.moves[c].elapsed-m)/x),y=setTimeout(()=>u(G=>G+1),b);return()=>clearTimeout(y)},[p,c,x,t,Oe]);const Kt=t.moves.slice(0,c).map(m=>m.move).join(" "),Jt=e.facelets(e.parse(t.startFacelets).applyAlg(Kt));return d.jsxs("dialog",{ref:o,className:"panel replay-dialog","aria-label":"Solve replay",onCancel:m=>{m.preventDefault(),w||$()},children:[d.jsxs("div",{className:"replay-header",children:[d.jsxs("div",{className:"replay-summary",children:[d.jsxs("strong",{className:"replay-time","aria-label":"Solve time",children:[oe(pt(t),h),"s"]}),d.jsxs("span",{className:"d-inline-flex align-items-baseline gap-3 flex-wrap",children:[d.jsxs("span",{children:[lr(t)," turns"]}),d.jsxs("span",{className:"small text-secondary","aria-label":"Inspection time",children:["Inspection: ",t.inspection===void 0?"Not recorded":`${oe(t.inspection,h)}s`]})]})]}),d.jsxs("div",{className:"d-flex gap-2",children:[d.jsx("button",{className:"btn btn-outline-danger",disabled:w,onClick:Xt,children:w?"Deleting...":"Delete"}),a?d.jsx("button",{className:"btn btn-outline-primary",disabled:w||l,onClick:()=>{$(),a(t)},children:"Retry"}):d.jsx("a",{className:`btn btn-outline-primary${w?" disabled":""}`,"aria-disabled":w||void 0,tabIndex:w?-1:void 0,href:`/timer/?retry=${encodeURIComponent(t.id)}`,onClick:m=>{w?m.preventDefault():$()},children:"Retry"}),d.jsx("button",{autoFocus:!0,className:"btn btn-outline-secondary",disabled:w,onClick:$,children:"Close"})]})]}),O&&d.jsx("p",{className:"alert alert-danger",role:"alert",children:O}),d.jsx("p",{className:"scramble",children:cr(t.scramble).join(" ")}),d.jsx(os,{cube:e,facelets:Jt,moves:ye,position:c,speed:x,cross:Q,rotation:_}),d.jsxs("div",{className:"d-flex gap-2 align-items-center flex-wrap",children:[d.jsx("button",{className:"btn btn-primary",disabled:!t.moves.length,onClick:()=>{c>=t.moves.length&&u(0),g(!p)},children:p?"Pause":"Play"}),d.jsx("button",{className:"btn btn-outline-secondary",disabled:c===0,onClick:()=>{g(!1),u(m=>m-1)},children:"Previous move"}),d.jsx("button",{className:"btn btn-outline-secondary",disabled:c>=t.moves.length,onClick:()=>{g(!1),u(m=>m+1)},children:"Next move"}),d.jsx("select",{className:"form-select replay-speed","aria-label":"Replay speed",value:x,onChange:m=>k(Number(m.target.value)),children:[.25,.5,1,2,4].map(m=>d.jsxs("option",{value:m,children:[m,"x"]},m))}),d.jsxs("span",{children:[c,"/",t.moves.length," moves - ",oe(c?t.moves[c-1].elapsed:0,h),"s"]})]}),d.jsx("input",{className:"form-range mt-3",type:"range",min:0,max:t.moves.length,value:c,"aria-label":"Replay move",onChange:m=>{g(!1),u(Number(m.target.value))}}),d.jsx("div",{className:"move-timeline",role:"group","aria-label":"Solution steps",children:Zt.map(m=>d.jsxs("div",{role:"group","aria-label":`${m.name} solution`,className:"mb-2",children:[d.jsxs("div",{className:"d-flex align-items-baseline gap-2",children:[d.jsx("h3",{className:"replay-step-name",children:m.name}),m.case&&(m.caseUrl?d.jsx("a",{className:"badge text-bg-secondary","aria-label":`${m.name} case`,href:m.caseUrl,target:"_blank",rel:"noopener noreferrer",children:m.case}):d.jsx("span",{className:"badge text-bg-secondary","aria-label":`${m.name} case`,children:m.case})),m.pair&&d.jsx("span",{role:"img","aria-label":`${m.pair.replace("/"," / ")} pair`,title:m.pair.replace("/"," / "),children:Er(m.pair)})]}),m.name==="Cross"&&_&&d.jsx("span",{className:"move","aria-label":"Initial rotation",children:_}),m.groups.length?m.groups.map(b=>{const y=c===0?b.start===0:b.start<c&&c<=b.end;return d.jsx("button",{className:`move ${b.end<=c?"done":""} ${y?"current":""} ${y&&c>b.start&&c<b.end?"partial":""}`,title:`${oe(t.moves[b.end-1].elapsed,h)}s`,"aria-current":y?"step":void 0,"aria-label":`${b.move}, recorded moves ${b.start+1} to ${b.end}: ${t.moves.slice(b.start,b.end).map(G=>G.move).join(" ")}`,onClick:()=>{g(!1),u(b.end)},children:b.move},b.start)}):d.jsx("span",{className:"small text-secondary",children:m.empty})]},m.name))}),i&&d.jsxs("fieldset",{className:"mt-3",disabled:w||t.status!=="complete"&&t.dnfReason!=="manual",children:[d.jsx("legend",{className:"h6",children:"Manual penalties"}),d.jsxs("label",{className:"form-check",children:[d.jsx("input",{className:"form-check-input",type:"checkbox",checked:Ve(t).includes("manual"),onChange:m=>i(dr({...t},"manual",m.target.checked))}),d.jsx("span",{className:"form-check-label",children:"Manual +2"})]}),d.jsxs("label",{className:"form-check",children:[d.jsx("input",{className:"form-check-input",type:"checkbox",checked:t.dnfReason==="manual",onChange:m=>i({...t,status:m.target.checked?"incomplete":"complete",dnfReason:m.target.checked?"manual":void 0})}),d.jsx("span",{className:"form-check-label",children:"Manual DNF"})]})]}),t.status==="incomplete"&&d.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["DNF reason: ",ur(t)]}),!!t.penalty&&d.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["+",t.penalty/1e3," ",t.penalty===2e3?"reason":"reasons",": ",Ve(t).join(", ")]}),t.reason&&t.reason!=="Solve aborted by user."&&d.jsx("p",{className:"text-secondary small mt-2",children:t.reason}),d.jsxs("p",{className:"small text-secondary text-break mt-3 mb-0","aria-label":"Solve ID",children:["Solve ID: ",d.jsx("span",{className:"font-monospace",children:t.id})]}),d.jsx(cs,{cube:e,solve:t,history:r})]})}export{os as C,fs as R,cs as S,Fr as T,jr as a,E as b,gs as h};
