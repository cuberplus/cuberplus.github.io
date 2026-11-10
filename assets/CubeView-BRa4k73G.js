const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/main-BVcrw-Br.css"])))=>i.map(i=>d[i]);
import{r as F,j as Lt}from"./main-B-S_7umi.js";import{L as Ye,M as k,A as z,a as kt,b as At,p as _e,d as Dt,c as Ct,o as Et,T as se,f as ae,h as we,i as Pt,j as Nt,G as ie,C as xe,k as Rt,N as Ot,l as Te,s as O,m as q,n as Ft,P as ze}from"./cubing-core-CIxi9GK6.js";import{_ as Ge}from"./preload-helper-bFjQlsqE.js";import{c as jt,a as Vt,b as Bt}from"./chunk-UEUJSZTX-BeuSS03m.js";import{crossRotation as Ut}from"./puzzle-BID71MKA.js";import{c as qt}from"./cfop-dfez2HHw.js";import{l as Wt}from"./cubeLocations-DaISfJW4.js";var oe=class{#e=0;#t=0;queue(e){return new Promise(async(t,r)=>{try{const i=++this.#e,n=await e;i>this.#t&&(this.#t=i,t(n))}catch(i){r(i)}})}},Xe=0,Ze=class{canReuse(e,t){return e===t||this.canReuseValue(e,t)}canReuseValue(e,t){return!1}debugGetChildren(){return Array.from(this.#e.values())}#e=new Set;addChild(e){this.#e.add(e)}removeChild(e){this.#e.delete(e)}lastSourceGeneration=0;markStale(e){if(e.detail.generation!==Xe)throw new Error("A TwistyProp was marked stale too late!");if(this.lastSourceGeneration!==e.detail.generation){this.lastSourceGeneration=e.detail.generation;for(const t of this.#e)t.markStale(e);this.#r()}}#t=new Set;addRawListener(e,t){this.#t.add(e),t?.initial&&e()}removeRawListener(e){this.#t.delete(e)}#r(){this.#i||(this.#i=!0,setTimeout(()=>this.#s(),0))}#i=!1;#s(){if(!this.#i)throw new Error("Invalid dispatch state!");for(const e of this.#t)e();this.#i=!1}#n=new Map;addFreshListener(e){const t=new oe;let r=null;const i=async()=>{const n=await t.queue(this.get());r!==null&&this.canReuse(r,n)||(r=n,e(n))};this.#n.set(e,i),this.addRawListener(i,{initial:!0})}removeFreshListener(e){this.removeRawListener(this.#n.get(e)),this.#n.delete(e)}},P=class extends Ze{#e;constructor(e){super(),this.#e=new Ye(async()=>this.getDefaultValue()),e&&(this.#e=this.deriveFromPromiseOrValue(e,this.#e))}set(e){this.#e=this.deriveFromPromiseOrValue(e,this.#e);const t={sourceProp:this,value:this.#e,generation:++Xe};this.markStale(new CustomEvent("stale",{detail:t}))}async get(){return this.#e}async deriveFromPromiseOrValue(e,t){return this.derive(await e,t)}},p=class extends P{derive(e){return e}},H=Symbol("no value"),v=class extends Ze{constructor(e,t){super(),this.userVisibleErrorTracker=t,this.#e=e;for(const r of Object.values(e))r.addChild(this)}userVisibleErrorTracker;#e;#t=null;#r=null;async get(){const e=this.lastSourceGeneration;if(this.#r?.generation===e)return this.#r.output;const t={generation:e,output:this.#s(this.#i(),e,this.#t)};return this.#r=t,this.userVisibleErrorTracker?.reset(),t.output}async#i(){const e={};for(const[r,i]of Object.entries(this.#e))e[r]=i.get();const t={};for(const r in this.#e)t[r]=await e[r];return t}async#s(e,t,r=null){const i=await e,n=a=>(this.#t={inputs:i,output:Promise.resolve(a),generation:t},a);if(!r)return n(await this.derive(i));const s=r.inputs;for(const a in this.#e)if(!this.#e[a].canReuse(i[a],s[a]))return n(await this.derive(i));return r.output}},G=class{#e=[];addListener(e,t){let r=!1;const i=n=>{r||t(n)};e.addFreshListener(i),this.#e.push(()=>{e.removeFreshListener(i),r=!0})}addMultiListener3(e,t){this.addMultiListener(e,t)}addMultiListener(e,t){let r=!1,i=e.length-1;const n=async s=>{if(i>0){i--;return}if(r)return;const a=e.map(c=>c.get()),l=await Promise.all(a);t(l)};for(const s of e)s.addFreshListener(n);this.#e.push(()=>{for(const s of e)s.removeFreshListener(n);r=!0})}disconnect(){for(const e of this.#e)e()}},Ht=class{},Q;globalThis.HTMLElement?Q=globalThis.HTMLElement:Q=Ht;var Qt=class{define(){}},T;globalThis.customElements?T=globalThis.customElements:T=new Qt;var b,Yt=class{replaceSync(){}};globalThis.CSSStyleSheet?b=globalThis.CSSStyleSheet:b=Yt;var I=class extends Q{shadow;contentWrapper;constructor(e){super(),this.shadow=this.attachShadow({mode:e?.mode??"closed"}),this.contentWrapper=document.createElement("div"),this.contentWrapper.classList.add("wrapper"),this.shadow.appendChild(this.contentWrapper)}addCSS(e){this.shadow.adoptedStyleSheets.push(e)}removeCSS(e){const t=this.shadow.adoptedStyleSheets.indexOf(e);typeof t<"u"&&this.shadow.adoptedStyleSheets.splice(t,t+1)}addElement(e){return this.contentWrapper.appendChild(e)}prependElement(e){this.contentWrapper.prepend(e)}removeElement(e){return this.contentWrapper.removeChild(e)}};T.define("twisty-managed-custom-element",I);var B=class{constructor(e){this.callback=e}callback;animFrameID=null;animFrame=this.animFrameWrapper.bind(this);requestIsPending(){return!!this.animFrameID}requestAnimFrame(){this.animFrameID||(this.animFrameID=requestAnimationFrame(this.animFrame))}cancelAnimFrame(){this.animFrameID&&(cancelAnimationFrame(this.animFrameID),this.animFrameID=0)}animFrameWrapper(e){this.animFrameID=0,this.callback(e)}},_t={floating:!0,none:!0},Gt=class extends p{getDefaultValue(){return"auto"}},Xt=Math.PI*2,Y=360/Xt,A=new Ye(()=>Ge(()=>import("./twisty-dynamic-3d-4BEQ76PB-Bsq5bxW6.js"),__vite__mapDeps([0])));function he(){return devicePixelRatio||1}var Se=.1,Zt=class extends EventTarget{constructor(e){super(),this.target=e}target;#e=new Map;start(){this.addTargetListener("pointerdown",this.onPointerDown.bind(this)),this.addTargetListener("contextmenu",e=>{e.preventDefault()}),this.addTargetListener("touchmove",e=>e.preventDefault()),this.addTargetListener("dblclick",e=>e.preventDefault())}stop(){for(const[e,t]of this.#t.entries())this.target.removeEventListener(e,t);this.#t.clear(),this.#r=!1}#t=new Map;addTargetListener(e,t){this.#t.has(e)||(this.target.addEventListener(e,t),this.#t.set(e,t))}#r=!1;#i(){this.#r||(this.addTargetListener("pointermove",this.onPointerMove.bind(this)),this.addTargetListener("pointerup",this.onPointerUp.bind(this)),this.#r=!0)}#s(e){this.#e.delete(e.pointerId)}#n(e){const t=this.#e.get(e.pointerId);if(!t)return{movementInfo:null,hasMoved:!1};let r;return(e.movementX??0)!==0||(e.movementY??0)!==0?r={attachedInfo:t.attachedInfo,movementX:e.movementX,movementY:e.movementY,elapsedMs:e.timeStamp-t.lastTimeStamp}:r={attachedInfo:t.attachedInfo,movementX:e.clientX-t.lastClientX,movementY:e.clientY-t.lastClientY,elapsedMs:e.timeStamp-t.lastTimeStamp},t.lastClientX=e.clientX,t.lastClientY=e.clientY,t.lastTimeStamp=e.timeStamp,Math.abs(r.movementX)<Se&&Math.abs(r.movementY)<Se?{movementInfo:null,hasMoved:t.hasMoved}:(t.hasMoved=!0,{movementInfo:r,hasMoved:t.hasMoved})}onPointerDown(e){this.#i();const t={attachedInfo:{},hasMoved:!1,lastClientX:e.clientX,lastClientY:e.clientY,lastTimeStamp:e.timeStamp};this.#e.set(e.pointerId,t),this.target.setPointerCapture(e.pointerId)}onPointerMove(e){const t=this.#n(e).movementInfo;t&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("move",{detail:t})))}onPointerUp(e){const t=this.#n(e),r=this.#e.get(e.pointerId);this.#s(e),this.target.releasePointerCapture(e.pointerId);let i;if(t.hasMoved)i=new CustomEvent("up",{detail:{attachedInfo:r.attachedInfo}});else{const{altKey:n,ctrlKey:s,metaKey:a,shiftKey:l}=e;i=new CustomEvent("press",{detail:{normalizedX:e.offsetX/this.target.offsetWidth*2-1,normalizedY:1-e.offsetY/this.target.offsetHeight*2,rightClick:!!(e.button&2),keys:{altKey:n,ctrlOrMetaKey:s||a,shiftKey:l}}})}this.dispatchEvent(i)}},W=[];async function $e(e,t,r,i){W.length===0&&W.push(ye());const n=await W[0];return n.setSize(e,t),n.render(r,i),n.domElement}async function $t(e,t,r,i,n){if(e===0||t===0)return;W.length===0&&W.push(ye());const s=await $e(e,t,i,n),a=r.getContext("2d");a.clearRect(0,0,r.width,r.height),a.drawImage(s,0,0)}var Jt="srgb-linear";async function ye(){const e=(await A).ThreeWebGLRenderer,t=new e({antialias:!0,alpha:!0});return t.outputColorSpace=Jt,t.setPixelRatio(he()),t}var Je=new b;Je.replaceSync(`
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
`);var Kt=!0,ce=500,er=50,tr=.75;function be(e){return(Math.exp(1-e)-(1-e))/(1-Math.E)+1}var rr=class{constructor(e,t,r,i){this.startTimestamp=e,this.momentumX=t,this.momentumY=r,this.callback=i,this.scheduler.requestAnimFrame(),this.lastTimestamp=e}startTimestamp;momentumX;momentumY;callback;scheduler=new B(this.render.bind(this));lastTimestamp;render(e){const t=(this.lastTimestamp-this.startTimestamp)/ce,r=Math.min(1,(e-this.startTimestamp)/ce);if(t===0&&r>er/ce)return;const i=be(r)-be(t);this.callback(this.momentumX*i*1e3,this.momentumY*i*1e3),r<1&&this.scheduler.requestAnimFrame(),this.lastTimestamp=e}},ir=class{constructor(e,t,r,i){this.model=e,this.mirror=t,this.canvas=r,this.dragTracker=i,this.dragTracker.addEventListener("move",this.onMove.bind(this)),this.dragTracker.addEventListener("up",this.onUp.bind(this))}model;mirror;canvas;dragTracker;experimentalInertia=Kt;onMovementBound=this.onMovement.bind(this);experimentalHasBeenMoved=!1;temperMovement(e){return Math.sign(e)*Math.log(Math.abs(e*10)+1)/6}onMove(e){e.detail.attachedInfo??={};const{temperedX:t,temperedY:r}=this.onMovement(e.detail.movementX,e.detail.movementY),i=e.detail.attachedInfo;i.lastTemperedX=t*10,i.lastTemperedY=r*10,i.timestamp=e.timeStamp}onMovement(e,t){const r=this.mirror?-1:1,i=Math.min(this.canvas.offsetWidth,this.canvas.offsetHeight),n=this.temperMovement(e/i),s=this.temperMovement(t/i*tr);return this.model.twistySceneModel.orbitCoordinatesRequest.set((async()=>{const a=await this.model.twistySceneModel.orbitCoordinates.get();return{latitude:a.latitude+2*s*Y*r,longitude:a.longitude-2*n*Y}})()),{temperedX:n,temperedY:s}}onUp(e){e.preventDefault(),"lastTemperedX"in e.detail.attachedInfo&&"lastTemperedY"in e.detail.attachedInfo&&"timestamp"in e.detail.attachedInfo&&e.timeStamp-e.detail.attachedInfo.timestamp<60&&new rr(e.timeStamp,e.detail.attachedInfo.lastTemperedX,e.detail.attachedInfo.lastTemperedY,this.onMovementBound)}};async function Ke(e,t,r=!1){const i=new(await A).ThreeSpherical(t.distance,(90-(r?-1:1)*t.latitude)/Y,((r?180:0)+t.longitude)/Y);i.makeSafe(),e.position.setFromSpherical(i),e.lookAt(0,0,0)}var Ie=0,nr=2,et=!1;function sr(){return Ie<nr?(Ie++,!1):(et=!0,!0)}function bn(){return et}var me=class extends I{constructor(e,t,r){super(),this.model=e,this.options=r,this.scene=t??null,this.loadingElement=this.addElement(document.createElement("div")),this.loadingElement.classList.add("loading")}model;options;scene=null;stats=null;rendererIsShared=sr();loadingElement=null;async connectedCallback(){this.addCSS(Je),this.addElement((await this.canvasInfo()).canvas),this.#s(),new ResizeObserver(this.#s.bind(this)).observe(this.contentWrapper),this.orbitControls(),this.#e(),this.scheduleRender()}async#e(){(await this.#l()).addEventListener("press",(async t=>{await this.model.twistySceneModel.movePressInput.get()==="basic"&&this.dispatchEvent(new CustomEvent("press",{detail:{pressInfo:t.detail,cameraPromise:this.camera()}}))}))}#t=new oe;async clearCanvas(){if(this.rendererIsShared){const e=await this.canvasInfo();e.context.clearRect(0,0,e.canvas.width,e.canvas.height)}else{const t=(await this.renderer()).getContext();t.clear(t.COLOR_BUFFER_BIT)}}#r=0;#i=0;async#s(){const e=await this.#t.queue(this.camera()),t=this.contentWrapper.clientWidth,r=this.contentWrapper.clientHeight;this.#r=t,this.#i=r;const i=0;let n=0,s=0;if(r>t&&(s=r-t,n=-Math.floor(.5*s)),e.aspect=t/r,e.setViewOffset(t,r-s,i,n,t,r),e.updateProjectionMatrix(),this.clearCanvas(),this.rendererIsShared){const a=await this.canvasInfo();a.canvas.width=t*he(),a.canvas.height=r*he(),a.canvas.style.width=`${t.toString()}px`,a.canvas.style.height=`${r.toString()}px`}else(await this.renderer()).setSize(t,r,!0);this.scheduleRender()}#n=null;async renderer(){if(this.rendererIsShared)throw new Error("renderer expected to be shared.");return this.#n??=ye()}#a=null;async canvasInfo(){return this.#a??=(async()=>{let e;if(this.rendererIsShared)e=this.addElement(document.createElement("canvas"));else{const r=await this.renderer();e=this.addElement(r.domElement)}this.loadingElement?.remove();const t=e.getContext("2d");return{canvas:e,context:t}})()}#o=null;async#l(){return this.#o??=(async()=>{const e=new Zt((await this.canvasInfo()).canvas);return this.model?.twistySceneModel.dragInput.addFreshListener(t=>{let r=!1;switch(t){case"auto":{e.start(),r=!0;break}case"none":{e.stop();break}}this.contentWrapper.classList.toggle("drag-input-enabled",r)}),e})()}#d=null;async camera(){return this.#d??=(async()=>{const e=new(await A).ThreePerspectiveCamera(20,1,.1,20);return e.position.copy(new(await A).ThreeVector3(2,4,4).multiplyScalar(this.options?.backView?-1:1)),e.lookAt(0,0,0),e})()}#u=null;async orbitControls(){return this.#u??=(async()=>{const e=new ir(this.model,!!this.options?.backView,(await this.canvasInfo()).canvas,await this.#l());return this.model&&this.addListener(this.model.twistySceneModel.orbitCoordinates,async t=>{const r=await this.camera();Ke(r,t,this.options?.backView),this.scheduleRender()}),e})()}addListener(e,t){e.addFreshListener(t),this.#c.push(()=>{e.removeFreshListener(t)})}#c=[];disconnect(){for(const e of this.#c)e();this.#c=[]}#h=null;experimentalNextRenderFinishedCallback(e){this.#h=e}async render(){if(!this.scene)throw new Error("Attempted to render without a scene");this.stats?.begin();const[e,t,r]=await Promise.all([this.scene.scene(),this.camera(),this.canvasInfo()]);this.rendererIsShared?await $t(this.#r,this.#i,r.canvas,e,t):(await this.renderer()).render(e,t),this.stats?.end(),this.#h?.(),this.#h=null}#m=new B(this.render.bind(this));scheduleRender(){this.#m.requestAnimFrame()}};T.define("twisty-3d-vantage",me);function R(e){switch(Math.abs(e)){case 0:return 0;case 1:return 1e3;case 2:return 1500;default:return 2e3}}var tt=class extends se{constructor(e=R){super(),this.durationForAmount=e}durationForAmount;traverseAlg(e){let t=0;for(const r of e.childAlgNodes())t+=this.traverseAlgNode(r);return t}traverseGrouping(e){return e.amount*this.traverseAlg(e.alg)}traverseMove(e){return this.durationForAmount(e.amount)}traverseCommutator(e){return 2*(this.traverseAlg(e.A)+this.traverseAlg(e.B))}traverseConjugate(e){return 2*this.traverseAlg(e.A)+this.traverseAlg(e.B)}traversePause(e){return this.durationForAmount(1)}traverseNewline(e){return this.durationForAmount(1)}traverseLineComment(e){return this.durationForAmount(0)}},ar=class{constructor(e,t){this.kpuzzle=e,this.moves=new z(t.experimentalExpand())}kpuzzle;moves;durationFn=new tt(R);getAnimLeaf(e){return Array.from(this.moves.childAlgNodes())[e]}indexToMoveStartTimestamp(e){const t=new z(Array.from(this.moves.childAlgNodes()).slice(0,e));return this.durationFn.traverseAlg(t)}timestampToIndex(e){let t=0,r;for(r=0;r<this.numAnimatedLeaves();r++)if(t+=this.durationFn.traverseMove(this.getAnimLeaf(r)),t>=e)return r;return r}patternAtIndex(e){return this.kpuzzle.defaultPattern().applyTransformation(this.transformationAtIndex(e))}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of Array.from(this.moves.childAlgNodes()).slice(0,e))t=t.applyMove(r);return t}algDuration(){return this.durationFn.traverseAlg(this.moves)}numAnimatedLeaves(){return Vt(this.moves)}moveDuration(e){return this.durationFn.traverseMove(this.getAnimLeaf(e))}},N=class{constructor(e,t,r,i,n=[]){this.moveCount=e,this.duration=t,this.forward=r,this.backward=i,this.children=n}moveCount;duration;forward;backward;children},or=class extends se{constructor(e){super(),this.kpuzzle=e,this.identity=e.identityTransformation(),this.dummyLeaf=new N(0,0,this.identity,this.identity,[])}kpuzzle;identity;dummyLeaf;durationFn=new tt(R);cache={};traverseAlg(e){let t=0,r=0,i=this.identity;const n=[];for(const s of e.childAlgNodes()){const a=this.traverseAlgNode(s);t+=a.moveCount,r+=a.duration,i===this.identity?i=a.forward:i=i.applyTransformation(a.forward),n.push(a)}return new N(t,r,i,i.invert(),n)}traverseGrouping(e){const t=this.traverseAlg(e.alg);return this.mult(t,e.amount,[t])}traverseMove(e){const t=e.toString();let r=this.cache[t];if(r)return r;const i=this.kpuzzle.moveToTransformation(e);return r=new N(1,this.durationFn.traverseAlgNode(e),i,i.invert()),this.cache[t]=r,r}traverseCommutator(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),i=t.forward.applyTransformation(r.forward),n=t.backward.applyTransformation(r.backward),s=i.applyTransformation(n),a=new N(2*(t.moveCount+r.moveCount),2*(t.duration+r.duration),s,s.invert(),[t,r]);return this.mult(a,1,[a,t,r])}traverseConjugate(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),n=t.forward.applyTransformation(r.forward).applyTransformation(t.backward),s=new N(2*t.moveCount+r.moveCount,2*t.duration+r.duration,n,n.invert(),[t,r]);return this.mult(s,1,[s,t,r])}traversePause(e){return e.experimentalNISSGrouping?this.dummyLeaf:new N(1,this.durationFn.traverseAlgNode(e),this.identity,this.identity)}traverseNewline(e){return this.dummyLeaf}traverseLineComment(e){return this.dummyLeaf}mult(e,t,r){const i=Math.abs(t),n=e.forward.selfMultiply(t);return new N(e.moveCount*i,e.duration*i,n,n.invert(),r)}},M=class{constructor(e,t){this.apd=e,this.back=t}apd;back},lr=class extends we{constructor(e,t,r){super(),this.kpuzzle=e,this.algOrAlgNode=t,this.apd=r,this.i=-1,this.dur=-1,this.goalIndex=-1,this.goalDuration=-1,this.move=void 0,this.back=!1,this.moveDuration=0,this.st=this.kpuzzle.identityTransformation(),this.root=new M(this.apd,!1)}kpuzzle;algOrAlgNode;apd;move;moveDuration;back;st;root;i;dur;goalIndex;goalDuration;moveByIndex(e){return this.i>=0&&this.i===e?this.move!==void 0:this.dosearch(e,1/0)}moveByDuration(e){return this.dur>=0&&this.dur<e&&this.dur+this.moveDuration>=e?this.move!==void 0:this.dosearch(1/0,e)}dosearch(e,t){return this.goalIndex=e,this.goalDuration=t,this.i=0,this.dur=0,this.move=void 0,this.moveDuration=0,this.back=!1,this.st=this.kpuzzle.identityTransformation(),this.algOrAlgNode.is(z)?this.traverseAlg(this.algOrAlgNode,this.root):this.traverseAlgNode(this.algOrAlgNode,this.root)}traverseAlg(e,t){if(!this.firstcheck(t))return!1;let r=t.back?e.experimentalNumChildAlgNodes()-1:0;for(const i of Pt(e.childAlgNodes(),t.back?-1:1)){if(this.traverseAlgNode(i,new M(t.apd.children[r],t.back)))return!0;r+=t.back?-1:1}return!1}traverseGrouping(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,e.amount);return this.traverseAlg(e.alg,new M(t.apd.children[0],r))}traverseMove(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseCommutator(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.B,new M(t.apd.children[2],!r))||this.traverseAlg(e.A,new M(t.apd.children[1],!r))||this.traverseAlg(e.B,new M(t.apd.children[2],r))||this.traverseAlg(e.A,new M(t.apd.children[1],r)):this.traverseAlg(e.A,new M(t.apd.children[1],r))||this.traverseAlg(e.B,new M(t.apd.children[2],r))||this.traverseAlg(e.A,new M(t.apd.children[1],!r))||this.traverseAlg(e.B,new M(t.apd.children[2],!r))}traverseConjugate(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.A,new M(t.apd.children[1],!r))||this.traverseAlg(e.B,new M(t.apd.children[2],r))||this.traverseAlg(e.A,new M(t.apd.children[1],r)):this.traverseAlg(e.A,new M(t.apd.children[1],r))||this.traverseAlg(e.B,new M(t.apd.children[2],r))||this.traverseAlg(e.A,new M(t.apd.children[1],!r))}traversePause(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseNewline(e,t){return!1}traverseLineComment(e,t){return!1}firstcheck(e){return e.apd.moveCount+this.i<=this.goalIndex&&e.apd.duration+this.dur<this.goalDuration?this.keepgoing(e):!0}domult(e,t){let r=e.back;if(t===0)return r;t<0&&(r=!r,t=-t);const i=e.apd.children[0],n=Math.min(Math.floor((this.goalIndex-this.i)/i.moveCount),Math.ceil((this.goalDuration-this.dur)/i.duration-1));return n>0&&this.keepgoing(new M(i,r),n),r}keepgoing(e,t=1){return this.i+=t*e.apd.moveCount,this.dur+=t*e.apd.duration,t!==1?e.back?this.st=this.st.applyTransformation(e.apd.backward.selfMultiply(t)):this.st=this.st.applyTransformation(e.apd.forward.selfMultiply(t)):e.back?this.st=this.st.applyTransformation(e.apd.backward):this.st=this.st.applyTransformation(e.apd.forward),!1}},cr=16;function dr(e,t){const r=new Te,i=new Te;for(const n of e.childAlgNodes())i.push(n),i.experimentalNumAlgNodes()>=t&&(r.push(new ie(i.toAlg())),i.reset());return r.push(new ie(i.toAlg())),r.toAlg()}var ur=class extends se{traverseAlg(e){const t=e.experimentalNumChildAlgNodes();return t<cr?e:dr(e,Math.ceil(Math.sqrt(t)))}traverseGrouping(e){return new ie(this.traverseAlg(e.alg),e.amount)}traverseMove(e){return e}traverseCommutator(e){return new xe(this.traverseAlg(e.A),this.traverseAlg(e.B))}traverseConjugate(e){return new xe(this.traverseAlg(e.A),this.traverseAlg(e.B))}traversePause(e){return e}traverseNewline(e){return e}traverseLineComment(e){return e}},hr=ae(ur),Le=class{constructor(e,t){this.kpuzzle=e;const r=new or(this.kpuzzle),i=hr(t);this.decoration=r.traverseAlg(i),this.walker=new lr(this.kpuzzle,i,this.decoration)}kpuzzle;decoration;walker;getAnimLeaf(e){if(this.walker.moveByIndex(e)){if(!this.walker.move)throw new Error("`this.walker.mv` missing");const t=this.walker.move;return this.walker.back?t.invert():t}return null}indexToMoveStartTimestamp(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}indexToMovesInProgress(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}patternAtIndex(e,t){return this.walker.moveByIndex(e),(t??this.kpuzzle.defaultPattern()).applyTransformation(this.walker.st)}transformationAtIndex(e){return this.walker.moveByIndex(e),this.walker.st}numAnimatedLeaves(){return this.decoration.moveCount}timestampToIndex(e){return this.walker.moveByDuration(e),this.walker.i}algDuration(){return this.decoration.duration}moveDuration(e){return this.walker.moveByIndex(e),this.walker.moveDuration}},mr=class extends p{getDefaultValue(){return"auto"}},$="http://www.w3.org/2000/svg",ke="data-copy-id",Ae=0;function pr(){return Ae+=1,`svg${Ae.toString()}`}var gr={dim:{white:"#dddddd",orange:"#884400",limegreen:"#008800",red:"#660000","rgb(34, 102, 255)":"#000088",yellow:"#888800","rgb(102, 0, 153)":"rgb(50, 0, 76)",purple:"#3f003f"},oriented:"#44ddcc",ignored:"#555555",invisible:"#00000000"},fr=class{constructor(e,t,r,i=!1){if(this.kpuzzle=e,this.showUnknownOrientations=i,!t)throw new Error(`No SVG definition for puzzle type: ${e.name()}`);this.svgID=pr(),this.wrapperElement=document.createElement("div"),this.wrapperElement.classList.add("svg-wrapper"),this.wrapperElement.innerHTML=t;const n=this.wrapperElement.querySelector("svg");if(!n)throw new Error("Could not get SVG element");if(this.svgElement=n,$!==n.namespaceURI)throw new Error("Unexpected XML namespace");n.style.maxWidth="100%",n.style.maxHeight="100%",this.gradientDefs=document.createElementNS($,"defs"),n.insertBefore(this.gradientDefs,n.firstChild);for(const s of e.definition.orbits)for(let a=0;a<s.numPieces;a++)for(let l=0;l<s.numOrientations;l++){const c=this.elementID(s.orbitName,a,l),o=this.elementByID(c);let h=o?.style.fill;r?(()=>{const d=r.orbits;if(!d)return;const y=d[s.orbitName];if(!y)return;const w=y.pieces[a];if(!w)return;const x=w.facelets[l];if(!x)return;const D=typeof x=="string"?x:x?.mask,f=gr[D];typeof f=="string"?h=f:f&&(h=f[h])})():h=o?.style.fill,this.originalColors[c]=h,this.gradients[c]=this.newGradient(c,h),this.gradientDefs.appendChild(this.gradients[c]),o?.setAttribute("style",`fill: url(#grad-${this.svgID}-${c})`)}for(const s of Array.from(n.querySelectorAll(`[${ke}]`))){const a=s.getAttribute(ke);s.setAttribute("style",`fill: url(#grad-${this.svgID}-${a})`)}this.showUnknownOrientations&&this.drawPattern(this.kpuzzle.defaultPattern())}kpuzzle;showUnknownOrientations;wrapperElement;svgElement;gradientDefs;originalColors={};gradients={};svgID;drawPattern(e,t,r){this.draw(e,t,r)}draw(e,t,r){const i=t?.experimentalToTransformation();if(!e)throw new Error("Distinguishable pieces are not handled for SVG yet!");for(const n of e.kpuzzle.definition.orbits){const s=e.patternData[n.orbitName],a=i?i.transformationData[n.orbitName]:null;for(let l=0;l<n.numPieces;l++)for(let c=0;c<n.numOrientations;c++){const o=this.elementID(n.orbitName,l,c),h=this.elementID(n.orbitName,s.pieces[l],(n.numOrientations-s.orientation[l]+c)%n.numOrientations);let d=!1;if(a){const y=this.elementID(n.orbitName,a.permutation[l],(n.numOrientations-a.orientationDelta[l]+c)%n.numOrientations);h===y&&(d=!0),r=r||0;const w=100*(1-r*r*(2-r*r));this.gradients[o].children[0].setAttribute("stop-color",this.originalColors[h]),this.gradients[o].children[0].setAttribute("offset",`${Math.max(w-5,0)}%`),this.gradients[o].children[1].setAttribute("offset",`${Math.max(w-5,0)}%`),this.gradients[o].children[2].setAttribute("offset",`${w}%`),this.gradients[o].children[3].setAttribute("offset",`${w}%`),this.gradients[o].children[3].setAttribute("stop-color",this.originalColors[y])}else d=!0;d&&(this.showUnknownOrientations&&s.orientationMod?.[l]===1?(this.gradients[o].children[0].setAttribute("stop-color","#000"),this.gradients[o].children[0].setAttribute("offset","5%"),this.gradients[o].children[1].setAttribute("offset","5%"),this.gradients[o].children[2].setAttribute("offset","20%"),this.gradients[o].children[3].setAttribute("offset","20%"),this.gradients[o].children[3].setAttribute("stop-color",this.originalColors[h])):(this.gradients[o].children[0].setAttribute("stop-color",this.originalColors[h]),this.gradients[o].children[0].setAttribute("offset","100%"),this.gradients[o].children[1].setAttribute("offset","100%"),this.gradients[o].children[2].setAttribute("offset","100%"),this.gradients[o].children[3].setAttribute("offset","100%")))}}}newGradient(e,t){const r=document.createElementNS($,"radialGradient");r.setAttribute("id",`grad-${this.svgID}-${e}`),r.setAttribute("r","70.7107%");const i=[{offset:0,color:t},{offset:0,color:"black"},{offset:0,color:"black"},{offset:0,color:t}];for(const n of i){const s=document.createElementNS($,"stop");s.setAttribute("offset",`${n.offset}%`),s.setAttribute("stop-color",n.color),s.setAttribute("stop-opacity","1"),r.appendChild(s)}return r}elementID(e,t,r){return`${e}-l${t}-o${r}`}elementByID(e){return this.wrapperElement.querySelector(`#${e}`)}},X=class{constructor(e,t,r){this.elem=e,this.prefix=t,this.validSuffixes=r}elem;prefix;validSuffixes;#e=null;clearValue(){this.#e&&this.elem.contentWrapper.classList.remove(this.#e),this.#e=null}setValue(e){if(!this.validSuffixes.includes(e))throw new Error(`Invalid suffix: ${e}`);const t=`${this.prefix}${e}`,r=this.#e!==t;return r&&(this.clearValue(),this.elem.contentWrapper.classList.add(t),this.#e=t),r}};function pe(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0}function De(e,t,r){if(e===t)return!0;if(e.length!==t.length)return!1;for(let i=0;i<e.length;i++)if(!r(e[i],t[i]))return!1;return!0}function ge(e,t,r){return Et(e,r-t,t)}var vr=class{constructor(e){this.model=e,e.tempoScale.addFreshListener(t=>{this.tempoScale=t})}model;catchingUp=!1;pendingFrame=!1;tempoScale=1;scheduler=new B(this.animFrame.bind(this));start(){this.catchingUp||(this.lastTimestamp=performance.now()),this.catchingUp=!0,this.pendingFrame=!0,this.scheduler.requestAnimFrame()}stop(){this.catchingUp=!1,this.scheduler.cancelAnimFrame()}catchUpMs=500;lastTimestamp=0;animFrame(e){this.scheduler.requestAnimFrame();const t=this.tempoScale*(e-this.lastTimestamp)/this.catchUpMs;this.lastTimestamp=e,this.model.catchUpMove.set((async()=>{const r=await this.model.catchUpMove.get();if(r.move===null)return r;const i=r.amount+t;return i>=1?(this.pendingFrame=!0,this.stop(),this.model.timestampRequest.set("end"),{move:null,amount:0}):(this.pendingFrame=!1,{move:r.move,amount:i})})())}},wr=class{constructor(e,t){this.delegate=t,this.model=e,this.lastTimestampPromise=this.#e(),this.model.playingInfo.addFreshListener(this.onPlayingProp.bind(this)),this.catchUpHelper=new vr(this.model),this.model.catchUpMove.addFreshListener(this.onCatchUpMoveProp.bind(this))}delegate;playing=!1;direction=1;catchUpHelper;model;lastDatestamp=0;lastTimestampPromise;scheduler=new B(this.animFrame.bind(this));async onPlayingProp(e){e.playing!==this.playing&&(e.playing?this.play(e):this.pause())}async onCatchUpMoveProp(e){const t=e.move!==null;t!==this.catchUpHelper.catchingUp&&(t?this.catchUpHelper.start():this.catchUpHelper.stop()),this.scheduler.requestAnimFrame()}async#e(){return(await this.model.detailedTimelineInfo.get()).timestamp}jumpToStart(e){this.model.timestampRequest.set("start"),this.pause(),e?.flash&&this.delegate.flash()}jumpToEnd(e){this.model.timestampRequest.set("end"),this.pause(),e?.flash&&this.delegate.flash()}playPause(){this.playing?this.pause():this.play()}play(e){(async()=>{const t=e?.direction??1,r=await this.model.coarseTimelineInfo.get();(e?.autoSkipToOtherEndIfStartingAtBoundary??!0)&&(t===1&&r.atEnd&&(this.model.timestampRequest.set("start"),this.delegate.flash()),t===-1&&r.atStart&&(this.model.timestampRequest.set("end"),this.delegate.flash())),this.model.playingInfo.set({playing:!0,direction:t,untilBoundary:e?.untilBoundary??"entire-timeline",loop:e?.loop??!1}),this.playing=!0,this.lastDatestamp=performance.now(),this.lastTimestampPromise=this.#e(),this.scheduler.requestAnimFrame()})()}pause(){this.playing=!1,this.scheduler.cancelAnimFrame(),this.model.playingInfo.set({playing:!1,untilBoundary:"entire-timeline"})}#t=new oe;async animFrame(e){this.playing&&this.scheduler.requestAnimFrame();const t=this.lastDatestamp,r=await this.#t.queue(Promise.all([this.model.playingInfo.get(),this.lastTimestampPromise,this.model.timeRange.get(),this.model.tempoScale.get(),this.model.currentMoveInfo.get()])),[i,n,s,a,l]=r;if(!i.playing){this.playing=!1;return}let c=l.earliestEnd;(l.currentMoves.length===0||i.untilBoundary==="entire-timeline")&&(c=s.end);let o=l.latestStart;(l.currentMoves.length===0||i.untilBoundary==="entire-timeline")&&(o=s.start);let h=(e-t)*this.direction*a;h=Math.max(h,1),h*=i.direction;let d=n+h,y=null;d>=c?i.loop?d=ge(d,s.start,s.end):(d===s.end?y="end":d=c,this.playing=!1,this.model.playingInfo.set({playing:!1})):d<=o&&(i.loop?d=ge(d,s.start,s.end):(d===s.start?y="start":d=o,this.playing=!1,this.model.playingInfo.set({playing:!1}))),this.lastDatestamp=e,this.lastTimestampPromise=Promise.resolve(d),this.model.timestampRequest.set(y??d)}},yr=class{constructor(e,t){this.model=e,this.animationController=new wr(e,t)}model;animationController;jumpToStart(e){this.animationController.jumpToStart(e)}jumpToEnd(e){this.animationController.jumpToEnd(e)}togglePlay(e){typeof e>"u"&&this.animationController.playPause(),e?this.animationController.play():this.animationController.pause()}async visitTwizzleLink(){const e=document.createElement("a");e.href=await this.model.twizzleLink(),e.target="_blank",e.click()}},Mr={"bottom-row":!0,none:!0},xr=class extends p{getDefaultValue(){return"auto"}},Me=new b;Me.replaceSync(`
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
`);var rt=new b;rt.replaceSync(`
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
`);var it=class extends I{constructor(e,t,r,i,n){super(),this.model=e,this.kpuzzle=t,this.svgSource=r,this.options=i,this.puzzleLoader=n,this.addCSS(rt),this.resetSVG(),this.#t.addListener(this.model.puzzleID,s=>{n?.id!==s&&this.disconnect()}),this.#t.addListener(this.model.twistySceneModel.hintFacelet,s=>{this.setHintFacelet(s)}),this.#t.addListener(this.model.legacyPosition,this.onPositionChange.bind(this)),this.options?.experimentalStickeringMask&&this.experimentalSetStickeringMask(this.options.experimentalStickeringMask)}model;kpuzzle;svgSource;options;puzzleLoader;svgWrapper;scheduler=new B(this.render.bind(this));#e=null;#t=new G;disconnect(){this.#t.disconnect()}onPositionChange(e){try{if(e.movesInProgress.length>0){const t=e.movesInProgress[0].move;let r=t;e.movesInProgress[0].direction===-1&&(r=t.invert());const i=e.pattern.applyMove(r);this.svgWrapper?.draw(e.pattern,i,e.movesInProgress[0].fraction)}else this.svgWrapper?.draw(e.pattern),this.#e=e}catch(t){console.warn("Bad position (this doesn't necessarily mean something is wrong). Pre-emptively disconnecting:",this.puzzleLoader?.id,t),this.disconnect()}}scheduleRender(){this.scheduler.requestAnimFrame()}experimentalSetStickeringMask(e){this.resetSVG(e)}resetSVG(e){this.svgWrapper&&this.removeElement(this.svgWrapper.wrapperElement),this.kpuzzle&&(this.svgWrapper=new fr(this.kpuzzle,this.svgSource,e),this.addElement(this.svgWrapper.wrapperElement),this.#e&&this.onPositionChange(this.#e))}hintFaceletsClassListManager=new X(this,"hint-facelets-",Object.keys(_t));setHintFacelet(e){this.hintFaceletsClassListManager.setValue(e==="auto"?"floating":e)}render(){}};T.define("twisty-2d-puzzle",it);var Tr=class{constructor(e,t,r,i){this.model=e,this.schedulable=t,this.puzzleLoader=r,this.effectiveVisualization=i,this.twisty2DPuzzle(),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async n=>{(await this.twisty2DPuzzle()).experimentalSetStickeringMask(n)})}model;schedulable;puzzleLoader;effectiveVisualization;#e=new G;disconnect(){this.#e.disconnect()}scheduleRender(){}#t=null;async twisty2DPuzzle(){return this.#t??=(async()=>{const e=this.effectiveVisualization==="experimental-2D-LL-face"?this.puzzleLoader.llFaceSVG():this.effectiveVisualization==="experimental-2D-LL"?this.puzzleLoader.llSVG():this.puzzleLoader.svg();return new it(this.model,await this.puzzleLoader.kpuzzle(),await e,{},this.puzzleLoader)})()}},nt=class extends I{constructor(e,t){super(),this.model=e,this.effectiveVisualization=t}model;effectiveVisualization;#e=new G;disconnect(){this.#e.disconnect()}async connectedCallback(){this.addCSS(Me),this.model&&this.#e.addListener(this.model.twistyPlayerModel.puzzleLoader,this.onPuzzleLoader.bind(this))}#t;async scene(){return this.#t??=(async()=>new(await A).ThreeScene)()}scheduleRender(){this.#r?.scheduleRender()}#r;currentTwisty2DPuzzleWrapper(){return this.#r}async setCurrentTwisty2DPuzzleWrapper(e){const t=this.#r;this.#r=e,t?.disconnect();const r=e.twisty2DPuzzle();this.contentWrapper.textContent="",this.addElement(await r)}async onPuzzleLoader(e){this.#r?.disconnect();const t=new Tr(this.model.twistyPlayerModel,this,e,this.effectiveVisualization);this.setCurrentTwisty2DPuzzleWrapper(t)}};T.define("twisty-2d-scene-wrapper",nt);var st=class{#e;reject;promise;constructor(){this.promise=new Promise((e,t)=>{this.#e=e,this.reject=t})}handleNewValue(e){this.#e(e)}},at=class extends EventTarget{constructor(e,t,r,i){super(),this.model=e,this.schedulable=t,this.puzzleLoader=r,this.visualizationStrategy=i,this.twisty3DPuzzle(),this.#e.addListener(this.model.puzzleLoader,n=>{this.puzzleLoader.id!==n.id&&this.disconnect()}),this.#e.addListener(this.model.legacyPosition,async n=>{try{(await this.twisty3DPuzzle()).onPositionChange(n),this.scheduleRender()}catch{this.disconnect()}}),this.#e.addListener(this.model.twistySceneModel.hintFacelet,async n=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFacelets:n==="auto"?"floating":n}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.foundationDisplay,async n=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({showFoundation:n!=="none"}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async n=>{(await this.twisty3DPuzzle()).setStickeringMask(n),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.faceletScale,async n=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({faceletScale:n}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.hintFaceletsElevation,async n=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFaceletsElevation:n}),this.scheduleRender()}),this.#e.addMultiListener3([this.model.twistySceneModel.stickeringMask,this.model.twistySceneModel.foundationStickerSprite,this.model.twistySceneModel.hintStickerSprite],async n=>{"experimentalUpdateTexture"in await this.twisty3DPuzzle()&&((await this.twisty3DPuzzle()).experimentalUpdateTexture(n[0].specialBehaviour==="picture",n[1],n[2]),this.scheduleRender())})}model;schedulable;puzzleLoader;visualizationStrategy;#e=new G;disconnect(){this.#e.disconnect()}scheduleRender(){this.schedulable.scheduleRender(),this.dispatchEvent(new CustomEvent("render-scheduled"))}#t=null;async twisty3DPuzzle(){return this.#t??=(async()=>{if(this.puzzleLoader.id==="3x3x3"&&this.visualizationStrategy==="Cube3D"){const[e,t,r,i,n,s]=await Promise.all([this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.stickeringMask.get(),this.model.twistySceneModel.initialHintFaceletsAnimation.get(),this.model.twistySceneModel.faceletScale.get(),this.model.twistySceneModel.hintFaceletsElevation.get()]);return(await A).cube3DShim(()=>this.schedulable.scheduleRender(),{foundationSprite:e,hintSprite:t,experimentalStickeringMask:r,initialHintFaceletsAnimation:i,faceletScale:n,hintFaceletsElevation:s})}else{const[e,t,r,i]=await Promise.all([this.model.twistySceneModel.hintFacelet.get(),this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.faceletScale.get()]),n=(await A).pg3dShim(()=>this.schedulable.scheduleRender(),this.puzzleLoader,e==="auto"?"floating":e,i,this.puzzleLoader.id==="kilominx");return n.then(s=>s.experimentalUpdateTexture(!0,t??void 0,r??void 0)),n}})()}async raycastMove(e,t){const r=await this.twisty3DPuzzle();if(!("experimentalGetControlTargets"in r)){console.info("not PG3D! skipping raycast");return}const i=r.experimentalGetControlTargets(),[n,s]=await Promise.all([e,this.model.twistySceneModel.movePressCancelOptions.get()]),a=n.intersectObjects(i);if(a.length>0){const l=r.getClosestMoveToAxis(a[0].point,t);l?this.model.experimentalAddMove(l.move,{cancel:s}):console.info("Skipping move!")}}},fe=class extends I{constructor(e){super(),this.model=e}model;#e=new X(this,"back-view-",["auto","none","side-by-side","top-right"]);#t=new G;disconnect(){this.#t.disconnect()}async connectedCallback(){this.addCSS(Me);const e=new me(this.model,this);this.addVantage(e),this.model&&(this.#t.addMultiListener([this.model.puzzleLoader,this.model.visualizationStrategy],this.onPuzzle.bind(this)),this.#t.addListener(this.model.backView,this.setBackView.bind(this))),this.scheduleRender()}#r=null;setBackView(e){const t=["side-by-side","top-right"].includes(e),r=this.#r!==null;this.#e.setValue(e),t?r||(this.#r=new me(this.model,this,{backView:!0}),this.addVantage(this.#r),this.scheduleRender()):this.#r&&(this.removeVantage(this.#r),this.#r=null)}async onPress(e){const t=this.#n;if(!t){console.info("no wrapper; skipping scene wrapper press!");return}const r=(async()=>{const[i,{ThreeRaycaster:n,ThreeVector2:s}]=await Promise.all([e.detail.cameraPromise,(async()=>{const{ThreeRaycaster:c,ThreeVector2:o}=await A;return{ThreeRaycaster:c,ThreeVector2:o}})()]),a=new n,l=new s(e.detail.pressInfo.normalizedX,e.detail.pressInfo.normalizedY);return a.setFromCamera(l,i),a})();await t.raycastMove(r,{invert:!e.detail.pressInfo.rightClick,depth:e.detail.pressInfo.keys.ctrlOrMetaKey?"rotation":e.detail.pressInfo.keys.shiftKey?"secondSlice":"none"})}#i;async scene(){return this.#i??=(async()=>new(await A).ThreeScene)()}#s=new Set;addVantage(e){e.addEventListener("press",this.onPress.bind(this)),this.#s.add(e),this.contentWrapper.appendChild(e)}removeVantage(e){this.#s.delete(e),e.remove(),e.disconnect(),this.#n?.disconnect()}experimentalVantages(){return this.#s.values()}scheduleRender(){for(const e of this.#s)e.scheduleRender()}#n=null;async setCurrentTwisty3DPuzzleWrapper(e,t){const r=this.#n;try{this.#n=t,r?.disconnect(),e.add(await t.twisty3DPuzzle())}finally{r&&e.remove(await r.twisty3DPuzzle())}this.#a.handleNewValue(t)}#a=new st;async experimentalTwisty3DPuzzleWrapper(){return this.#n||this.#a.promise}#o=new oe;async onPuzzle(e){if(e[1]==="2D")return;this.#n?.disconnect();const[t,r]=await this.#o.queue(Promise.all([this.scene(),new at(this.model,this,e[0],e[1])]));this.setCurrentTwisty3DPuzzleWrapper(t,r)}};T.define("twisty-3d-scene-wrapper",fe);var E=typeof document>"u"?null:document,zr=E?.fullscreenEnabled||!!E?.webkitFullscreenEnabled;function Sr(){return document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen()}function Ce(){return document.fullscreenElement?document.fullscreenElement:document.webkitFullscreenElement??null}function br(e){return e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen()}var Ir=["skip-to-start","skip-to-end","step-forward","step-backward","pause","play","enter-fullscreen","exit-fullscreen","twizzle-tw"],Lr=class extends v{derive(e){return{fullscreen:{enabled:zr,icon:document.fullscreenElement===null?"enter-fullscreen":"exit-fullscreen",title:"Enter fullscreen"},"jump-to-start":{enabled:!e.coarseTimelineInfo.atStart,icon:"skip-to-start",title:"Restart"},"play-step-backwards":{enabled:!e.coarseTimelineInfo.atStart,icon:"step-backward",title:"Step backward"},"play-pause":{enabled:!(e.coarseTimelineInfo.atStart&&e.coarseTimelineInfo.atEnd),icon:e.coarseTimelineInfo.playing?"pause":"play",title:e.coarseTimelineInfo.playing?"Pause":"Play"},"play-step":{enabled:!e.coarseTimelineInfo.atEnd,icon:"step-forward",title:"Step forward"},"jump-to-end":{enabled:!e.coarseTimelineInfo.atEnd,icon:"skip-to-end",title:"Skip to End"},"twizzle-link":{enabled:!0,icon:"twizzle-tw",title:"View at Twizzle",hidden:e.viewerLink==="none"}}}},ot=new b;ot.replaceSync(`
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
`);var lt=new b;lt.replaceSync(`
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
`);var Ee={fullscreen:!0,"jump-to-start":!0,"play-step-backwards":!0,"play-pause":!0,"play-step":!0,"jump-to-end":!0,"twizzle-link":!0},ct=class extends I{constructor(e,t,r){super(),this.model=e,this.controller=t,this.defaultFullscreenElement=r}model;controller;defaultFullscreenElement;buttons=null;connectedCallback(){this.addCSS(ot);const e={};for(const t in Ee){const r=new dt;e[t]=r,r.htmlButton.addEventListener("click",()=>this.#e(t)),this.addElement(r)}this.buttons=e,this.model?.buttonAppearance.addFreshListener(this.update.bind(this)),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}#e(e){switch(e){case"fullscreen":{this.onFullscreenButton();break}case"jump-to-start":{this.controller?.jumpToStart({flash:!0});break}case"play-step-backwards":{this.controller?.animationController.play({direction:-1,untilBoundary:"move"});break}case"play-pause":{this.controller?.togglePlay();break}case"play-step":{this.controller?.animationController.play({direction:1,untilBoundary:"move"});break}case"jump-to-end":{this.controller?.jumpToEnd({flash:!0});break}case"twizzle-link":{this.controller?.visitTwizzleLink();break}default:throw new Error("Missing command")}}async onFullscreenButton(){if(!this.defaultFullscreenElement)throw new Error("Attempted to go fullscreen without an element.");if(Ce()===this.defaultFullscreenElement)Sr();else{this.buttons?.fullscreen.setIcon("exit-fullscreen"),br(await this.model?.twistySceneModel.fullscreenElement.get()??this.defaultFullscreenElement);const e=()=>{Ce()!==this.defaultFullscreenElement&&(this.buttons?.fullscreen.setIcon("enter-fullscreen"),globalThis.removeEventListener("fullscreenchange",e))};globalThis.addEventListener("fullscreenchange",e)}}async update(e){for(const t in Ee){const r=this.buttons[t],i=e[t];r.htmlButton.disabled=!i.enabled,r.htmlButton.title=i.title,r.setIcon(i.icon),r.hidden=!!i.hidden}}updateColorScheme(e){for(const t of Object.values(this.buttons??{}))t.updateColorScheme(e)}};T.define("twisty-buttons",ct);var dt=class extends I{htmlButton=document.createElement("button");updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}connectedCallback(){this.addCSS(lt),this.addElement(this.htmlButton)}#e=new X(this,"svg-",Ir);setIcon(e){this.#e.setValue(e)}};T.define("twisty-button",dt);var ut=new b;ut.replaceSync(`
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
`);E?.addEventListener("mousedown",e=>{e.which},!0);E?.addEventListener("mouseup",e=>{e.which},!0);E?.addEventListener("mousedown",()=>{},!1);E?.addEventListener("mousemove",ht,!1);E?.addEventListener("mouseenter",ht,!1);function ht(e){e.pageY}var mt=class extends I{constructor(e,t){super(),this.model=e,this.controller=t}model;controller;async onDetailedTimelineInfo(e){const t=await this.inputElem();t.min=e.timeRange.start.toString(),t.max=e.timeRange.end.toString(),t.disabled=t.min===t.max,t.value=e.timestamp.toString()}async connectedCallback(){this.addCSS(ut),this.addElement(await this.inputElem()),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}#e=null;async inputElem(){return this.#e??=(async()=>{const e=document.createElement("input");return e.type="range",e.disabled=!0,this.model?.detailedTimelineInfo.addFreshListener(this.onDetailedTimelineInfo.bind(this)),e.addEventListener("input",this.onInput.bind(this)),e.addEventListener("keydown",this.onKeypress.bind(this)),e})()}async onInput(e){const t=await this.inputElem();await this.slowDown(e,t);const r=parseInt(t.value,10);this.model?.playingInfo.set({playing:!1}),this.model?.timestampRequest.set(r)}onKeypress(e){switch(e.key){case"ArrowLeft":case"ArrowRight":{this.controller?.animationController.play({direction:e.key==="ArrowLeft"?-1:1,untilBoundary:"move"}),e.preventDefault();break}case" ":{this.controller?.togglePlay(),e.preventDefault();break}}}async slowDown(e,t){}};T.define("twisty-scrubber",mt);var kr=null;async function Pe(e,t){const[{ThreePerspectiveCamera:r,ThreeScene:i},n,s,a,l,c,o]=await Promise.all([(async()=>{const{ThreePerspectiveCamera:S,ThreeScene:L}=await A;return{ThreePerspectiveCamera:S,ThreeScene:L}})(),await e.puzzleLoader.get(),await e.visualizationStrategy.get(),await e.twistySceneModel.stickeringRequest.get(),await e.twistySceneModel.stickeringMaskRequest.get(),await e.legacyPosition.get(),await e.twistySceneModel.orbitCoordinates.get()]),h=t?.width??2048,d=t?.height??2048,y=h/d,w=kr??=await(async()=>new r(20,y,.1,20))(),x=new i,D=new at(e,{scheduleRender:()=>{}},n,s);x.add(await D.twisty3DPuzzle()),await Ke(w,o);const u=(await $e(h,d,x,w)).toDataURL(),g=await pt(e);return{dataURL:u,download:async S=>{gt(u,S??g)}}}async function pt(e){const[t,r]=await Promise.all([e.puzzleID.get(),e.alg.get()]);return`[${t}]${r.alg.experimentalNumChildAlgNodes()===0?"":` ${r.alg.toString()}`}`}function gt(e,t,r="png"){const i=document.createElement("a");i.href=e,i.download=`${t}.${r}`,i.click()}var ft=new b;ft.replaceSync(`
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
`);var Ne=class extends p{getDefaultValue(){return null}},ve=class extends P{getDefaultValue(){return null}derive(e){return typeof e=="string"?new URL(e,location.href):e}},_=class vt{warnings;errors;constructor(t){this.warnings=Object.freeze(t?.warnings??[]),this.errors=Object.freeze(t?.errors??[]),Object.freeze(this)}add(t){return new vt({warnings:this.warnings.concat(t?.warnings??[]),errors:this.errors.concat(t?.errors??[])})}log(){this.errors.length>0?console.error(`🚨 ${this.errors[0]}`):this.warnings.length>0?console.warn(`⚠️ ${this.warnings[0]}`):console.info("😎 No issues!")}};function wt(e){try{const t=z.fromString(e),r=[];return t.toString()!==e&&r.push("Alg is non-canonical!"),{alg:t,issues:new _({warnings:r})}}catch(t){return{alg:new z,issues:new _({errors:[`Malformed alg: ${t.toString()}`]})}}}function Ar(e,t){return e.alg.isIdentical(t.alg)&&pe(e.issues.warnings,t.issues.warnings)&&pe(e.issues.errors,t.issues.errors)}var Re=class extends P{getDefaultValue(){return{alg:new z,issues:new _}}canReuseValue(e,t){return Ar(e,t)}async derive(e){return typeof e=="string"?wt(e):{alg:e,issues:new _}}},Dr=class extends v{derive(e){return e.kpuzzle.algToTransformation(e.setupAlg.alg)}},Cr=class extends v{derive(e){if(e.setupTransformation)return e.setupTransformation;switch(e.setupAnchor){case"start":return e.setupAlgTransformation;case"end":{const r=e.indexer.transformationAtIndex(e.indexer.numAnimatedLeaves()).invert();return e.setupAlgTransformation.applyTransformation(r)}default:throw new Error("Unimplemented!")}}},Er=class extends p{getDefaultValue(){return null}},Pr=class extends p{getDefaultValue(){return{move:null,amount:0}}canReuseValue(e,t){return e.move===t.move&&e.amount===t.amount}},Nr=class extends v{derive(e){return{patternIndex:e.currentMoveInfo.patternIndex,movesFinishing:e.currentMoveInfo.movesFinishing.map(t=>t.move),movesFinished:e.currentMoveInfo.movesFinished.map(t=>t.move)}}canReuseValue(e,t){return e.patternIndex===t.patternIndex&&De(e.movesFinishing,t.movesFinishing,(r,i)=>r.isIdentical(i))&&De(e.movesFinished,t.movesFinished,(r,i)=>r.isIdentical(i))}},Rr=class extends v{derive(e){function t(r){return e.detailedTimelineInfo.atEnd&&e.catchUpMove.move!==null&&r.currentMoves.push({move:e.catchUpMove.move,direction:-1,fraction:1-e.catchUpMove.amount,startTimestamp:-1,endTimestamp:-1}),r}if(e.indexer.currentMoveInfo)return t(e.indexer.currentMoveInfo(e.detailedTimelineInfo.timestamp));{const r=e.indexer.timestampToIndex(e.detailedTimelineInfo.timestamp),i={patternIndex:r,currentMoves:[],movesFinishing:[],movesFinished:[],movesStarting:[],latestStart:-1/0,earliestEnd:1/0};if(e.indexer.numAnimatedLeaves()>0){const n=e.indexer.getAnimLeaf(r)?.as(k);if(!n)return t(i);const s=e.indexer.indexToMoveStartTimestamp(r),a=e.indexer.moveDuration(r),l=a?(e.detailedTimelineInfo.timestamp-s)/a:0,c=s+a,o={move:n,direction:1,fraction:l,startTimestamp:s,endTimestamp:c};l===0?i.movesStarting.push(o):l===1?i.movesFinishing.push(o):(i.currentMoves.push(o),i.latestStart=Math.max(i.latestStart,s),i.earliestEnd=Math.min(i.earliestEnd,c))}return t(i)}}},Or=class extends v{derive(e){let t=e.indexer.transformationAtIndex(e.currentLeavesSimplified.patternIndex);t=e.anchoredStart.applyTransformation(t);for(const r of e.currentLeavesSimplified.movesFinishing)t=t.applyMove(r);for(const r of e.currentLeavesSimplified.movesFinished)t=t.applyMove(r);return t.toKPattern()}},Oe={u:"y",l:"x",f:"z",r:"x",b:"z",d:"y",m:"x",e:"y",s:"z",x:"x",y:"y",z:"z"};function Fr(e,t){return Oe[e.family[0].toLowerCase()]===Oe[t.family[0].toLowerCase()]}var jr=class extends se{traverseAlg(e){const t=[];for(const r of e.childAlgNodes())t.push(this.traverseAlgNode(r));return Array.prototype.concat(...t)}traverseGroupingOnce(e){if(e.experimentalIsEmpty())return[];const t=[];for(const n of e.childAlgNodes()){if(!(n.is(k)||n.is(Rt)||n.is(Ot)))return this.traverseAlg(e);const s=n.as(k);s&&t.push(s)}let r=R(t[0].amount);for(let n=0;n<t.length-1;n++){for(let s=1;s<t.length;s++)if(!Fr(t[n],t[s]))return this.traverseAlg(e);r=Math.max(r,R(t[n].amount))}const i=t.map(n=>({animLeafAlgNode:n,msUntilNext:0,duration:r}));return i[i.length-1].msUntilNext=r,i}traverseGrouping(e){const t=[],r=e.amount>0?e.alg:e.alg.invert();for(let i=0;i<Math.abs(e.amount);i++)t.push(this.traverseGroupingOnce(r));return Array.prototype.concat(...t)}traverseMove(e){const t=R(e.amount);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseCommutator(e){const t=[],r=[e.A,e.B,e.A.invert(),e.B.invert()];for(const i of r)t.push(this.traverseGroupingOnce(i));return Array.prototype.concat(...t)}traverseConjugate(e){const t=[],r=[e.A,e.B,e.A.invert()];for(const i of r)t.push(this.traverseGroupingOnce(i));return Array.prototype.concat(...t)}traversePause(e){if(e.experimentalNISSGrouping)return[];const t=R(1);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseNewline(e){return[]}traverseLineComment(e){return[]}},Vr=ae(jr);function Br(e){let t=0;return Vr(e).map(i=>{const n={animLeaf:i.animLeafAlgNode,start:t,end:t+i.duration};return t+=i.msUntilNext,n})}var de=class{constructor(e,t,r){this.kpuzzle=e,this.animLeaves=r?.animationTimelineLeaves??Br(t)}kpuzzle;animLeaves;getAnimLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]?.animLeaf??null}getAnimationTimelineLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]}indexToMoveStartTimestamp(e){let t=0;return this.animLeaves.length>0&&(t=this.animLeaves[Math.min(e,this.animLeaves.length-1)].start),t}timestampToIndex(e){let t=0;for(t=0;t<this.animLeaves.length;t++)if(this.animLeaves[t].start>=e)return Math.max(0,t-1);return Math.max(0,t-1)}timestampToPosition(e,t){const r=this.currentMoveInfo(e);let i=t??this.kpuzzle.identityTransformation().toKPattern();for(const n of this.animLeaves.slice(0,r.patternIndex)){const s=n.animLeaf.as(k);s!==null&&(i=i.applyMove(s))}return{pattern:i,movesInProgress:r.currentMoves}}currentMoveInfo(e){let t=1/0;for(const o of this.animLeaves)if(o.start<=e&&o.end>=e)t=Math.min(t,o.start);else if(o.start>e)break;const r=[],i=[],n=[],s=[];let a=-1/0,l=1/0,c=0;for(const o of this.animLeaves)if(o.end<=t){if(!isFinite(t)&&o.start>e)break;c++}else{if(o.start>e)break;{const h=o.animLeaf.as(k);if(h!==null){let d=(e-o.start)/(o.end-o.start),y=!1;d>1&&(d=1,y=!0);const w={move:h,direction:1,fraction:d,startTimestamp:o.start,endTimestamp:o.end};switch(d){case 0:{i.push(w);break}case 1:{y?s.push(w):n.push(w);break}default:r.push(w),a=Math.max(a,o.start),l=Math.min(l,o.end)}}}}return{patternIndex:c,currentMoves:r,latestStart:a,earliestEnd:l,movesStarting:i,movesFinishing:n,movesFinished:s}}patternAtIndex(e,t){let r=t??this.kpuzzle.defaultPattern();for(let i=0;i<this.animLeaves.length&&i<e;i++){const s=this.animLeaves[i].animLeaf.as(k);s!==null&&(r=r.applyMove(s))}return r}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of this.animLeaves.slice(0,e)){const i=r.animLeaf.as(k);i!==null&&(t=t.applyMove(i))}return t}algDuration(){let e=0;for(const t of this.animLeaves)e=Math.max(e,t.end);return e}numAnimatedLeaves(){return this.animLeaves.length}moveDuration(e){const t=this.getAnimationTimelineLeaf(e);return t.end-t.start}},Ur=1024,qr=class extends v{derive(e){switch(e.indexerConstructorRequest){case"auto":return e.animationTimelineLeaves!==null||jt(e.alg.alg)<=Ur&&e.puzzle==="3x3x3"&&e.visualizationStrategy==="Cube3D"?de:Le;case"tree":return Le;case"simple":return ar;case"simultaneous":return de;default:throw new Error("Invalid indexer request!")}}},Wr=class extends p{getDefaultValue(){return"auto"}},Hr=class extends v{derive(e){return new e.indexerConstructor(e.kpuzzle,e.algWithIssues.alg,{animationTimelineLeaves:e.animationTimelineLeaves})}},Qr=class extends v{derive(e){return{pattern:e.currentPattern,movesInProgress:e.currentMoveInfo.currentMoves}}},Yr=!0,Fe=class extends v{async derive(e){try{return Yr&&e.kpuzzle.algToTransformation(e.algWithIssues.alg),e.algWithIssues}catch(t){return{alg:new z,issues:new _({errors:[`Invalid alg for puzzle: ${t.toString()}`]})}}}},_r=class extends p{getDefaultValue(){return"start"}},Gr=class extends p{getDefaultValue(){return null}},Xr=class extends v{async derive(e){return e.puzzleLoader.kpuzzle()}},Zr=class extends p{getDefaultValue(){return H}},$r=class extends v{async derive(e){return e.puzzleLoader.id}},Jr=class extends p{getDefaultValue(){return H}},Kr=class extends v{derive(e){if(e.puzzleIDRequest&&e.puzzleIDRequest!==H){const t=_e[e.puzzleIDRequest];return t||this.userVisibleErrorTracker.set({errors:[`Invalid puzzle ID: ${e.puzzleIDRequest}`]}),t}return e.puzzleDescriptionRequest&&e.puzzleDescriptionRequest!==H?Dt(e.puzzleDescriptionRequest):Ct}},ei=class extends v{derive(e){return{playing:e.playingInfo.playing,atStart:e.detailedTimelineInfo.atStart,atEnd:e.detailedTimelineInfo.atEnd}}canReuseValue(e,t){return e.playing===t.playing&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},ti=class extends v{derive(e){let t=this.#e(e),r=!1,i=!1;return t>=e.timeRange.end&&(i=!0,t=Math.min(e.timeRange.end,t)),t<=e.timeRange.start&&(r=!0,t=Math.max(e.timeRange.start,t)),{timestamp:t,timeRange:e.timeRange,atStart:r,atEnd:i}}#e(e){switch(e.timestampRequest){case"auto":return e.setupAnchor==="start"&&e.setupAlg.alg.experimentalIsEmpty()?e.timeRange.end:e.timeRange.start;case"start":return e.timeRange.start;case"end":return e.timeRange.end;case"anchor":return e.setupAnchor==="start"?e.timeRange.start:e.timeRange.end;case"opposite-anchor":return e.setupAnchor==="start"?e.timeRange.end:e.timeRange.start;default:return e.timestampRequest}}canReuseValue(e,t){return e.timestamp===t.timestamp&&e.timeRange.start===t.timeRange.start&&e.timeRange.end===t.timeRange.end&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},ri=class extends P{async getDefaultValue(){return{direction:1,playing:!1,untilBoundary:"entire-timeline",loop:!1}}async derive(e,t){const r=await t,i=Object.assign({},r);return Object.assign(i,e),i}canReuseValue(e,t){return e.direction===t.direction&&e.playing===t.playing&&e.untilBoundary===t.untilBoundary&&e.loop===t.loop}},ii=class extends P{getDefaultValue(){return 1}derive(e){return e<0?1:e}},ni={auto:!0,start:!0,end:!0,anchor:!0,"opposite-anchor":!0},si=class extends p{getDefaultValue(){return"auto"}set(e){const t=this.get();super.set((async()=>this.validInput(await e)?e:t)())}validInput(e){return!!(typeof e=="number"||ni[e])}},ai=class extends v{derive(e){return{start:0,end:e.indexer.algDuration()}}},oi=class extends p{getDefaultValue(){return"auto"}},li=class extends p{getDefaultValue(){return"auto"}},ci=class extends v{derive(e){switch(e.puzzleID){case"clock":case"square1":case"redi_cube":case"melindas2x2x2x2":case"tri_quad":case"loopover":return"2D";case"3x3x3":switch(e.visualizationRequest){case"auto":case"3D":return"Cube3D";default:return e.visualizationRequest}default:switch(e.visualizationRequest){case"auto":case"3D":return"PG3D";case"experimental-2D-LL":case"experimental-2D-LL-face":return["2x2x2","4x4x4","megaminx"].includes(e.puzzleID)?"experimental-2D-LL":"2D";default:return e.visualizationRequest}}}},di=class extends p{getDefaultValue(){return"auto"}},ui=class extends p{getDefaultValue(){return"auto"}},hi=class extends p{getDefaultValue(){return"auto"}},mi=class extends p{getDefaultValue(){return"auto"}},pi=null;async function gi(){return pi??=new(await A).ThreeTextureLoader}var je=class extends v{async derive(e){const{spriteURL:t}=e;return t===null?null:new Promise(async(r,i)=>{const n=()=>{console.warn("Could not load sprite:",t.toString()),r(null)};try{(await gi()).load(t.toString(),r,n,n)}catch{n()}})}},fi={facelets:["regular","regular","regular","regular","regular"]};async function vi(e){const{definition:t}=await e.kpuzzle(),r={orbits:{}};for(const i of t.orbits)r.orbits[i.orbitName]={pieces:new Array(i.numPieces).fill(fi)};return r}var wi=class extends v{getDefaultValue(){return{orbits:{}}}async derive(e){return e.stickeringMaskRequest?e.stickeringMaskRequest:e.stickeringRequest==="picture"?{specialBehaviour:"picture",orbits:{}}:e.puzzleLoader.stickeringMask?.(e.stickeringRequest??"full")??vi(e.puzzleLoader)}},yi={"-":"Regular",D:"Dim",I:"Ignored",X:"Invisible",O:"IgnoreNonPrimary",P:"PermuteNonPrimary",o:"Ignoriented","?":"OrientationWithoutPermutation",M:"Mystery","@":"Regular"};function Mi(e){const t={orbits:{}},r=e.split(",");for(const i of r){const[n,s,...a]=i.split(":");if(a.length>0)throw new Error(`Invalid serialized orbit stickering mask (too many colons): \`${i}\``);const l=[];t.orbits[n]={pieces:l};for(const c of s){const o=yi[c];l.push(Nt(o))}}return t}var xi=class extends P{getDefaultValue(){return null}derive(e){return e===null?null:typeof e=="string"?Mi(e):e}},Ti=class extends p{getDefaultValue(){return null}},zi=class extends p{getDefaultValue(){return"auto"}},Si=class extends p{getDefaultValue(){return{}}},bi=class extends p{getDefaultValue(){return"auto"}},Ii=class extends p{getDefaultValue(){return"auto"}},Li=class extends v{derive(e){return e.colorSchemeRequest==="dark"?"dark":"light"}},ki=class extends p{getDefaultValue(){return"auto"}},Ai=class extends p{getDefaultValue(){return null}},Di=35,Ci=class extends p{getDefaultValue(){return Di}};function yt(e,t){return e.latitude===t.latitude&&e.longitude===t.longitude&&e.distance===t.distance}var Ei=class extends P{getDefaultValue(){return"auto"}canReuseValue(e,t){return e===t||yt(e,t)}async derive(e,t){if(e==="auto")return"auto";let r=await t;r==="auto"&&(r={});const i=Object.assign({},r);return Object.assign(i,e),typeof i.latitude<"u"&&(i.latitude=Math.min(Math.max(i.latitude,-90),90)),typeof i.longitude<"u"&&(i.longitude=ge(i.longitude,180,-180)),i}},Pi=class extends v{canReuseValue(e,t){return yt(e,t)}async derive(e){if(e.orbitCoordinatesRequest==="auto")return Be(e.puzzleID,e.strategy);const t=Object.assign(Object.assign({},Be(e.puzzleID,e.strategy),e.orbitCoordinatesRequest));if(Math.abs(t.latitude)<=e.latitudeLimit)return t;{const{latitude:r,longitude:i,distance:n}=t;return{latitude:e.latitudeLimit*Math.sign(r),longitude:i,distance:n}}}},Ni={latitude:31.717474411461005,longitude:0,distance:5.877852522924731},Ri={latitude:35,longitude:30,distance:6},Ve={latitude:35,longitude:30,distance:6.25},Oi={latitude:Math.atan(1/2)*Y,longitude:0,distance:6.7},Fi={latitude:26.56505117707799,longitude:0,distance:6};function Be(e,t){if(e[1]==="x")return t==="Cube3D"?Ri:Ve;switch(e){case"megaminx":case"gigaminx":return Oi;case"pyraminx":case"master_tetraminx":return Fi;case"skewb":return Ve;default:return Ni}}var ji=class{constructor(e){this.twistyPlayerModel=e,this.orbitCoordinates=new Pi({orbitCoordinatesRequest:this.orbitCoordinatesRequest,latitudeLimit:this.latitudeLimit,puzzleID:e.puzzleID,strategy:e.visualizationStrategy}),this.stickeringMask=new wi({stickeringMaskRequest:this.stickeringMaskRequest,stickeringRequest:this.stickeringRequest,puzzleLoader:e.puzzleLoader})}twistyPlayerModel;background=new Ii;colorSchemeRequest=new ki;dragInput=new zi;foundationDisplay=new ui;foundationStickerSpriteURL=new ve;fullscreenElement=new Ai;hintFacelet=new Gt;hintStickerSpriteURL=new ve;initialHintFaceletsAnimation=new mi;hintFaceletsElevation=new hi;latitudeLimit=new Ci;movePressInput=new bi;movePressCancelOptions=new Si;orbitCoordinatesRequest=new Ei;stickeringMaskRequest=new xi;stickeringRequest=new Ti;faceletScale=new di;colorScheme=new Li({colorSchemeRequest:this.colorSchemeRequest});foundationStickerSprite=new je({spriteURL:this.foundationStickerSpriteURL});hintStickerSprite=new je({spriteURL:this.hintStickerSpriteURL});orbitCoordinates;stickeringMask},Vi={errors:[]},Bi=class extends p{getDefaultValue(){return Vi}reset(){this.set(this.getDefaultValue())}canReuseValue(e,t){return pe(e.errors,t.errors)}},Ui=class{userVisibleErrorTracker=new Bi;alg=new Re;backView=new mr;controlPanel=new xr;catchUpMove=new Pr;indexerConstructorRequest=new Wr;playingInfo=new ri;puzzleDescriptionRequest=new Zr;puzzleIDRequest=new Jr;setupAnchor=new _r;setupAlg=new Re;setupTransformation=new Gr;tempoScale=new ii;timestampRequest=new si;viewerLink=new oi;visualizationFormat=new li;title=new Ne;videoURL=new ve;competitionID=new Ne;animationTimelineLeavesRequest=new Er;puzzleLoader=new Kr({puzzleIDRequest:this.puzzleIDRequest,puzzleDescriptionRequest:this.puzzleDescriptionRequest},this.userVisibleErrorTracker);kpuzzle=new Xr({puzzleLoader:this.puzzleLoader});puzzleID=new $r({puzzleLoader:this.puzzleLoader});puzzleAlg=new Fe({algWithIssues:this.alg,kpuzzle:this.kpuzzle});puzzleSetupAlg=new Fe({algWithIssues:this.setupAlg,kpuzzle:this.kpuzzle});visualizationStrategy=new ci({visualizationRequest:this.visualizationFormat,puzzleID:this.puzzleID});indexerConstructor=new qr({alg:this.alg,puzzle:this.puzzleID,visualizationStrategy:this.visualizationStrategy,indexerConstructorRequest:this.indexerConstructorRequest,animationTimelineLeaves:this.animationTimelineLeavesRequest});setupAlgTransformation=new Dr({setupAlg:this.puzzleSetupAlg,kpuzzle:this.kpuzzle});indexer=new Hr({indexerConstructor:this.indexerConstructor,algWithIssues:this.puzzleAlg,kpuzzle:this.kpuzzle,animationTimelineLeaves:this.animationTimelineLeavesRequest});anchorTransformation=new Cr({setupTransformation:this.setupTransformation,setupAnchor:this.setupAnchor,setupAlgTransformation:this.setupAlgTransformation,indexer:this.indexer});timeRange=new ai({indexer:this.indexer});detailedTimelineInfo=new ti({timestampRequest:this.timestampRequest,timeRange:this.timeRange,setupAnchor:this.setupAnchor,setupAlg:this.setupAlg});coarseTimelineInfo=new ei({detailedTimelineInfo:this.detailedTimelineInfo,playingInfo:this.playingInfo});currentMoveInfo=new Rr({indexer:this.indexer,detailedTimelineInfo:this.detailedTimelineInfo,catchUpMove:this.catchUpMove});buttonAppearance=new Lr({coarseTimelineInfo:this.coarseTimelineInfo,viewerLink:this.viewerLink});currentLeavesSimplified=new Nr({currentMoveInfo:this.currentMoveInfo});currentPattern=new Or({anchoredStart:this.anchorTransformation,currentLeavesSimplified:this.currentLeavesSimplified,indexer:this.indexer});legacyPosition=new Qr({currentMoveInfo:this.currentMoveInfo,currentPattern:this.currentPattern});twistySceneModel=new ji(this);async twizzleLink(){const[e,t,r,i,n,s,a,l]=await Promise.all([this.viewerLink.get(),this.puzzleID.get(),this.puzzleDescriptionRequest.get(),this.alg.get(),this.setupAlg.get(),this.setupAnchor.get(),this.twistySceneModel.stickeringRequest.get(),this.twistySceneModel.twistyPlayerModel.title.get()]),c=e==="experimental-twizzle-explorer",o=new URL(`https://alpha.twizzle.net/${c?"explore":"edit"}/`);return i.alg.experimentalIsEmpty()||o.searchParams.set("alg",i.alg.toString()),n.alg.experimentalIsEmpty()||o.searchParams.set("setup-alg",n.alg.toString()),s!=="start"&&o.searchParams.set("setup-anchor",s),a!=="full"&&a!==null&&o.searchParams.set("experimental-stickering",a),c&&r!==H?o.searchParams.set("puzzle-description",r):t!=="3x3x3"&&o.searchParams.set("puzzle",t),l&&o.searchParams.set("title",l),o.toString()}experimentalAddAlgLeaf(e,t){const r=e.as(k);r?this.experimentalAddMove(r,t):this.alg.set((async()=>{const n=(await this.alg.get()).alg.concat(new z([e]));return this.timestampRequest.set("end"),n})())}experimentalAddMove(e,t){const r=typeof e=="string"?new k(e):e;this.alg.set((async()=>{const[{alg:i},n]=await Promise.all([this.alg.get(),this.puzzleLoader.get()]),s=kt(i,r,{...t,...await At(n)});return this.timestampRequest.set("end"),this.catchUpMove.set({move:r,amount:0}),s})())}experimentalRemoveFinalChild(){this.alg.set((async()=>{const e=(await this.alg.get()).alg,t=Array.from(e.childAlgNodes()),[r]=t.splice(-1);if(!r)return e;this.timestampRequest.set("end");const i=r.as(k);return i&&this.catchUpMove.set({move:i.invert(),amount:0}),new z(t)})())}};function m(e){return new Error(`Cannot get \`.${e}\` directly from a \`TwistyPlayer\`.`)}var qi=class extends I{experimentalModel=new Ui;set alg(e){this.experimentalModel.alg.set(e)}get alg(){throw m("alg")}set experimentalSetupAlg(e){this.experimentalModel.setupAlg.set(e)}get experimentalSetupAlg(){throw m("setup")}set experimentalSetupAnchor(e){this.experimentalModel.setupAnchor.set(e)}get experimentalSetupAnchor(){throw m("anchor")}set puzzle(e){this.experimentalModel.puzzleIDRequest.set(e)}get puzzle(){throw m("puzzle")}set experimentalPuzzleDescription(e){this.experimentalModel.puzzleDescriptionRequest.set(e)}get experimentalPuzzleDescription(){throw m("experimentalPuzzleDescription")}set timestamp(e){this.experimentalModel.timestampRequest.set(e)}get timestamp(){throw m("timestamp")}set hintFacelets(e){this.experimentalModel.twistySceneModel.hintFacelet.set(e)}get hintFacelets(){throw m("hintFacelets")}set experimentalStickering(e){this.experimentalModel.twistySceneModel.stickeringRequest.set(e)}get experimentalStickering(){throw m("experimentalStickering")}set experimentalStickeringMaskOrbits(e){this.experimentalModel.twistySceneModel.stickeringMaskRequest.set(e)}get experimentalStickeringMaskOrbits(){throw m("experimentalStickeringMaskOrbits")}set experimentalFaceletScale(e){this.experimentalModel.twistySceneModel.faceletScale.set(e)}get experimentalFaceletScale(){throw m("experimentalFaceletScale")}set backView(e){this.experimentalModel.backView.set(e)}get backView(){throw m("backView")}set background(e){this.experimentalModel.twistySceneModel.background.set(e)}get background(){throw m("background")}set colorScheme(e){this.experimentalModel.twistySceneModel.colorSchemeRequest.set(e)}get colorScheme(){throw m("colorScheme")}set controlPanel(e){this.experimentalModel.controlPanel.set(e)}get controlPanel(){throw m("controlPanel")}set visualization(e){this.experimentalModel.visualizationFormat.set(e)}get visualization(){throw m("visualization")}set experimentalTitle(e){this.experimentalModel.title.set(e)}get experimentalTitle(){throw m("experimentalTitle")}set experimentalVideoURL(e){this.experimentalModel.videoURL.set(e)}get experimentalVideoURL(){throw m("experimentalVideoURL")}set experimentalCompetitionID(e){this.experimentalModel.competitionID.set(e)}get experimentalCompetitionID(){throw m("experimentalCompetitionID")}set viewerLink(e){this.experimentalModel.viewerLink.set(e)}get viewerLink(){throw m("viewerLink")}set experimentalMovePressInput(e){this.experimentalModel.twistySceneModel.movePressInput.set(e)}get experimentalMovePressInput(){throw m("experimentalMovePressInput")}set experimentalMovePressCancelOptions(e){this.experimentalModel.twistySceneModel.movePressCancelOptions.set(e)}get experimentalMovePressCancelOptions(){throw m("experimentalMovePressCancelOptions")}set cameraLatitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({latitude:e})}get cameraLatitude(){throw m("cameraLatitude")}set cameraLongitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({longitude:e})}get cameraLongitude(){throw m("cameraLongitude")}set cameraDistance(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({distance:e})}get cameraDistance(){throw m("cameraDistance")}set cameraLatitudeLimit(e){this.experimentalModel.twistySceneModel.latitudeLimit.set(e)}get cameraLatitudeLimit(){throw m("cameraLatitudeLimit")}set indexer(e){this.experimentalModel.indexerConstructorRequest.set(e)}get indexer(){throw m("indexer")}set tempoScale(e){this.experimentalModel.tempoScale.set(e)}get tempoScale(){throw m("tempoScale")}set experimentalSprite(e){this.experimentalModel.twistySceneModel.foundationStickerSpriteURL.set(e)}get experimentalSprite(){throw m("experimentalSprite")}set experimentalHintSprite(e){this.experimentalModel.twistySceneModel.hintStickerSpriteURL.set(e)}get experimentalHintSprite(){throw m("experimentalHintSprite")}set fullscreenElement(e){this.experimentalModel.twistySceneModel.fullscreenElement.set(e)}get fullscreenElement(){throw m("fullscreenElement")}set experimentalInitialHintFaceletsAnimation(e){this.experimentalModel.twistySceneModel.initialHintFaceletsAnimation.set(e)}get experimentalInitialHintFaceletsAnimation(){throw m("experimentalInitialHintFaceletsAnimation")}set experimentalHintFaceletsElevation(e){this.experimentalModel.twistySceneModel.hintFaceletsElevation.set(e)}get experimentalHintFaceletsElevation(){throw m("experimentalHintFaceletsElevation")}set experimentalDragInput(e){this.experimentalModel.twistySceneModel.dragInput.set(e)}get experimentalDragInput(){throw m("experimentalDragInput")}experimentalGet=new Wi(this.experimentalModel)},Wi=class{constructor(e){this.model=e}model;async alg(){return(await this.model.alg.get()).alg}async setupAlg(){return(await this.model.setupAlg.get()).alg}puzzleID(){return this.model.puzzleID.get()}async timestamp(){return(await this.model.detailedTimelineInfo.get()).timestamp}},ue="data-",ne={alg:"alg","experimental-setup-alg":"experimentalSetupAlg","experimental-setup-anchor":"experimentalSetupAnchor",puzzle:"puzzle","experimental-puzzle-description":"experimentalPuzzleDescription",visualization:"visualization","hint-facelets":"hintFacelets","experimental-stickering":"experimentalStickering","experimental-stickering-mask-orbits":"experimentalStickeringMaskOrbits",background:"background","color-scheme":"colorScheme","control-panel":"controlPanel","back-view":"backView","experimental-facelet-scale":"experimentalFaceletScale","experimental-initial-hint-facelets-animation":"experimentalInitialHintFaceletsAnimation","experimental-hint-facelets-elevation":"experimentalHintFaceletsElevation","viewer-link":"viewerLink","experimental-move-press-input":"experimentalMovePressInput","experimental-drag-input":"experimentalDragInput","experimental-title":"experimentalTitle","experimental-video-url":"experimentalVideoURL","experimental-competition-id":"experimentalCompetitionID","camera-latitude":"cameraLatitude","camera-longitude":"cameraLongitude","camera-distance":"cameraDistance","camera-latitude-limit":"cameraLatitudeLimit","tempo-scale":"tempoScale","experimental-sprite":"experimentalSprite","experimental-hint-sprite":"experimentalHintSprite"},Hi=Object.fromEntries(Object.values(ne).map(e=>[e,!0])),Qi={experimentalMovePressCancelOptions:!0},Ue,Mt=Symbol("intersectedCallback");function Yi(e){Ue??=new IntersectionObserver((t,r)=>{for(const i of t)i.isIntersecting&&i.intersectionRect.height>0&&(i.target[Mt](),r.unobserve(i.target))}),Ue.observe(e)}var Z=class extends qi{controller=new yr(this.experimentalModel,this);buttons;experimentalCanvasClickCallback=()=>{};constructor(e={}){super();for(const[t,r]of Object.entries(e)){if(!(Hi[t]||Qi[t])){console.warn(`Invalid config passed to TwistyPlayer: ${t}`);break}this[t]=r}}#e=new X(this,"controls-",["auto"].concat(Object.keys(Mr)));#t=document.createElement("div");#r=document.createElement("div");#i=!1;connectedCallback(){this.addCSS(ft),Yi(this)}async[Mt](){if(this.#i)return;this.#i=!0,this.addElement(this.#t).classList.add("visualization-wrapper"),this.addElement(this.#r).classList.add("error-elem"),this.#r.textContent="Error",this.experimentalModel.userVisibleErrorTracker.addFreshListener(t=>{const r=t.errors[0]??null;this.contentWrapper.classList.toggle("error",!!r),r&&(this.#r.textContent=r)});const e=new mt(this.experimentalModel,this.controller);this.contentWrapper.appendChild(e),this.buttons=new ct(this.experimentalModel,this.controller,this),this.contentWrapper.appendChild(this.buttons),this.experimentalModel.twistySceneModel.background.addFreshListener(t=>{this.contentWrapper.classList.toggle("checkered",["auto","checkered"].includes(t)),this.contentWrapper.classList.toggle("checkered-transparent",t==="checkered-transparent")}),this.experimentalModel.twistySceneModel.colorScheme.addFreshListener(t=>{this.contentWrapper.classList.toggle("dark-mode",["dark"].includes(t))}),this.experimentalModel.controlPanel.addFreshListener(t=>{this.#e.setValue(t)}),this.experimentalModel.visualizationStrategy.addFreshListener(this.#l.bind(this)),this.experimentalModel.puzzleID.addFreshListener(this.flash.bind(this))}#s="auto";experimentalSetFlashLevel(e){this.#s=e}flash(){this.#s==="auto"&&this.#n?.animate([{opacity:.25},{opacity:1}],{duration:250,easing:"ease-out"})}#n=null;#a=new st;#o=null;#l(e){if(e!==this.#o){this.#n?.remove(),this.#n?.disconnect();let t;switch(e){case"2D":case"experimental-2D-LL":case"experimental-2D-LL-face":{t=new nt(this.experimentalModel.twistySceneModel,e);break}case"Cube3D":case"PG3D":{t=new fe(this.experimentalModel),this.#a.handleNewValue(t);break}default:throw new Error("Invalid visualization")}this.#t.appendChild(t),this.#n=t,this.#o=e}}async experimentalCurrentVantages(){this.connectedCallback();const e=this.#n;return e instanceof fe?e.experimentalVantages():[]}async experimentalCurrentCanvases(){const e=await this.experimentalCurrentVantages(),t=[];for(const r of e)t.push((await r.canvasInfo()).canvas);return t}async experimentalCurrentThreeJSPuzzleObject(e){this.connectedCallback();const r=await(await this.#a.promise).experimentalTwisty3DPuzzleWrapper(),i=r.twisty3DPuzzle(),n=(async()=>{await i,await new Promise(s=>setTimeout(s,0))})();if(e){const s=new B(async()=>{});r.addEventListener("render-scheduled",async()=>{s.requestIsPending()||(s.requestAnimFrame(),await n,e())})}return i}jumpToStart(e){this.controller.jumpToStart(e)}jumpToEnd(e){this.controller.jumpToEnd(e)}play(){this.controller.togglePlay(!0)}pause(){this.controller.togglePlay(!1)}togglePlay(e){this.controller.togglePlay(e)}experimentalAddMove(e,t){this.experimentalModel.experimentalAddMove(e,t)}experimentalAddAlgLeaf(e,t){this.experimentalModel.experimentalAddAlgLeaf(e,t)}static get observedAttributes(){const e=[];for(const t of Object.keys(ne))e.push(t,ue+t);return e}experimentalRemoveFinalChild(){this.experimentalModel.experimentalRemoveFinalChild()}attributeChangedCallback(e,t,r){e.startsWith(ue)&&(e=e.slice(ue.length));const i=ne[e];i&&(this[i]=r)}async experimentalScreenshot(e){return(await Pe(this.experimentalModel,e)).dataURL}async experimentalDownloadScreenshot(e){if(["2D","experimental-2D-LL","experimental-2D-LL-face"].includes(await this.experimentalModel.visualizationStrategy.get())){const r=await this.#n.currentTwisty2DPuzzleWrapper().twisty2DPuzzle(),i=new XMLSerializer().serializeToString(r.svgWrapper.svgElement),n=URL.createObjectURL(new Blob([i]));gt(n,e??await pt(this.experimentalModel),"svg")}else await(await Pe(this.experimentalModel)).download(e)}};T.define("twisty-player",Z);var _i=class extends we{traverseAlg(e,t){const r=[];let i=0;for(const n of e.childAlgNodes()){const s=this.traverseAlgNode(n,{numMovesSoFar:t.numMovesSoFar+i});r.push(s.tokens),i+=s.numLeavesInside}return{tokens:Array.prototype.concat(...r),numLeavesInside:i}}traverseGrouping(e,t){const r=this.traverseAlg(e.alg,t);return{tokens:r.tokens,numLeavesInside:r.numLeavesInside*e.amount}}traverseMove(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseCommutator(e,t){const r=this.traverseAlg(e.A,t),i=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(i.tokens),numLeavesInside:r.numLeavesInside*2+i.numLeavesInside}}traverseConjugate(e,t){const r=this.traverseAlg(e.A,t),i=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(i.tokens),numLeavesInside:r.numLeavesInside*2+i.numLeavesInside*2}}traversePause(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseNewline(e,t){return{tokens:[],numLeavesInside:0}}traverseLineComment(e,t){return{tokens:[],numLeavesInside:0}}},Gi=ae(_i),Xi=class extends p{getDefaultValue(){return""}},Zi=class extends v{derive(e){return wt(e.value)}},$i=class extends P{getDefaultValue(){return{selectionStart:0,selectionEnd:0,endChangedMostRecently:!1}}async derive(e,t){const{selectionStart:r,selectionEnd:i}=e,n=await t,s=e.selectionStart===n.selectionStart&&e.selectionEnd!==(await t).selectionEnd;return{selectionStart:r,selectionEnd:i,endChangedMostRecently:s}}},Ji=class extends v{derive(e){return e.selectionInfo.endChangedMostRecently?e.selectionInfo.selectionEnd:e.selectionInfo.selectionStart}},Ki=class extends v{derive(e){return Gi(e.algWithIssues.alg,{numMovesSoFar:0}).tokens}},en=class extends v{derive(e){function t(i){if(i===null)return null;let n;return e.targetChar<i.leaf[O]?n="before":e.targetChar===i.leaf[O]?n="start":e.targetChar<i.leaf[q]?n="inside":e.targetChar===i.leaf[q]?n="end":n="after",{leafInfo:i,where:n}}let r=null;for(const i of e.leafTokens){if(e.targetChar<i.leaf[O]&&r!==null)return t(r);if(e.targetChar<=i.leaf[q])return t(i);r=i}return t(r)}},tn=class{valueProp=new Xi;selectionProp=new $i;targetCharProp=new Ji({selectionInfo:this.selectionProp});algEditorAlgWithIssues=new Zi({value:this.valueProp});leafTokensProp=new Ki({algWithIssues:this.algEditorAlgWithIssues});leafToHighlight=new en({leafTokens:this.leafTokensProp,targetChar:this.targetCharProp})},rn="//";function nn(e){try{return z.fromString(e)}catch{return null}}function xt(e,t){const r=e.indexOf(t);return r===-1?[e,""]:[e.slice(0,r),e.slice(r)]}function qe(e){const t=[];for(const r of e.split(`
`)){let[i,n]=xt(r,rn);i=i.replaceAll("’","'"),t.push(i+n)}return t.join(`
`)}function sn(e,t){const{value:r}=e,{selectionStart:i,selectionEnd:n}=e,s=r.slice(0,i),a=r.slice(n);t=t.replaceAll(`\r
`,`
`);const l=s.match(/\/\/[^\n]*$/),c=r[i-1]==="/"&&t[0]==="/",o=l||c,h=t.match(/\/\/[^\n]*$/);let d=t;if(o){const[f,u]=xt(t,`
`);d=f+qe(u)}else d=qe(t);const y=!o&&i!==0&&![`
`," "].includes(d[0])&&![`
`," "].includes(r[i-1]),w=!h&&n!==r.length&&![`
`," "].includes(d.at(-1))&&![`
`," "].includes(r[n]);function x(f,u){const g=f+d+u,S=!!nn(s+g+a);return S&&(d=g),S}y&&w&&x(" "," ")||y&&x(" ","")||w&&x(""," "),E?.execCommand("insertText",!1,d)||e.setRangeText(d,i,n,"end")}var Tt=new b;Tt.replaceSync(`
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
`);var J="for-twisty-player",We="placeholder",He="twisty-player-prop",an=class extends I{model=new tn;#e=document.createElement("textarea");#t=document.createElement("div");#r=document.createElement("span");#i=document.createElement("span");#s=document.createElement("span");#n=new X(this,"valid-for-puzzle-",["none","warning","error"]);#a=null;#o;get#l(){return this.#a===null?null:this.#a.experimentalModel[this.#o]}debugNeverRequestTimestamp=!1;constructor(e){super(),this.#t.classList.add("carbon-copy"),this.addElement(this.#t),this.#e.rows=1,this.addElement(this.#e),this.#r.classList.add("prefix"),this.#t.appendChild(this.#r),this.#i.classList.add("highlight"),this.#t.appendChild(this.#i),this.#s.classList.add("suffix"),this.#t.appendChild(this.#s),this.#e.placeholder="Alg",this.#e.setAttribute("spellcheck","false"),this.addCSS(Tt),this.#e.addEventListener("input",()=>{this.#d=!0,this.onInput()}),this.#e.addEventListener("blur",()=>this.onBlur()),document.addEventListener("selectionchange",()=>this.onSelectionChange()),e?.twistyPlayer&&(this.twistyPlayer=e.twistyPlayer),this.#o=e?.twistyPlayerProp??"alg",e?.twistyPlayerProp==="alg"&&this.model.leafToHighlight.addFreshListener(t=>{t&&this.highlightLeaf(t.leafInfo.leaf)})}connectedCallback(){this.#e.addEventListener("paste",e=>{const t=e.clipboardData?.getData("text");t&&(sn(this.#e,t),e.preventDefault(),this.onInput())})}set algString(e){this.#e.value=e,this.onInput()}get algString(){return this.#e.value}set placeholder(e){this.#e.placeholder=e}#d=!1;onInput(){this.#i.hidden=!0,this.highlightLeaf(null);const e=this.#e.value.trimEnd();this.model.valueProp.set(e),this.#l?.set(e)}async onSelectionChange(){if(document.activeElement!==this||this.shadow.activeElement!==this.#e||this.#o!=="alg")return;const{selectionStart:e,selectionEnd:t}=this.#e;this.model.selectionProp.set({selectionStart:e,selectionEnd:t})}async onBlur(){}setAlgIssueClassForPuzzle(e){this.#n.setValue(e)}#u(e){return e.endsWith(`
`)?`${e} `:e}#c=null;highlightLeaf(e){if(e===null){this.#r.textContent="",this.#i.textContent="",this.#s.textContent=this.#u(this.#e.value);return}e!==this.#c&&(this.#c=e,this.#r.textContent=this.#e.value.slice(0,e[O]),this.#i.textContent=this.#e.value.slice(e[O],e[q]),this.#s.textContent=this.#u(this.#e.value.slice(e[q])),this.#i.hidden=!1)}get twistyPlayer(){return this.#a}set twistyPlayer(e){if(this.#a){console.warn("twisty-player reassignment/clearing is not supported");return}this.#a=e,e&&((async()=>this.algString=this.#l?(await this.#l.get()).alg.toString():"")(),this.#o==="alg"&&(this.#a?.experimentalModel.puzzleAlg.addFreshListener(t=>{if(t.issues.errors.length===0){this.setAlgIssueClassForPuzzle(t.issues.warnings.length===0?"none":"warning");const r=t.alg,i=z.fromString(this.algString);r.isIdentical(i)||(this.algString=r.toString(),this.onInput())}else this.setAlgIssueClassForPuzzle("error")}),this.model.leafToHighlight.addFreshListener(async t=>{if(t===null)return;const[r,i]=await Promise.all([await e.experimentalModel.indexer.get(),await e.experimentalModel.timestampRequest.get()]);if(i==="auto"&&!this.#d)return;const n=r.indexToMoveStartTimestamp(t.leafInfo.idx),s=r.moveDuration(t.leafInfo.idx);let a;switch(t.where){case"before":{a=n;break}case"start":case"inside":{a=n+s/4;break}case"end":case"after":{a=n+s;break}default:throw console.log("invalid where"),new Error("Invalid where!")}this.debugNeverRequestTimestamp||e.experimentalModel.timestampRequest.set(a)}),e.experimentalModel.currentLeavesSimplified.addFreshListener(async t=>{const i=(await e.experimentalModel.indexer.get()).getAnimLeaf(t.patternIndex);this.highlightLeaf(i)})))}attributeChangedCallback(e,t,r){switch(e){case J:{const i=document.getElementById(r);if(!i){console.warn(`${J}= elem does not exist`);return}if(!(i instanceof Z)){console.warn(`${J}=is not a twisty-player`);return}this.twistyPlayer=i;return}case We:{this.placeholder=r;return}case He:{if(this.#a)throw console.log("cannot set prop"),new Error("cannot set prop after twisty player");this.#o=r;return}}}static get observedAttributes(){return[J,We,He]}};T.define("twisty-alg-editor",an);async function on(e){return new Promise((t,r)=>{try{const i=document.getElementById(e);i&&t(i);const n=new MutationObserver(s=>{for(const a of s)a.attributeName==="id"&&a.target instanceof Element&&a.target.getAttribute("id")===e&&(t(a.target),n.disconnect())});n.observe(document.body,{attributeFilter:["id"],subtree:!0})}catch(i){r(i)}})}var zt=new b;zt.replaceSync(`
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
`);var ln=.25,j=class extends Q{constructor(e,t,r,i,n,s){if(super(),this.algOrAlgNode=i,this.classList.add(e),s){const a=this.appendChild(document.createElement("a"));a.href="#",a.textContent=t,a.addEventListener("click",l=>{l.preventDefault(),r.twistyAlgViewer.jumpToIndex(r.earliestMoveIndex,n)})}else this.appendChild(document.createElement("span")).textContent=t}algOrAlgNode;pathToIndex(e){return[]}setCurrentMove(e){this.classList.toggle("current-move",e)}};T.define("twisty-alg-leaf-elem",j);var V=class extends Q{constructor(e,t){super(),this.algOrAlgNode=t,this.classList.add(e)}algOrAlgNode;queue=[];addString(e){const t=document.createElement("span");t.textContent=e,this.queue.push(t)}addElem(e){return this.queue.push(e.element),e.moveCount}flushQueue(e=1){for(const t of St(this.queue,e))this.append(t);this.queue=[]}pathToIndex(e){return[]}};T.define("twisty-alg-wrapper-elem",V);function cn(e){return e===1?-1:1}function dn(e,t){return t<0?cn(e):e}function St(e,t){if(t===1)return e;const r=Array.from(e);return r.reverse(),r}var un=class extends we{traverseAlg(e,t){let r=0;const i=new V("twisty-alg-alg",e);let n=!0;for(const s of Ft(e.childAlgNodes(),t.direction))n||i.addString(" "),n=!1,s.as(ze)?.experimentalNISSGrouping&&i.addString("^("),s.as(ie)?.experimentalNISSPlaceholder||(r+=i.addElem(this.traverseAlgNode(s,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}))),s.as(ze)?.experimentalNISSGrouping&&i.addString(")");return i.flushQueue(t.direction),{moveCount:r,element:i}}traverseGrouping(e,t){const r=e.experimentalAsSquare1Tuple(),i=dn(t.direction,e.amount);let n=0;const s=new V("twisty-alg-grouping",e);return s.addString("("),r?(n+=s.addElem({moveCount:1,element:new j("twisty-alg-move",r[0].amount.toString(),t,r[0],!0,!0)}),s.addString(", "),n+=s.addElem({moveCount:1,element:new j("twisty-alg-move",r[1].amount.toString(),t,r[1],!0,!0)})):n+=s.addElem(this.traverseAlg(e.alg,{earliestMoveIndex:t.earliestMoveIndex+n,twistyAlgViewer:t.twistyAlgViewer,direction:i})),s.addString(`)${e.experimentalRepetitionSuffix}`),s.flushQueue(),{moveCount:n*Math.abs(e.amount),element:s}}traverseMove(e,t){const r=new j("twisty-alg-move",e.toString(),t,e,!0,!0);return t.twistyAlgViewer.highlighter.addMove(e[O],r),{moveCount:1,element:r}}traverseCommutator(e,t){let r=0;const i=new V("twisty-alg-commutator",e);i.addString("["),i.flushQueue();const[n,s]=St([e.A,e.B],t.direction);return r+=i.addElem(this.traverseAlg(n,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),i.addString(", "),r+=i.addElem(this.traverseAlg(s,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),i.flushQueue(t.direction),i.addString("]"),i.flushQueue(),{moveCount:r*2,element:i}}traverseConjugate(e,t){let r=0;const i=new V("twisty-alg-conjugate",e);i.addString("[");const n=i.addElem(this.traverseAlg(e.A,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}));return r+=n,i.addString(": "),r+=i.addElem(this.traverseAlg(e.B,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),i.addString("]"),i.flushQueue(),{moveCount:r+n,element:i}}traversePause(e,t){return e.experimentalNISSGrouping?this.traverseAlg(e.experimentalNISSGrouping.alg,t):{moveCount:1,element:new j("twisty-alg-pause",".",t,e,!0,!0)}}traverseNewline(e,t){const r=new V("twisty-alg-newline",e);return r.append(document.createElement("br")),{moveCount:0,element:r}}traverseLineComment(e,t){return{moveCount:0,element:new j("twisty-alg-line-comment",`//${e.text}`,t,e,!1,!1)}}},hn=ae(un),mn=class{moveCharIndexMap=new Map;currentElem=null;addMove(e,t){this.moveCharIndexMap.set(e,t)}set(e){const t=e?this.moveCharIndexMap.get(e[O])??null:null;this.currentElem!==t&&(this.currentElem?.setCurrentMove(!1),t?.setCurrentMove(!0),this.currentElem=t)}},bt=class extends I{highlighter=new mn;#e;#t;#r=null;lastClickTimestamp=null;constructor(e){super({mode:"open"}),this.addCSS(zt),e?.twistyPlayer&&(this.twistyPlayer=e?.twistyPlayer)}connectedCallback(){}setAlg(e){this.#t?.isIdentical(e)||(this.#e=hn(e,{earliestMoveIndex:0,twistyAlgViewer:this,direction:1}).element,this.#t=e,this.contentWrapper.textContent="",this.contentWrapper.appendChild(this.#e))}get twistyPlayer(){return this.#r}set twistyPlayer(e){this.#i(e)}async#i(e){if(this.#r){console.warn("twisty-player reassignment is not supported");return}if(e===null)throw new Error("clearing twistyPlayer is not supported");this.#r=e,this.#r.experimentalModel.alg.addFreshListener(t=>{this.setAlg(t.alg)}),e.experimentalModel.currentMoveInfo.addFreshListener(t=>{let r=t.currentMoves[0];if(r??=t.movesStarting[0],r??=t.movesFinishing[0],!r)this.highlighter.set(null);else{const i=r.move;this.highlighter.set(i)}}),e.experimentalModel.detailedTimelineInfo.addFreshListener(t=>{t.timestamp!==this.lastClickTimestamp&&(this.lastClickTimestamp=null)})}async jumpToIndex(e,t){const r=this.#r;if(r){r.pause();const i=(async()=>{const n=await r.experimentalModel.indexer.get(),s=t?n.moveDuration(e)*ln:0;return n.indexToMoveStartTimestamp(e)+n.moveDuration(e)-s})();r.experimentalModel.timestampRequest.set(await i),this.lastClickTimestamp===await i?(r.play(),this.lastClickTimestamp=null):this.lastClickTimestamp=await i}}async attributeChangedCallback(e,t,r){if(e==="for"){let i=document.getElementById(r);if(i||console.info("for= elem does not exist, waiting for one"),await customElements.whenDefined("twisty-player"),i=await on(r),!(i instanceof Z)){console.warn("for= elem is not a twisty-player");return}this.twistyPlayer=i}}static get observedAttributes(){return["for"]}};T.define("twisty-alg-viewer",bt);var re=new b;re.replaceSync(`
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
`);var It=new b;It.replaceSync(`
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
`);function pn(e="",t=location.href){const r={alg:"alg","setup-alg":"experimental-setup-alg","setup-anchor":"experimental-setup-anchor",puzzle:"puzzle",stickering:"experimental-stickering","puzzle-description":"experimental-puzzle-description",title:"experimental-title","video-url":"experimental-video-url",competition:"experimental-competition-id"},i=new URL(t).searchParams,n={};for(const[s,a]of Object.entries(r)){const l=i.get(e+s);if(l!==null){const c=ne[a];n[c]=l}}return n}var K="outer block moves (e.g. R, Rw, or 4r)",ee="inner block moves (e.g. M or 2-5r)",Qe={OBTM:`HTM = OBTM ("Outer Block Turn Metric"):
• ${ee} count as 2 turns
• ${K} count as 1 turn
• rotations (e.g. x) count as 0 turns`,OBQTM:`QTM = OBQTM ("Outer Block Quantum Turn Metric"):
• ${ee} count as 2 turns per quantum (e.g. M2 counts as 4)
• ${K} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,RBTM:`STM = RBTM ("Range Block Turn Metric"):
• ${ee} count as 1 turn
• ${K} count as 1 turn
• rotations (e.g. x) count as 0 turns`,RBQTM:`SQTM = RBQTM ("Range Block Quantum Turn Metric"):
• ${ee} count as 1 turn per quantum (e.g. M2 counts as 2)
• ${K} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,ETM:`ETM ("Execution Turn Metric"):
• all moves (including rotations) count as 1 turn`},gn={OBTM:"OB",OBQTM:"OBQ",RBTM:"RB",RBQTM:"RBQ",ETM:"E"},fn=class extends I{constructor(e){super({mode:"open"}),this.options=e}options;twistyPlayer=null;a=null;#e(){if(this.contentWrapper.textContent="",this.a){const t=this.contentWrapper.appendChild(document.createElement("span"));t.textContent="❗️",t.title="Could not show a player for link",this.addElement(this.a)}this.removeCSS(re);const e=this.shadow.adoptedStyleSheets.indexOf(re);typeof e<"u"&&this.shadow.adoptedStyleSheets.splice(e,e+1),this.#t?.remove()}#t;#r;#i;#s;async connectedCallback(){if(this.#i=this.addElement(document.createElement("div")),this.#i.classList.add("responsive-wrapper"),this.options?.colorScheme==="dark"&&this.contentWrapper.classList.add("dark-mode"),this.addCSS(re),this.options?.cdnForumTweaks&&this.addCSS(It),this.a=this.querySelector("a"),!this.a)return;const e=pn("",this.a.href),t=this.a?.href,{hostname:r,pathname:i}=new URL(t);if(r!=="alpha.twizzle.net"){this.#e();return}if(["/edit/","/explore/"].includes(i)){const n=i==="/explore/";if(e.puzzle&&!(e.puzzle in _e)){const l=(await Ge(async()=>{const{getPuzzleDescriptionString:c}=await import("./index-Oozf9bYC.js");return{getPuzzleDescriptionString:c}},[])).getPuzzleDescriptionString(e.puzzle);delete e.puzzle,e.experimentalPuzzleDescription=l}if(this.twistyPlayer=this.#i.appendChild(new Z({background:this.options?.cdnForumTweaks?"checkered-transparent":"checkered",colorScheme:this.options?.colorScheme==="dark"?"dark":"light",...e,viewerLink:n?"experimental-twizzle-explorer":"auto"})),this.twistyPlayer.fullscreenElement=this.contentWrapper,e.experimentalTitle&&(this.twistyPlayer.experimentalTitle=e.experimentalTitle),this.#r=this.#i.appendChild(document.createElement("div")),this.#r.classList.add("scrollable-region"),e.experimentalTitle&&this.#n(e.experimentalTitle).classList.add("title"),e.experimentalSetupAlg){this.#n("Setup",async()=>(await this.twistyPlayer?.experimentalModel.setupAlg.get())?.alg.toString()??null);const l=this.#r.appendChild(document.createElement("div"));l.classList.add("setup-alg"),l.textContent=new z(e.experimentalSetupAlg).toString()}const s=this.#n("Moves",async()=>(await this.twistyPlayer?.experimentalModel.alg.get())?.alg.toString()??null);this.#s=s.appendChild(vn(this.twistyPlayer.experimentalModel)),this.#s.classList.add("move-count"),this.#r.appendChild(new bt({twistyPlayer:this.twistyPlayer})).part.add("twisty-alg-viewer")}else this.#e()}#n(e,t){const r=this.#r.appendChild(document.createElement("div"));r.classList.add("heading");const i=r.appendChild(document.createElement("span"));if(i.textContent=e,t){i.textContent+=" ";const n=i.appendChild(document.createElement("a"));n.textContent="📋",n.href="#",n.title="Copy to clipboard";async function s(a){n.textContent=a,await new Promise(l=>setTimeout(l,2e3)),n.textContent===a&&(n.textContent="📋")}n.addEventListener("click",async a=>{a.preventDefault(),n.textContent="📋…";const l=await t();if(l)try{await navigator.clipboard.writeText(l),s("📋✅")}catch(c){throw s("📋❌"),c}else s("📋❌")})}return r}};T.define("twizzle-link",fn);function vn(e,t=document.createElement("span")){async function r(){const[i,n]=await Promise.all([e.puzzleAlg.get(),e.puzzleLoader.get()]);if(i.issues.errors.length!==0){t.textContent="";return}let s=!0;function a(l){s?s=!1:t.append(")(");const c=t.appendChild(document.createElement("span")),o=Bt(n,l,i.alg);c.append(`${gn[l]}: `);const h=c.appendChild(document.createElement("span"));h.textContent=o.toString(),h.classList.add("move-number"),c.setAttribute("data-before",Qe[l]??""),c.setAttribute("title",Qe[l]??"")}t.textContent="(",n.id==="3x3x3"?(a("OBTM"),a("OBQTM"),a("RBTM")):n.pg&&(a("RBTM"),a("RBQTM")),a("ETM"),t.append(")")}return e.puzzleAlg.addFreshListener(r),e.puzzleID.addFreshListener(r),t}const te=e=>e*1e3;function In({cube:e,facelets:t,moves:r,position:i=r.length,speed:n=1,animateSeeks:s=!1,playback:a=!1,seekVersion:l=0,cross:c=null,rotation:o=Ut(c),colorFrame:h="",height:d=280,hidePLL:y=!1}){const w=F.useRef(null),x=F.useRef(null),D=F.useRef(null);return F.useEffect(()=>{const f=new Z({puzzle:"3x3x3",visualization:"3D",background:"none",controlPanel:"none",hintFacelets:"none"});return f.style.width="100%",f.style.height=`${d}px`,w.current?.appendChild(f),x.current=f,()=>{D.current&&cancelAnimationFrame(D.current.frame),D.current=null,f.pause(),f.remove(),x.current=null}},[d]),F.useEffect(()=>{const f=x.current;if(!f)return;const u=e.solved().applyAlg(h).patternData;f.experimentalStickeringMaskOrbits={orbits:{CENTERS:{pieces:Array.from({length:6},()=>null)},...Object.fromEntries(["EDGES","CORNERS"].map(g=>[g,{pieces:Wt[g].map((S,L)=>{const C=u[g].pieces.indexOf(L);return{facelets:S.map((U,le)=>y&&C<4&&le!==(S.length-u[g].orientation[C])%S.length?"ignored":"regular")}})}]))}}},[e,h,y,d]),F.useEffect(()=>{const f=x.current;if(!f)return;let u=D.current;if(!u||u.cube!==e||u.moves!==r||u.rotation!==o||u.colorFrame!==h){u&&cancelAnimationFrame(u.frame);const L=new z(r.slice(0,i).join(" ")),C=e.parse(t).applyAlg(L.invert()).experimentalToTransformation();f.experimentalModel.setupTransformation.set(e.solved().applyAlg(h).applyTransformation(C).applyAlg(o).experimentalToTransformation()),u={cube:e,moves:r,rotation:o,colorFrame:h,length:-1,cursor:i,target:i,speed:n,playback:a,seekVersion:l,time:0,frame:0},D.current=u}if(u.length!==r.length){const L=r.map(qt(e,o)).map(C=>new k(C));f.alg=new z(L),f.experimentalModel.animationTimelineLeavesRequest.set(L.map((C,U)=>({animLeaf:C,start:te(U),end:te(U+1)}))),u.length=r.length}if((l!==u.seekVersion||!s&&!a)&&Math.abs(i-u.target)>1&&(cancelAnimationFrame(u.frame),u.frame=0,u.cursor=i),u.target=i,u.speed=n,u.playback=a,u.seekVersion=l,f.timestamp=te(u.cursor),u.frame||u.cursor===u.target)return;const g=u;g.time=performance.now();const S=L=>{const C=Math.abs(g.target-g.cursor),U=Math.max(1,C)/(g.playback?80:100),le=Math.min(.95,Math.max(0,L-g.time)*g.speed*U);g.time=L,g.cursor+=Math.sign(g.target-g.cursor)*Math.min(Math.abs(g.target-g.cursor),le),f.timestamp=te(g.cursor),g.frame=g.cursor===g.target?0:requestAnimationFrame(S)};g.frame=requestAnimationFrame(S)},[e,t,r,r.length,i,n,s,a,l,o,h,d]),Lt.jsx("div",{ref:w,role:"img","aria-label":"Live 3x3 cube state"})}export{In as C,Xt as T,_t as a,A as b,bn as h};
