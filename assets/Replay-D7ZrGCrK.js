const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BdhXpoQ7.css"])))=>i.map(i=>d[i]);
import{r as k,j as m,u as pr}from"./index-DmfeTrWW.js";import{o as Be,a as kt,q as ye,u as gr,s as It,l as fr,C as Lt,w as vr,x as wr,f as he,t as yr,y as Mr,z as Ye,A as xr,k as Sr}from"./storage-Bt-FY82j.js";import{c as Me,m as br}from"./puzzle-DS2a_82R.js";import{L as Dt,_ as At,M as j,A as C,a as Tr,b as zr,p as Ct,d as kr,c as Ir,o as Lr,T as Te,f as ze,h as We,i as Dr,j as Ar,G as Se,C as _e,k as Cr,N as Er,l as $e,s as G,m as te,n as Nr,P as Ge}from"./cubing-core-BlVCN5VW.js";import{c as Pr,a as Rr,b as jr}from"./chunk-UEUJSZTX-CfQkmGpb.js";import{aq as Or,ak as Fr,ar as Vr,a6 as Ce,a2 as Ur,a3 as Br,a7 as Wr,a8 as Xe,as as qr}from"./MistakeAnalysis-F9JTMfay.js";import{f as Ze,a as Hr,i as Qr,u as Yr}from"./favorites-BOHBlVfA.js";var ke=class{#e=0;#t=0;queue(e){return new Promise(async(t,r)=>{try{const n=++this.#e,s=await e;n>this.#t&&(this.#t=n,t(s))}catch(n){r(n)}})}},Et=0,Nt=class{canReuse(e,t){return e===t||this.canReuseValue(e,t)}canReuseValue(e,t){return!1}debugGetChildren(){return Array.from(this.#e.values())}#e=new Set;addChild(e){this.#e.add(e)}removeChild(e){this.#e.delete(e)}lastSourceGeneration=0;markStale(e){if(e.detail.generation!==Et)throw new Error("A TwistyProp was marked stale too late!");if(this.lastSourceGeneration!==e.detail.generation){this.lastSourceGeneration=e.detail.generation;for(const t of this.#e)t.markStale(e);this.#r()}}#t=new Set;addRawListener(e,t){this.#t.add(e),t?.initial&&e()}removeRawListener(e){this.#t.delete(e)}#r(){this.#n||(this.#n=!0,setTimeout(()=>this.#i(),0))}#n=!1;#i(){if(!this.#n)throw new Error("Invalid dispatch state!");for(const e of this.#t)e();this.#n=!1}#s=new Map;addFreshListener(e){const t=new ke;let r=null;const n=async()=>{const s=await t.queue(this.get());r!==null&&this.canReuse(r,s)||(r=s,e(s))};this.#s.set(e,n),this.addRawListener(n,{initial:!0})}removeFreshListener(e){this.removeRawListener(this.#s.get(e)),this.#s.delete(e)}},Q=class extends Nt{#e;constructor(e){super(),this.#e=new Dt(async()=>this.getDefaultValue()),e&&(this.#e=this.deriveFromPromiseOrValue(e,this.#e))}set(e){this.#e=this.deriveFromPromiseOrValue(e,this.#e);const t={sourceProp:this,value:this.#e,generation:++Et};this.markStale(new CustomEvent("stale",{detail:t}))}async get(){return this.#e}async deriveFromPromiseOrValue(e,t){return this.derive(await e,t)}},x=class extends Q{derive(e){return e}},ne=Symbol("no value"),b=class extends Nt{constructor(e,t){super(),this.userVisibleErrorTracker=t,this.#e=e;for(const r of Object.values(e))r.addChild(this)}userVisibleErrorTracker;#e;#t=null;#r=null;async get(){const e=this.lastSourceGeneration;if(this.#r?.generation===e)return this.#r.output;const t={generation:e,output:this.#i(this.#n(),e,this.#t)};return this.#r=t,this.userVisibleErrorTracker?.reset(),t.output}async#n(){const e={};for(const[r,n]of Object.entries(this.#e))e[r]=n.get();const t={};for(const r in this.#e)t[r]=await e[r];return t}async#i(e,t,r=null){const n=await e,s=a=>(this.#t={inputs:n,output:Promise.resolve(a),generation:t},a);if(!r)return s(await this.derive(n));const i=r.inputs;for(const a in this.#e)if(!this.#e[a].canReuse(n[a],i[a]))return s(await this.derive(n));return r.output}},oe=class{#e=[];addListener(e,t){let r=!1;const n=s=>{r||t(s)};e.addFreshListener(n),this.#e.push(()=>{e.removeFreshListener(n),r=!0})}addMultiListener3(e,t){this.addMultiListener(e,t)}addMultiListener(e,t){let r=!1,n=e.length-1;const s=async i=>{if(n>0){n--;return}if(r)return;const a=e.map(d=>d.get()),o=await Promise.all(a);t(o)};for(const i of e)i.addFreshListener(s);this.#e.push(()=>{for(const i of e)i.removeFreshListener(s);r=!0})}disconnect(){for(const e of this.#e)e()}},_r=class{},se;globalThis.HTMLElement?se=globalThis.HTMLElement:se=_r;var $r=class{define(){}},D;globalThis.customElements?D=globalThis.customElements:D=new $r;var E,Gr=class{replaceSync(){}};globalThis.CSSStyleSheet?E=globalThis.CSSStyleSheet:E=Gr;var O=class extends se{shadow;contentWrapper;constructor(e){super(),this.shadow=this.attachShadow({mode:e?.mode??"closed"}),this.contentWrapper=document.createElement("div"),this.contentWrapper.classList.add("wrapper"),this.shadow.appendChild(this.contentWrapper)}addCSS(e){this.shadow.adoptedStyleSheets.push(e)}removeCSS(e){const t=this.shadow.adoptedStyleSheets.indexOf(e);typeof t<"u"&&this.shadow.adoptedStyleSheets.splice(t,t+1)}addElement(e){return this.contentWrapper.appendChild(e)}prependElement(e){this.contentWrapper.prepend(e)}removeElement(e){return this.contentWrapper.removeChild(e)}};D.define("twisty-managed-custom-element",O);var J=class{constructor(e){this.callback=e}callback;animFrameID=null;animFrame=this.animFrameWrapper.bind(this);requestIsPending(){return!!this.animFrameID}requestAnimFrame(){this.animFrameID||(this.animFrameID=requestAnimationFrame(this.animFrame))}cancelAnimFrame(){this.animFrameID&&(cancelAnimationFrame(this.animFrameID),this.animFrameID=0)}animFrameWrapper(e){this.animFrameID=0,this.callback(e)}},Xr={floating:!0,none:!0},Zr=class extends x{getDefaultValue(){return"auto"}},Kr=Math.PI*2,ie=360/Kr,V=new Dt(()=>At(()=>import("./twisty-dynamic-3d-4BEQ76PB-D9KI0LfX.js"),__vite__mapDeps([0])));function Re(){return devicePixelRatio||1}var Ke=.1,Jr=class extends EventTarget{constructor(e){super(),this.target=e}target;#e=new Map;start(){this.addTargetListener("pointerdown",this.onPointerDown.bind(this)),this.addTargetListener("contextmenu",e=>{e.preventDefault()}),this.addTargetListener("touchmove",e=>e.preventDefault()),this.addTargetListener("dblclick",e=>e.preventDefault())}stop(){for(const[e,t]of this.#t.entries())this.target.removeEventListener(e,t);this.#t.clear(),this.#r=!1}#t=new Map;addTargetListener(e,t){this.#t.has(e)||(this.target.addEventListener(e,t),this.#t.set(e,t))}#r=!1;#n(){this.#r||(this.addTargetListener("pointermove",this.onPointerMove.bind(this)),this.addTargetListener("pointerup",this.onPointerUp.bind(this)),this.#r=!0)}#i(e){this.#e.delete(e.pointerId)}#s(e){const t=this.#e.get(e.pointerId);if(!t)return{movementInfo:null,hasMoved:!1};let r;return(e.movementX??0)!==0||(e.movementY??0)!==0?r={attachedInfo:t.attachedInfo,movementX:e.movementX,movementY:e.movementY,elapsedMs:e.timeStamp-t.lastTimeStamp}:r={attachedInfo:t.attachedInfo,movementX:e.clientX-t.lastClientX,movementY:e.clientY-t.lastClientY,elapsedMs:e.timeStamp-t.lastTimeStamp},t.lastClientX=e.clientX,t.lastClientY=e.clientY,t.lastTimeStamp=e.timeStamp,Math.abs(r.movementX)<Ke&&Math.abs(r.movementY)<Ke?{movementInfo:null,hasMoved:t.hasMoved}:(t.hasMoved=!0,{movementInfo:r,hasMoved:t.hasMoved})}onPointerDown(e){this.#n();const t={attachedInfo:{},hasMoved:!1,lastClientX:e.clientX,lastClientY:e.clientY,lastTimeStamp:e.timeStamp};this.#e.set(e.pointerId,t),this.target.setPointerCapture(e.pointerId)}onPointerMove(e){const t=this.#s(e).movementInfo;t&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("move",{detail:t})))}onPointerUp(e){const t=this.#s(e),r=this.#e.get(e.pointerId);this.#i(e),this.target.releasePointerCapture(e.pointerId);let n;if(t.hasMoved)n=new CustomEvent("up",{detail:{attachedInfo:r.attachedInfo}});else{const{altKey:s,ctrlKey:i,metaKey:a,shiftKey:o}=e;n=new CustomEvent("press",{detail:{normalizedX:e.offsetX/this.target.offsetWidth*2-1,normalizedY:1-e.offsetY/this.target.offsetHeight*2,rightClick:!!(e.button&2),keys:{altKey:s,ctrlOrMetaKey:i||a,shiftKey:o}}})}this.dispatchEvent(n)}},re=[];async function Pt(e,t,r,n){re.length===0&&re.push(qe());const s=await re[0];return s.setSize(e,t),s.render(r,n),s.domElement}async function en(e,t,r,n,s){if(e===0||t===0)return;re.length===0&&re.push(qe());const i=await Pt(e,t,n,s),a=r.getContext("2d");a.clearRect(0,0,r.width,r.height),a.drawImage(i,0,0)}var tn="srgb-linear";async function qe(){const e=(await V).ThreeWebGLRenderer,t=new e({antialias:!0,alpha:!0});return t.outputColorSpace=tn,t.setPixelRatio(Re()),t}var Rt=new E;Rt.replaceSync(`
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
`);var rn=!0,Ee=500,nn=50,sn=.75;function Je(e){return(Math.exp(1-e)-(1-e))/(1-Math.E)+1}var an=class{constructor(e,t,r,n){this.startTimestamp=e,this.momentumX=t,this.momentumY=r,this.callback=n,this.scheduler.requestAnimFrame(),this.lastTimestamp=e}startTimestamp;momentumX;momentumY;callback;scheduler=new J(this.render.bind(this));lastTimestamp;render(e){const t=(this.lastTimestamp-this.startTimestamp)/Ee,r=Math.min(1,(e-this.startTimestamp)/Ee);if(t===0&&r>nn/Ee)return;const n=Je(r)-Je(t);this.callback(this.momentumX*n*1e3,this.momentumY*n*1e3),r<1&&this.scheduler.requestAnimFrame(),this.lastTimestamp=e}},on=class{constructor(e,t,r,n){this.model=e,this.mirror=t,this.canvas=r,this.dragTracker=n,this.dragTracker.addEventListener("move",this.onMove.bind(this)),this.dragTracker.addEventListener("up",this.onUp.bind(this))}model;mirror;canvas;dragTracker;experimentalInertia=rn;onMovementBound=this.onMovement.bind(this);experimentalHasBeenMoved=!1;temperMovement(e){return Math.sign(e)*Math.log(Math.abs(e*10)+1)/6}onMove(e){e.detail.attachedInfo??={};const{temperedX:t,temperedY:r}=this.onMovement(e.detail.movementX,e.detail.movementY),n=e.detail.attachedInfo;n.lastTemperedX=t*10,n.lastTemperedY=r*10,n.timestamp=e.timeStamp}onMovement(e,t){const r=this.mirror?-1:1,n=Math.min(this.canvas.offsetWidth,this.canvas.offsetHeight),s=this.temperMovement(e/n),i=this.temperMovement(t/n*sn);return this.model.twistySceneModel.orbitCoordinatesRequest.set((async()=>{const a=await this.model.twistySceneModel.orbitCoordinates.get();return{latitude:a.latitude+2*i*ie*r,longitude:a.longitude-2*s*ie}})()),{temperedX:s,temperedY:i}}onUp(e){e.preventDefault(),"lastTemperedX"in e.detail.attachedInfo&&"lastTemperedY"in e.detail.attachedInfo&&"timestamp"in e.detail.attachedInfo&&e.timeStamp-e.detail.attachedInfo.timestamp<60&&new an(e.timeStamp,e.detail.attachedInfo.lastTemperedX,e.detail.attachedInfo.lastTemperedY,this.onMovementBound)}};async function jt(e,t,r=!1){const n=new(await V).ThreeSpherical(t.distance,(90-(r?-1:1)*t.latitude)/ie,((r?180:0)+t.longitude)/ie);n.makeSafe(),e.position.setFromSpherical(n),e.lookAt(0,0,0)}var et=0,ln=2,Ot=!1;function cn(){return et<ln?(et++,!1):(Ot=!0,!0)}function Ri(){return Ot}var je=class extends O{constructor(e,t,r){super(),this.model=e,this.options=r,this.scene=t??null,this.loadingElement=this.addElement(document.createElement("div")),this.loadingElement.classList.add("loading")}model;options;scene=null;stats=null;rendererIsShared=cn();loadingElement=null;async connectedCallback(){this.addCSS(Rt),this.addElement((await this.canvasInfo()).canvas),this.#i(),new ResizeObserver(this.#i.bind(this)).observe(this.contentWrapper),this.orbitControls(),this.#e(),this.scheduleRender()}async#e(){(await this.#l()).addEventListener("press",(async t=>{await this.model.twistySceneModel.movePressInput.get()==="basic"&&this.dispatchEvent(new CustomEvent("press",{detail:{pressInfo:t.detail,cameraPromise:this.camera()}}))}))}#t=new ke;async clearCanvas(){if(this.rendererIsShared){const e=await this.canvasInfo();e.context.clearRect(0,0,e.canvas.width,e.canvas.height)}else{const t=(await this.renderer()).getContext();t.clear(t.COLOR_BUFFER_BIT)}}#r=0;#n=0;async#i(){const e=await this.#t.queue(this.camera()),t=this.contentWrapper.clientWidth,r=this.contentWrapper.clientHeight;this.#r=t,this.#n=r;const n=0;let s=0,i=0;if(r>t&&(i=r-t,s=-Math.floor(.5*i)),e.aspect=t/r,e.setViewOffset(t,r-i,n,s,t,r),e.updateProjectionMatrix(),this.clearCanvas(),this.rendererIsShared){const a=await this.canvasInfo();a.canvas.width=t*Re(),a.canvas.height=r*Re(),a.canvas.style.width=`${t.toString()}px`,a.canvas.style.height=`${r.toString()}px`}else(await this.renderer()).setSize(t,r,!0);this.scheduleRender()}#s=null;async renderer(){if(this.rendererIsShared)throw new Error("renderer expected to be shared.");return this.#s??=qe()}#a=null;async canvasInfo(){return this.#a??=(async()=>{let e;if(this.rendererIsShared)e=this.addElement(document.createElement("canvas"));else{const r=await this.renderer();e=this.addElement(r.domElement)}this.loadingElement?.remove();const t=e.getContext("2d");return{canvas:e,context:t}})()}#o=null;async#l(){return this.#o??=(async()=>{const e=new Jr((await this.canvasInfo()).canvas);return this.model?.twistySceneModel.dragInput.addFreshListener(t=>{let r=!1;switch(t){case"auto":{e.start(),r=!0;break}case"none":{e.stop();break}}this.contentWrapper.classList.toggle("drag-input-enabled",r)}),e})()}#d=null;async camera(){return this.#d??=(async()=>{const e=new(await V).ThreePerspectiveCamera(20,1,.1,20);return e.position.copy(new(await V).ThreeVector3(2,4,4).multiplyScalar(this.options?.backView?-1:1)),e.lookAt(0,0,0),e})()}#u=null;async orbitControls(){return this.#u??=(async()=>{const e=new on(this.model,!!this.options?.backView,(await this.canvasInfo()).canvas,await this.#l());return this.model&&this.addListener(this.model.twistySceneModel.orbitCoordinates,async t=>{const r=await this.camera();jt(r,t,this.options?.backView),this.scheduleRender()}),e})()}addListener(e,t){e.addFreshListener(t),this.#c.push(()=>{e.removeFreshListener(t)})}#c=[];disconnect(){for(const e of this.#c)e();this.#c=[]}#h=null;experimentalNextRenderFinishedCallback(e){this.#h=e}async render(){if(!this.scene)throw new Error("Attempted to render without a scene");this.stats?.begin();const[e,t,r]=await Promise.all([this.scene.scene(),this.camera(),this.canvasInfo()]);this.rendererIsShared?await en(this.#r,this.#n,r.canvas,e,t):(await this.renderer()).render(e,t),this.stats?.end(),this.#h?.(),this.#h=null}#m=new J(this.render.bind(this));scheduleRender(){this.#m.requestAnimFrame()}};D.define("twisty-3d-vantage",je);function $(e){switch(Math.abs(e)){case 0:return 0;case 1:return 1e3;case 2:return 1500;default:return 2e3}}var Ft=class extends Te{constructor(e=$){super(),this.durationForAmount=e}durationForAmount;traverseAlg(e){let t=0;for(const r of e.childAlgNodes())t+=this.traverseAlgNode(r);return t}traverseGrouping(e){return e.amount*this.traverseAlg(e.alg)}traverseMove(e){return this.durationForAmount(e.amount)}traverseCommutator(e){return 2*(this.traverseAlg(e.A)+this.traverseAlg(e.B))}traverseConjugate(e){return 2*this.traverseAlg(e.A)+this.traverseAlg(e.B)}traversePause(e){return this.durationForAmount(1)}traverseNewline(e){return this.durationForAmount(1)}traverseLineComment(e){return this.durationForAmount(0)}},dn=class{constructor(e,t){this.kpuzzle=e,this.moves=new C(t.experimentalExpand())}kpuzzle;moves;durationFn=new Ft($);getAnimLeaf(e){return Array.from(this.moves.childAlgNodes())[e]}indexToMoveStartTimestamp(e){const t=new C(Array.from(this.moves.childAlgNodes()).slice(0,e));return this.durationFn.traverseAlg(t)}timestampToIndex(e){let t=0,r;for(r=0;r<this.numAnimatedLeaves();r++)if(t+=this.durationFn.traverseMove(this.getAnimLeaf(r)),t>=e)return r;return r}patternAtIndex(e){return this.kpuzzle.defaultPattern().applyTransformation(this.transformationAtIndex(e))}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of Array.from(this.moves.childAlgNodes()).slice(0,e))t=t.applyMove(r);return t}algDuration(){return this.durationFn.traverseAlg(this.moves)}numAnimatedLeaves(){return Rr(this.moves)}moveDuration(e){return this.durationFn.traverseMove(this.getAnimLeaf(e))}},_=class{constructor(e,t,r,n,s=[]){this.moveCount=e,this.duration=t,this.forward=r,this.backward=n,this.children=s}moveCount;duration;forward;backward;children},un=class extends Te{constructor(e){super(),this.kpuzzle=e,this.identity=e.identityTransformation(),this.dummyLeaf=new _(0,0,this.identity,this.identity,[])}kpuzzle;identity;dummyLeaf;durationFn=new Ft($);cache={};traverseAlg(e){let t=0,r=0,n=this.identity;const s=[];for(const i of e.childAlgNodes()){const a=this.traverseAlgNode(i);t+=a.moveCount,r+=a.duration,n===this.identity?n=a.forward:n=n.applyTransformation(a.forward),s.push(a)}return new _(t,r,n,n.invert(),s)}traverseGrouping(e){const t=this.traverseAlg(e.alg);return this.mult(t,e.amount,[t])}traverseMove(e){const t=e.toString();let r=this.cache[t];if(r)return r;const n=this.kpuzzle.moveToTransformation(e);return r=new _(1,this.durationFn.traverseAlgNode(e),n,n.invert()),this.cache[t]=r,r}traverseCommutator(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),n=t.forward.applyTransformation(r.forward),s=t.backward.applyTransformation(r.backward),i=n.applyTransformation(s),a=new _(2*(t.moveCount+r.moveCount),2*(t.duration+r.duration),i,i.invert(),[t,r]);return this.mult(a,1,[a,t,r])}traverseConjugate(e){const t=this.traverseAlg(e.A),r=this.traverseAlg(e.B),s=t.forward.applyTransformation(r.forward).applyTransformation(t.backward),i=new _(2*t.moveCount+r.moveCount,2*t.duration+r.duration,s,s.invert(),[t,r]);return this.mult(i,1,[i,t,r])}traversePause(e){return e.experimentalNISSGrouping?this.dummyLeaf:new _(1,this.durationFn.traverseAlgNode(e),this.identity,this.identity)}traverseNewline(e){return this.dummyLeaf}traverseLineComment(e){return this.dummyLeaf}mult(e,t,r){const n=Math.abs(t),s=e.forward.selfMultiply(t);return new _(e.moveCount*n,e.duration*n,s,s.invert(),r)}},I=class{constructor(e,t){this.apd=e,this.back=t}apd;back},hn=class extends We{constructor(e,t,r){super(),this.kpuzzle=e,this.algOrAlgNode=t,this.apd=r,this.i=-1,this.dur=-1,this.goalIndex=-1,this.goalDuration=-1,this.move=void 0,this.back=!1,this.moveDuration=0,this.st=this.kpuzzle.identityTransformation(),this.root=new I(this.apd,!1)}kpuzzle;algOrAlgNode;apd;move;moveDuration;back;st;root;i;dur;goalIndex;goalDuration;moveByIndex(e){return this.i>=0&&this.i===e?this.move!==void 0:this.dosearch(e,1/0)}moveByDuration(e){return this.dur>=0&&this.dur<e&&this.dur+this.moveDuration>=e?this.move!==void 0:this.dosearch(1/0,e)}dosearch(e,t){return this.goalIndex=e,this.goalDuration=t,this.i=0,this.dur=0,this.move=void 0,this.moveDuration=0,this.back=!1,this.st=this.kpuzzle.identityTransformation(),this.algOrAlgNode.is(C)?this.traverseAlg(this.algOrAlgNode,this.root):this.traverseAlgNode(this.algOrAlgNode,this.root)}traverseAlg(e,t){if(!this.firstcheck(t))return!1;let r=t.back?e.experimentalNumChildAlgNodes()-1:0;for(const n of Dr(e.childAlgNodes(),t.back?-1:1)){if(this.traverseAlgNode(n,new I(t.apd.children[r],t.back)))return!0;r+=t.back?-1:1}return!1}traverseGrouping(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,e.amount);return this.traverseAlg(e.alg,new I(t.apd.children[0],r))}traverseMove(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseCommutator(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.B,new I(t.apd.children[2],!r))||this.traverseAlg(e.A,new I(t.apd.children[1],!r))||this.traverseAlg(e.B,new I(t.apd.children[2],r))||this.traverseAlg(e.A,new I(t.apd.children[1],r)):this.traverseAlg(e.A,new I(t.apd.children[1],r))||this.traverseAlg(e.B,new I(t.apd.children[2],r))||this.traverseAlg(e.A,new I(t.apd.children[1],!r))||this.traverseAlg(e.B,new I(t.apd.children[2],!r))}traverseConjugate(e,t){if(!this.firstcheck(t))return!1;const r=this.domult(t,1);return r?this.traverseAlg(e.A,new I(t.apd.children[1],!r))||this.traverseAlg(e.B,new I(t.apd.children[2],r))||this.traverseAlg(e.A,new I(t.apd.children[1],r)):this.traverseAlg(e.A,new I(t.apd.children[1],r))||this.traverseAlg(e.B,new I(t.apd.children[2],r))||this.traverseAlg(e.A,new I(t.apd.children[1],!r))}traversePause(e,t){return this.firstcheck(t)?(this.move=e,this.moveDuration=t.apd.duration,this.back=t.back,!0):!1}traverseNewline(e,t){return!1}traverseLineComment(e,t){return!1}firstcheck(e){return e.apd.moveCount+this.i<=this.goalIndex&&e.apd.duration+this.dur<this.goalDuration?this.keepgoing(e):!0}domult(e,t){let r=e.back;if(t===0)return r;t<0&&(r=!r,t=-t);const n=e.apd.children[0],s=Math.min(Math.floor((this.goalIndex-this.i)/n.moveCount),Math.ceil((this.goalDuration-this.dur)/n.duration-1));return s>0&&this.keepgoing(new I(n,r),s),r}keepgoing(e,t=1){return this.i+=t*e.apd.moveCount,this.dur+=t*e.apd.duration,t!==1?e.back?this.st=this.st.applyTransformation(e.apd.backward.selfMultiply(t)):this.st=this.st.applyTransformation(e.apd.forward.selfMultiply(t)):e.back?this.st=this.st.applyTransformation(e.apd.backward):this.st=this.st.applyTransformation(e.apd.forward),!1}},mn=16;function pn(e,t){const r=new $e,n=new $e;for(const s of e.childAlgNodes())n.push(s),n.experimentalNumAlgNodes()>=t&&(r.push(new Se(n.toAlg())),n.reset());return r.push(new Se(n.toAlg())),r.toAlg()}var gn=class extends Te{traverseAlg(e){const t=e.experimentalNumChildAlgNodes();return t<mn?e:pn(e,Math.ceil(Math.sqrt(t)))}traverseGrouping(e){return new Se(this.traverseAlg(e.alg),e.amount)}traverseMove(e){return e}traverseCommutator(e){return new _e(this.traverseAlg(e.A),this.traverseAlg(e.B))}traverseConjugate(e){return new _e(this.traverseAlg(e.A),this.traverseAlg(e.B))}traversePause(e){return e}traverseNewline(e){return e}traverseLineComment(e){return e}},fn=ze(gn),tt=class{constructor(e,t){this.kpuzzle=e;const r=new un(this.kpuzzle),n=fn(t);this.decoration=r.traverseAlg(n),this.walker=new hn(this.kpuzzle,n,this.decoration)}kpuzzle;decoration;walker;getAnimLeaf(e){if(this.walker.moveByIndex(e)){if(!this.walker.move)throw new Error("`this.walker.mv` missing");const t=this.walker.move;return this.walker.back?t.invert():t}return null}indexToMoveStartTimestamp(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}indexToMovesInProgress(e){if(this.walker.moveByIndex(e)||this.walker.i===e)return this.walker.dur;throw new Error(`Out of algorithm: index ${e}`)}patternAtIndex(e,t){return this.walker.moveByIndex(e),(t??this.kpuzzle.defaultPattern()).applyTransformation(this.walker.st)}transformationAtIndex(e){return this.walker.moveByIndex(e),this.walker.st}numAnimatedLeaves(){return this.decoration.moveCount}timestampToIndex(e){return this.walker.moveByDuration(e),this.walker.i}algDuration(){return this.decoration.duration}moveDuration(e){return this.walker.moveByIndex(e),this.walker.moveDuration}},vn=class extends x{getDefaultValue(){return"auto"}},me="http://www.w3.org/2000/svg",rt="data-copy-id",nt=0;function wn(){return nt+=1,`svg${nt.toString()}`}var yn={dim:{white:"#dddddd",orange:"#884400",limegreen:"#008800",red:"#660000","rgb(34, 102, 255)":"#000088",yellow:"#888800","rgb(102, 0, 153)":"rgb(50, 0, 76)",purple:"#3f003f"},oriented:"#44ddcc",ignored:"#555555",invisible:"#00000000"},Mn=class{constructor(e,t,r,n=!1){if(this.kpuzzle=e,this.showUnknownOrientations=n,!t)throw new Error(`No SVG definition for puzzle type: ${e.name()}`);this.svgID=wn(),this.wrapperElement=document.createElement("div"),this.wrapperElement.classList.add("svg-wrapper"),this.wrapperElement.innerHTML=t;const s=this.wrapperElement.querySelector("svg");if(!s)throw new Error("Could not get SVG element");if(this.svgElement=s,me!==s.namespaceURI)throw new Error("Unexpected XML namespace");s.style.maxWidth="100%",s.style.maxHeight="100%",this.gradientDefs=document.createElementNS(me,"defs"),s.insertBefore(this.gradientDefs,s.firstChild);for(const i of e.definition.orbits)for(let a=0;a<i.numPieces;a++)for(let o=0;o<i.numOrientations;o++){const d=this.elementID(i.orbitName,a,o),l=this.elementByID(d);let h=l?.style.fill;r?(()=>{const c=r.orbits;if(!c)return;const u=c[i.orbitName];if(!u)return;const p=u.pieces[a];if(!p)return;const f=p.facelets[o];if(!f)return;const w=typeof f=="string"?f:f?.mask,y=yn[w];typeof y=="string"?h=y:y&&(h=y[h])})():h=l?.style.fill,this.originalColors[d]=h,this.gradients[d]=this.newGradient(d,h),this.gradientDefs.appendChild(this.gradients[d]),l?.setAttribute("style",`fill: url(#grad-${this.svgID}-${d})`)}for(const i of Array.from(s.querySelectorAll(`[${rt}]`))){const a=i.getAttribute(rt);i.setAttribute("style",`fill: url(#grad-${this.svgID}-${a})`)}this.showUnknownOrientations&&this.drawPattern(this.kpuzzle.defaultPattern())}kpuzzle;showUnknownOrientations;wrapperElement;svgElement;gradientDefs;originalColors={};gradients={};svgID;drawPattern(e,t,r){this.draw(e,t,r)}draw(e,t,r){const n=t?.experimentalToTransformation();if(!e)throw new Error("Distinguishable pieces are not handled for SVG yet!");for(const s of e.kpuzzle.definition.orbits){const i=e.patternData[s.orbitName],a=n?n.transformationData[s.orbitName]:null;for(let o=0;o<s.numPieces;o++)for(let d=0;d<s.numOrientations;d++){const l=this.elementID(s.orbitName,o,d),h=this.elementID(s.orbitName,i.pieces[o],(s.numOrientations-i.orientation[o]+d)%s.numOrientations);let c=!1;if(a){const u=this.elementID(s.orbitName,a.permutation[o],(s.numOrientations-a.orientationDelta[o]+d)%s.numOrientations);h===u&&(c=!0),r=r||0;const p=100*(1-r*r*(2-r*r));this.gradients[l].children[0].setAttribute("stop-color",this.originalColors[h]),this.gradients[l].children[0].setAttribute("offset",`${Math.max(p-5,0)}%`),this.gradients[l].children[1].setAttribute("offset",`${Math.max(p-5,0)}%`),this.gradients[l].children[2].setAttribute("offset",`${p}%`),this.gradients[l].children[3].setAttribute("offset",`${p}%`),this.gradients[l].children[3].setAttribute("stop-color",this.originalColors[u])}else c=!0;c&&(this.showUnknownOrientations&&i.orientationMod?.[o]===1?(this.gradients[l].children[0].setAttribute("stop-color","#000"),this.gradients[l].children[0].setAttribute("offset","5%"),this.gradients[l].children[1].setAttribute("offset","5%"),this.gradients[l].children[2].setAttribute("offset","20%"),this.gradients[l].children[3].setAttribute("offset","20%"),this.gradients[l].children[3].setAttribute("stop-color",this.originalColors[h])):(this.gradients[l].children[0].setAttribute("stop-color",this.originalColors[h]),this.gradients[l].children[0].setAttribute("offset","100%"),this.gradients[l].children[1].setAttribute("offset","100%"),this.gradients[l].children[2].setAttribute("offset","100%"),this.gradients[l].children[3].setAttribute("offset","100%")))}}}newGradient(e,t){const r=document.createElementNS(me,"radialGradient");r.setAttribute("id",`grad-${this.svgID}-${e}`),r.setAttribute("r","70.7107%");const n=[{offset:0,color:t},{offset:0,color:"black"},{offset:0,color:"black"},{offset:0,color:t}];for(const s of n){const i=document.createElementNS(me,"stop");i.setAttribute("offset",`${s.offset}%`),i.setAttribute("stop-color",s.color),i.setAttribute("stop-opacity","1"),r.appendChild(i)}return r}elementID(e,t,r){return`${e}-l${t}-o${r}`}elementByID(e){return this.wrapperElement.querySelector(`#${e}`)}},le=class{constructor(e,t,r){this.elem=e,this.prefix=t,this.validSuffixes=r}elem;prefix;validSuffixes;#e=null;clearValue(){this.#e&&this.elem.contentWrapper.classList.remove(this.#e),this.#e=null}setValue(e){if(!this.validSuffixes.includes(e))throw new Error(`Invalid suffix: ${e}`);const t=`${this.prefix}${e}`,r=this.#e!==t;return r&&(this.clearValue(),this.elem.contentWrapper.classList.add(t),this.#e=t),r}};function Oe(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0}function st(e,t,r){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(!r(e[n],t[n]))return!1;return!0}function Fe(e,t,r){return Lr(e,r-t,t)}var xn=class{constructor(e){this.model=e,e.tempoScale.addFreshListener(t=>{this.tempoScale=t})}model;catchingUp=!1;pendingFrame=!1;tempoScale=1;scheduler=new J(this.animFrame.bind(this));start(){this.catchingUp||(this.lastTimestamp=performance.now()),this.catchingUp=!0,this.pendingFrame=!0,this.scheduler.requestAnimFrame()}stop(){this.catchingUp=!1,this.scheduler.cancelAnimFrame()}catchUpMs=500;lastTimestamp=0;animFrame(e){this.scheduler.requestAnimFrame();const t=this.tempoScale*(e-this.lastTimestamp)/this.catchUpMs;this.lastTimestamp=e,this.model.catchUpMove.set((async()=>{const r=await this.model.catchUpMove.get();if(r.move===null)return r;const n=r.amount+t;return n>=1?(this.pendingFrame=!0,this.stop(),this.model.timestampRequest.set("end"),{move:null,amount:0}):(this.pendingFrame=!1,{move:r.move,amount:n})})())}},Sn=class{constructor(e,t){this.delegate=t,this.model=e,this.lastTimestampPromise=this.#e(),this.model.playingInfo.addFreshListener(this.onPlayingProp.bind(this)),this.catchUpHelper=new xn(this.model),this.model.catchUpMove.addFreshListener(this.onCatchUpMoveProp.bind(this))}delegate;playing=!1;direction=1;catchUpHelper;model;lastDatestamp=0;lastTimestampPromise;scheduler=new J(this.animFrame.bind(this));async onPlayingProp(e){e.playing!==this.playing&&(e.playing?this.play(e):this.pause())}async onCatchUpMoveProp(e){const t=e.move!==null;t!==this.catchUpHelper.catchingUp&&(t?this.catchUpHelper.start():this.catchUpHelper.stop()),this.scheduler.requestAnimFrame()}async#e(){return(await this.model.detailedTimelineInfo.get()).timestamp}jumpToStart(e){this.model.timestampRequest.set("start"),this.pause(),e?.flash&&this.delegate.flash()}jumpToEnd(e){this.model.timestampRequest.set("end"),this.pause(),e?.flash&&this.delegate.flash()}playPause(){this.playing?this.pause():this.play()}play(e){(async()=>{const t=e?.direction??1,r=await this.model.coarseTimelineInfo.get();(e?.autoSkipToOtherEndIfStartingAtBoundary??!0)&&(t===1&&r.atEnd&&(this.model.timestampRequest.set("start"),this.delegate.flash()),t===-1&&r.atStart&&(this.model.timestampRequest.set("end"),this.delegate.flash())),this.model.playingInfo.set({playing:!0,direction:t,untilBoundary:e?.untilBoundary??"entire-timeline",loop:e?.loop??!1}),this.playing=!0,this.lastDatestamp=performance.now(),this.lastTimestampPromise=this.#e(),this.scheduler.requestAnimFrame()})()}pause(){this.playing=!1,this.scheduler.cancelAnimFrame(),this.model.playingInfo.set({playing:!1,untilBoundary:"entire-timeline"})}#t=new ke;async animFrame(e){this.playing&&this.scheduler.requestAnimFrame();const t=this.lastDatestamp,r=await this.#t.queue(Promise.all([this.model.playingInfo.get(),this.lastTimestampPromise,this.model.timeRange.get(),this.model.tempoScale.get(),this.model.currentMoveInfo.get()])),[n,s,i,a,o]=r;if(!n.playing){this.playing=!1;return}let d=o.earliestEnd;(o.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(d=i.end);let l=o.latestStart;(o.currentMoves.length===0||n.untilBoundary==="entire-timeline")&&(l=i.start);let h=(e-t)*this.direction*a;h=Math.max(h,1),h*=n.direction;let c=s+h,u=null;c>=d?n.loop?c=Fe(c,i.start,i.end):(c===i.end?u="end":c=d,this.playing=!1,this.model.playingInfo.set({playing:!1})):c<=l&&(n.loop?c=Fe(c,i.start,i.end):(c===i.start?u="start":c=l,this.playing=!1,this.model.playingInfo.set({playing:!1}))),this.lastDatestamp=e,this.lastTimestampPromise=Promise.resolve(c),this.model.timestampRequest.set(u??c)}},bn=class{constructor(e,t){this.model=e,this.animationController=new Sn(e,t)}model;animationController;jumpToStart(e){this.animationController.jumpToStart(e)}jumpToEnd(e){this.animationController.jumpToEnd(e)}togglePlay(e){typeof e>"u"&&this.animationController.playPause(),e?this.animationController.play():this.animationController.pause()}async visitTwizzleLink(){const e=document.createElement("a");e.href=await this.model.twizzleLink(),e.target="_blank",e.click()}},Tn={"bottom-row":!0,none:!0},zn=class extends x{getDefaultValue(){return"auto"}},He=new E;He.replaceSync(`
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
`);var Vt=new E;Vt.replaceSync(`
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
`);var Ut=class extends O{constructor(e,t,r,n,s){super(),this.model=e,this.kpuzzle=t,this.svgSource=r,this.options=n,this.puzzleLoader=s,this.addCSS(Vt),this.resetSVG(),this.#t.addListener(this.model.puzzleID,i=>{s?.id!==i&&this.disconnect()}),this.#t.addListener(this.model.twistySceneModel.hintFacelet,i=>{this.setHintFacelet(i)}),this.#t.addListener(this.model.legacyPosition,this.onPositionChange.bind(this)),this.options?.experimentalStickeringMask&&this.experimentalSetStickeringMask(this.options.experimentalStickeringMask)}model;kpuzzle;svgSource;options;puzzleLoader;svgWrapper;scheduler=new J(this.render.bind(this));#e=null;#t=new oe;disconnect(){this.#t.disconnect()}onPositionChange(e){try{if(e.movesInProgress.length>0){const t=e.movesInProgress[0].move;let r=t;e.movesInProgress[0].direction===-1&&(r=t.invert());const n=e.pattern.applyMove(r);this.svgWrapper?.draw(e.pattern,n,e.movesInProgress[0].fraction)}else this.svgWrapper?.draw(e.pattern),this.#e=e}catch(t){console.warn("Bad position (this doesn't necessarily mean something is wrong). Pre-emptively disconnecting:",this.puzzleLoader?.id,t),this.disconnect()}}scheduleRender(){this.scheduler.requestAnimFrame()}experimentalSetStickeringMask(e){this.resetSVG(e)}resetSVG(e){this.svgWrapper&&this.removeElement(this.svgWrapper.wrapperElement),this.kpuzzle&&(this.svgWrapper=new Mn(this.kpuzzle,this.svgSource,e),this.addElement(this.svgWrapper.wrapperElement),this.#e&&this.onPositionChange(this.#e))}hintFaceletsClassListManager=new le(this,"hint-facelets-",Object.keys(Xr));setHintFacelet(e){this.hintFaceletsClassListManager.setValue(e==="auto"?"floating":e)}render(){}};D.define("twisty-2d-puzzle",Ut);var kn=class{constructor(e,t,r,n){this.model=e,this.schedulable=t,this.puzzleLoader=r,this.effectiveVisualization=n,this.twisty2DPuzzle(),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async s=>{(await this.twisty2DPuzzle()).experimentalSetStickeringMask(s)})}model;schedulable;puzzleLoader;effectiveVisualization;#e=new oe;disconnect(){this.#e.disconnect()}scheduleRender(){}#t=null;async twisty2DPuzzle(){return this.#t??=(async()=>{const e=this.effectiveVisualization==="experimental-2D-LL-face"?this.puzzleLoader.llFaceSVG():this.effectiveVisualization==="experimental-2D-LL"?this.puzzleLoader.llSVG():this.puzzleLoader.svg();return new Ut(this.model,await this.puzzleLoader.kpuzzle(),await e,{},this.puzzleLoader)})()}},Bt=class extends O{constructor(e,t){super(),this.model=e,this.effectiveVisualization=t}model;effectiveVisualization;#e=new oe;disconnect(){this.#e.disconnect()}async connectedCallback(){this.addCSS(He),this.model&&this.#e.addListener(this.model.twistyPlayerModel.puzzleLoader,this.onPuzzleLoader.bind(this))}#t;async scene(){return this.#t??=(async()=>new(await V).ThreeScene)()}scheduleRender(){this.#r?.scheduleRender()}#r;currentTwisty2DPuzzleWrapper(){return this.#r}async setCurrentTwisty2DPuzzleWrapper(e){const t=this.#r;this.#r=e,t?.disconnect();const r=e.twisty2DPuzzle();this.contentWrapper.textContent="",this.addElement(await r)}async onPuzzleLoader(e){this.#r?.disconnect();const t=new kn(this.model.twistyPlayerModel,this,e,this.effectiveVisualization);this.setCurrentTwisty2DPuzzleWrapper(t)}};D.define("twisty-2d-scene-wrapper",Bt);var Wt=class{#e;reject;promise;constructor(){this.promise=new Promise((e,t)=>{this.#e=e,this.reject=t})}handleNewValue(e){this.#e(e)}},qt=class extends EventTarget{constructor(e,t,r,n){super(),this.model=e,this.schedulable=t,this.puzzleLoader=r,this.visualizationStrategy=n,this.twisty3DPuzzle(),this.#e.addListener(this.model.puzzleLoader,s=>{this.puzzleLoader.id!==s.id&&this.disconnect()}),this.#e.addListener(this.model.legacyPosition,async s=>{try{(await this.twisty3DPuzzle()).onPositionChange(s),this.scheduleRender()}catch{this.disconnect()}}),this.#e.addListener(this.model.twistySceneModel.hintFacelet,async s=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFacelets:s==="auto"?"floating":s}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.foundationDisplay,async s=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({showFoundation:s!=="none"}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.stickeringMask,async s=>{(await this.twisty3DPuzzle()).setStickeringMask(s),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.faceletScale,async s=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({faceletScale:s}),this.scheduleRender()}),this.#e.addListener(this.model.twistySceneModel.hintFaceletsElevation,async s=>{(await this.twisty3DPuzzle()).experimentalUpdateOptions({hintFaceletsElevation:s}),this.scheduleRender()}),this.#e.addMultiListener3([this.model.twistySceneModel.stickeringMask,this.model.twistySceneModel.foundationStickerSprite,this.model.twistySceneModel.hintStickerSprite],async s=>{"experimentalUpdateTexture"in await this.twisty3DPuzzle()&&((await this.twisty3DPuzzle()).experimentalUpdateTexture(s[0].specialBehaviour==="picture",s[1],s[2]),this.scheduleRender())})}model;schedulable;puzzleLoader;visualizationStrategy;#e=new oe;disconnect(){this.#e.disconnect()}scheduleRender(){this.schedulable.scheduleRender(),this.dispatchEvent(new CustomEvent("render-scheduled"))}#t=null;async twisty3DPuzzle(){return this.#t??=(async()=>{if(this.puzzleLoader.id==="3x3x3"&&this.visualizationStrategy==="Cube3D"){const[e,t,r,n,s,i]=await Promise.all([this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.stickeringMask.get(),this.model.twistySceneModel.initialHintFaceletsAnimation.get(),this.model.twistySceneModel.faceletScale.get(),this.model.twistySceneModel.hintFaceletsElevation.get()]);return(await V).cube3DShim(()=>this.schedulable.scheduleRender(),{foundationSprite:e,hintSprite:t,experimentalStickeringMask:r,initialHintFaceletsAnimation:n,faceletScale:s,hintFaceletsElevation:i})}else{const[e,t,r,n]=await Promise.all([this.model.twistySceneModel.hintFacelet.get(),this.model.twistySceneModel.foundationStickerSprite.get(),this.model.twistySceneModel.hintStickerSprite.get(),this.model.twistySceneModel.faceletScale.get()]),s=(await V).pg3dShim(()=>this.schedulable.scheduleRender(),this.puzzleLoader,e==="auto"?"floating":e,n,this.puzzleLoader.id==="kilominx");return s.then(i=>i.experimentalUpdateTexture(!0,t??void 0,r??void 0)),s}})()}async raycastMove(e,t){const r=await this.twisty3DPuzzle();if(!("experimentalGetControlTargets"in r)){console.info("not PG3D! skipping raycast");return}const n=r.experimentalGetControlTargets(),[s,i]=await Promise.all([e,this.model.twistySceneModel.movePressCancelOptions.get()]),a=s.intersectObjects(n);if(a.length>0){const o=r.getClosestMoveToAxis(a[0].point,t);o?this.model.experimentalAddMove(o.move,{cancel:i}):console.info("Skipping move!")}}},Ve=class extends O{constructor(e){super(),this.model=e}model;#e=new le(this,"back-view-",["auto","none","side-by-side","top-right"]);#t=new oe;disconnect(){this.#t.disconnect()}async connectedCallback(){this.addCSS(He);const e=new je(this.model,this);this.addVantage(e),this.model&&(this.#t.addMultiListener([this.model.puzzleLoader,this.model.visualizationStrategy],this.onPuzzle.bind(this)),this.#t.addListener(this.model.backView,this.setBackView.bind(this))),this.scheduleRender()}#r=null;setBackView(e){const t=["side-by-side","top-right"].includes(e),r=this.#r!==null;this.#e.setValue(e),t?r||(this.#r=new je(this.model,this,{backView:!0}),this.addVantage(this.#r),this.scheduleRender()):this.#r&&(this.removeVantage(this.#r),this.#r=null)}async onPress(e){const t=this.#s;if(!t){console.info("no wrapper; skipping scene wrapper press!");return}const r=(async()=>{const[n,{ThreeRaycaster:s,ThreeVector2:i}]=await Promise.all([e.detail.cameraPromise,(async()=>{const{ThreeRaycaster:d,ThreeVector2:l}=await V;return{ThreeRaycaster:d,ThreeVector2:l}})()]),a=new s,o=new i(e.detail.pressInfo.normalizedX,e.detail.pressInfo.normalizedY);return a.setFromCamera(o,n),a})();await t.raycastMove(r,{invert:!e.detail.pressInfo.rightClick,depth:e.detail.pressInfo.keys.ctrlOrMetaKey?"rotation":e.detail.pressInfo.keys.shiftKey?"secondSlice":"none"})}#n;async scene(){return this.#n??=(async()=>new(await V).ThreeScene)()}#i=new Set;addVantage(e){e.addEventListener("press",this.onPress.bind(this)),this.#i.add(e),this.contentWrapper.appendChild(e)}removeVantage(e){this.#i.delete(e),e.remove(),e.disconnect(),this.#s?.disconnect()}experimentalVantages(){return this.#i.values()}scheduleRender(){for(const e of this.#i)e.scheduleRender()}#s=null;async setCurrentTwisty3DPuzzleWrapper(e,t){const r=this.#s;try{this.#s=t,r?.disconnect(),e.add(await t.twisty3DPuzzle())}finally{r&&e.remove(await r.twisty3DPuzzle())}this.#a.handleNewValue(t)}#a=new Wt;async experimentalTwisty3DPuzzleWrapper(){return this.#s||this.#a.promise}#o=new ke;async onPuzzle(e){if(e[1]==="2D")return;this.#s?.disconnect();const[t,r]=await this.#o.queue(Promise.all([this.scene(),new qt(this.model,this,e[0],e[1])]));this.setCurrentTwisty3DPuzzleWrapper(t,r)}};D.define("twisty-3d-scene-wrapper",Ve);var H=typeof document>"u"?null:document,In=H?.fullscreenEnabled||!!H?.webkitFullscreenEnabled;function Ln(){return document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen()}function it(){return document.fullscreenElement?document.fullscreenElement:document.webkitFullscreenElement??null}function Dn(e){return e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen()}var An=["skip-to-start","skip-to-end","step-forward","step-backward","pause","play","enter-fullscreen","exit-fullscreen","twizzle-tw"],Cn=class extends b{derive(e){return{fullscreen:{enabled:In,icon:document.fullscreenElement===null?"enter-fullscreen":"exit-fullscreen",title:"Enter fullscreen"},"jump-to-start":{enabled:!e.coarseTimelineInfo.atStart,icon:"skip-to-start",title:"Restart"},"play-step-backwards":{enabled:!e.coarseTimelineInfo.atStart,icon:"step-backward",title:"Step backward"},"play-pause":{enabled:!(e.coarseTimelineInfo.atStart&&e.coarseTimelineInfo.atEnd),icon:e.coarseTimelineInfo.playing?"pause":"play",title:e.coarseTimelineInfo.playing?"Pause":"Play"},"play-step":{enabled:!e.coarseTimelineInfo.atEnd,icon:"step-forward",title:"Step forward"},"jump-to-end":{enabled:!e.coarseTimelineInfo.atEnd,icon:"skip-to-end",title:"Skip to End"},"twizzle-link":{enabled:!0,icon:"twizzle-tw",title:"View at Twizzle",hidden:e.viewerLink==="none"}}}},Ht=new E;Ht.replaceSync(`
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
`);var Qt=new E;Qt.replaceSync(`
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
`);var at={fullscreen:!0,"jump-to-start":!0,"play-step-backwards":!0,"play-pause":!0,"play-step":!0,"jump-to-end":!0,"twizzle-link":!0},Yt=class extends O{constructor(e,t,r){super(),this.model=e,this.controller=t,this.defaultFullscreenElement=r}model;controller;defaultFullscreenElement;buttons=null;connectedCallback(){this.addCSS(Ht);const e={};for(const t in at){const r=new _t;e[t]=r,r.htmlButton.addEventListener("click",()=>this.#e(t)),this.addElement(r)}this.buttons=e,this.model?.buttonAppearance.addFreshListener(this.update.bind(this)),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}#e(e){switch(e){case"fullscreen":{this.onFullscreenButton();break}case"jump-to-start":{this.controller?.jumpToStart({flash:!0});break}case"play-step-backwards":{this.controller?.animationController.play({direction:-1,untilBoundary:"move"});break}case"play-pause":{this.controller?.togglePlay();break}case"play-step":{this.controller?.animationController.play({direction:1,untilBoundary:"move"});break}case"jump-to-end":{this.controller?.jumpToEnd({flash:!0});break}case"twizzle-link":{this.controller?.visitTwizzleLink();break}default:throw new Error("Missing command")}}async onFullscreenButton(){if(!this.defaultFullscreenElement)throw new Error("Attempted to go fullscreen without an element.");if(it()===this.defaultFullscreenElement)Ln();else{this.buttons?.fullscreen.setIcon("exit-fullscreen"),Dn(await this.model?.twistySceneModel.fullscreenElement.get()??this.defaultFullscreenElement);const e=()=>{it()!==this.defaultFullscreenElement&&(this.buttons?.fullscreen.setIcon("enter-fullscreen"),globalThis.removeEventListener("fullscreenchange",e))};globalThis.addEventListener("fullscreenchange",e)}}async update(e){for(const t in at){const r=this.buttons[t],n=e[t];r.htmlButton.disabled=!n.enabled,r.htmlButton.title=n.title,r.setIcon(n.icon),r.hidden=!!n.hidden}}updateColorScheme(e){for(const t of Object.values(this.buttons??{}))t.updateColorScheme(e)}};D.define("twisty-buttons",Yt);var _t=class extends O{htmlButton=document.createElement("button");updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}connectedCallback(){this.addCSS(Qt),this.addElement(this.htmlButton)}#e=new le(this,"svg-",An);setIcon(e){this.#e.setValue(e)}};D.define("twisty-button",_t);var $t=new E;$t.replaceSync(`
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
`);H?.addEventListener("mousedown",e=>{e.which},!0);H?.addEventListener("mouseup",e=>{e.which},!0);H?.addEventListener("mousedown",()=>{},!1);H?.addEventListener("mousemove",Gt,!1);H?.addEventListener("mouseenter",Gt,!1);function Gt(e){e.pageY}var Xt=class extends O{constructor(e,t){super(),this.model=e,this.controller=t}model;controller;async onDetailedTimelineInfo(e){const t=await this.inputElem();t.min=e.timeRange.start.toString(),t.max=e.timeRange.end.toString(),t.disabled=t.min===t.max,t.value=e.timestamp.toString()}async connectedCallback(){this.addCSS($t),this.addElement(await this.inputElem()),this.model?.twistySceneModel.colorScheme.addFreshListener(this.updateColorScheme.bind(this))}updateColorScheme(e){this.contentWrapper.classList.toggle("dark-mode",e==="dark")}#e=null;async inputElem(){return this.#e??=(async()=>{const e=document.createElement("input");return e.type="range",e.disabled=!0,this.model?.detailedTimelineInfo.addFreshListener(this.onDetailedTimelineInfo.bind(this)),e.addEventListener("input",this.onInput.bind(this)),e.addEventListener("keydown",this.onKeypress.bind(this)),e})()}async onInput(e){const t=await this.inputElem();await this.slowDown(e,t);const r=parseInt(t.value,10);this.model?.playingInfo.set({playing:!1}),this.model?.timestampRequest.set(r)}onKeypress(e){switch(e.key){case"ArrowLeft":case"ArrowRight":{this.controller?.animationController.play({direction:e.key==="ArrowLeft"?-1:1,untilBoundary:"move"}),e.preventDefault();break}case" ":{this.controller?.togglePlay(),e.preventDefault();break}}}async slowDown(e,t){}};D.define("twisty-scrubber",Xt);var En=null;async function ot(e,t){const[{ThreePerspectiveCamera:r,ThreeScene:n},s,i,a,o,d,l]=await Promise.all([(async()=>{const{ThreePerspectiveCamera:M,ThreeScene:N}=await V;return{ThreePerspectiveCamera:M,ThreeScene:N}})(),await e.puzzleLoader.get(),await e.visualizationStrategy.get(),await e.twistySceneModel.stickeringRequest.get(),await e.twistySceneModel.stickeringMaskRequest.get(),await e.legacyPosition.get(),await e.twistySceneModel.orbitCoordinates.get()]),h=t?.width??2048,c=t?.height??2048,u=h/c,p=En??=await(async()=>new r(20,u,.1,20))(),f=new n,w=new qt(e,{scheduleRender:()=>{}},s,i);f.add(await w.twisty3DPuzzle()),await jt(p,l);const T=(await Pt(h,c,f,p)).toDataURL(),A=await Zt(e);return{dataURL:T,download:async M=>{Kt(T,M??A)}}}async function Zt(e){const[t,r]=await Promise.all([e.puzzleID.get(),e.alg.get()]);return`[${t}]${r.alg.experimentalNumChildAlgNodes()===0?"":` ${r.alg.toString()}`}`}function Kt(e,t,r="png"){const n=document.createElement("a");n.href=e,n.download=`${t}.${r}`,n.click()}var Jt=new E;Jt.replaceSync(`
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
`);var lt=class extends x{getDefaultValue(){return null}},Ue=class extends Q{getDefaultValue(){return null}derive(e){return typeof e=="string"?new URL(e,location.href):e}},ae=class er{warnings;errors;constructor(t){this.warnings=Object.freeze(t?.warnings??[]),this.errors=Object.freeze(t?.errors??[]),Object.freeze(this)}add(t){return new er({warnings:this.warnings.concat(t?.warnings??[]),errors:this.errors.concat(t?.errors??[])})}log(){this.errors.length>0?console.error(`🚨 ${this.errors[0]}`):this.warnings.length>0?console.warn(`⚠️ ${this.warnings[0]}`):console.info("😎 No issues!")}};function tr(e){try{const t=C.fromString(e),r=[];return t.toString()!==e&&r.push("Alg is non-canonical!"),{alg:t,issues:new ae({warnings:r})}}catch(t){return{alg:new C,issues:new ae({errors:[`Malformed alg: ${t.toString()}`]})}}}function Nn(e,t){return e.alg.isIdentical(t.alg)&&Oe(e.issues.warnings,t.issues.warnings)&&Oe(e.issues.errors,t.issues.errors)}var ct=class extends Q{getDefaultValue(){return{alg:new C,issues:new ae}}canReuseValue(e,t){return Nn(e,t)}async derive(e){return typeof e=="string"?tr(e):{alg:e,issues:new ae}}},Pn=class extends b{derive(e){return e.kpuzzle.algToTransformation(e.setupAlg.alg)}},Rn=class extends b{derive(e){if(e.setupTransformation)return e.setupTransformation;switch(e.setupAnchor){case"start":return e.setupAlgTransformation;case"end":{const r=e.indexer.transformationAtIndex(e.indexer.numAnimatedLeaves()).invert();return e.setupAlgTransformation.applyTransformation(r)}default:throw new Error("Unimplemented!")}}},jn=class extends x{getDefaultValue(){return null}},On=class extends x{getDefaultValue(){return{move:null,amount:0}}canReuseValue(e,t){return e.move===t.move&&e.amount===t.amount}},Fn=class extends b{derive(e){return{patternIndex:e.currentMoveInfo.patternIndex,movesFinishing:e.currentMoveInfo.movesFinishing.map(t=>t.move),movesFinished:e.currentMoveInfo.movesFinished.map(t=>t.move)}}canReuseValue(e,t){return e.patternIndex===t.patternIndex&&st(e.movesFinishing,t.movesFinishing,(r,n)=>r.isIdentical(n))&&st(e.movesFinished,t.movesFinished,(r,n)=>r.isIdentical(n))}},Vn=class extends b{derive(e){function t(r){return e.detailedTimelineInfo.atEnd&&e.catchUpMove.move!==null&&r.currentMoves.push({move:e.catchUpMove.move,direction:-1,fraction:1-e.catchUpMove.amount,startTimestamp:-1,endTimestamp:-1}),r}if(e.indexer.currentMoveInfo)return t(e.indexer.currentMoveInfo(e.detailedTimelineInfo.timestamp));{const r=e.indexer.timestampToIndex(e.detailedTimelineInfo.timestamp),n={patternIndex:r,currentMoves:[],movesFinishing:[],movesFinished:[],movesStarting:[],latestStart:-1/0,earliestEnd:1/0};if(e.indexer.numAnimatedLeaves()>0){const s=e.indexer.getAnimLeaf(r)?.as(j);if(!s)return t(n);const i=e.indexer.indexToMoveStartTimestamp(r),a=e.indexer.moveDuration(r),o=a?(e.detailedTimelineInfo.timestamp-i)/a:0,d=i+a,l={move:s,direction:1,fraction:o,startTimestamp:i,endTimestamp:d};o===0?n.movesStarting.push(l):o===1?n.movesFinishing.push(l):(n.currentMoves.push(l),n.latestStart=Math.max(n.latestStart,i),n.earliestEnd=Math.min(n.earliestEnd,d))}return t(n)}}},Un=class extends b{derive(e){let t=e.indexer.transformationAtIndex(e.currentLeavesSimplified.patternIndex);t=e.anchoredStart.applyTransformation(t);for(const r of e.currentLeavesSimplified.movesFinishing)t=t.applyMove(r);for(const r of e.currentLeavesSimplified.movesFinished)t=t.applyMove(r);return t.toKPattern()}},dt={u:"y",l:"x",f:"z",r:"x",b:"z",d:"y",m:"x",e:"y",s:"z",x:"x",y:"y",z:"z"};function Bn(e,t){return dt[e.family[0].toLowerCase()]===dt[t.family[0].toLowerCase()]}var Wn=class extends Te{traverseAlg(e){const t=[];for(const r of e.childAlgNodes())t.push(this.traverseAlgNode(r));return Array.prototype.concat(...t)}traverseGroupingOnce(e){if(e.experimentalIsEmpty())return[];const t=[];for(const s of e.childAlgNodes()){if(!(s.is(j)||s.is(Cr)||s.is(Er)))return this.traverseAlg(e);const i=s.as(j);i&&t.push(i)}let r=$(t[0].amount);for(let s=0;s<t.length-1;s++){for(let i=1;i<t.length;i++)if(!Bn(t[s],t[i]))return this.traverseAlg(e);r=Math.max(r,$(t[s].amount))}const n=t.map(s=>({animLeafAlgNode:s,msUntilNext:0,duration:r}));return n[n.length-1].msUntilNext=r,n}traverseGrouping(e){const t=[],r=e.amount>0?e.alg:e.alg.invert();for(let n=0;n<Math.abs(e.amount);n++)t.push(this.traverseGroupingOnce(r));return Array.prototype.concat(...t)}traverseMove(e){const t=$(e.amount);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseCommutator(e){const t=[],r=[e.A,e.B,e.A.invert(),e.B.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traverseConjugate(e){const t=[],r=[e.A,e.B,e.A.invert()];for(const n of r)t.push(this.traverseGroupingOnce(n));return Array.prototype.concat(...t)}traversePause(e){if(e.experimentalNISSGrouping)return[];const t=$(1);return[{animLeafAlgNode:e,msUntilNext:t,duration:t}]}traverseNewline(e){return[]}traverseLineComment(e){return[]}},qn=ze(Wn);function Hn(e){let t=0;return qn(e).map(n=>{const s={animLeaf:n.animLeafAlgNode,start:t,end:t+n.duration};return t+=n.msUntilNext,s})}var Ne=class{constructor(e,t,r){this.kpuzzle=e,this.animLeaves=r?.animationTimelineLeaves??Hn(t)}kpuzzle;animLeaves;getAnimLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]?.animLeaf??null}getAnimationTimelineLeaf(e){return this.animLeaves[Math.min(e,this.animLeaves.length-1)]}indexToMoveStartTimestamp(e){let t=0;return this.animLeaves.length>0&&(t=this.animLeaves[Math.min(e,this.animLeaves.length-1)].start),t}timestampToIndex(e){let t=0;for(t=0;t<this.animLeaves.length;t++)if(this.animLeaves[t].start>=e)return Math.max(0,t-1);return Math.max(0,t-1)}timestampToPosition(e,t){const r=this.currentMoveInfo(e);let n=t??this.kpuzzle.identityTransformation().toKPattern();for(const s of this.animLeaves.slice(0,r.patternIndex)){const i=s.animLeaf.as(j);i!==null&&(n=n.applyMove(i))}return{pattern:n,movesInProgress:r.currentMoves}}currentMoveInfo(e){let t=1/0;for(const l of this.animLeaves)if(l.start<=e&&l.end>=e)t=Math.min(t,l.start);else if(l.start>e)break;const r=[],n=[],s=[],i=[];let a=-1/0,o=1/0,d=0;for(const l of this.animLeaves)if(l.end<=t){if(!isFinite(t)&&l.start>e)break;d++}else{if(l.start>e)break;{const h=l.animLeaf.as(j);if(h!==null){let c=(e-l.start)/(l.end-l.start),u=!1;c>1&&(c=1,u=!0);const p={move:h,direction:1,fraction:c,startTimestamp:l.start,endTimestamp:l.end};switch(c){case 0:{n.push(p);break}case 1:{u?i.push(p):s.push(p);break}default:r.push(p),a=Math.max(a,l.start),o=Math.min(o,l.end)}}}}return{patternIndex:d,currentMoves:r,latestStart:a,earliestEnd:o,movesStarting:n,movesFinishing:s,movesFinished:i}}patternAtIndex(e,t){let r=t??this.kpuzzle.defaultPattern();for(let n=0;n<this.animLeaves.length&&n<e;n++){const i=this.animLeaves[n].animLeaf.as(j);i!==null&&(r=r.applyMove(i))}return r}transformationAtIndex(e){let t=this.kpuzzle.identityTransformation();for(const r of this.animLeaves.slice(0,e)){const n=r.animLeaf.as(j);n!==null&&(t=t.applyMove(n))}return t}algDuration(){let e=0;for(const t of this.animLeaves)e=Math.max(e,t.end);return e}numAnimatedLeaves(){return this.animLeaves.length}moveDuration(e){const t=this.getAnimationTimelineLeaf(e);return t.end-t.start}},Qn=1024,Yn=class extends b{derive(e){switch(e.indexerConstructorRequest){case"auto":return e.animationTimelineLeaves!==null||Pr(e.alg.alg)<=Qn&&e.puzzle==="3x3x3"&&e.visualizationStrategy==="Cube3D"?Ne:tt;case"tree":return tt;case"simple":return dn;case"simultaneous":return Ne;default:throw new Error("Invalid indexer request!")}}},_n=class extends x{getDefaultValue(){return"auto"}},$n=class extends b{derive(e){return new e.indexerConstructor(e.kpuzzle,e.algWithIssues.alg,{animationTimelineLeaves:e.animationTimelineLeaves})}},Gn=class extends b{derive(e){return{pattern:e.currentPattern,movesInProgress:e.currentMoveInfo.currentMoves}}},Xn=!0,ut=class extends b{async derive(e){try{return Xn&&e.kpuzzle.algToTransformation(e.algWithIssues.alg),e.algWithIssues}catch(t){return{alg:new C,issues:new ae({errors:[`Invalid alg for puzzle: ${t.toString()}`]})}}}},Zn=class extends x{getDefaultValue(){return"start"}},Kn=class extends x{getDefaultValue(){return null}},Jn=class extends b{async derive(e){return e.puzzleLoader.kpuzzle()}},es=class extends x{getDefaultValue(){return ne}},ts=class extends b{async derive(e){return e.puzzleLoader.id}},rs=class extends x{getDefaultValue(){return ne}},ns=class extends b{derive(e){if(e.puzzleIDRequest&&e.puzzleIDRequest!==ne){const t=Ct[e.puzzleIDRequest];return t||this.userVisibleErrorTracker.set({errors:[`Invalid puzzle ID: ${e.puzzleIDRequest}`]}),t}return e.puzzleDescriptionRequest&&e.puzzleDescriptionRequest!==ne?kr(e.puzzleDescriptionRequest):Ir}},ss=class extends b{derive(e){return{playing:e.playingInfo.playing,atStart:e.detailedTimelineInfo.atStart,atEnd:e.detailedTimelineInfo.atEnd}}canReuseValue(e,t){return e.playing===t.playing&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},is=class extends b{derive(e){let t=this.#e(e),r=!1,n=!1;return t>=e.timeRange.end&&(n=!0,t=Math.min(e.timeRange.end,t)),t<=e.timeRange.start&&(r=!0,t=Math.max(e.timeRange.start,t)),{timestamp:t,timeRange:e.timeRange,atStart:r,atEnd:n}}#e(e){switch(e.timestampRequest){case"auto":return e.setupAnchor==="start"&&e.setupAlg.alg.experimentalIsEmpty()?e.timeRange.end:e.timeRange.start;case"start":return e.timeRange.start;case"end":return e.timeRange.end;case"anchor":return e.setupAnchor==="start"?e.timeRange.start:e.timeRange.end;case"opposite-anchor":return e.setupAnchor==="start"?e.timeRange.end:e.timeRange.start;default:return e.timestampRequest}}canReuseValue(e,t){return e.timestamp===t.timestamp&&e.timeRange.start===t.timeRange.start&&e.timeRange.end===t.timeRange.end&&e.atStart===t.atStart&&e.atEnd===t.atEnd}},as=class extends Q{async getDefaultValue(){return{direction:1,playing:!1,untilBoundary:"entire-timeline",loop:!1}}async derive(e,t){const r=await t,n=Object.assign({},r);return Object.assign(n,e),n}canReuseValue(e,t){return e.direction===t.direction&&e.playing===t.playing&&e.untilBoundary===t.untilBoundary&&e.loop===t.loop}},os=class extends Q{getDefaultValue(){return 1}derive(e){return e<0?1:e}},ls={auto:!0,start:!0,end:!0,anchor:!0,"opposite-anchor":!0},cs=class extends x{getDefaultValue(){return"auto"}set(e){const t=this.get();super.set((async()=>this.validInput(await e)?e:t)())}validInput(e){return!!(typeof e=="number"||ls[e])}},ds=class extends b{derive(e){return{start:0,end:e.indexer.algDuration()}}},us=class extends x{getDefaultValue(){return"auto"}},hs=class extends x{getDefaultValue(){return"auto"}},ms=class extends b{derive(e){switch(e.puzzleID){case"clock":case"square1":case"redi_cube":case"melindas2x2x2x2":case"tri_quad":case"loopover":return"2D";case"3x3x3":switch(e.visualizationRequest){case"auto":case"3D":return"Cube3D";default:return e.visualizationRequest}default:switch(e.visualizationRequest){case"auto":case"3D":return"PG3D";case"experimental-2D-LL":case"experimental-2D-LL-face":return["2x2x2","4x4x4","megaminx"].includes(e.puzzleID)?"experimental-2D-LL":"2D";default:return e.visualizationRequest}}}},ps=class extends x{getDefaultValue(){return"auto"}},gs=class extends x{getDefaultValue(){return"auto"}},fs=class extends x{getDefaultValue(){return"auto"}},vs=class extends x{getDefaultValue(){return"auto"}},ws=null;async function ys(){return ws??=new(await V).ThreeTextureLoader}var ht=class extends b{async derive(e){const{spriteURL:t}=e;return t===null?null:new Promise(async(r,n)=>{const s=()=>{console.warn("Could not load sprite:",t.toString()),r(null)};try{(await ys()).load(t.toString(),r,s,s)}catch{s()}})}},Ms={facelets:["regular","regular","regular","regular","regular"]};async function xs(e){const{definition:t}=await e.kpuzzle(),r={orbits:{}};for(const n of t.orbits)r.orbits[n.orbitName]={pieces:new Array(n.numPieces).fill(Ms)};return r}var Ss=class extends b{getDefaultValue(){return{orbits:{}}}async derive(e){return e.stickeringMaskRequest?e.stickeringMaskRequest:e.stickeringRequest==="picture"?{specialBehaviour:"picture",orbits:{}}:e.puzzleLoader.stickeringMask?.(e.stickeringRequest??"full")??xs(e.puzzleLoader)}},bs={"-":"Regular",D:"Dim",I:"Ignored",X:"Invisible",O:"IgnoreNonPrimary",P:"PermuteNonPrimary",o:"Ignoriented","?":"OrientationWithoutPermutation",M:"Mystery","@":"Regular"};function Ts(e){const t={orbits:{}},r=e.split(",");for(const n of r){const[s,i,...a]=n.split(":");if(a.length>0)throw new Error(`Invalid serialized orbit stickering mask (too many colons): \`${n}\``);const o=[];t.orbits[s]={pieces:o};for(const d of i){const l=bs[d];o.push(Ar(l))}}return t}var zs=class extends Q{getDefaultValue(){return null}derive(e){return e===null?null:typeof e=="string"?Ts(e):e}},ks=class extends x{getDefaultValue(){return null}},Is=class extends x{getDefaultValue(){return"auto"}},Ls=class extends x{getDefaultValue(){return{}}},Ds=class extends x{getDefaultValue(){return"auto"}},As=class extends x{getDefaultValue(){return"auto"}},Cs=class extends b{derive(e){return e.colorSchemeRequest==="dark"?"dark":"light"}},Es=class extends x{getDefaultValue(){return"auto"}},Ns=class extends x{getDefaultValue(){return null}},Ps=35,Rs=class extends x{getDefaultValue(){return Ps}};function rr(e,t){return e.latitude===t.latitude&&e.longitude===t.longitude&&e.distance===t.distance}var js=class extends Q{getDefaultValue(){return"auto"}canReuseValue(e,t){return e===t||rr(e,t)}async derive(e,t){if(e==="auto")return"auto";let r=await t;r==="auto"&&(r={});const n=Object.assign({},r);return Object.assign(n,e),typeof n.latitude<"u"&&(n.latitude=Math.min(Math.max(n.latitude,-90),90)),typeof n.longitude<"u"&&(n.longitude=Fe(n.longitude,180,-180)),n}},Os=class extends b{canReuseValue(e,t){return rr(e,t)}async derive(e){if(e.orbitCoordinatesRequest==="auto")return pt(e.puzzleID,e.strategy);const t=Object.assign(Object.assign({},pt(e.puzzleID,e.strategy),e.orbitCoordinatesRequest));if(Math.abs(t.latitude)<=e.latitudeLimit)return t;{const{latitude:r,longitude:n,distance:s}=t;return{latitude:e.latitudeLimit*Math.sign(r),longitude:n,distance:s}}}},Fs={latitude:31.717474411461005,longitude:0,distance:5.877852522924731},Vs={latitude:35,longitude:30,distance:6},mt={latitude:35,longitude:30,distance:6.25},Us={latitude:Math.atan(1/2)*ie,longitude:0,distance:6.7},Bs={latitude:26.56505117707799,longitude:0,distance:6};function pt(e,t){if(e[1]==="x")return t==="Cube3D"?Vs:mt;switch(e){case"megaminx":case"gigaminx":return Us;case"pyraminx":case"master_tetraminx":return Bs;case"skewb":return mt;default:return Fs}}var Ws=class{constructor(e){this.twistyPlayerModel=e,this.orbitCoordinates=new Os({orbitCoordinatesRequest:this.orbitCoordinatesRequest,latitudeLimit:this.latitudeLimit,puzzleID:e.puzzleID,strategy:e.visualizationStrategy}),this.stickeringMask=new Ss({stickeringMaskRequest:this.stickeringMaskRequest,stickeringRequest:this.stickeringRequest,puzzleLoader:e.puzzleLoader})}twistyPlayerModel;background=new As;colorSchemeRequest=new Es;dragInput=new Is;foundationDisplay=new gs;foundationStickerSpriteURL=new Ue;fullscreenElement=new Ns;hintFacelet=new Zr;hintStickerSpriteURL=new Ue;initialHintFaceletsAnimation=new vs;hintFaceletsElevation=new fs;latitudeLimit=new Rs;movePressInput=new Ds;movePressCancelOptions=new Ls;orbitCoordinatesRequest=new js;stickeringMaskRequest=new zs;stickeringRequest=new ks;faceletScale=new ps;colorScheme=new Cs({colorSchemeRequest:this.colorSchemeRequest});foundationStickerSprite=new ht({spriteURL:this.foundationStickerSpriteURL});hintStickerSprite=new ht({spriteURL:this.hintStickerSpriteURL});orbitCoordinates;stickeringMask},qs={errors:[]},Hs=class extends x{getDefaultValue(){return qs}reset(){this.set(this.getDefaultValue())}canReuseValue(e,t){return Oe(e.errors,t.errors)}},Qs=class{userVisibleErrorTracker=new Hs;alg=new ct;backView=new vn;controlPanel=new zn;catchUpMove=new On;indexerConstructorRequest=new _n;playingInfo=new as;puzzleDescriptionRequest=new es;puzzleIDRequest=new rs;setupAnchor=new Zn;setupAlg=new ct;setupTransformation=new Kn;tempoScale=new os;timestampRequest=new cs;viewerLink=new us;visualizationFormat=new hs;title=new lt;videoURL=new Ue;competitionID=new lt;animationTimelineLeavesRequest=new jn;puzzleLoader=new ns({puzzleIDRequest:this.puzzleIDRequest,puzzleDescriptionRequest:this.puzzleDescriptionRequest},this.userVisibleErrorTracker);kpuzzle=new Jn({puzzleLoader:this.puzzleLoader});puzzleID=new ts({puzzleLoader:this.puzzleLoader});puzzleAlg=new ut({algWithIssues:this.alg,kpuzzle:this.kpuzzle});puzzleSetupAlg=new ut({algWithIssues:this.setupAlg,kpuzzle:this.kpuzzle});visualizationStrategy=new ms({visualizationRequest:this.visualizationFormat,puzzleID:this.puzzleID});indexerConstructor=new Yn({alg:this.alg,puzzle:this.puzzleID,visualizationStrategy:this.visualizationStrategy,indexerConstructorRequest:this.indexerConstructorRequest,animationTimelineLeaves:this.animationTimelineLeavesRequest});setupAlgTransformation=new Pn({setupAlg:this.puzzleSetupAlg,kpuzzle:this.kpuzzle});indexer=new $n({indexerConstructor:this.indexerConstructor,algWithIssues:this.puzzleAlg,kpuzzle:this.kpuzzle,animationTimelineLeaves:this.animationTimelineLeavesRequest});anchorTransformation=new Rn({setupTransformation:this.setupTransformation,setupAnchor:this.setupAnchor,setupAlgTransformation:this.setupAlgTransformation,indexer:this.indexer});timeRange=new ds({indexer:this.indexer});detailedTimelineInfo=new is({timestampRequest:this.timestampRequest,timeRange:this.timeRange,setupAnchor:this.setupAnchor,setupAlg:this.setupAlg});coarseTimelineInfo=new ss({detailedTimelineInfo:this.detailedTimelineInfo,playingInfo:this.playingInfo});currentMoveInfo=new Vn({indexer:this.indexer,detailedTimelineInfo:this.detailedTimelineInfo,catchUpMove:this.catchUpMove});buttonAppearance=new Cn({coarseTimelineInfo:this.coarseTimelineInfo,viewerLink:this.viewerLink});currentLeavesSimplified=new Fn({currentMoveInfo:this.currentMoveInfo});currentPattern=new Un({anchoredStart:this.anchorTransformation,currentLeavesSimplified:this.currentLeavesSimplified,indexer:this.indexer});legacyPosition=new Gn({currentMoveInfo:this.currentMoveInfo,currentPattern:this.currentPattern});twistySceneModel=new Ws(this);async twizzleLink(){const[e,t,r,n,s,i,a,o]=await Promise.all([this.viewerLink.get(),this.puzzleID.get(),this.puzzleDescriptionRequest.get(),this.alg.get(),this.setupAlg.get(),this.setupAnchor.get(),this.twistySceneModel.stickeringRequest.get(),this.twistySceneModel.twistyPlayerModel.title.get()]),d=e==="experimental-twizzle-explorer",l=new URL(`https://alpha.twizzle.net/${d?"explore":"edit"}/`);return n.alg.experimentalIsEmpty()||l.searchParams.set("alg",n.alg.toString()),s.alg.experimentalIsEmpty()||l.searchParams.set("setup-alg",s.alg.toString()),i!=="start"&&l.searchParams.set("setup-anchor",i),a!=="full"&&a!==null&&l.searchParams.set("experimental-stickering",a),d&&r!==ne?l.searchParams.set("puzzle-description",r):t!=="3x3x3"&&l.searchParams.set("puzzle",t),o&&l.searchParams.set("title",o),l.toString()}experimentalAddAlgLeaf(e,t){const r=e.as(j);r?this.experimentalAddMove(r,t):this.alg.set((async()=>{const s=(await this.alg.get()).alg.concat(new C([e]));return this.timestampRequest.set("end"),s})())}experimentalAddMove(e,t){const r=typeof e=="string"?new j(e):e;this.alg.set((async()=>{const[{alg:n},s]=await Promise.all([this.alg.get(),this.puzzleLoader.get()]),i=Tr(n,r,{...t,...await zr(s)});return this.timestampRequest.set("end"),this.catchUpMove.set({move:r,amount:0}),i})())}experimentalRemoveFinalChild(){this.alg.set((async()=>{const e=(await this.alg.get()).alg,t=Array.from(e.childAlgNodes()),[r]=t.splice(-1);if(!r)return e;this.timestampRequest.set("end");const n=r.as(j);return n&&this.catchUpMove.set({move:n.invert(),amount:0}),new C(t)})())}};function v(e){return new Error(`Cannot get \`.${e}\` directly from a \`TwistyPlayer\`.`)}var Ys=class extends O{experimentalModel=new Qs;set alg(e){this.experimentalModel.alg.set(e)}get alg(){throw v("alg")}set experimentalSetupAlg(e){this.experimentalModel.setupAlg.set(e)}get experimentalSetupAlg(){throw v("setup")}set experimentalSetupAnchor(e){this.experimentalModel.setupAnchor.set(e)}get experimentalSetupAnchor(){throw v("anchor")}set puzzle(e){this.experimentalModel.puzzleIDRequest.set(e)}get puzzle(){throw v("puzzle")}set experimentalPuzzleDescription(e){this.experimentalModel.puzzleDescriptionRequest.set(e)}get experimentalPuzzleDescription(){throw v("experimentalPuzzleDescription")}set timestamp(e){this.experimentalModel.timestampRequest.set(e)}get timestamp(){throw v("timestamp")}set hintFacelets(e){this.experimentalModel.twistySceneModel.hintFacelet.set(e)}get hintFacelets(){throw v("hintFacelets")}set experimentalStickering(e){this.experimentalModel.twistySceneModel.stickeringRequest.set(e)}get experimentalStickering(){throw v("experimentalStickering")}set experimentalStickeringMaskOrbits(e){this.experimentalModel.twistySceneModel.stickeringMaskRequest.set(e)}get experimentalStickeringMaskOrbits(){throw v("experimentalStickeringMaskOrbits")}set experimentalFaceletScale(e){this.experimentalModel.twistySceneModel.faceletScale.set(e)}get experimentalFaceletScale(){throw v("experimentalFaceletScale")}set backView(e){this.experimentalModel.backView.set(e)}get backView(){throw v("backView")}set background(e){this.experimentalModel.twistySceneModel.background.set(e)}get background(){throw v("background")}set colorScheme(e){this.experimentalModel.twistySceneModel.colorSchemeRequest.set(e)}get colorScheme(){throw v("colorScheme")}set controlPanel(e){this.experimentalModel.controlPanel.set(e)}get controlPanel(){throw v("controlPanel")}set visualization(e){this.experimentalModel.visualizationFormat.set(e)}get visualization(){throw v("visualization")}set experimentalTitle(e){this.experimentalModel.title.set(e)}get experimentalTitle(){throw v("experimentalTitle")}set experimentalVideoURL(e){this.experimentalModel.videoURL.set(e)}get experimentalVideoURL(){throw v("experimentalVideoURL")}set experimentalCompetitionID(e){this.experimentalModel.competitionID.set(e)}get experimentalCompetitionID(){throw v("experimentalCompetitionID")}set viewerLink(e){this.experimentalModel.viewerLink.set(e)}get viewerLink(){throw v("viewerLink")}set experimentalMovePressInput(e){this.experimentalModel.twistySceneModel.movePressInput.set(e)}get experimentalMovePressInput(){throw v("experimentalMovePressInput")}set experimentalMovePressCancelOptions(e){this.experimentalModel.twistySceneModel.movePressCancelOptions.set(e)}get experimentalMovePressCancelOptions(){throw v("experimentalMovePressCancelOptions")}set cameraLatitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({latitude:e})}get cameraLatitude(){throw v("cameraLatitude")}set cameraLongitude(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({longitude:e})}get cameraLongitude(){throw v("cameraLongitude")}set cameraDistance(e){this.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set({distance:e})}get cameraDistance(){throw v("cameraDistance")}set cameraLatitudeLimit(e){this.experimentalModel.twistySceneModel.latitudeLimit.set(e)}get cameraLatitudeLimit(){throw v("cameraLatitudeLimit")}set indexer(e){this.experimentalModel.indexerConstructorRequest.set(e)}get indexer(){throw v("indexer")}set tempoScale(e){this.experimentalModel.tempoScale.set(e)}get tempoScale(){throw v("tempoScale")}set experimentalSprite(e){this.experimentalModel.twistySceneModel.foundationStickerSpriteURL.set(e)}get experimentalSprite(){throw v("experimentalSprite")}set experimentalHintSprite(e){this.experimentalModel.twistySceneModel.hintStickerSpriteURL.set(e)}get experimentalHintSprite(){throw v("experimentalHintSprite")}set fullscreenElement(e){this.experimentalModel.twistySceneModel.fullscreenElement.set(e)}get fullscreenElement(){throw v("fullscreenElement")}set experimentalInitialHintFaceletsAnimation(e){this.experimentalModel.twistySceneModel.initialHintFaceletsAnimation.set(e)}get experimentalInitialHintFaceletsAnimation(){throw v("experimentalInitialHintFaceletsAnimation")}set experimentalHintFaceletsElevation(e){this.experimentalModel.twistySceneModel.hintFaceletsElevation.set(e)}get experimentalHintFaceletsElevation(){throw v("experimentalHintFaceletsElevation")}set experimentalDragInput(e){this.experimentalModel.twistySceneModel.dragInput.set(e)}get experimentalDragInput(){throw v("experimentalDragInput")}experimentalGet=new _s(this.experimentalModel)},_s=class{constructor(e){this.model=e}model;async alg(){return(await this.model.alg.get()).alg}async setupAlg(){return(await this.model.setupAlg.get()).alg}puzzleID(){return this.model.puzzleID.get()}async timestamp(){return(await this.model.detailedTimelineInfo.get()).timestamp}},Pe="data-",be={alg:"alg","experimental-setup-alg":"experimentalSetupAlg","experimental-setup-anchor":"experimentalSetupAnchor",puzzle:"puzzle","experimental-puzzle-description":"experimentalPuzzleDescription",visualization:"visualization","hint-facelets":"hintFacelets","experimental-stickering":"experimentalStickering","experimental-stickering-mask-orbits":"experimentalStickeringMaskOrbits",background:"background","color-scheme":"colorScheme","control-panel":"controlPanel","back-view":"backView","experimental-facelet-scale":"experimentalFaceletScale","experimental-initial-hint-facelets-animation":"experimentalInitialHintFaceletsAnimation","experimental-hint-facelets-elevation":"experimentalHintFaceletsElevation","viewer-link":"viewerLink","experimental-move-press-input":"experimentalMovePressInput","experimental-drag-input":"experimentalDragInput","experimental-title":"experimentalTitle","experimental-video-url":"experimentalVideoURL","experimental-competition-id":"experimentalCompetitionID","camera-latitude":"cameraLatitude","camera-longitude":"cameraLongitude","camera-distance":"cameraDistance","camera-latitude-limit":"cameraLatitudeLimit","tempo-scale":"tempoScale","experimental-sprite":"experimentalSprite","experimental-hint-sprite":"experimentalHintSprite"},$s=Object.fromEntries(Object.values(be).map(e=>[e,!0])),Gs={experimentalMovePressCancelOptions:!0},gt,nr=Symbol("intersectedCallback");function Xs(e){gt??=new IntersectionObserver((t,r)=>{for(const n of t)n.isIntersecting&&n.intersectionRect.height>0&&(n.target[nr](),r.unobserve(n.target))}),gt.observe(e)}var ce=class extends Ys{controller=new bn(this.experimentalModel,this);buttons;experimentalCanvasClickCallback=()=>{};constructor(e={}){super();for(const[t,r]of Object.entries(e)){if(!($s[t]||Gs[t])){console.warn(`Invalid config passed to TwistyPlayer: ${t}`);break}this[t]=r}}#e=new le(this,"controls-",["auto"].concat(Object.keys(Tn)));#t=document.createElement("div");#r=document.createElement("div");#n=!1;connectedCallback(){this.addCSS(Jt),Xs(this)}async[nr](){if(this.#n)return;this.#n=!0,this.addElement(this.#t).classList.add("visualization-wrapper"),this.addElement(this.#r).classList.add("error-elem"),this.#r.textContent="Error",this.experimentalModel.userVisibleErrorTracker.addFreshListener(t=>{const r=t.errors[0]??null;this.contentWrapper.classList.toggle("error",!!r),r&&(this.#r.textContent=r)});const e=new Xt(this.experimentalModel,this.controller);this.contentWrapper.appendChild(e),this.buttons=new Yt(this.experimentalModel,this.controller,this),this.contentWrapper.appendChild(this.buttons),this.experimentalModel.twistySceneModel.background.addFreshListener(t=>{this.contentWrapper.classList.toggle("checkered",["auto","checkered"].includes(t)),this.contentWrapper.classList.toggle("checkered-transparent",t==="checkered-transparent")}),this.experimentalModel.twistySceneModel.colorScheme.addFreshListener(t=>{this.contentWrapper.classList.toggle("dark-mode",["dark"].includes(t))}),this.experimentalModel.controlPanel.addFreshListener(t=>{this.#e.setValue(t)}),this.experimentalModel.visualizationStrategy.addFreshListener(this.#l.bind(this)),this.experimentalModel.puzzleID.addFreshListener(this.flash.bind(this))}#i="auto";experimentalSetFlashLevel(e){this.#i=e}flash(){this.#i==="auto"&&this.#s?.animate([{opacity:.25},{opacity:1}],{duration:250,easing:"ease-out"})}#s=null;#a=new Wt;#o=null;#l(e){if(e!==this.#o){this.#s?.remove(),this.#s?.disconnect();let t;switch(e){case"2D":case"experimental-2D-LL":case"experimental-2D-LL-face":{t=new Bt(this.experimentalModel.twistySceneModel,e);break}case"Cube3D":case"PG3D":{t=new Ve(this.experimentalModel),this.#a.handleNewValue(t);break}default:throw new Error("Invalid visualization")}this.#t.appendChild(t),this.#s=t,this.#o=e}}async experimentalCurrentVantages(){this.connectedCallback();const e=this.#s;return e instanceof Ve?e.experimentalVantages():[]}async experimentalCurrentCanvases(){const e=await this.experimentalCurrentVantages(),t=[];for(const r of e)t.push((await r.canvasInfo()).canvas);return t}async experimentalCurrentThreeJSPuzzleObject(e){this.connectedCallback();const r=await(await this.#a.promise).experimentalTwisty3DPuzzleWrapper(),n=r.twisty3DPuzzle(),s=(async()=>{await n,await new Promise(i=>setTimeout(i,0))})();if(e){const i=new J(async()=>{});r.addEventListener("render-scheduled",async()=>{i.requestIsPending()||(i.requestAnimFrame(),await s,e())})}return n}jumpToStart(e){this.controller.jumpToStart(e)}jumpToEnd(e){this.controller.jumpToEnd(e)}play(){this.controller.togglePlay(!0)}pause(){this.controller.togglePlay(!1)}togglePlay(e){this.controller.togglePlay(e)}experimentalAddMove(e,t){this.experimentalModel.experimentalAddMove(e,t)}experimentalAddAlgLeaf(e,t){this.experimentalModel.experimentalAddAlgLeaf(e,t)}static get observedAttributes(){const e=[];for(const t of Object.keys(be))e.push(t,Pe+t);return e}experimentalRemoveFinalChild(){this.experimentalModel.experimentalRemoveFinalChild()}attributeChangedCallback(e,t,r){e.startsWith(Pe)&&(e=e.slice(Pe.length));const n=be[e];n&&(this[n]=r)}async experimentalScreenshot(e){return(await ot(this.experimentalModel,e)).dataURL}async experimentalDownloadScreenshot(e){if(["2D","experimental-2D-LL","experimental-2D-LL-face"].includes(await this.experimentalModel.visualizationStrategy.get())){const r=await this.#s.currentTwisty2DPuzzleWrapper().twisty2DPuzzle(),n=new XMLSerializer().serializeToString(r.svgWrapper.svgElement),s=URL.createObjectURL(new Blob([n]));Kt(s,e??await Zt(this.experimentalModel),"svg")}else await(await ot(this.experimentalModel)).download(e)}};D.define("twisty-player",ce);var Zs=class extends We{traverseAlg(e,t){const r=[];let n=0;for(const s of e.childAlgNodes()){const i=this.traverseAlgNode(s,{numMovesSoFar:t.numMovesSoFar+n});r.push(i.tokens),n+=i.numLeavesInside}return{tokens:Array.prototype.concat(...r),numLeavesInside:n}}traverseGrouping(e,t){const r=this.traverseAlg(e.alg,t);return{tokens:r.tokens,numLeavesInside:r.numLeavesInside*e.amount}}traverseMove(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseCommutator(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside}}traverseConjugate(e,t){const r=this.traverseAlg(e.A,t),n=this.traverseAlg(e.B,{numMovesSoFar:t.numMovesSoFar+r.numLeavesInside});return{tokens:r.tokens.concat(n.tokens),numLeavesInside:r.numLeavesInside*2+n.numLeavesInside*2}}traversePause(e,t){return{tokens:[{leaf:e,idx:t.numMovesSoFar}],numLeavesInside:1}}traverseNewline(e,t){return{tokens:[],numLeavesInside:0}}traverseLineComment(e,t){return{tokens:[],numLeavesInside:0}}},Ks=ze(Zs),Js=class extends x{getDefaultValue(){return""}},ei=class extends b{derive(e){return tr(e.value)}},ti=class extends Q{getDefaultValue(){return{selectionStart:0,selectionEnd:0,endChangedMostRecently:!1}}async derive(e,t){const{selectionStart:r,selectionEnd:n}=e,s=await t,i=e.selectionStart===s.selectionStart&&e.selectionEnd!==(await t).selectionEnd;return{selectionStart:r,selectionEnd:n,endChangedMostRecently:i}}},ri=class extends b{derive(e){return e.selectionInfo.endChangedMostRecently?e.selectionInfo.selectionEnd:e.selectionInfo.selectionStart}},ni=class extends b{derive(e){return Ks(e.algWithIssues.alg,{numMovesSoFar:0}).tokens}},si=class extends b{derive(e){function t(n){if(n===null)return null;let s;return e.targetChar<n.leaf[G]?s="before":e.targetChar===n.leaf[G]?s="start":e.targetChar<n.leaf[te]?s="inside":e.targetChar===n.leaf[te]?s="end":s="after",{leafInfo:n,where:s}}let r=null;for(const n of e.leafTokens){if(e.targetChar<n.leaf[G]&&r!==null)return t(r);if(e.targetChar<=n.leaf[te])return t(n);r=n}return t(r)}},ii=class{valueProp=new Js;selectionProp=new ti;targetCharProp=new ri({selectionInfo:this.selectionProp});algEditorAlgWithIssues=new ei({value:this.valueProp});leafTokensProp=new ni({algWithIssues:this.algEditorAlgWithIssues});leafToHighlight=new si({leafTokens:this.leafTokensProp,targetChar:this.targetCharProp})},ai="//";function oi(e){try{return C.fromString(e)}catch{return null}}function sr(e,t){const r=e.indexOf(t);return r===-1?[e,""]:[e.slice(0,r),e.slice(r)]}function ft(e){const t=[];for(const r of e.split(`
`)){let[n,s]=sr(r,ai);n=n.replaceAll("’","'"),t.push(n+s)}return t.join(`
`)}function li(e,t){const{value:r}=e,{selectionStart:n,selectionEnd:s}=e,i=r.slice(0,n),a=r.slice(s);t=t.replaceAll(`\r
`,`
`);const o=i.match(/\/\/[^\n]*$/),d=r[n-1]==="/"&&t[0]==="/",l=o||d,h=t.match(/\/\/[^\n]*$/);let c=t;if(l){const[y,T]=sr(t,`
`);c=y+ft(T)}else c=ft(t);const u=!l&&n!==0&&![`
`," "].includes(c[0])&&![`
`," "].includes(r[n-1]),p=!h&&s!==r.length&&![`
`," "].includes(c.at(-1))&&![`
`," "].includes(r[s]);function f(y,T){const A=y+c+T,M=!!oi(i+A+a);return M&&(c=A),M}u&&p&&f(" "," ")||u&&f(" ","")||p&&f(""," "),H?.execCommand("insertText",!1,c)||e.setRangeText(c,n,s,"end")}var ir=new E;ir.replaceSync(`
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
`);var pe="for-twisty-player",vt="placeholder",wt="twisty-player-prop",ci=class extends O{model=new ii;#e=document.createElement("textarea");#t=document.createElement("div");#r=document.createElement("span");#n=document.createElement("span");#i=document.createElement("span");#s=new le(this,"valid-for-puzzle-",["none","warning","error"]);#a=null;#o;get#l(){return this.#a===null?null:this.#a.experimentalModel[this.#o]}debugNeverRequestTimestamp=!1;constructor(e){super(),this.#t.classList.add("carbon-copy"),this.addElement(this.#t),this.#e.rows=1,this.addElement(this.#e),this.#r.classList.add("prefix"),this.#t.appendChild(this.#r),this.#n.classList.add("highlight"),this.#t.appendChild(this.#n),this.#i.classList.add("suffix"),this.#t.appendChild(this.#i),this.#e.placeholder="Alg",this.#e.setAttribute("spellcheck","false"),this.addCSS(ir),this.#e.addEventListener("input",()=>{this.#d=!0,this.onInput()}),this.#e.addEventListener("blur",()=>this.onBlur()),document.addEventListener("selectionchange",()=>this.onSelectionChange()),e?.twistyPlayer&&(this.twistyPlayer=e.twistyPlayer),this.#o=e?.twistyPlayerProp??"alg",e?.twistyPlayerProp==="alg"&&this.model.leafToHighlight.addFreshListener(t=>{t&&this.highlightLeaf(t.leafInfo.leaf)})}connectedCallback(){this.#e.addEventListener("paste",e=>{const t=e.clipboardData?.getData("text");t&&(li(this.#e,t),e.preventDefault(),this.onInput())})}set algString(e){this.#e.value=e,this.onInput()}get algString(){return this.#e.value}set placeholder(e){this.#e.placeholder=e}#d=!1;onInput(){this.#n.hidden=!0,this.highlightLeaf(null);const e=this.#e.value.trimEnd();this.model.valueProp.set(e),this.#l?.set(e)}async onSelectionChange(){if(document.activeElement!==this||this.shadow.activeElement!==this.#e||this.#o!=="alg")return;const{selectionStart:e,selectionEnd:t}=this.#e;this.model.selectionProp.set({selectionStart:e,selectionEnd:t})}async onBlur(){}setAlgIssueClassForPuzzle(e){this.#s.setValue(e)}#u(e){return e.endsWith(`
`)?`${e} `:e}#c=null;highlightLeaf(e){if(e===null){this.#r.textContent="",this.#n.textContent="",this.#i.textContent=this.#u(this.#e.value);return}e!==this.#c&&(this.#c=e,this.#r.textContent=this.#e.value.slice(0,e[G]),this.#n.textContent=this.#e.value.slice(e[G],e[te]),this.#i.textContent=this.#u(this.#e.value.slice(e[te])),this.#n.hidden=!1)}get twistyPlayer(){return this.#a}set twistyPlayer(e){if(this.#a){console.warn("twisty-player reassignment/clearing is not supported");return}this.#a=e,e&&((async()=>this.algString=this.#l?(await this.#l.get()).alg.toString():"")(),this.#o==="alg"&&(this.#a?.experimentalModel.puzzleAlg.addFreshListener(t=>{if(t.issues.errors.length===0){this.setAlgIssueClassForPuzzle(t.issues.warnings.length===0?"none":"warning");const r=t.alg,n=C.fromString(this.algString);r.isIdentical(n)||(this.algString=r.toString(),this.onInput())}else this.setAlgIssueClassForPuzzle("error")}),this.model.leafToHighlight.addFreshListener(async t=>{if(t===null)return;const[r,n]=await Promise.all([await e.experimentalModel.indexer.get(),await e.experimentalModel.timestampRequest.get()]);if(n==="auto"&&!this.#d)return;const s=r.indexToMoveStartTimestamp(t.leafInfo.idx),i=r.moveDuration(t.leafInfo.idx);let a;switch(t.where){case"before":{a=s;break}case"start":case"inside":{a=s+i/4;break}case"end":case"after":{a=s+i;break}default:throw console.log("invalid where"),new Error("Invalid where!")}this.debugNeverRequestTimestamp||e.experimentalModel.timestampRequest.set(a)}),e.experimentalModel.currentLeavesSimplified.addFreshListener(async t=>{const n=(await e.experimentalModel.indexer.get()).getAnimLeaf(t.patternIndex);this.highlightLeaf(n)})))}attributeChangedCallback(e,t,r){switch(e){case pe:{const n=document.getElementById(r);if(!n){console.warn(`${pe}= elem does not exist`);return}if(!(n instanceof ce)){console.warn(`${pe}=is not a twisty-player`);return}this.twistyPlayer=n;return}case vt:{this.placeholder=r;return}case wt:{if(this.#a)throw console.log("cannot set prop"),new Error("cannot set prop after twisty player");this.#o=r;return}}}static get observedAttributes(){return[pe,vt,wt]}};D.define("twisty-alg-editor",ci);async function di(e){return new Promise((t,r)=>{try{const n=document.getElementById(e);n&&t(n);const s=new MutationObserver(i=>{for(const a of i)a.attributeName==="id"&&a.target instanceof Element&&a.target.getAttribute("id")===e&&(t(a.target),s.disconnect())});s.observe(document.body,{attributeFilter:["id"],subtree:!0})}catch(n){r(n)}})}var ar=new E;ar.replaceSync(`
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
`);var ui=.25,Z=class extends se{constructor(e,t,r,n,s,i){if(super(),this.algOrAlgNode=n,this.classList.add(e),i){const a=this.appendChild(document.createElement("a"));a.href="#",a.textContent=t,a.addEventListener("click",o=>{o.preventDefault(),r.twistyAlgViewer.jumpToIndex(r.earliestMoveIndex,s)})}else this.appendChild(document.createElement("span")).textContent=t}algOrAlgNode;pathToIndex(e){return[]}setCurrentMove(e){this.classList.toggle("current-move",e)}};D.define("twisty-alg-leaf-elem",Z);var K=class extends se{constructor(e,t){super(),this.algOrAlgNode=t,this.classList.add(e)}algOrAlgNode;queue=[];addString(e){const t=document.createElement("span");t.textContent=e,this.queue.push(t)}addElem(e){return this.queue.push(e.element),e.moveCount}flushQueue(e=1){for(const t of or(this.queue,e))this.append(t);this.queue=[]}pathToIndex(e){return[]}};D.define("twisty-alg-wrapper-elem",K);function hi(e){return e===1?-1:1}function mi(e,t){return t<0?hi(e):e}function or(e,t){if(t===1)return e;const r=Array.from(e);return r.reverse(),r}var pi=class extends We{traverseAlg(e,t){let r=0;const n=new K("twisty-alg-alg",e);let s=!0;for(const i of Nr(e.childAlgNodes(),t.direction))s||n.addString(" "),s=!1,i.as(Ge)?.experimentalNISSGrouping&&n.addString("^("),i.as(Se)?.experimentalNISSPlaceholder||(r+=n.addElem(this.traverseAlgNode(i,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}))),i.as(Ge)?.experimentalNISSGrouping&&n.addString(")");return n.flushQueue(t.direction),{moveCount:r,element:n}}traverseGrouping(e,t){const r=e.experimentalAsSquare1Tuple(),n=mi(t.direction,e.amount);let s=0;const i=new K("twisty-alg-grouping",e);return i.addString("("),r?(s+=i.addElem({moveCount:1,element:new Z("twisty-alg-move",r[0].amount.toString(),t,r[0],!0,!0)}),i.addString(", "),s+=i.addElem({moveCount:1,element:new Z("twisty-alg-move",r[1].amount.toString(),t,r[1],!0,!0)})):s+=i.addElem(this.traverseAlg(e.alg,{earliestMoveIndex:t.earliestMoveIndex+s,twistyAlgViewer:t.twistyAlgViewer,direction:n})),i.addString(`)${e.experimentalRepetitionSuffix}`),i.flushQueue(),{moveCount:s*Math.abs(e.amount),element:i}}traverseMove(e,t){const r=new Z("twisty-alg-move",e.toString(),t,e,!0,!0);return t.twistyAlgViewer.highlighter.addMove(e[G],r),{moveCount:1,element:r}}traverseCommutator(e,t){let r=0;const n=new K("twisty-alg-commutator",e);n.addString("["),n.flushQueue();const[s,i]=or([e.A,e.B],t.direction);return r+=n.addElem(this.traverseAlg(s,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString(", "),r+=n.addElem(this.traverseAlg(i,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.flushQueue(t.direction),n.addString("]"),n.flushQueue(),{moveCount:r*2,element:n}}traverseConjugate(e,t){let r=0;const n=new K("twisty-alg-conjugate",e);n.addString("[");const s=n.addElem(this.traverseAlg(e.A,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction}));return r+=s,n.addString(": "),r+=n.addElem(this.traverseAlg(e.B,{earliestMoveIndex:t.earliestMoveIndex+r,twistyAlgViewer:t.twistyAlgViewer,direction:t.direction})),n.addString("]"),n.flushQueue(),{moveCount:r+s,element:n}}traversePause(e,t){return e.experimentalNISSGrouping?this.traverseAlg(e.experimentalNISSGrouping.alg,t):{moveCount:1,element:new Z("twisty-alg-pause",".",t,e,!0,!0)}}traverseNewline(e,t){const r=new K("twisty-alg-newline",e);return r.append(document.createElement("br")),{moveCount:0,element:r}}traverseLineComment(e,t){return{moveCount:0,element:new Z("twisty-alg-line-comment",`//${e.text}`,t,e,!1,!1)}}},gi=ze(pi),fi=class{moveCharIndexMap=new Map;currentElem=null;addMove(e,t){this.moveCharIndexMap.set(e,t)}set(e){const t=e?this.moveCharIndexMap.get(e[G])??null:null;this.currentElem!==t&&(this.currentElem?.setCurrentMove(!1),t?.setCurrentMove(!0),this.currentElem=t)}},lr=class extends O{highlighter=new fi;#e;#t;#r=null;lastClickTimestamp=null;constructor(e){super({mode:"open"}),this.addCSS(ar),e?.twistyPlayer&&(this.twistyPlayer=e?.twistyPlayer)}connectedCallback(){}setAlg(e){this.#t?.isIdentical(e)||(this.#e=gi(e,{earliestMoveIndex:0,twistyAlgViewer:this,direction:1}).element,this.#t=e,this.contentWrapper.textContent="",this.contentWrapper.appendChild(this.#e))}get twistyPlayer(){return this.#r}set twistyPlayer(e){this.#n(e)}async#n(e){if(this.#r){console.warn("twisty-player reassignment is not supported");return}if(e===null)throw new Error("clearing twistyPlayer is not supported");this.#r=e,this.#r.experimentalModel.alg.addFreshListener(t=>{this.setAlg(t.alg)}),e.experimentalModel.currentMoveInfo.addFreshListener(t=>{let r=t.currentMoves[0];if(r??=t.movesStarting[0],r??=t.movesFinishing[0],!r)this.highlighter.set(null);else{const n=r.move;this.highlighter.set(n)}}),e.experimentalModel.detailedTimelineInfo.addFreshListener(t=>{t.timestamp!==this.lastClickTimestamp&&(this.lastClickTimestamp=null)})}async jumpToIndex(e,t){const r=this.#r;if(r){r.pause();const n=(async()=>{const s=await r.experimentalModel.indexer.get(),i=t?s.moveDuration(e)*ui:0;return s.indexToMoveStartTimestamp(e)+s.moveDuration(e)-i})();r.experimentalModel.timestampRequest.set(await n),this.lastClickTimestamp===await n?(r.play(),this.lastClickTimestamp=null):this.lastClickTimestamp=await n}}async attributeChangedCallback(e,t,r){if(e==="for"){let n=document.getElementById(r);if(n||console.info("for= elem does not exist, waiting for one"),await customElements.whenDefined("twisty-player"),n=await di(r),!(n instanceof ce)){console.warn("for= elem is not a twisty-player");return}this.twistyPlayer=n}}static get observedAttributes(){return["for"]}};D.define("twisty-alg-viewer",lr);var xe=new E;xe.replaceSync(`
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
`);var cr=new E;cr.replaceSync(`
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
`);function vi(e="",t=location.href){const r={alg:"alg","setup-alg":"experimental-setup-alg","setup-anchor":"experimental-setup-anchor",puzzle:"puzzle",stickering:"experimental-stickering","puzzle-description":"experimental-puzzle-description",title:"experimental-title","video-url":"experimental-video-url",competition:"experimental-competition-id"},n=new URL(t).searchParams,s={};for(const[i,a]of Object.entries(r)){const o=n.get(e+i);if(o!==null){const d=be[a];s[d]=o}}return s}var ge="outer block moves (e.g. R, Rw, or 4r)",fe="inner block moves (e.g. M or 2-5r)",yt={OBTM:`HTM = OBTM ("Outer Block Turn Metric"):
• ${fe} count as 2 turns
• ${ge} count as 1 turn
• rotations (e.g. x) count as 0 turns`,OBQTM:`QTM = OBQTM ("Outer Block Quantum Turn Metric"):
• ${fe} count as 2 turns per quantum (e.g. M2 counts as 4)
• ${ge} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,RBTM:`STM = RBTM ("Range Block Turn Metric"):
• ${fe} count as 1 turn
• ${ge} count as 1 turn
• rotations (e.g. x) count as 0 turns`,RBQTM:`SQTM = RBQTM ("Range Block Quantum Turn Metric"):
• ${fe} count as 1 turn per quantum (e.g. M2 counts as 2)
• ${ge} count as 1 turn per quantum (e.g. R2 counts as 2)
• rotations (e.g. x) count as 0 turns`,ETM:`ETM ("Execution Turn Metric"):
• all moves (including rotations) count as 1 turn`},wi={OBTM:"OB",OBQTM:"OBQ",RBTM:"RB",RBQTM:"RBQ",ETM:"E"},yi=class extends O{constructor(e){super({mode:"open"}),this.options=e}options;twistyPlayer=null;a=null;#e(){if(this.contentWrapper.textContent="",this.a){const t=this.contentWrapper.appendChild(document.createElement("span"));t.textContent="❗️",t.title="Could not show a player for link",this.addElement(this.a)}this.removeCSS(xe);const e=this.shadow.adoptedStyleSheets.indexOf(xe);typeof e<"u"&&this.shadow.adoptedStyleSheets.splice(e,e+1),this.#t?.remove()}#t;#r;#n;#i;async connectedCallback(){if(this.#n=this.addElement(document.createElement("div")),this.#n.classList.add("responsive-wrapper"),this.options?.colorScheme==="dark"&&this.contentWrapper.classList.add("dark-mode"),this.addCSS(xe),this.options?.cdnForumTweaks&&this.addCSS(cr),this.a=this.querySelector("a"),!this.a)return;const e=vi("",this.a.href),t=this.a?.href,{hostname:r,pathname:n}=new URL(t);if(r!=="alpha.twizzle.net"){this.#e();return}if(["/edit/","/explore/"].includes(n)){const s=n==="/explore/";if(e.puzzle&&!(e.puzzle in Ct)){const o=(await At(async()=>{const{getPuzzleDescriptionString:d}=await import("./index-CW5GorPG.js");return{getPuzzleDescriptionString:d}},[])).getPuzzleDescriptionString(e.puzzle);delete e.puzzle,e.experimentalPuzzleDescription=o}if(this.twistyPlayer=this.#n.appendChild(new ce({background:this.options?.cdnForumTweaks?"checkered-transparent":"checkered",colorScheme:this.options?.colorScheme==="dark"?"dark":"light",...e,viewerLink:s?"experimental-twizzle-explorer":"auto"})),this.twistyPlayer.fullscreenElement=this.contentWrapper,e.experimentalTitle&&(this.twistyPlayer.experimentalTitle=e.experimentalTitle),this.#r=this.#n.appendChild(document.createElement("div")),this.#r.classList.add("scrollable-region"),e.experimentalTitle&&this.#s(e.experimentalTitle).classList.add("title"),e.experimentalSetupAlg){this.#s("Setup",async()=>(await this.twistyPlayer?.experimentalModel.setupAlg.get())?.alg.toString()??null);const o=this.#r.appendChild(document.createElement("div"));o.classList.add("setup-alg"),o.textContent=new C(e.experimentalSetupAlg).toString()}const i=this.#s("Moves",async()=>(await this.twistyPlayer?.experimentalModel.alg.get())?.alg.toString()??null);this.#i=i.appendChild(Mi(this.twistyPlayer.experimentalModel)),this.#i.classList.add("move-count"),this.#r.appendChild(new lr({twistyPlayer:this.twistyPlayer})).part.add("twisty-alg-viewer")}else this.#e()}#s(e,t){const r=this.#r.appendChild(document.createElement("div"));r.classList.add("heading");const n=r.appendChild(document.createElement("span"));if(n.textContent=e,t){n.textContent+=" ";const s=n.appendChild(document.createElement("a"));s.textContent="📋",s.href="#",s.title="Copy to clipboard";async function i(a){s.textContent=a,await new Promise(o=>setTimeout(o,2e3)),s.textContent===a&&(s.textContent="📋")}s.addEventListener("click",async a=>{a.preventDefault(),s.textContent="📋…";const o=await t();if(o)try{await navigator.clipboard.writeText(o),i("📋✅")}catch(d){throw i("📋❌"),d}else i("📋❌")})}return r}};D.define("twizzle-link",yi);function Mi(e,t=document.createElement("span")){async function r(){const[n,s]=await Promise.all([e.puzzleAlg.get(),e.puzzleLoader.get()]);if(n.issues.errors.length!==0){t.textContent="";return}let i=!0;function a(o){i?i=!1:t.append(")(");const d=t.appendChild(document.createElement("span")),l=jr(s,o,n.alg);d.append(`${wi[o]}: `);const h=d.appendChild(document.createElement("span"));h.textContent=l.toString(),h.classList.add("move-number"),d.setAttribute("data-before",yt[o]??""),d.setAttribute("title",yt[o]??"")}t.textContent="(",s.id==="3x3x3"?(a("OBTM"),a("OBQTM"),a("RBTM")):s.pg&&(a("RBTM"),a("RBQTM")),a("ETM"),t.append(")")}return e.puzzleAlg.addFreshListener(r),e.puzzleID.addFreshListener(r),t}const ve=e=>e*1e3;function xi({cube:e,facelets:t,moves:r,position:n=r.length,speed:s=1,animateSeeks:i=!1,cross:a=null,rotation:o=Me(a)}){const d=k.useRef(null),l=k.useRef(null),h=k.useRef(null);return k.useEffect(()=>{const c=new ce({puzzle:"3x3x3",visualization:"3D",background:"none",controlPanel:"none",hintFacelets:"none"});return c.style.width="100%",c.style.height="280px",d.current?.appendChild(c),l.current=c,()=>{h.current&&cancelAnimationFrame(h.current.frame),h.current=null,c.pause(),c.remove(),l.current=null}},[]),k.useEffect(()=>{const c=l.current;if(!c)return;let u=h.current;if(!u||u.cube!==e||u.moves!==r||u.rotation!==o){u&&cancelAnimationFrame(u.frame);const w=new C(r.slice(0,n).join(" "));c.experimentalModel.setupTransformation.set(e.parse(t).applyAlg(w.invert()).applyAlg(o).experimentalToTransformation()),u={cube:e,moves:r,rotation:o,length:-1,cursor:n,target:n,speed:s,time:0,frame:0},h.current=u}if(u.length!==r.length){const w=r.map(Be(e,o)).map(y=>new j(y));c.alg=new C(w),c.experimentalModel.animationTimelineLeavesRequest.set(w.map((y,T)=>({animLeaf:y,start:ve(T),end:ve(T+1)}))),u.length=r.length}if(!i&&Math.abs(n-u.target)>1&&(cancelAnimationFrame(u.frame),u.frame=0,u.cursor=n),u.target=n,u.speed=s,c.timestamp=ve(u.cursor),u.frame||u.cursor===u.target)return;const p=u;p.time=performance.now();const f=w=>{const y=Math.min(.95,Math.max(0,w-p.time)*p.speed/100);p.time=w,p.cursor+=Math.sign(p.target-p.cursor)*Math.min(Math.abs(p.target-p.cursor),y),c.timestamp=ve(p.cursor),p.frame=p.cursor===p.target?0:requestAnimationFrame(f)};p.frame=requestAnimationFrame(f)},[e,t,r,r.length,n,s,i,o]),m.jsx("div",{ref:d,role:"img","aria-label":"Live 3x3 cube state"})}const Si=["","x","x2","x'","z","z'"].flatMap(e=>["","y","y2","y'"].map(t=>`${e} ${t}`.trim())),we="ULFRBD",Mt=["UD","RL","FB"],xt=e=>JSON.stringify([e.patternData.CORNERS,e.patternData.EDGES,e.patternData.CENTERS.pieces]);class bi{constructor(t){this.cube=t;const r=["","","2","'"];for(const n of Si)for(const s of Mt)for(let i=0;i<4;i++)for(let a=0;a<4;a++){const o=[i?s[0]+r[i]:"",a?s[1]+r[a]:""].filter(Boolean),d=t.solved().applyAlg(`${o.join(" ")} ${n}`),l=xt(d);this.decompositions.has(l)||this.decompositions.set(l,{moves:o,rotation:t.puzzle.algToTransformation(n)})}}decompositions=new Map;signatures=new Map;outerMoves(t){let r=this.cube.puzzle.identityTransformation();const n=[];for(const s of new C(t).experimentalExpand()){if(!(s instanceof j))continue;const i=this.decompositions.get(xt(this.cube.solved().applyMove(s)));if(!i)throw new Error(`Unsupported algorithm move: ${s.toString()}`);const a=this.cube.solved().applyTransformation(r).patternData.CENTERS.pieces;n.push(...i.moves.map(o=>we[a[we.indexOf(o[0])]]+o.slice(1))),r=r.applyTransformation(i.rotation)}return{moves:n,rotation:r}}signature(t){const r=this.signatures.get(t);if(r!==void 0)return r;const n=this.outerMoves(t).moves,i=["","y","y2","y'"].map(a=>{const o=this.cube.solved().applyAlg(a).patternData.CENTERS.pieces,d=[];for(const h of n){const c=we[o[we.indexOf(h[0])]],u=Mt.find(w=>w.includes(c));d.at(-1)?.axis!==u&&d.push({axis:u,amounts:[0,0]});const p=d.at(-1),f=u.indexOf(c);p.amounts[f]=(p.amounts[f]+(h.includes("2")?2:h.endsWith("'")?3:1))%4,p.amounts.every(w=>!w)&&d.pop()}const l=d.flatMap(({axis:h,amounts:c})=>c.flatMap((u,p)=>u?[h[p]+(u===2?"2":u===3?"'":"")]:[]));for(;l[0]?.[0]==="U";)l.shift();for(;l.at(-1)?.[0]==="U";)l.pop();return l.join(" ")}).sort()[0];return this.signatures.set(t,i),i}}const St=new WeakMap;function dr(e){let t=St.get(e);return t||St.set(e,t=new bi(e)),t}const bt=new WeakMap,Tt=new WeakMap;function ur(e,t){if(e.status!=="complete")return[];let r=bt.get(t);r||bt.set(t,r=new WeakMap);const n=r.get(e);if(n)return n;const{cross:s,ends:i}=kt(e,t),a=dr(t);if(s===null)return[];const o=[],d=Be(t,s),l=[t.parse(e.startFacelets)];for(const{move:c}of e.moves)l.push(l.at(-1).applyMove(c));let h=i[0]??0;for(let c=1;c<i.length;c++){const u=h,p=i[c];if(p>u){if(c<5){const T=Ti(t,ye(t,l[u],Me(s))).flatMap(({entry:M,yaw:N})=>{const W=[],q=ye(t,l[u],`${Me(s)} ${N}`);for(let P=u+1;P<=i[4];P++){const R=ye(t,l[P],`${Me(s)} ${N}`),U=M.pair,X=[8,9,11,10][U-4];if(R.patternData.CORNERS.pieces[U]!==U||R.patternData.CORNERS.orientation[U]||R.patternData.EDGES.pieces[X]!==X||R.patternData.EDGES.orientation[X])continue;const F=(L,Y,g)=>L.patternData[Y].pieces[g]===g&&!L.patternData[Y].orientation[g];if([4,5,6,7].some(L=>!F(R,"EDGES",L))||[4,5,6,7].some(L=>{const Y=[8,9,11,10][L-4];return F(q,"CORNERS",L)&&F(q,"EDGES",Y)&&(!F(R,"CORNERS",L)||!F(R,"EDGES",Y))}))continue;const de=a.signature(e.moves.slice(u,P).map(L=>d(L.move)).join(" ")),Ie=M.options.filter(L=>a.signature(L)===de).map(L=>Ze(M,L));W.push({endIndex:P,caseKey:`AF2L-${M.id}`,signature:de,matches:Ie})}return W}),A=T.find(M=>M.matches.length)??T[0];if(A){const M=T.filter(N=>N.endIndex===A.endIndex);o.push({step:c,caseKey:A.caseKey,signature:A.signature,caseKeys:[...new Set(M.map(N=>N.caseKey))],matches:[...new Set(M.flatMap(N=>N.matches))]}),h=A.endIndex,h<p&&c--;continue}}const f=gr(c,t,s,l[u],l[p]),w=f&&f!=="Solved"?`${c<5?"F2L":c===5?"OLL":"PLL"}-${f}`:"";if(w){const y=a.signature(e.moves.slice(u,p).map(M=>d(M.move)).join(" ")),T=Hr.find(M=>`${M.category}-${M.id}`===w),A=T?.options.filter(M=>a.signature(M)===y).map(M=>Ze(T,M))??[];o.push({step:c,caseKey:w,caseKeys:[w],signature:y,matches:A})}h=p}}return r.set(e,o),o}function Ti(e,t){let r=Tt.get(e);r||(r=Qr(e).filter(s=>s.category==="AF2L"),Tt.set(e,r));const n=[];for(const s of["","y","y2","y'"])for(const i of["","U","U2","U'"]){const a=e.facelets(ye(e,t,s).applyAlg(i));for(const o of r)o.visibleStickers.every(d=>a[d]===o.facelets[d])&&!n.some(d=>d.entry===o&&d.yaw===s)&&n.push({entry:o,yaw:s})}return n}function zi(e,t,r,n={F2L:!0,OLL:!0,PLL:!0}){if(!r.size||!Object.values(n).some(Boolean))return[];const s=dr(t);return ur(e,t).filter(i=>{if(!n[i.caseKey.startsWith("AF2L-")?"F2L":i.caseKey.split("-")[0]])return!1;const a=[...r].filter(o=>i.caseKeys.some(d=>o.startsWith(`${d}:`)));return a.length>0&&!a.some(o=>s.signature(o.slice(o.indexOf(":")+1))===i.signature)})}async function ji(e,t,r){const n=new Set(r),s=e.filter(i=>i.status==="complete").sort((i,a)=>a.createdAt.localeCompare(i.createdAt)).slice(0,2e3);for(let i=0;i<s.length;i++)ur(s[i],t).forEach(a=>a.matches.forEach(o=>n.add(o))),i%20===0&&await new Promise(a=>setTimeout(a,0));return n}const zt=new WeakMap,ki=[];function Ii({solve:e,cube:t,history:r=ki,brief:n=!1}){const s=k.useRef(null),{favorites:i,enabled:a,categories:o}=Yr(),d=k.useMemo(()=>a?zi(e,t,i,o):[],[e,e.status,t,i,a,o]),l=u=>`${Lt[u.step]}: Non-favorite algorithm (${u.caseKey.replace("-"," ")})`,h=k.useMemo(()=>{if(e.status!=="complete")return null;let u=zt.get(t);u||zt.set(t,u=new WeakMap);const p=[...r.filter(f=>f.id!==e.id),e].filter(f=>f.session===e.session&&f.status!=="active").map(f=>{let w=u.get(f);return(!w||w.dnf!==(f.status!=="complete")||w.time!==Math.round(It(f))/1e3)&&(w={...Or(fr([f],t),",")[0],source:"timer",isCorrupt:!1},u.set(f,w)),w}).sort((f,w)=>f.date.getTime()-w.date.getTime());return Fr(p,100),p.find(f=>f.id===e.id)},[e,e.status,e.penalty,t,r]),c=h?Vr(h):[];return m.jsxs("section",{ref:s,className:"mt-3","aria-label":"Solve mistakes","aria-live":"polite",children:[m.jsx("p",{className:"mb-1",children:h?d.length||c.length?m.jsxs(m.Fragment,{children:[m.jsx("strong",{children:"Biggest mistake: "}),d.length?l(d[0]):Ce(c[0])]}):"No clear mistakes detected.":"Incomplete solve - mistakes could not be fully assessed."}),!n&&!!(d.length||c.length)&&m.jsxs("ul",{children:[d.map(u=>m.jsxs("li",{children:[m.jsx("strong",{children:l(u)})," ",m.jsx("a",{href:`/database/#${u.caseKey}`,target:"_blank",rel:"noopener noreferrer",children:"Choose favorites"})]},`favorite-${u.step}`)),c.map(u=>m.jsxs("li",{children:[m.jsx("strong",{children:Ce(u)})," ",m.jsx(Ur,{placement:"top",container:s,overlay:m.jsx(Br,{id:`replay-mistake-${Xe(u)}`,children:Wr[u.kind].rule}),children:m.jsx("button",{type:"button",className:"btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none","aria-label":`About ${Ce(u)}`,children:"ⓘ"})})]},Xe(u)))]})]})}function Oi({cube:e,solve:t,history:r,close:n,change:s,remove:i,retry:a,retryDisabled:o=!1,precision:d=2}){const l=k.useRef(null),[h,c]=k.useState(0),[u,p]=k.useState(!1),[f,w]=k.useState(1),[y,T]=k.useState(!1),[A,M]=k.useState(""),N=k.useMemo(()=>t.moves.map(g=>g.move),[t]),{cross:W,ends:q,cases:P,pairs:R}=k.useMemo(()=>kt(t,e),[t,e]),U=k.useMemo(()=>vr(e,W,R[0]),[e,W,R]),X=pr(l),F=()=>{l.current?.close(),n()};async function de(){if(window.confirm("Are you sure you want to delete this solve? This cannot be undone.")){T(!0),M("");try{await(i?i(t):Sr(t.id)),F()}catch(g){M(g instanceof Error?g.message:"Unable to delete solve."),T(!1)}}}const Ie=k.useMemo(()=>{const g=Be(e,U);return Lt.map((z,S)=>{const ee=S?q[S-1]??t.moves.length:0,hr=S===6?t.moves.length:q[S]??t.moves.length,Le=[];for(let B=ee;B<hr;B++){const ue=g(t.moves[B].move),Qe=ue.includes("2")?2:ue.endsWith("'")?-1:1,Ae=Le.at(-1);Ae?.notation===ue?(Ae.end=B+1,Ae.amount+=Qe):Le.push({notation:ue,start:B,end:B+1,amount:Qe})}const De=P[S],mr=S===6?"PLL":S===5?"OLL":"F2L";return{name:z.replace("Slot","Pair"),pair:S>0&&S<5?wr(R[S-1],W):"",case:P[S]?P[S]==="Solved"?"Solved":S===6?`${P[S]} perm`:`${S===5?"OLL":"F2L"} ${P[S]}`:"",caseUrl:De&&De!=="Solved"&&S>0?`/database/#${mr}-${encodeURIComponent(De)}`:"",empty:S>q.length?"Not reached":q[S]===void 0?"No moves recorded":"Skipped",groups:Le.map(B=>({...B,move:B.notation[0]+["4","","2","'"][(B.amount%4+4)%4]}))}})},[q,P,t,e,U,R,W]);k.useEffect(()=>{if(!X||!u||h>=t.moves.length){p(!1);return}const g=h?t.moves[h-1].elapsed:0,z=Math.max(20,(t.moves[h].elapsed-g)/f),S=setTimeout(()=>c(ee=>ee+1),z);return()=>clearTimeout(S)},[u,h,f,t,X]);const L=t.moves.slice(0,h).map(g=>g.move).join(" "),Y=e.facelets(e.parse(t.startFacelets).applyAlg(L));return m.jsxs("dialog",{ref:l,className:"panel replay-dialog","aria-label":"Solve replay",onCancel:g=>{g.preventDefault(),y||F()},children:[m.jsxs("div",{className:"replay-header",children:[m.jsxs("div",{className:"replay-summary",children:[m.jsxs("strong",{className:"replay-time","aria-label":"Solve time",children:[he(It(t),d),"s"]}),m.jsxs("span",{className:"d-inline-flex align-items-baseline gap-3 flex-wrap",children:[m.jsxs("span",{children:[yr(t)," turns"]}),m.jsxs("span",{className:"small text-secondary","aria-label":"Inspection time",children:["Inspection: ",t.inspection===void 0?"Not recorded":`${he(t.inspection,d)}s`]})]})]}),m.jsxs("div",{className:"d-flex gap-2",children:[m.jsx("button",{className:"btn btn-outline-danger",disabled:y,onClick:de,children:y?"Deleting...":"Delete"}),a?m.jsx("button",{className:"btn btn-outline-primary",disabled:y||o,onClick:()=>{F(),a(t)},children:"Retry"}):m.jsx("a",{className:`btn btn-outline-primary${y?" disabled":""}`,"aria-disabled":y||void 0,tabIndex:y?-1:void 0,href:`/timer/?retry=${encodeURIComponent(t.id)}`,onClick:g=>{y?g.preventDefault():F()},children:"Retry"}),m.jsx("button",{autoFocus:!0,className:"btn btn-outline-secondary",disabled:y,onClick:F,children:"Close"})]})]}),A&&m.jsx("p",{className:"alert alert-danger",role:"alert",children:A}),m.jsx("p",{className:"scramble",children:br(t.scramble).join(" ")}),m.jsx(xi,{cube:e,facelets:Y,moves:N,position:h,speed:f,cross:W,rotation:U}),m.jsxs("div",{className:"d-flex gap-2 align-items-center flex-wrap",children:[m.jsx("button",{className:"btn btn-primary",disabled:!t.moves.length,onClick:()=>{h>=t.moves.length&&c(0),p(!u)},children:u?"Pause":"Play"}),m.jsx("button",{className:"btn btn-outline-secondary",disabled:h===0,onClick:()=>{p(!1),c(g=>g-1)},children:"Previous move"}),m.jsx("button",{className:"btn btn-outline-secondary",disabled:h>=t.moves.length,onClick:()=>{p(!1),c(g=>g+1)},children:"Next move"}),m.jsx("select",{className:"form-select replay-speed","aria-label":"Replay speed",value:f,onChange:g=>w(Number(g.target.value)),children:[.25,.5,1,2,4].map(g=>m.jsxs("option",{value:g,children:[g,"x"]},g))}),m.jsxs("span",{children:[h,"/",t.moves.length," moves - ",he(h?t.moves[h-1].elapsed:0,d),"s"]})]}),m.jsx("input",{className:"form-range mt-3",type:"range",min:0,max:t.moves.length,value:h,"aria-label":"Replay move",onChange:g=>{p(!1),c(Number(g.target.value))}}),m.jsx("div",{className:"move-timeline",role:"group","aria-label":"Solution steps",children:Ie.map(g=>m.jsxs("div",{role:"group","aria-label":`${g.name} solution`,className:"mb-2",children:[m.jsxs("div",{className:"d-flex align-items-baseline gap-2",children:[m.jsx("h3",{className:"replay-step-name",children:g.name}),g.case&&(g.caseUrl?m.jsx("a",{className:"badge text-bg-secondary","aria-label":`${g.name} case`,href:g.caseUrl,target:"_blank",rel:"noopener noreferrer",children:g.case}):m.jsx("span",{className:"badge text-bg-secondary","aria-label":`${g.name} case`,children:g.case})),g.pair&&m.jsx("span",{role:"img","aria-label":`${g.pair.replace("/"," / ")} pair`,title:g.pair.replace("/"," / "),children:qr(g.pair)})]}),g.name==="Cross"&&U&&m.jsx("span",{className:"move","aria-label":"Initial rotation",children:U}),g.groups.length?g.groups.map(z=>{const S=h===0?z.start===0:z.start<h&&h<=z.end;return m.jsx("button",{className:`move ${z.end<=h?"done":""} ${S?"current":""} ${S&&h>z.start&&h<z.end?"partial":""}`,title:`${he(t.moves[z.end-1].elapsed,d)}s`,"aria-current":S?"step":void 0,"aria-label":`${z.move}, recorded moves ${z.start+1} to ${z.end}: ${t.moves.slice(z.start,z.end).map(ee=>ee.move).join(" ")}`,onClick:()=>{p(!1),c(z.end)},children:z.move},z.start)}):m.jsx("span",{className:"small text-secondary",children:g.empty})]},g.name))}),s&&m.jsxs("fieldset",{className:"mt-3",disabled:y||t.status!=="complete"&&t.dnfReason!=="manual",children:[m.jsx("legend",{className:"h6",children:"Manual penalties"}),m.jsxs("label",{className:"form-check",children:[m.jsx("input",{className:"form-check-input",type:"checkbox",checked:Ye(t).includes("manual"),onChange:g=>s(Mr({...t},"manual",g.target.checked))}),m.jsx("span",{className:"form-check-label",children:"Manual +2"})]}),m.jsxs("label",{className:"form-check",children:[m.jsx("input",{className:"form-check-input",type:"checkbox",checked:t.dnfReason==="manual",onChange:g=>s({...t,status:g.target.checked?"incomplete":"complete",dnfReason:g.target.checked?"manual":void 0})}),m.jsx("span",{className:"form-check-label",children:"Manual DNF"})]})]}),t.status==="incomplete"&&m.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["DNF reason: ",xr(t)]}),!!t.penalty&&m.jsxs("p",{className:"text-warning mt-2","aria-label":"Penalty reason",children:["+",t.penalty/1e3," ",t.penalty===2e3?"reason":"reasons",": ",Ye(t).join(", ")]}),t.reason&&t.reason!=="Solve aborted by user."&&m.jsx("p",{className:"text-secondary small mt-2",children:t.reason}),m.jsxs("p",{className:"small text-secondary text-break mt-3 mb-0","aria-label":"Solve ID",children:["Solve ID: ",m.jsx("span",{className:"font-monospace",children:t.id})]}),m.jsx(Ii,{cube:e,solve:t,history:r})]})}export{xi as C,Oi as R,Ii as S,Kr as T,Xr as a,V as b,ji as d,Ri as h};
