var CommentWidget=function(N){var Ti;"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const nt=globalThis,At=nt.ShadowRoot&&(nt.ShadyCSS===void 0||nt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,jt=Symbol(),en=new WeakMap;let tn=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==jt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(At&&e===void 0){const i=t!==void 0&&t.length===1;i&&(e=en.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&en.set(t,e))}return e}toString(){return this.cssText}};const Ui=n=>new tn(typeof n=="string"?n:n+"",void 0,jt),X=(n,...e)=>{const t=n.length===1?n[0]:e.reduce((i,r,o)=>i+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+n[o+1],n[0]);return new tn(t,n,jt)},Hi=(n,e)=>{if(At)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const i=document.createElement("style"),r=nt.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,n.appendChild(i)}},nn=At?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return Ui(t)})(n):n;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Bi,defineProperty:Ii,getOwnPropertyDescriptor:Ni,getOwnPropertyNames:Fi,getOwnPropertySymbols:Vi,getPrototypeOf:Yi}=Object,ce=globalThis,on=ce.trustedTypes,Wi=on?on.emptyScript:"",Mt=ce.reactiveElementPolyfillSupport,He=(n,e)=>n,it={toAttribute(n,e){switch(e){case Boolean:n=n?Wi:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},Et=(n,e)=>!Bi(n,e),rn={attribute:!0,type:String,converter:it,reflect:!1,hasChanged:Et};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),ce.litPropertyMetadata??(ce.litPropertyMetadata=new WeakMap);class je extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=rn){if(t.state&&(t.attribute=!1),this._$Ei(),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&Ii(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){const{get:r,set:o}=Ni(this.prototype,e)??{get(){return this[t]},set(s){this[t]=s}};return{get(){return r==null?void 0:r.call(this)},set(s){const a=r==null?void 0:r.call(this);o.call(this,s),this.requestUpdate(e,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??rn}static _$Ei(){if(this.hasOwnProperty(He("elementProperties")))return;const e=Yi(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(He("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(He("properties"))){const t=this.properties,i=[...Fi(t),...Vi(t)];for(const r of i)this.createProperty(r,t[r])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(const[t,i]of this.elementProperties){const r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const r of i)t.unshift(nn(r))}else e!==void 0&&t.push(nn(e));return t}static _$Eu(e,t){const i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Hi(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(t=>{var i;return(i=t.hostConnected)==null?void 0:i.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var i;return(i=t.hostDisconnected)==null?void 0:i.call(t)})}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$EC(e,t){var o;const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){const s=(((o=i.converter)==null?void 0:o.toAttribute)!==void 0?i.converter:it).toAttribute(t,i.type);this._$Em=e,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(e,t){var o;const i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const s=i.getPropertyOptions(r),a=typeof s.converter=="function"?{fromAttribute:s.converter}:((o=s.converter)==null?void 0:o.fromAttribute)!==void 0?s.converter:it;this._$Em=r,this[r]=a.fromAttribute(t,s.type),this._$Em=null}}requestUpdate(e,t,i){if(e!==void 0){if(i??(i=this.constructor.getPropertyOptions(e)),!(i.hasChanged??Et)(this[e],t))return;this.P(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$ET())}P(e,t,i){this._$AL.has(e)||this._$AL.set(e,t),i.reflect===!0&&this._$Em!==e&&(this._$Ej??(this._$Ej=new Set)).add(e)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[o,s]of this._$Ep)this[o]=s;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[o,s]of r)s.wrapped!==!0||this._$AL.has(o)||this[o]===void 0||this.P(o,this[o],s)}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(i=this._$EO)==null||i.forEach(r=>{var o;return(o=r.hostUpdate)==null?void 0:o.call(r)}),this.update(t)):this._$EU()}catch(r){throw e=!1,this._$EU(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(i=>{var r;return(r=i.hostUpdated)==null?void 0:r.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Ej&&(this._$Ej=this._$Ej.forEach(t=>this._$EC(t,this[t]))),this._$EU()}updated(e){}firstUpdated(e){}}je.elementStyles=[],je.shadowRootOptions={mode:"open"},je[He("elementProperties")]=new Map,je[He("finalized")]=new Map,Mt==null||Mt({ReactiveElement:je}),(ce.reactiveElementVersions??(ce.reactiveElementVersions=[])).push("2.0.4");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Be=globalThis,ot=Be.trustedTypes,sn=ot?ot.createPolicy("lit-html",{createHTML:n=>n}):void 0,Pt="$lit$",ie=`lit$${(Math.random()+"").slice(9)}$`,Rt="?"+ie,qi=`<${Rt}>`,me=document,Ie=()=>me.createComment(""),Ne=n=>n===null||typeof n!="object"&&typeof n!="function",an=Array.isArray,cn=n=>an(n)||typeof(n==null?void 0:n[Symbol.iterator])=="function",zt=`[ 	
\f\r]`,Fe=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ln=/-->/g,hn=/>/g,ve=RegExp(`>|${zt}(?:([^\\s"'>=/]+)(${zt}*=${zt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),dn=/'/g,un=/"/g,pn=/^(?:script|style|textarea|title)$/i,Ji=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),E=Ji(1),ge=Symbol.for("lit-noChange"),U=Symbol.for("lit-nothing"),fn=new WeakMap,be=me.createTreeWalker(me,129);function mn(n,e){if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return sn!==void 0?sn.createHTML(e):e}const vn=(n,e)=>{const t=n.length-1,i=[];let r,o=e===2?"<svg>":"",s=Fe;for(let a=0;a<t;a++){const c=n[a];let h,l,u=-1,d=0;for(;d<c.length&&(s.lastIndex=d,l=s.exec(c),l!==null);)d=s.lastIndex,s===Fe?l[1]==="!--"?s=ln:l[1]!==void 0?s=hn:l[2]!==void 0?(pn.test(l[2])&&(r=RegExp("</"+l[2],"g")),s=ve):l[3]!==void 0&&(s=ve):s===ve?l[0]===">"?(s=r??Fe,u=-1):l[1]===void 0?u=-2:(u=s.lastIndex-l[2].length,h=l[1],s=l[3]===void 0?ve:l[3]==='"'?un:dn):s===un||s===dn?s=ve:s===ln||s===hn?s=Fe:(s=ve,r=void 0);const p=s===ve&&n[a+1].startsWith("/>")?" ":"";o+=s===Fe?c+qi:u>=0?(i.push(h),c.slice(0,u)+Pt+c.slice(u)+ie+p):c+ie+(u===-2?a:p)}return[mn(n,o+(n[t]||"<?>")+(e===2?"</svg>":"")),i]};class Ve{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let o=0,s=0;const a=e.length-1,c=this.parts,[h,l]=vn(e,t);if(this.el=Ve.createElement(h,i),be.currentNode=this.el.content,t===2){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(r=be.nextNode())!==null&&c.length<a;){if(r.nodeType===1){if(r.hasAttributes())for(const u of r.getAttributeNames())if(u.endsWith(Pt)){const d=l[s++],p=r.getAttribute(u).split(ie),m=/([.?@])?(.*)/.exec(d);c.push({type:1,index:o,name:m[2],strings:p,ctor:m[1]==="."?bn:m[1]==="?"?_n:m[1]==="@"?$n:Ye}),r.removeAttribute(u)}else u.startsWith(ie)&&(c.push({type:6,index:o}),r.removeAttribute(u));if(pn.test(r.tagName)){const u=r.textContent.split(ie),d=u.length-1;if(d>0){r.textContent=ot?ot.emptyScript:"";for(let p=0;p<d;p++)r.append(u[p],Ie()),be.nextNode(),c.push({type:2,index:++o});r.append(u[d],Ie())}}}else if(r.nodeType===8)if(r.data===Rt)c.push({type:2,index:o});else{let u=-1;for(;(u=r.data.indexOf(ie,u+1))!==-1;)c.push({type:7,index:o}),u+=ie.length-1}o++}}static createElement(e,t){const i=me.createElement("template");return i.innerHTML=e,i}}function _e(n,e,t=n,i){var s,a;if(e===ge)return e;let r=i!==void 0?(s=t._$Co)==null?void 0:s[i]:t._$Cl;const o=Ne(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==o&&((a=r==null?void 0:r._$AO)==null||a.call(r,!1),o===void 0?r=void 0:(r=new o(n),r._$AT(n,t,i)),i!==void 0?(t._$Co??(t._$Co=[]))[i]=r:t._$Cl=r),r!==void 0&&(e=_e(n,r._$AS(n,e.values),r,i)),e}class gn{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,r=((e==null?void 0:e.creationScope)??me).importNode(t,!0);be.currentNode=r;let o=be.nextNode(),s=0,a=0,c=i[0];for(;c!==void 0;){if(s===c.index){let h;c.type===2?h=new Me(o,o.nextSibling,this,e):c.type===1?h=new c.ctor(o,c.name,c.strings,this,e):c.type===6&&(h=new yn(o,this,e)),this._$AV.push(h),c=i[++a]}s!==(c==null?void 0:c.index)&&(o=be.nextNode(),s++)}return be.currentNode=me,r}p(e){let t=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Me{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=U,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=_e(this,e,t),Ne(e)?e===U||e==null||e===""?(this._$AH!==U&&this._$AR(),this._$AH=U):e!==this._$AH&&e!==ge&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):cn(e)?this.k(e):this._(e)}S(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.S(e))}_(e){this._$AH!==U&&Ne(this._$AH)?this._$AA.nextSibling.data=e:this.T(me.createTextNode(e)),this._$AH=e}$(e){var o;const{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Ve.createElement(mn(i.h,i.h[0]),this.options)),i);if(((o=this._$AH)==null?void 0:o._$AD)===r)this._$AH.p(t);else{const s=new gn(r,this),a=s.u(this.options);s.p(t),this.T(a),this._$AH=s}}_$AC(e){let t=fn.get(e.strings);return t===void 0&&fn.set(e.strings,t=new Ve(e)),t}k(e){an(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,r=0;for(const o of e)r===t.length?t.push(i=new Me(this.S(Ie()),this.S(Ie()),this,this.options)):i=t[r],i._$AI(o),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,t);e&&e!==this._$AB;){const r=e.nextSibling;e.remove(),e=r}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class Ye{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,o){this.type=1,this._$AH=U,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=o,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=U}_$AI(e,t=this,i,r){const o=this.strings;let s=!1;if(o===void 0)e=_e(this,e,t,0),s=!Ne(e)||e!==this._$AH&&e!==ge,s&&(this._$AH=e);else{const a=e;let c,h;for(e=o[0],c=0;c<o.length-1;c++)h=_e(this,a[i+c],t,c),h===ge&&(h=this._$AH[c]),s||(s=!Ne(h)||h!==this._$AH[c]),h===U?e=U:e!==U&&(e+=(h??"")+o[c+1]),this._$AH[c]=h}s&&!r&&this.j(e)}j(e){e===U?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class bn extends Ye{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===U?void 0:e}}class _n extends Ye{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==U)}}class $n extends Ye{constructor(e,t,i,r,o){super(e,t,i,r,o),this.type=5}_$AI(e,t=this){if((e=_e(this,e,t,0)??U)===ge)return;const i=this._$AH,r=e===U&&i!==U||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==U&&(i===U||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class yn{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){_e(this,e)}}const Zi={P:Pt,A:ie,C:Rt,M:1,L:vn,R:gn,D:cn,V:_e,I:Me,H:Ye,N:_n,U:$n,B:bn,F:yn},Dt=Be.litHtmlPolyfillSupport;Dt==null||Dt(Ve,Me),(Be.litHtmlVersions??(Be.litHtmlVersions=[])).push("3.1.2");const Ki=(n,e,t)=>{const i=(t==null?void 0:t.renderBefore)??e;let r=i._$litPart$;if(r===void 0){const o=(t==null?void 0:t.renderBefore)??null;i._$litPart$=r=new Me(e.insertBefore(Ie(),o),o,void 0,t??{})}return r._$AI(n),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let V=class extends je{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ki(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return ge}};V._$litElement$=!0,V.finalized=!0,(Ti=globalThis.litElementHydrateSupport)==null||Ti.call(globalThis,{LitElement:V});const Ot=globalThis.litElementPolyfillSupport;Ot==null||Ot({LitElement:V}),(globalThis.litElementVersions??(globalThis.litElementVersions=[])).push("4.0.4");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const K=n=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(n,e)}):customElements.define(n,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Gi={attribute:!0,type:String,converter:it,reflect:!1,hasChanged:Et},Xi=(n=Gi,e,t)=>{const{kind:i,metadata:r}=t;let o=globalThis.litPropertyMetadata.get(r);if(o===void 0&&globalThis.litPropertyMetadata.set(r,o=new Map),o.set(t.name,n),i==="accessor"){const{name:s}=t;return{set(a){const c=e.get.call(this);e.set.call(this,a),this.requestUpdate(s,c,n)},init(a){return a!==void 0&&this.P(s,void 0,n),a}}}if(i==="setter"){const{name:s}=t;return function(a){const c=this[s];e.call(this,a),this.requestUpdate(s,c,n)}}throw Error("Unsupported decorator location: "+i)};function T(n){return(e,t)=>typeof t=="object"?Xi(n,e,t):((i,r,o)=>{const s=r.hasOwnProperty(o);return r.constructor.createProperty(o,s?{...i,wrapped:!0}:i),s?Object.getOwnPropertyDescriptor(r,o):void 0})(n,e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function R(n){return T({...n,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const wn={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},xn=n=>(...e)=>({_$litDirective$:n,values:e});let Cn=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{I:Qi}=Zi,eo=n=>n.strings===void 0,kn=()=>document.createComment(""),We=(n,e,t)=>{var o;const i=n._$AA.parentNode,r=e===void 0?n._$AB:e._$AA;if(t===void 0){const s=i.insertBefore(kn(),r),a=i.insertBefore(kn(),r);t=new Qi(s,a,n,n.options)}else{const s=t._$AB.nextSibling,a=t._$AM,c=a!==n;if(c){let h;(o=t._$AQ)==null||o.call(t,n),t._$AM=n,t._$AP!==void 0&&(h=n._$AU)!==a._$AU&&t._$AP(h)}if(s!==r||c){let h=t._$AA;for(;h!==s;){const l=h.nextSibling;i.insertBefore(h,r),h=l}}}return t},$e=(n,e,t=n)=>(n._$AI(e,t),n),to={},no=(n,e=to)=>n._$AH=e,io=n=>n._$AH,Tt=n=>{var i;(i=n._$AP)==null||i.call(n,!1,!0);let e=n._$AA;const t=n._$AB.nextSibling;for(;e!==t;){const r=e.nextSibling;e.remove(),e=r}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Sn=(n,e,t)=>{const i=new Map;for(let r=e;r<=t;r++)i.set(n[r],r);return i},An=xn(class extends Cn{constructor(n){if(super(n),n.type!==wn.CHILD)throw Error("repeat() can only be used in text expressions")}dt(n,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);const r=[],o=[];let s=0;for(const a of n)r[s]=i?i(a,s):s,o[s]=t(a,s),s++;return{values:o,keys:r}}render(n,e,t){return this.dt(n,e,t).values}update(n,[e,t,i]){const r=io(n),{values:o,keys:s}=this.dt(e,t,i);if(!Array.isArray(r))return this.ut=s,o;const a=this.ut??(this.ut=[]),c=[];let h,l,u=0,d=r.length-1,p=0,m=o.length-1;for(;u<=d&&p<=m;)if(r[u]===null)u++;else if(r[d]===null)d--;else if(a[u]===s[p])c[p]=$e(r[u],o[p]),u++,p++;else if(a[d]===s[m])c[m]=$e(r[d],o[m]),d--,m--;else if(a[u]===s[m])c[m]=$e(r[u],o[m]),We(n,c[m+1],r[u]),u++,m--;else if(a[d]===s[p])c[p]=$e(r[d],o[p]),We(n,r[u],r[d]),d--,p++;else if(h===void 0&&(h=Sn(s,p,m),l=Sn(a,u,d)),h.has(a[u]))if(h.has(a[d])){const _=l.get(s[p]),$=_!==void 0?r[_]:null;if($===null){const C=We(n,r[u]);$e(C,o[p]),c[p]=C}else c[p]=$e($,o[p]),We(n,r[u],$),r[_]=null;p++}else Tt(r[d]),d--;else Tt(r[u]),u++;for(;p<=m;){const _=We(n,c[m+1]);$e(_,o[p]),c[p++]=_}for(;u<=d;){const _=r[u++];_!==null&&Tt(_)}return this.ut=s,no(n,c),ge}}),qe=X`
  *,
  ::before,
  ::after {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #e5e7eb;
  }

  :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -moz-tab-size: 4;
    tab-size: 4;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
      'Apple Color Emoji', 'Segoe UI Emoji', Segoe UI Symbol, 'Noto Color Emoji';
    font-feature-settings: normal;
    font-variation-settings: normal;
  }

  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }

  abbr:where([title]) {
    text-decoration: underline dotted;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: inherit;
    font-weight: inherit;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }

  b,
  strong {
    font-weight: bolder;
  }

  code,
  kbd,
  samp,
  pre {
    font-size: 1em;
  }

  small {
    font-size: 80%;
  }

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    font-size: 100%;
    font-weight: inherit;
    line-height: inherit;
    color: inherit;
    margin: 0;
    padding: 0;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type='button'],
  [type='reset'],
  [type='submit'] {
    -webkit-appearance: button;
    background-color: transparent;
    background-image: none;
  }

  blockquote,
  dl,
  dd,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  hr,
  figure,
  p,
  pre {
    margin: 0;
  }

  ol,
  ul,
  menu {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  textarea {
    resize: vertical;
  }

  input::placeholder,
  textarea::placeholder {
    opacity: 1;
    color: #9ca3af;
  }

  button,
  [role='button'] {
    cursor: pointer;
  }
`;/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let jn=class extends Event{constructor(e,t,i){super("context-request",{bubbles:!0,composed:!0}),this.context=e,this.callback=t,this.subscribe=i??!1}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function sr(n){return n}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Mn=class{constructor(e,t,i,r){if(this.subscribe=!1,this.provided=!1,this.value=void 0,this.t=(o,s)=>{this.unsubscribe&&(this.unsubscribe!==s&&(this.provided=!1,this.unsubscribe()),this.subscribe||this.unsubscribe()),this.value=o,this.host.requestUpdate(),this.provided&&!this.subscribe||(this.provided=!0,this.callback&&this.callback(o,s)),this.unsubscribe=s},this.host=e,t.context!==void 0){const o=t;this.context=o.context,this.callback=o.callback,this.subscribe=o.subscribe??!1}else this.context=t,this.callback=i,this.subscribe=r??!1;this.host.addController(this)}hostConnected(){this.dispatchRequest()}hostDisconnected(){this.unsubscribe&&(this.unsubscribe(),this.unsubscribe=void 0)}dispatchRequest(){this.host.dispatchEvent(new jn(this.context,this.t,this.subscribe))}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let oo=class{get value(){return this.o}set value(e){this.setValue(e)}setValue(e,t=!1){const i=t||!Object.is(e,this.o);this.o=e,i&&this.updateObservers()}constructor(e){this.subscriptions=new Map,this.updateObservers=()=>{for(const[t,{disposer:i}]of this.subscriptions)t(this.o,i)},e!==void 0&&(this.value=e)}addCallback(e,t,i){if(!i)return void e(this.value);this.subscriptions.has(e)||this.subscriptions.set(e,{disposer:()=>{this.subscriptions.delete(e)},consumerHost:t});const{disposer:r}=this.subscriptions.get(e);e(this.value,r)}clearCallbacks(){this.subscriptions.clear()}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let ro=class extends Event{constructor(e){super("context-provider",{bubbles:!0,composed:!0}),this.context=e}};class En extends oo{constructor(e,t,i){var r,o;super(t.context!==void 0?t.initialValue:i),this.onContextRequest=s=>{const a=s.composedPath()[0];s.context===this.context&&a!==this.host&&(s.stopPropagation(),this.addCallback(s.callback,a,s.subscribe))},this.onProviderRequest=s=>{const a=s.composedPath()[0];if(s.context!==this.context||a===this.host)return;const c=new Set;for(const[h,{consumerHost:l}]of this.subscriptions)c.has(h)||(c.add(h),l.dispatchEvent(new jn(this.context,h,!0)));s.stopPropagation()},this.host=e,t.context!==void 0?this.context=t.context:this.context=t,this.attachListeners(),(o=(r=this.host).addController)==null||o.call(r,this)}attachListeners(){this.host.addEventListener("context-request",this.onContextRequest),this.host.addEventListener("context-provider",this.onProviderRequest)}hostConnected(){this.host.dispatchEvent(new ro(this.context))}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function le({context:n}){return(e,t)=>{const i=new WeakMap;if(typeof t=="object")return t.addInitializer(function(){i.set(this,new En(this,{context:n}))}),{get(){return e.get.call(this)},set(r){var o;return(o=i.get(this))==null||o.setValue(r),e.set.call(this,r)},init(r){var o;return(o=i.get(this))==null||o.setValue(r),r}};{e.constructor.addInitializer(s=>{i.set(s,new En(s,{context:n}))});const r=Object.getOwnPropertyDescriptor(e,t);let o;if(r===void 0){const s=new WeakMap;o={get:function(){return s.get(this)},set:function(a){i.get(this).setValue(a),s.set(this,a)},configurable:!0,enumerable:!0}}else{const s=r.set;o={...r,set:function(a){i.get(this).setValue(a),s==null||s.call(this,a)}}}return void Object.defineProperty(e,t,o)}}}/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Q({context:n,subscribe:e}){return(t,i)=>{typeof i=="object"?i.addInitializer(function(){new Mn(this,{context:n,callback:r=>{this[i.name]=r},subscribe:e})}):t.constructor.addInitializer(r=>{new Mn(r,{context:n,callback:o=>{r[i]=o},subscribe:e})})}}const Ee=Symbol("baseUrl"),Pn=Symbol("kind"),Rn=Symbol("group"),zn=Symbol("name"),Dn=Symbol("version"),On=Symbol("allowAnonymousComments"),so=Symbol("currentUser"),Tn=Symbol("emojiDataUrl");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Je=(n,e)=>{var i;const t=n._$AN;if(t===void 0)return!1;for(const r of t)(i=r._$AO)==null||i.call(r,e,!1),Je(r,e);return!0},rt=n=>{let e,t;do{if((e=n._$AM)===void 0)break;t=e._$AN,t.delete(n),n=e}while((t==null?void 0:t.size)===0)},Ln=n=>{for(let e;e=n._$AM;n=e){let t=e._$AN;if(t===void 0)e._$AN=t=new Set;else if(t.has(n))break;t.add(n),lo(e)}};function ao(n){this._$AN!==void 0?(rt(this),this._$AM=n,Ln(this)):this._$AM=n}function co(n,e=!1,t=0){const i=this._$AH,r=this._$AN;if(r!==void 0&&r.size!==0)if(e)if(Array.isArray(i))for(let o=t;o<i.length;o++)Je(i[o],!1),rt(i[o]);else i!=null&&(Je(i,!1),rt(i));else Je(this,n)}const lo=n=>{n.type==wn.CHILD&&(n._$AP??(n._$AP=co),n._$AQ??(n._$AQ=ao))};class ho extends Cn{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),Ln(this),this.isConnected=e._$AU}_$AO(e,t=!0){var i,r;e!==this.isConnected&&(this.isConnected=e,e?(i=this.reconnected)==null||i.call(this):(r=this.disconnected)==null||r.call(this)),t&&(Je(this,e),rt(this))}setValue(e){if(eo(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const st=()=>new uo;class uo{}const Lt=new WeakMap,at=xn(class extends ho{render(n){return U}update(n,[e]){var i;const t=e!==this.Y;return t&&this.Y!==void 0&&this.rt(void 0),(t||this.lt!==this.ct)&&(this.Y=e,this.ht=(i=n.options)==null?void 0:i.host,this.rt(this.ct=n.element)),U}rt(n){if(typeof this.Y=="function"){const e=this.ht??globalThis;let t=Lt.get(e);t===void 0&&(t=new WeakMap,Lt.set(e,t)),t.get(this.Y)!==void 0&&this.Y.call(this.ht,void 0),t.set(this.Y,n),n!==void 0&&this.Y.call(this.ht,n)}else this.Y.value=n}get lt(){var n,e;return typeof this.Y=="function"?(n=Lt.get(this.ht??globalThis))==null?void 0:n.get(this.Y):(e=this.Y)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});function Un(n){return n&&n.__esModule?n.default:n}function ee(n,e,t){return e in n?Object.defineProperty(n,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):n[e]=t,n}var ct,w,Hn,Ze,Bn,In,lt={},Nn=[],po=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function he(n,e){for(var t in e)n[t]=e[t];return n}function Fn(n){var e=n.parentNode;e&&e.removeChild(n)}function Ut(n,e,t){var i,r,o,s={};for(o in e)o=="key"?i=e[o]:o=="ref"?r=e[o]:s[o]=e[o];if(arguments.length>2&&(s.children=arguments.length>3?ct.call(arguments,2):t),typeof n=="function"&&n.defaultProps!=null)for(o in n.defaultProps)s[o]===void 0&&(s[o]=n.defaultProps[o]);return ht(n,s,i,r,null)}function ht(n,e,t,i,r){var o={type:n,props:e,key:t,ref:i,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:r??++Hn};return r==null&&w.vnode!=null&&w.vnode(o),o}function oe(){return{current:null}}function Pe(n){return n.children}function ne(n,e){this.props=n,this.context=e}function Re(n,e){if(e==null)return n.__?Re(n.__,n.__.__k.indexOf(n)+1):null;for(var t;e<n.__k.length;e++)if((t=n.__k[e])!=null&&t.__e!=null)return t.__e;return typeof n.type=="function"?Re(n):null}function Vn(n){var e,t;if((n=n.__)!=null&&n.__c!=null){for(n.__e=n.__c.base=null,e=0;e<n.__k.length;e++)if((t=n.__k[e])!=null&&t.__e!=null){n.__e=n.__c.base=t.__e;break}return Vn(n)}}function Yn(n){(!n.__d&&(n.__d=!0)&&Ze.push(n)&&!dt.__r++||In!==w.debounceRendering)&&((In=w.debounceRendering)||Bn)(dt)}function dt(){for(var n;dt.__r=Ze.length;)n=Ze.sort(function(e,t){return e.__v.__b-t.__v.__b}),Ze=[],n.some(function(e){var t,i,r,o,s,a;e.__d&&(s=(o=(t=e).__v).__e,(a=t.__P)&&(i=[],(r=he({},o)).__v=o.__v+1,Ht(a,o,r,t.__n,a.ownerSVGElement!==void 0,o.__h!=null?[s]:null,i,s??Re(o),o.__h),Xn(i,o),o.__e!=s&&Vn(o)))})}function Wn(n,e,t,i,r,o,s,a,c,h){var l,u,d,p,m,_,$,C=i&&i.__k||Nn,j=C.length;for(t.__k=[],l=0;l<e.length;l++)if((p=t.__k[l]=(p=e[l])==null||typeof p=="boolean"?null:typeof p=="string"||typeof p=="number"||typeof p=="bigint"?ht(null,p,null,null,p):Array.isArray(p)?ht(Pe,{children:p},null,null,null):p.__b>0?ht(p.type,p.props,p.key,null,p.__v):p)!=null){if(p.__=t,p.__b=t.__b+1,(d=C[l])===null||d&&p.key==d.key&&p.type===d.type)C[l]=void 0;else for(u=0;u<j;u++){if((d=C[u])&&p.key==d.key&&p.type===d.type){C[u]=void 0;break}d=null}Ht(n,p,d=d||lt,r,o,s,a,c,h),m=p.__e,(u=p.ref)&&d.ref!=u&&($||($=[]),d.ref&&$.push(d.ref,null,p),$.push(u,p.__c||m,p)),m!=null?(_==null&&(_=m),typeof p.type=="function"&&p.__k===d.__k?p.__d=c=qn(p,c,n):c=Jn(n,p,d,C,m,c),typeof t.type=="function"&&(t.__d=c)):c&&d.__e==c&&c.parentNode!=n&&(c=Re(d))}for(t.__e=_,l=j;l--;)C[l]!=null&&(typeof t.type=="function"&&C[l].__e!=null&&C[l].__e==t.__d&&(t.__d=Re(i,l+1)),ei(C[l],C[l]));if($)for(l=0;l<$.length;l++)Qn($[l],$[++l],$[++l])}function qn(n,e,t){for(var i,r=n.__k,o=0;r&&o<r.length;o++)(i=r[o])&&(i.__=n,e=typeof i.type=="function"?qn(i,e,t):Jn(t,i,i,r,i.__e,e));return e}function ut(n,e){return e=e||[],n==null||typeof n=="boolean"||(Array.isArray(n)?n.some(function(t){ut(t,e)}):e.push(n)),e}function Jn(n,e,t,i,r,o){var s,a,c;if(e.__d!==void 0)s=e.__d,e.__d=void 0;else if(t==null||r!=o||r.parentNode==null)e:if(o==null||o.parentNode!==n)n.appendChild(r),s=null;else{for(a=o,c=0;(a=a.nextSibling)&&c<i.length;c+=2)if(a==r)break e;n.insertBefore(r,o),s=o}return s!==void 0?s:r.nextSibling}function fo(n,e,t,i,r){var o;for(o in t)o==="children"||o==="key"||o in e||pt(n,o,null,t[o],i);for(o in e)r&&typeof e[o]!="function"||o==="children"||o==="key"||o==="value"||o==="checked"||t[o]===e[o]||pt(n,o,e[o],t[o],i)}function Zn(n,e,t){e[0]==="-"?n.setProperty(e,t):n[e]=t==null?"":typeof t!="number"||po.test(e)?t:t+"px"}function pt(n,e,t,i,r){var o;e:if(e==="style")if(typeof t=="string")n.style.cssText=t;else{if(typeof i=="string"&&(n.style.cssText=i=""),i)for(e in i)t&&e in t||Zn(n.style,e,"");if(t)for(e in t)i&&t[e]===i[e]||Zn(n.style,e,t[e])}else if(e[0]==="o"&&e[1]==="n")o=e!==(e=e.replace(/Capture$/,"")),e=e.toLowerCase()in n?e.toLowerCase().slice(2):e.slice(2),n.l||(n.l={}),n.l[e+o]=t,t?i||n.addEventListener(e,o?Gn:Kn,o):n.removeEventListener(e,o?Gn:Kn,o);else if(e!=="dangerouslySetInnerHTML"){if(r)e=e.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if(e!=="href"&&e!=="list"&&e!=="form"&&e!=="tabIndex"&&e!=="download"&&e in n)try{n[e]=t??"";break e}catch{}typeof t=="function"||(t!=null&&(t!==!1||e[0]==="a"&&e[1]==="r")?n.setAttribute(e,t):n.removeAttribute(e))}}function Kn(n){this.l[n.type+!1](w.event?w.event(n):n)}function Gn(n){this.l[n.type+!0](w.event?w.event(n):n)}function Ht(n,e,t,i,r,o,s,a,c){var h,l,u,d,p,m,_,$,C,j,H,z=e.type;if(e.constructor!==void 0)return null;t.__h!=null&&(c=t.__h,a=e.__e=t.__e,e.__h=null,o=[a]),(h=w.__b)&&h(e);try{e:if(typeof z=="function"){if($=e.props,C=(h=z.contextType)&&i[h.__c],j=h?C?C.props.value:h.__:i,t.__c?_=(l=e.__c=t.__c).__=l.__E:("prototype"in z&&z.prototype.render?e.__c=l=new z($,j):(e.__c=l=new ne($,j),l.constructor=z,l.render=vo),C&&C.sub(l),l.props=$,l.state||(l.state={}),l.context=j,l.__n=i,u=l.__d=!0,l.__h=[]),l.__s==null&&(l.__s=l.state),z.getDerivedStateFromProps!=null&&(l.__s==l.state&&(l.__s=he({},l.__s)),he(l.__s,z.getDerivedStateFromProps($,l.__s))),d=l.props,p=l.state,u)z.getDerivedStateFromProps==null&&l.componentWillMount!=null&&l.componentWillMount(),l.componentDidMount!=null&&l.__h.push(l.componentDidMount);else{if(z.getDerivedStateFromProps==null&&$!==d&&l.componentWillReceiveProps!=null&&l.componentWillReceiveProps($,j),!l.__e&&l.shouldComponentUpdate!=null&&l.shouldComponentUpdate($,l.__s,j)===!1||e.__v===t.__v){l.props=$,l.state=l.__s,e.__v!==t.__v&&(l.__d=!1),l.__v=e,e.__e=t.__e,e.__k=t.__k,e.__k.forEach(function(P){P&&(P.__=e)}),l.__h.length&&s.push(l);break e}l.componentWillUpdate!=null&&l.componentWillUpdate($,l.__s,j),l.componentDidUpdate!=null&&l.__h.push(function(){l.componentDidUpdate(d,p,m)})}l.context=j,l.props=$,l.state=l.__s,(h=w.__r)&&h(e),l.__d=!1,l.__v=e,l.__P=n,h=l.render(l.props,l.state,l.context),l.state=l.__s,l.getChildContext!=null&&(i=he(he({},i),l.getChildContext())),u||l.getSnapshotBeforeUpdate==null||(m=l.getSnapshotBeforeUpdate(d,p)),H=h!=null&&h.type===Pe&&h.key==null?h.props.children:h,Wn(n,Array.isArray(H)?H:[H],e,t,i,r,o,s,a,c),l.base=e.__e,e.__h=null,l.__h.length&&s.push(l),_&&(l.__E=l.__=null),l.__e=!1}else o==null&&e.__v===t.__v?(e.__k=t.__k,e.__e=t.__e):e.__e=mo(t.__e,e,t,i,r,o,s,c);(h=w.diffed)&&h(e)}catch(P){e.__v=null,(c||o!=null)&&(e.__e=a,e.__h=!!c,o[o.indexOf(a)]=null),w.__e(P,e,t)}}function Xn(n,e){w.__c&&w.__c(e,n),n.some(function(t){try{n=t.__h,t.__h=[],n.some(function(i){i.call(t)})}catch(i){w.__e(i,t.__v)}})}function mo(n,e,t,i,r,o,s,a){var c,h,l,u=t.props,d=e.props,p=e.type,m=0;if(p==="svg"&&(r=!0),o!=null){for(;m<o.length;m++)if((c=o[m])&&"setAttribute"in c==!!p&&(p?c.localName===p:c.nodeType===3)){n=c,o[m]=null;break}}if(n==null){if(p===null)return document.createTextNode(d);n=r?document.createElementNS("http://www.w3.org/2000/svg",p):document.createElement(p,d.is&&d),o=null,a=!1}if(p===null)u===d||a&&n.data===d||(n.data=d);else{if(o=o&&ct.call(n.childNodes),h=(u=t.props||lt).dangerouslySetInnerHTML,l=d.dangerouslySetInnerHTML,!a){if(o!=null)for(u={},m=0;m<n.attributes.length;m++)u[n.attributes[m].name]=n.attributes[m].value;(l||h)&&(l&&(h&&l.__html==h.__html||l.__html===n.innerHTML)||(n.innerHTML=l&&l.__html||""))}if(fo(n,d,u,r,a),l)e.__k=[];else if(m=e.props.children,Wn(n,Array.isArray(m)?m:[m],e,t,i,r&&p!=="foreignObject",o,s,o?o[0]:t.__k&&Re(t,0),a),o!=null)for(m=o.length;m--;)o[m]!=null&&Fn(o[m]);a||("value"in d&&(m=d.value)!==void 0&&(m!==u.value||m!==n.value||p==="progress"&&!m)&&pt(n,"value",m,u.value,!1),"checked"in d&&(m=d.checked)!==void 0&&m!==n.checked&&pt(n,"checked",m,u.checked,!1))}return n}function Qn(n,e,t){try{typeof n=="function"?n(e):n.current=e}catch(i){w.__e(i,t)}}function ei(n,e,t){var i,r;if(w.unmount&&w.unmount(n),(i=n.ref)&&(i.current&&i.current!==n.__e||Qn(i,null,e)),(i=n.__c)!=null){if(i.componentWillUnmount)try{i.componentWillUnmount()}catch(o){w.__e(o,e)}i.base=i.__P=null}if(i=n.__k)for(r=0;r<i.length;r++)i[r]&&ei(i[r],e,typeof n.type!="function");t||n.__e==null||Fn(n.__e),n.__e=n.__d=void 0}function vo(n,e,t){return this.constructor(n,t)}function ti(n,e,t){var i,r,o;w.__&&w.__(n,e),r=(i=typeof t=="function")?null:t&&t.__k||e.__k,o=[],Ht(e,n=(!i&&t||e).__k=Ut(Pe,null,[n]),r||lt,lt,e.ownerSVGElement!==void 0,!i&&t?[t]:r?null:e.firstChild?ct.call(e.childNodes):null,o,!i&&t?t:r?r.__e:e.firstChild,i),Xn(o,n)}ct=Nn.slice,w={__e:function(n,e){for(var t,i,r;e=e.__;)if((t=e.__c)&&!t.__)try{if((i=t.constructor)&&i.getDerivedStateFromError!=null&&(t.setState(i.getDerivedStateFromError(n)),r=t.__d),t.componentDidCatch!=null&&(t.componentDidCatch(n),r=t.__d),r)return t.__E=t}catch(o){n=o}throw n}},Hn=0,ne.prototype.setState=function(n,e){var t;t=this.__s!=null&&this.__s!==this.state?this.__s:this.__s=he({},this.state),typeof n=="function"&&(n=n(he({},t),this.props)),n&&he(t,n),n!=null&&this.__v&&(e&&this.__h.push(e),Yn(this))},ne.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),Yn(this))},ne.prototype.render=Pe,Ze=[],Bn=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,dt.__r=0;var go=0;function f(n,e,t,i,r){var o,s,a={};for(s in e)s=="ref"?o=e[s]:a[s]=e[s];var c={type:n,props:a,key:t,ref:o,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:--go,__source:i,__self:r};if(typeof n=="function"&&(o=n.defaultProps))for(s in o)a[s]===void 0&&(a[s]=o[s]);return w.vnode&&w.vnode(c),c}function bo(n,e){try{window.localStorage[`emoji-mart.${n}`]=JSON.stringify(e)}catch{}}function _o(n){try{const e=window.localStorage[`emoji-mart.${n}`];if(e)return JSON.parse(e)}catch{}}var de={set:bo,get:_o};const Bt=new Map,$o=[{v:14,emoji:"🫠"},{v:13.1,emoji:"😶‍🌫️"},{v:13,emoji:"🥸"},{v:12.1,emoji:"🧑‍🦰"},{v:12,emoji:"🥱"},{v:11,emoji:"🥰"},{v:5,emoji:"🤩"},{v:4,emoji:"👱‍♀️"},{v:3,emoji:"🤣"},{v:2,emoji:"👋🏻"},{v:1,emoji:"🙃"}];function yo(){for(const{v:n,emoji:e}of $o)if(ni(e))return n}function wo(){return!ni("🇨🇦")}function ni(n){if(Bt.has(n))return Bt.get(n);const e=xo(n);return Bt.set(n,e),e}const xo=(()=>{let n=null;try{navigator.userAgent.includes("jsdom")||(n=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}))}catch{}if(!n)return()=>!1;const e=25,t=20,i=Math.floor(e/2);return n.font=i+"px Arial, Sans-Serif",n.textBaseline="top",n.canvas.width=t*2,n.canvas.height=e,r=>{n.clearRect(0,0,t*2,e),n.fillStyle="#FF0000",n.fillText(r,0,22),n.fillStyle="#0000FF",n.fillText(r,t,22);const o=n.getImageData(0,0,t,e).data,s=o.length;let a=0;for(;a<s&&!o[a+3];a+=4);if(a>=s)return!1;const c=t+a/4%t,h=Math.floor(a/4/t),l=n.getImageData(c,h,1,1).data;return!(o[a]!==l[0]||o[a+2]!==l[2]||n.measureText(r).width>=t)}})();var ii={latestVersion:yo,noCountryFlags:wo};const It=["+1","grinning","kissing_heart","heart_eyes","laughing","stuck_out_tongue_winking_eye","sweat_smile","joy","scream","disappointed","unamused","weary","sob","sunglasses","heart"];let F=null;function Co(n){F||(F=de.get("frequently")||{});const e=n.id||n;e&&(F[e]||(F[e]=0),F[e]+=1,de.set("last",e),de.set("frequently",F))}function ko({maxFrequentRows:n,perLine:e}){if(!n)return[];F||(F=de.get("frequently"));let t=[];if(!F){F={};for(let o in It.slice(0,e)){const s=It[o];F[s]=e-o,t.push(s)}return t}const i=n*e,r=de.get("last");for(let o in F)t.push(o);if(t.sort((o,s)=>{const a=F[s],c=F[o];return a==c?o.localeCompare(s):a-c}),t.length>i){const o=t.slice(i);t=t.slice(0,i);for(let s of o)s!=r&&delete F[s];r&&t.indexOf(r)==-1&&(delete F[t[t.length-1]],t.splice(-1,1,r)),de.set("frequently",F)}return t}var oi={add:Co,get:ko,DEFAULTS:It},ri={};ri=JSON.parse('{"search":"Search","search_no_results_1":"Oh no!","search_no_results_2":"That emoji couldn’t be found","pick":"Pick an emoji…","add_custom":"Add custom emoji","categories":{"activity":"Activity","custom":"Custom","flags":"Flags","foods":"Food & Drink","frequent":"Frequently used","nature":"Animals & Nature","objects":"Objects","people":"Smileys & People","places":"Travel & Places","search":"Search Results","symbols":"Symbols"},"skins":{"1":"Default","2":"Light","3":"Medium-Light","4":"Medium","5":"Medium-Dark","6":"Dark","choose":"Choose default skin tone"}}');var re={autoFocus:{value:!1},dynamicWidth:{value:!1},emojiButtonColors:{value:null},emojiButtonRadius:{value:"100%"},emojiButtonSize:{value:36},emojiSize:{value:24},emojiVersion:{value:14,choices:[1,2,3,4,5,11,12,12.1,13,13.1,14]},exceptEmojis:{value:[]},icons:{value:"auto",choices:["auto","outline","solid"]},locale:{value:"en",choices:["en","ar","be","cs","de","es","fa","fi","fr","hi","it","ja","kr","nl","pl","pt","ru","sa","tr","uk","vi","zh"]},maxFrequentRows:{value:4},navPosition:{value:"top",choices:["top","bottom","none"]},noCountryFlags:{value:!1},noResultsEmoji:{value:null},perLine:{value:9},previewEmoji:{value:null},previewPosition:{value:"bottom",choices:["top","bottom","none"]},searchPosition:{value:"sticky",choices:["sticky","static","none"]},set:{value:"native",choices:["native","apple","facebook","google","twitter"]},skin:{value:1,choices:[1,2,3,4,5,6]},skinTonePosition:{value:"preview",choices:["preview","search","none"]},theme:{value:"auto",choices:["auto","light","dark"]},categories:null,categoryIcons:null,custom:null,data:null,i18n:null,getImageURL:null,getSpritesheetURL:null,onAddCustomEmoji:null,onClickOutside:null,onEmojiSelect:null,stickySearch:{deprecated:!0,value:!0}};let Y=null,A=null;const Nt={};async function si(n){if(Nt[n])return Nt[n];const t=await(await fetch(n)).json();return Nt[n]=t,t}let Ft=null,ai=null,ci=!1;function ft(n,{caller:e}={}){return Ft||(Ft=new Promise(t=>{ai=t})),n?So(n):e&&!ci&&console.warn(`\`${e}\` requires data to be initialized first. Promise will be pending until \`init\` is called.`),Ft}async function So(n){ci=!0;let{emojiVersion:e,set:t,locale:i}=n;if(e||(e=re.emojiVersion.value),t||(t=re.set.value),i||(i=re.locale.value),A)A.categories=A.categories.filter(c=>!c.name);else{A=(typeof n.data=="function"?await n.data():n.data)||await si(`https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/${e}/${t}.json`),A.emoticons={},A.natives={},A.categories.unshift({id:"frequent",emojis:[]});for(const c in A.aliases){const h=A.aliases[c],l=A.emojis[h];l&&(l.aliases||(l.aliases=[]),l.aliases.push(c))}A.originalCategories=A.categories}if(Y=(typeof n.i18n=="function"?await n.i18n():n.i18n)||(i=="en"?Un(ri):await si(`https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/i18n/${i}.json`)),n.custom)for(let c in n.custom){c=parseInt(c);const h=n.custom[c],l=n.custom[c-1];if(!(!h.emojis||!h.emojis.length)){h.id||(h.id=`custom_${c+1}`),h.name||(h.name=Y.categories.custom),l&&!h.icon&&(h.target=l.target||l),A.categories.push(h);for(const u of h.emojis)A.emojis[u.id]=u}}n.categories&&(A.categories=A.originalCategories.filter(c=>n.categories.indexOf(c.id)!=-1).sort((c,h)=>{const l=n.categories.indexOf(c.id),u=n.categories.indexOf(h.id);return l-u}));let r=null,o=null;t=="native"&&(r=ii.latestVersion(),o=n.noCountryFlags||ii.noCountryFlags());let s=A.categories.length,a=!1;for(;s--;){const c=A.categories[s];if(c.id=="frequent"){let{maxFrequentRows:u,perLine:d}=n;u=u>=0?u:re.maxFrequentRows.value,d||(d=re.perLine.value),c.emojis=oi.get({maxFrequentRows:u,perLine:d})}if(!c.emojis||!c.emojis.length){A.categories.splice(s,1);continue}const{categoryIcons:h}=n;if(h){const u=h[c.id];u&&!c.icon&&(c.icon=u)}let l=c.emojis.length;for(;l--;){const u=c.emojis[l],d=u.id?u:A.emojis[u],p=()=>{c.emojis.splice(l,1)};if(!d||n.exceptEmojis&&n.exceptEmojis.includes(d.id)){p();continue}if(r&&d.version>r){p();continue}if(o&&c.id=="flags"&&!Po.includes(d.id)){p();continue}if(!d.search){if(a=!0,d.search=","+[[d.id,!1],[d.name,!0],[d.keywords,!1],[d.emoticons,!1]].map(([_,$])=>{if(_)return(Array.isArray(_)?_:[_]).map(C=>($?C.split(/[-|_|\s]+/):[C]).map(j=>j.toLowerCase())).flat()}).flat().filter(_=>_&&_.trim()).join(","),d.emoticons)for(const _ of d.emoticons)A.emoticons[_]||(A.emoticons[_]=d.id);let m=0;for(const _ of d.skins){if(!_)continue;m++;const{native:$}=_;$&&(A.natives[$]=d.id,d.search+=`,${$}`);const C=m==1?"":`:skin-tone-${m}:`;_.shortcodes=`:${d.id}:${C}`}}}}a&&ze.reset(),ai()}function li(n,e,t){n||(n={});const i={};for(let r in e)i[r]=hi(r,n,e,t);return i}function hi(n,e,t,i){const r=t[n];let o=i&&i.getAttribute(n)||(e[n]!=null&&e[n]!=null?e[n]:null);return r&&(o!=null&&r.value&&typeof r.value!=typeof o&&(typeof r.value=="boolean"?o=o!="false":o=r.value.constructor(o)),r.transform&&o&&(o=r.transform(o)),(o==null||r.choices&&r.choices.indexOf(o)==-1)&&(o=r.value)),o}const Ao=/^(?:\:([^\:]+)\:)(?:\:skin-tone-(\d)\:)?$/;let Vt=null;function jo(n){return n.id?n:A.emojis[n]||A.emojis[A.aliases[n]]||A.emojis[A.natives[n]]}function Mo(){Vt=null}async function Eo(n,{maxResults:e,caller:t}={}){if(!n||!n.trim().length)return null;e||(e=90),await ft(null,{caller:t||"SearchIndex.search"});const i=n.toLowerCase().replace(/(\w)-/,"$1 ").split(/[\s|,]+/).filter((a,c,h)=>a.trim()&&h.indexOf(a)==c);if(!i.length)return;let r=Vt||(Vt=Object.values(A.emojis)),o,s;for(const a of i){if(!r.length)break;o=[],s={};for(const c of r){if(!c.search)continue;const h=c.search.indexOf(`,${a}`);h!=-1&&(o.push(c),s[c.id]||(s[c.id]=0),s[c.id]+=c.id==a?0:h+1)}r=o}return o.length<2||(o.sort((a,c)=>{const h=s[a.id],l=s[c.id];return h==l?a.id.localeCompare(c.id):h-l}),o.length>e&&(o=o.slice(0,e))),o}var ze={search:Eo,get:jo,reset:Mo,SHORTCODES_REGEX:Ao};const Po=["checkered_flag","crossed_flags","pirate_flag","rainbow-flag","transgender_flag","triangular_flag_on_post","waving_black_flag","waving_white_flag"];function Ro(n,e){return Array.isArray(n)&&Array.isArray(e)&&n.length===e.length&&n.every((t,i)=>t==e[i])}async function zo(n=1){for(let e in[...Array(n).keys()])await new Promise(requestAnimationFrame)}function Do(n,{skinIndex:e=0}={}){const t=n.skins[e]||(()=>(e=0,n.skins[e]))(),i={id:n.id,name:n.name,native:t.native,unified:t.unified,keywords:n.keywords,shortcodes:t.shortcodes||n.shortcodes};return n.skins.length>1&&(i.skin=e+1),t.src&&(i.src=t.src),n.aliases&&n.aliases.length&&(i.aliases=n.aliases),n.emoticons&&n.emoticons.length&&(i.emoticons=n.emoticons),i}var mt={categories:{activity:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:f("path",{d:"M12 0C5.373 0 0 5.372 0 12c0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.372-12-12-12m9.949 11H17.05c.224-2.527 1.232-4.773 1.968-6.113A9.966 9.966 0 0 1 21.949 11M13 11V2.051a9.945 9.945 0 0 1 4.432 1.564c-.858 1.491-2.156 4.22-2.392 7.385H13zm-2 0H8.961c-.238-3.165-1.536-5.894-2.393-7.385A9.95 9.95 0 0 1 11 2.051V11zm0 2v8.949a9.937 9.937 0 0 1-4.432-1.564c.857-1.492 2.155-4.221 2.393-7.385H11zm4.04 0c.236 3.164 1.534 5.893 2.392 7.385A9.92 9.92 0 0 1 13 21.949V13h2.04zM4.982 4.887C5.718 6.227 6.726 8.473 6.951 11h-4.9a9.977 9.977 0 0 1 2.931-6.113M2.051 13h4.9c-.226 2.527-1.233 4.771-1.969 6.113A9.972 9.972 0 0 1 2.051 13m16.967 6.113c-.735-1.342-1.744-3.586-1.968-6.113h4.899a9.961 9.961 0 0 1-2.931 6.113"})}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M16.17 337.5c0 44.98 7.565 83.54 13.98 107.9C35.22 464.3 50.46 496 174.9 496c9.566 0 19.59-.4707 29.84-1.271L17.33 307.3C16.53 317.6 16.17 327.7 16.17 337.5zM495.8 174.5c0-44.98-7.565-83.53-13.98-107.9c-4.688-17.54-18.34-31.23-36.04-35.95C435.5 27.91 392.9 16 337 16c-9.564 0-19.59 .4707-29.84 1.271l187.5 187.5C495.5 194.4 495.8 184.3 495.8 174.5zM26.77 248.8l236.3 236.3c142-36.1 203.9-150.4 222.2-221.1L248.9 26.87C106.9 62.96 45.07 177.2 26.77 248.8zM256 335.1c0 9.141-7.474 16-16 16c-4.094 0-8.188-1.564-11.31-4.689L164.7 283.3C161.6 280.2 160 276.1 160 271.1c0-8.529 6.865-16 16-16c4.095 0 8.189 1.562 11.31 4.688l64.01 64C254.4 327.8 256 331.9 256 335.1zM304 287.1c0 9.141-7.474 16-16 16c-4.094 0-8.188-1.564-11.31-4.689L212.7 235.3C209.6 232.2 208 228.1 208 223.1c0-9.141 7.473-16 16-16c4.094 0 8.188 1.562 11.31 4.688l64.01 64.01C302.5 279.8 304 283.9 304 287.1zM256 175.1c0-9.141 7.473-16 16-16c4.094 0 8.188 1.562 11.31 4.688l64.01 64.01c3.125 3.125 4.688 7.219 4.688 11.31c0 9.133-7.468 16-16 16c-4.094 0-8.189-1.562-11.31-4.688l-64.01-64.01C257.6 184.2 256 180.1 256 175.1z"})})},custom:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:f("path",{d:"M417.1 368c-5.937 10.27-16.69 16-27.75 16c-5.422 0-10.92-1.375-15.97-4.281L256 311.4V448c0 17.67-14.33 32-31.1 32S192 465.7 192 448V311.4l-118.3 68.29C68.67 382.6 63.17 384 57.75 384c-11.06 0-21.81-5.734-27.75-16c-8.828-15.31-3.594-34.88 11.72-43.72L159.1 256L41.72 187.7C26.41 178.9 21.17 159.3 29.1 144C36.63 132.5 49.26 126.7 61.65 128.2C65.78 128.7 69.88 130.1 73.72 132.3L192 200.6V64c0-17.67 14.33-32 32-32S256 46.33 256 64v136.6l118.3-68.29c3.838-2.213 7.939-3.539 12.07-4.051C398.7 126.7 411.4 132.5 417.1 144c8.828 15.31 3.594 34.88-11.72 43.72L288 256l118.3 68.28C421.6 333.1 426.8 352.7 417.1 368z"})}),flags:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:f("path",{d:"M0 0l6.084 24H8L1.916 0zM21 5h-4l-1-4H4l3 12h3l1 4h13L21 5zM6.563 3h7.875l2 8H8.563l-2-8zm8.832 10l-2.856 1.904L12.063 13h3.332zM19 13l-1.5-6h1.938l2 8H16l3-2z"})}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M64 496C64 504.8 56.75 512 48 512h-32C7.25 512 0 504.8 0 496V32c0-17.75 14.25-32 32-32s32 14.25 32 32V496zM476.3 0c-6.365 0-13.01 1.35-19.34 4.233c-45.69 20.86-79.56 27.94-107.8 27.94c-59.96 0-94.81-31.86-163.9-31.87C160.9 .3055 131.6 4.867 96 15.75v350.5c32-9.984 59.87-14.1 84.85-14.1c73.63 0 124.9 31.78 198.6 31.78c31.91 0 68.02-5.971 111.1-23.09C504.1 355.9 512 344.4 512 332.1V30.73C512 11.1 495.3 0 476.3 0z"})})},foods:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:f("path",{d:"M17 4.978c-1.838 0-2.876.396-3.68.934.513-1.172 1.768-2.934 4.68-2.934a1 1 0 0 0 0-2c-2.921 0-4.629 1.365-5.547 2.512-.064.078-.119.162-.18.244C11.73 1.838 10.798.023 9.207.023 8.579.022 7.85.306 7 .978 5.027 2.54 5.329 3.902 6.492 4.999 3.609 5.222 0 7.352 0 12.969c0 4.582 4.961 11.009 9 11.009 1.975 0 2.371-.486 3-1 .629.514 1.025 1 3 1 4.039 0 9-6.418 9-11 0-5.953-4.055-8-7-8M8.242 2.546c.641-.508.943-.523.965-.523.426.169.975 1.405 1.357 3.055-1.527-.629-2.741-1.352-2.98-1.846.059-.112.241-.356.658-.686M15 21.978c-1.08 0-1.21-.109-1.559-.402l-.176-.146c-.367-.302-.816-.452-1.266-.452s-.898.15-1.266.452l-.176.146c-.347.292-.477.402-1.557.402-2.813 0-7-5.389-7-9.009 0-5.823 4.488-5.991 5-5.991 1.939 0 2.484.471 3.387 1.251l.323.276a1.995 1.995 0 0 0 2.58 0l.323-.276c.902-.78 1.447-1.251 3.387-1.251.512 0 5 .168 5 6 0 3.617-4.187 9-7 9"})}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M481.9 270.1C490.9 279.1 496 291.3 496 304C496 316.7 490.9 328.9 481.9 337.9C472.9 346.9 460.7 352 448 352H64C51.27 352 39.06 346.9 30.06 337.9C21.06 328.9 16 316.7 16 304C16 291.3 21.06 279.1 30.06 270.1C39.06 261.1 51.27 256 64 256H448C460.7 256 472.9 261.1 481.9 270.1zM475.3 388.7C478.3 391.7 480 395.8 480 400V416C480 432.1 473.3 449.3 461.3 461.3C449.3 473.3 432.1 480 416 480H96C79.03 480 62.75 473.3 50.75 461.3C38.74 449.3 32 432.1 32 416V400C32 395.8 33.69 391.7 36.69 388.7C39.69 385.7 43.76 384 48 384H464C468.2 384 472.3 385.7 475.3 388.7zM50.39 220.8C45.93 218.6 42.03 215.5 38.97 211.6C35.91 207.7 33.79 203.2 32.75 198.4C31.71 193.5 31.8 188.5 32.99 183.7C54.98 97.02 146.5 32 256 32C365.5 32 457 97.02 479 183.7C480.2 188.5 480.3 193.5 479.2 198.4C478.2 203.2 476.1 207.7 473 211.6C469.1 215.5 466.1 218.6 461.6 220.8C457.2 222.9 452.3 224 447.3 224H64.67C59.73 224 54.84 222.9 50.39 220.8zM372.7 116.7C369.7 119.7 368 123.8 368 128C368 131.2 368.9 134.3 370.7 136.9C372.5 139.5 374.1 141.6 377.9 142.8C380.8 143.1 384 144.3 387.1 143.7C390.2 143.1 393.1 141.6 395.3 139.3C397.6 137.1 399.1 134.2 399.7 131.1C400.3 128 399.1 124.8 398.8 121.9C397.6 118.1 395.5 116.5 392.9 114.7C390.3 112.9 387.2 111.1 384 111.1C379.8 111.1 375.7 113.7 372.7 116.7V116.7zM244.7 84.69C241.7 87.69 240 91.76 240 96C240 99.16 240.9 102.3 242.7 104.9C244.5 107.5 246.1 109.6 249.9 110.8C252.8 111.1 256 112.3 259.1 111.7C262.2 111.1 265.1 109.6 267.3 107.3C269.6 105.1 271.1 102.2 271.7 99.12C272.3 96.02 271.1 92.8 270.8 89.88C269.6 86.95 267.5 84.45 264.9 82.7C262.3 80.94 259.2 79.1 256 79.1C251.8 79.1 247.7 81.69 244.7 84.69V84.69zM116.7 116.7C113.7 119.7 112 123.8 112 128C112 131.2 112.9 134.3 114.7 136.9C116.5 139.5 118.1 141.6 121.9 142.8C124.8 143.1 128 144.3 131.1 143.7C134.2 143.1 137.1 141.6 139.3 139.3C141.6 137.1 143.1 134.2 143.7 131.1C144.3 128 143.1 124.8 142.8 121.9C141.6 118.1 139.5 116.5 136.9 114.7C134.3 112.9 131.2 111.1 128 111.1C123.8 111.1 119.7 113.7 116.7 116.7L116.7 116.7z"})})},frequent:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:[f("path",{d:"M13 4h-2l-.001 7H9v2h2v2h2v-2h4v-2h-4z"}),f("path",{d:"M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"})]}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512zM232 256C232 264 236 271.5 242.7 275.1L338.7 339.1C349.7 347.3 364.6 344.3 371.1 333.3C379.3 322.3 376.3 307.4 365.3 300L280 243.2V120C280 106.7 269.3 96 255.1 96C242.7 96 231.1 106.7 231.1 120L232 256z"})})},nature:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:[f("path",{d:"M15.5 8a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 15.5 8M8.5 8a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 8.5 8"}),f("path",{d:"M18.933 0h-.027c-.97 0-2.138.787-3.018 1.497-1.274-.374-2.612-.51-3.887-.51-1.285 0-2.616.133-3.874.517C7.245.79 6.069 0 5.093 0h-.027C3.352 0 .07 2.67.002 7.026c-.039 2.479.276 4.238 1.04 5.013.254.258.882.677 1.295.882.191 3.177.922 5.238 2.536 6.38.897.637 2.187.949 3.2 1.102C8.04 20.6 8 20.795 8 21c0 1.773 2.35 3 4 3 1.648 0 4-1.227 4-3 0-.201-.038-.393-.072-.586 2.573-.385 5.435-1.877 5.925-7.587.396-.22.887-.568 1.104-.788.763-.774 1.079-2.534 1.04-5.013C23.929 2.67 20.646 0 18.933 0M3.223 9.135c-.237.281-.837 1.155-.884 1.238-.15-.41-.368-1.349-.337-3.291.051-3.281 2.478-4.972 3.091-5.031.256.015.731.27 1.265.646-1.11 1.171-2.275 2.915-2.352 5.125-.133.546-.398.858-.783 1.313M12 22c-.901 0-1.954-.693-2-1 0-.654.475-1.236 1-1.602V20a1 1 0 1 0 2 0v-.602c.524.365 1 .947 1 1.602-.046.307-1.099 1-2 1m3-3.48v.02a4.752 4.752 0 0 0-1.262-1.02c1.092-.516 2.239-1.334 2.239-2.217 0-1.842-1.781-2.195-3.977-2.195-2.196 0-3.978.354-3.978 2.195 0 .883 1.148 1.701 2.238 2.217A4.8 4.8 0 0 0 9 18.539v-.025c-1-.076-2.182-.281-2.973-.842-1.301-.92-1.838-3.045-1.853-6.478l.023-.041c.496-.826 1.49-1.45 1.804-3.102 0-2.047 1.357-3.631 2.362-4.522C9.37 3.178 10.555 3 11.948 3c1.447 0 2.685.192 3.733.57 1 .9 2.316 2.465 2.316 4.48.313 1.651 1.307 2.275 1.803 3.102.035.058.068.117.102.178-.059 5.967-1.949 7.01-4.902 7.19m6.628-8.202c-.037-.065-.074-.13-.113-.195a7.587 7.587 0 0 0-.739-.987c-.385-.455-.648-.768-.782-1.313-.076-2.209-1.241-3.954-2.353-5.124.531-.376 1.004-.63 1.261-.647.636.071 3.044 1.764 3.096 5.031.027 1.81-.347 3.218-.37 3.235"})]}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 576 512",children:f("path",{d:"M332.7 19.85C334.6 8.395 344.5 0 356.1 0C363.6 0 370.6 3.52 375.1 9.502L392 32H444.1C456.8 32 469.1 37.06 478.1 46.06L496 64H552C565.3 64 576 74.75 576 88V112C576 156.2 540.2 192 496 192H426.7L421.6 222.5L309.6 158.5L332.7 19.85zM448 64C439.2 64 432 71.16 432 80C432 88.84 439.2 96 448 96C456.8 96 464 88.84 464 80C464 71.16 456.8 64 448 64zM416 256.1V480C416 497.7 401.7 512 384 512H352C334.3 512 320 497.7 320 480V364.8C295.1 377.1 268.8 384 240 384C211.2 384 184 377.1 160 364.8V480C160 497.7 145.7 512 128 512H96C78.33 512 64 497.7 64 480V249.8C35.23 238.9 12.64 214.5 4.836 183.3L.9558 167.8C-3.331 150.6 7.094 133.2 24.24 128.1C41.38 124.7 58.76 135.1 63.05 152.2L66.93 167.8C70.49 182 83.29 191.1 97.97 191.1H303.8L416 256.1z"})})},objects:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:[f("path",{d:"M12 0a9 9 0 0 0-5 16.482V21s2.035 3 5 3 5-3 5-3v-4.518A9 9 0 0 0 12 0zm0 2c3.86 0 7 3.141 7 7s-3.14 7-7 7-7-3.141-7-7 3.14-7 7-7zM9 17.477c.94.332 1.946.523 3 .523s2.06-.19 3-.523v.834c-.91.436-1.925.689-3 .689a6.924 6.924 0 0 1-3-.69v-.833zm.236 3.07A8.854 8.854 0 0 0 12 21c.965 0 1.888-.167 2.758-.451C14.155 21.173 13.153 22 12 22c-1.102 0-2.117-.789-2.764-1.453z"}),f("path",{d:"M14.745 12.449h-.004c-.852-.024-1.188-.858-1.577-1.824-.421-1.061-.703-1.561-1.182-1.566h-.009c-.481 0-.783.497-1.235 1.537-.436.982-.801 1.811-1.636 1.791l-.276-.043c-.565-.171-.853-.691-1.284-1.794-.125-.313-.202-.632-.27-.913-.051-.213-.127-.53-.195-.634C7.067 9.004 7.039 9 6.99 9A1 1 0 0 1 7 7h.01c1.662.017 2.015 1.373 2.198 2.134.486-.981 1.304-2.058 2.797-2.075 1.531.018 2.28 1.153 2.731 2.141l.002-.008C14.944 8.424 15.327 7 16.979 7h.032A1 1 0 1 1 17 9h-.011c-.149.076-.256.474-.319.709a6.484 6.484 0 0 1-.311.951c-.429.973-.79 1.789-1.614 1.789"})]}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 384 512",children:f("path",{d:"M112.1 454.3c0 6.297 1.816 12.44 5.284 17.69l17.14 25.69c5.25 7.875 17.17 14.28 26.64 14.28h61.67c9.438 0 21.36-6.401 26.61-14.28l17.08-25.68c2.938-4.438 5.348-12.37 5.348-17.7L272 415.1h-160L112.1 454.3zM191.4 .0132C89.44 .3257 16 82.97 16 175.1c0 44.38 16.44 84.84 43.56 115.8c16.53 18.84 42.34 58.23 52.22 91.45c.0313 .25 .0938 .5166 .125 .7823h160.2c.0313-.2656 .0938-.5166 .125-.7823c9.875-33.22 35.69-72.61 52.22-91.45C351.6 260.8 368 220.4 368 175.1C368 78.61 288.9-.2837 191.4 .0132zM192 96.01c-44.13 0-80 35.89-80 79.1C112 184.8 104.8 192 96 192S80 184.8 80 176c0-61.76 50.25-111.1 112-111.1c8.844 0 16 7.159 16 16S200.8 96.01 192 96.01z"})})},people:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:[f("path",{d:"M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"}),f("path",{d:"M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0"})]}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"})})},places:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:[f("path",{d:"M6.5 12C5.122 12 4 13.121 4 14.5S5.122 17 6.5 17 9 15.879 9 14.5 7.878 12 6.5 12m0 3c-.275 0-.5-.225-.5-.5s.225-.5.5-.5.5.225.5.5-.225.5-.5.5M17.5 12c-1.378 0-2.5 1.121-2.5 2.5s1.122 2.5 2.5 2.5 2.5-1.121 2.5-2.5-1.122-2.5-2.5-2.5m0 3c-.275 0-.5-.225-.5-.5s.225-.5.5-.5.5.225.5.5-.225.5-.5.5"}),f("path",{d:"M22.482 9.494l-1.039-.346L21.4 9h.6c.552 0 1-.439 1-.992 0-.006-.003-.008-.003-.008H23c0-1-.889-2-1.984-2h-.642l-.731-1.717C19.262 3.012 18.091 2 16.764 2H7.236C5.909 2 4.738 3.012 4.357 4.283L3.626 6h-.642C1.889 6 1 7 1 8h.003S1 8.002 1 8.008C1 8.561 1.448 9 2 9h.6l-.043.148-1.039.346a2.001 2.001 0 0 0-1.359 2.097l.751 7.508a1 1 0 0 0 .994.901H3v1c0 1.103.896 2 2 2h2c1.104 0 2-.897 2-2v-1h6v1c0 1.103.896 2 2 2h2c1.104 0 2-.897 2-2v-1h1.096a.999.999 0 0 0 .994-.901l.751-7.508a2.001 2.001 0 0 0-1.359-2.097M6.273 4.857C6.402 4.43 6.788 4 7.236 4h9.527c.448 0 .834.43.963.857L19.313 9H4.688l1.585-4.143zM7 21H5v-1h2v1zm12 0h-2v-1h2v1zm2.189-3H2.811l-.662-6.607L3 11h18l.852.393L21.189 18z"})]}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M39.61 196.8L74.8 96.29C88.27 57.78 124.6 32 165.4 32H346.6C387.4 32 423.7 57.78 437.2 96.29L472.4 196.8C495.6 206.4 512 229.3 512 256V448C512 465.7 497.7 480 480 480H448C430.3 480 416 465.7 416 448V400H96V448C96 465.7 81.67 480 64 480H32C14.33 480 0 465.7 0 448V256C0 229.3 16.36 206.4 39.61 196.8V196.8zM109.1 192H402.9L376.8 117.4C372.3 104.6 360.2 96 346.6 96H165.4C151.8 96 139.7 104.6 135.2 117.4L109.1 192zM96 256C78.33 256 64 270.3 64 288C64 305.7 78.33 320 96 320C113.7 320 128 305.7 128 288C128 270.3 113.7 256 96 256zM416 320C433.7 320 448 305.7 448 288C448 270.3 433.7 256 416 256C398.3 256 384 270.3 384 288C384 305.7 398.3 320 416 320z"})})},symbols:{outline:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",children:f("path",{d:"M0 0h11v2H0zM4 11h3V6h4V4H0v2h4zM15.5 17c1.381 0 2.5-1.116 2.5-2.493s-1.119-2.493-2.5-2.493S13 13.13 13 14.507 14.119 17 15.5 17m0-2.986c.276 0 .5.222.5.493 0 .272-.224.493-.5.493s-.5-.221-.5-.493.224-.493.5-.493M21.5 19.014c-1.381 0-2.5 1.116-2.5 2.493S20.119 24 21.5 24s2.5-1.116 2.5-2.493-1.119-2.493-2.5-2.493m0 2.986a.497.497 0 0 1-.5-.493c0-.271.224-.493.5-.493s.5.222.5.493a.497.497 0 0 1-.5.493M22 13l-9 9 1.513 1.5 8.99-9.009zM17 11c2.209 0 4-1.119 4-2.5V2s.985-.161 1.498.949C23.01 4.055 23 6 23 6s1-1.119 1-3.135C24-.02 21 0 21 0h-2v6.347A5.853 5.853 0 0 0 17 6c-2.209 0-4 1.119-4 2.5s1.791 2.5 4 2.5M10.297 20.482l-1.475-1.585a47.54 47.54 0 0 1-1.442 1.129c-.307-.288-.989-1.016-2.045-2.183.902-.836 1.479-1.466 1.729-1.892s.376-.871.376-1.336c0-.592-.273-1.178-.818-1.759-.546-.581-1.329-.871-2.349-.871-1.008 0-1.79.293-2.344.879-.556.587-.832 1.181-.832 1.784 0 .813.419 1.748 1.256 2.805-.847.614-1.444 1.208-1.794 1.784a3.465 3.465 0 0 0-.523 1.833c0 .857.308 1.56.924 2.107.616.549 1.423.823 2.42.823 1.173 0 2.444-.379 3.813-1.137L8.235 24h2.819l-2.09-2.383 1.333-1.135zm-6.736-6.389a1.02 1.02 0 0 1 .73-.286c.31 0 .559.085.747.254a.849.849 0 0 1 .283.659c0 .518-.419 1.112-1.257 1.784-.536-.651-.805-1.231-.805-1.742a.901.901 0 0 1 .302-.669M3.74 22c-.427 0-.778-.116-1.057-.349-.279-.232-.418-.487-.418-.766 0-.594.509-1.288 1.527-2.083.968 1.134 1.717 1.946 2.248 2.438-.921.507-1.686.76-2.3.76"})}),solid:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:f("path",{d:"M500.3 7.251C507.7 13.33 512 22.41 512 31.1V175.1C512 202.5 483.3 223.1 447.1 223.1C412.7 223.1 383.1 202.5 383.1 175.1C383.1 149.5 412.7 127.1 447.1 127.1V71.03L351.1 90.23V207.1C351.1 234.5 323.3 255.1 287.1 255.1C252.7 255.1 223.1 234.5 223.1 207.1C223.1 181.5 252.7 159.1 287.1 159.1V63.1C287.1 48.74 298.8 35.61 313.7 32.62L473.7 .6198C483.1-1.261 492.9 1.173 500.3 7.251H500.3zM74.66 303.1L86.5 286.2C92.43 277.3 102.4 271.1 113.1 271.1H174.9C185.6 271.1 195.6 277.3 201.5 286.2L213.3 303.1H239.1C266.5 303.1 287.1 325.5 287.1 351.1V463.1C287.1 490.5 266.5 511.1 239.1 511.1H47.1C21.49 511.1-.0019 490.5-.0019 463.1V351.1C-.0019 325.5 21.49 303.1 47.1 303.1H74.66zM143.1 359.1C117.5 359.1 95.1 381.5 95.1 407.1C95.1 434.5 117.5 455.1 143.1 455.1C170.5 455.1 191.1 434.5 191.1 407.1C191.1 381.5 170.5 359.1 143.1 359.1zM440.3 367.1H496C502.7 367.1 508.6 372.1 510.1 378.4C513.3 384.6 511.6 391.7 506.5 396L378.5 508C372.9 512.1 364.6 513.3 358.6 508.9C352.6 504.6 350.3 496.6 353.3 489.7L391.7 399.1H336C329.3 399.1 323.4 395.9 321 389.6C318.7 383.4 320.4 376.3 325.5 371.1L453.5 259.1C459.1 255 467.4 254.7 473.4 259.1C479.4 263.4 481.6 271.4 478.7 278.3L440.3 367.1zM116.7 219.1L19.85 119.2C-8.112 90.26-6.614 42.31 24.85 15.34C51.82-8.137 93.26-3.642 118.2 21.83L128.2 32.32L137.7 21.83C162.7-3.642 203.6-8.137 231.6 15.34C262.6 42.31 264.1 90.26 236.1 119.2L139.7 219.1C133.2 225.6 122.7 225.6 116.7 219.1H116.7z"})})}},search:{loupe:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",children:f("path",{d:"M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"})}),delete:f("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 20 20",children:f("path",{d:"M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"})})}};function Yt(n){let{id:e,skin:t,emoji:i}=n;if(n.shortcodes){const a=n.shortcodes.match(ze.SHORTCODES_REGEX);a&&(e=a[1],a[2]&&(t=a[2]))}if(i||(i=ze.get(e||n.native)),!i)return n.fallback;const r=i.skins[t-1]||i.skins[0],o=r.src||(n.set!="native"&&!n.spritesheet?typeof n.getImageURL=="function"?n.getImageURL(n.set,r.unified):`https://cdn.jsdelivr.net/npm/emoji-datasource-${n.set}@14.0.0/img/${n.set}/64/${r.unified}.png`:void 0),s=typeof n.getSpritesheetURL=="function"?n.getSpritesheetURL(n.set):`https://cdn.jsdelivr.net/npm/emoji-datasource-${n.set}@14.0.0/img/${n.set}/sheets-256/64.png`;return f("span",{class:"emoji-mart-emoji","data-emoji-set":n.set,children:o?f("img",{style:{maxWidth:n.size||"1em",maxHeight:n.size||"1em",display:"inline-block"},alt:r.native||r.shortcodes,src:o}):n.set=="native"?f("span",{style:{fontSize:n.size,fontFamily:'"EmojiMart", "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", "Apple Color Emoji", "Twemoji Mozilla", "Noto Color Emoji", "Android Emoji"'},children:r.native}):f("span",{style:{display:"block",width:n.size,height:n.size,backgroundImage:`url(${s})`,backgroundSize:`${100*A.sheet.cols}% ${100*A.sheet.rows}%`,backgroundPosition:`${100/(A.sheet.cols-1)*r.x}% ${100/(A.sheet.rows-1)*r.y}%`}})})}const Oo=typeof window<"u"&&window.HTMLElement?window.HTMLElement:Object;class di extends Oo{static get observedAttributes(){return Object.keys(this.Props)}update(e={}){for(let t in e)this.attributeChangedCallback(t,null,e[t])}attributeChangedCallback(e,t,i){if(!this.component)return;const r=hi(e,{[e]:i},this.constructor.Props,this);this.component.componentWillReceiveProps?this.component.componentWillReceiveProps({[e]:r}):(this.component.props[e]=r,this.component.forceUpdate())}disconnectedCallback(){this.disconnected=!0,this.component&&this.component.unregister&&this.component.unregister()}constructor(e={}){if(super(),this.props=e,e.parent||e.ref){let t=null;const i=e.parent||(t=e.ref&&e.ref.current);t&&(t.innerHTML=""),i&&i.appendChild(this)}}}class To extends di{setShadow(){this.attachShadow({mode:"open"})}injectStyles(e){if(!e)return;const t=document.createElement("style");t.textContent=e,this.shadowRoot.insertBefore(t,this.shadowRoot.firstChild)}constructor(e,{styles:t}={}){super(e),this.setShadow(),this.injectStyles(t)}}var ui={fallback:"",id:"",native:"",shortcodes:"",size:{value:"",transform:n=>/\D/.test(n)?n:`${n}px`},set:re.set,skin:re.skin};class pi extends di{async connectedCallback(){const e=li(this.props,ui,this);e.element=this,e.ref=t=>{this.component=t},await ft(),!this.disconnected&&ti(f(Yt,{...e}),this)}constructor(e){super(e)}}ee(pi,"Props",ui),typeof customElements<"u"&&!customElements.get("em-emoji")&&customElements.define("em-emoji",pi);var fi,Wt=[],mi=w.__b,vi=w.__r,gi=w.diffed,bi=w.__c,_i=w.unmount;function Lo(){var n;for(Wt.sort(function(e,t){return e.__v.__b-t.__v.__b});n=Wt.pop();)if(n.__P)try{n.__H.__h.forEach(vt),n.__H.__h.forEach(qt),n.__H.__h=[]}catch(e){n.__H.__h=[],w.__e(e,n.__v)}}w.__b=function(n){mi&&mi(n)},w.__r=function(n){vi&&vi(n);var e=n.__c.__H;e&&(e.__h.forEach(vt),e.__h.forEach(qt),e.__h=[])},w.diffed=function(n){gi&&gi(n);var e=n.__c;e&&e.__H&&e.__H.__h.length&&(Wt.push(e)!==1&&fi===w.requestAnimationFrame||((fi=w.requestAnimationFrame)||function(t){var i,r=function(){clearTimeout(o),$i&&cancelAnimationFrame(i),setTimeout(t)},o=setTimeout(r,100);$i&&(i=requestAnimationFrame(r))})(Lo))},w.__c=function(n,e){e.some(function(t){try{t.__h.forEach(vt),t.__h=t.__h.filter(function(i){return!i.__||qt(i)})}catch(i){e.some(function(r){r.__h&&(r.__h=[])}),e=[],w.__e(i,t.__v)}}),bi&&bi(n,e)},w.unmount=function(n){_i&&_i(n);var e,t=n.__c;t&&t.__H&&(t.__H.__.forEach(function(i){try{vt(i)}catch(r){e=r}}),e&&w.__e(e,t.__v))};var $i=typeof requestAnimationFrame=="function";function vt(n){var e=n.__c;typeof e=="function"&&(n.__c=void 0,e())}function qt(n){n.__c=n.__()}function Uo(n,e){for(var t in e)n[t]=e[t];return n}function yi(n,e){for(var t in n)if(t!=="__source"&&!(t in e))return!0;for(var i in e)if(i!=="__source"&&n[i]!==e[i])return!0;return!1}function gt(n){this.props=n}(gt.prototype=new ne).isPureReactComponent=!0,gt.prototype.shouldComponentUpdate=function(n,e){return yi(this.props,n)||yi(this.state,e)};var wi=w.__b;w.__b=function(n){n.type&&n.type.__f&&n.ref&&(n.props.ref=n.ref,n.ref=null),wi&&wi(n)};var Ho=w.__e;w.__e=function(n,e,t){if(n.then){for(var i,r=e;r=r.__;)if((i=r.__c)&&i.__c)return e.__e==null&&(e.__e=t.__e,e.__k=t.__k),i.__c(n,e)}Ho(n,e,t)};var xi=w.unmount;function Jt(){this.__u=0,this.t=null,this.__b=null}function Ci(n){var e=n.__.__c;return e&&e.__e&&e.__e(n)}function bt(){this.u=null,this.o=null}w.unmount=function(n){var e=n.__c;e&&e.__R&&e.__R(),e&&n.__h===!0&&(n.type=null),xi&&xi(n)},(Jt.prototype=new ne).__c=function(n,e){var t=e.__c,i=this;i.t==null&&(i.t=[]),i.t.push(t);var r=Ci(i.__v),o=!1,s=function(){o||(o=!0,t.__R=null,r?r(a):a())};t.__R=s;var a=function(){if(!--i.__u){if(i.state.__e){var h=i.state.__e;i.__v.__k[0]=function u(d,p,m){return d&&(d.__v=null,d.__k=d.__k&&d.__k.map(function(_){return u(_,p,m)}),d.__c&&d.__c.__P===p&&(d.__e&&m.insertBefore(d.__e,d.__d),d.__c.__e=!0,d.__c.__P=m)),d}(h,h.__c.__P,h.__c.__O)}var l;for(i.setState({__e:i.__b=null});l=i.t.pop();)l.forceUpdate()}},c=e.__h===!0;i.__u++||c||i.setState({__e:i.__b=i.__v.__k[0]}),n.then(s,s)},Jt.prototype.componentWillUnmount=function(){this.t=[]},Jt.prototype.render=function(n,e){if(this.__b){if(this.__v.__k){var t=document.createElement("div"),i=this.__v.__k[0].__c;this.__v.__k[0]=function o(s,a,c){return s&&(s.__c&&s.__c.__H&&(s.__c.__H.__.forEach(function(h){typeof h.__c=="function"&&h.__c()}),s.__c.__H=null),(s=Uo({},s)).__c!=null&&(s.__c.__P===c&&(s.__c.__P=a),s.__c=null),s.__k=s.__k&&s.__k.map(function(h){return o(h,a,c)})),s}(this.__b,t,i.__O=i.__P)}this.__b=null}var r=e.__e&&Ut(Pe,null,n.fallback);return r&&(r.__h=null),[Ut(Pe,null,e.__e?null:n.children),r]};var ki=function(n,e,t){if(++t[1]===t[0]&&n.o.delete(e),n.props.revealOrder&&(n.props.revealOrder[0]!=="t"||!n.o.size))for(t=n.u;t;){for(;t.length>3;)t.pop()();if(t[1]<t[0])break;n.u=t=t[2]}};(bt.prototype=new ne).__e=function(n){var e=this,t=Ci(e.__v),i=e.o.get(n);return i[0]++,function(r){var o=function(){e.props.revealOrder?(i.push(r),ki(e,n,i)):r()};t?t(o):o()}},bt.prototype.render=function(n){this.u=null,this.o=new Map;var e=ut(n.children);n.revealOrder&&n.revealOrder[0]==="b"&&e.reverse();for(var t=e.length;t--;)this.o.set(e[t],this.u=[1,0,this.u]);return n.children},bt.prototype.componentDidUpdate=bt.prototype.componentDidMount=function(){var n=this;this.o.forEach(function(e,t){ki(n,t,e)})};var Bo=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,Io=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,No=typeof document<"u",Fo=function(n){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/i:/fil|che|ra/i).test(n)};ne.prototype.isReactComponent={},["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(n){Object.defineProperty(ne.prototype,n,{configurable:!0,get:function(){return this["UNSAFE_"+n]},set:function(e){Object.defineProperty(this,n,{configurable:!0,writable:!0,value:e})}})});var Si=w.event;function Vo(){}function Yo(){return this.cancelBubble}function Wo(){return this.defaultPrevented}w.event=function(n){return Si&&(n=Si(n)),n.persist=Vo,n.isPropagationStopped=Yo,n.isDefaultPrevented=Wo,n.nativeEvent=n};var Ai={configurable:!0,get:function(){return this.class}},ji=w.vnode;w.vnode=function(n){var e=n.type,t=n.props,i=t;if(typeof e=="string"){var r=e.indexOf("-")===-1;for(var o in i={},t){var s=t[o];No&&o==="children"&&e==="noscript"||o==="value"&&"defaultValue"in t&&s==null||(o==="defaultValue"&&"value"in t&&t.value==null?o="value":o==="download"&&s===!0?s="":/ondoubleclick/i.test(o)?o="ondblclick":/^onchange(textarea|input)/i.test(o+e)&&!Fo(t.type)?o="oninput":/^onfocus$/i.test(o)?o="onfocusin":/^onblur$/i.test(o)?o="onfocusout":/^on(Ani|Tra|Tou|BeforeInp)/.test(o)?o=o.toLowerCase():r&&Io.test(o)?o=o.replace(/[A-Z0-9]/,"-$&").toLowerCase():s===null&&(s=void 0),i[o]=s)}e=="select"&&i.multiple&&Array.isArray(i.value)&&(i.value=ut(t.children).forEach(function(a){a.props.selected=i.value.indexOf(a.props.value)!=-1})),e=="select"&&i.defaultValue!=null&&(i.value=ut(t.children).forEach(function(a){a.props.selected=i.multiple?i.defaultValue.indexOf(a.props.value)!=-1:i.defaultValue==a.props.value})),n.props=i,t.class!=t.className&&(Ai.enumerable="className"in t,t.className!=null&&(i.class=t.className),Object.defineProperty(i,"className",Ai))}n.$$typeof=Bo,ji&&ji(n)};var Mi=w.__r;w.__r=function(n){Mi&&Mi(n),n.__c};const qo={light:"outline",dark:"solid"};class Jo extends gt{renderIcon(e){const{icon:t}=e;if(t){if(t.svg)return f("span",{class:"flex",dangerouslySetInnerHTML:{__html:t.svg}});if(t.src)return f("img",{src:t.src})}const i=mt.categories[e.id]||mt.categories.custom,r=this.props.icons=="auto"?qo[this.props.theme]:this.props.icons;return i[r]||i}render(){let e=null;return f("nav",{id:"nav",class:"padding","data-position":this.props.position,dir:this.props.dir,children:f("div",{class:"flex relative",children:[this.categories.map((t,i)=>{const r=t.name||Y.categories[t.id],o=!this.props.unfocused&&t.id==this.state.categoryId;return o&&(e=i),f("button",{"aria-label":r,"aria-selected":o||void 0,title:r,type:"button",class:"flex flex-grow flex-center",onMouseDown:s=>s.preventDefault(),onClick:()=>{this.props.onClick({category:t,i})},children:this.renderIcon(t)})}),f("div",{class:"bar",style:{width:`${100/this.categories.length}%`,opacity:e==null?0:1,transform:this.props.dir==="rtl"?`scaleX(-1) translateX(${e*100}%)`:`translateX(${e*100}%)`}})]})})}constructor(){super(),this.categories=A.categories.filter(e=>!e.target),this.state={categoryId:this.categories[0].id}}}class Zo extends gt{shouldComponentUpdate(e){for(let t in e)if(t!="children"&&e[t]!=this.props[t])return!0;return!1}render(){return this.props.children}}const _t={rowsPerRender:10};class Ko extends ne{getInitialState(e=this.props){return{skin:de.get("skin")||e.skin,theme:this.initTheme(e.theme)}}componentWillMount(){this.dir=Y.rtl?"rtl":"ltr",this.refs={menu:oe(),navigation:oe(),scroll:oe(),search:oe(),searchInput:oe(),skinToneButton:oe(),skinToneRadio:oe()},this.initGrid(),this.props.stickySearch==!1&&this.props.searchPosition=="sticky"&&(console.warn("[EmojiMart] Deprecation warning: `stickySearch` has been renamed `searchPosition`."),this.props.searchPosition="static")}componentDidMount(){if(this.register(),this.shadowRoot=this.base.parentNode,this.props.autoFocus){const{searchInput:e}=this.refs;e.current&&e.current.focus()}}componentWillReceiveProps(e){this.nextState||(this.nextState={});for(const t in e)this.nextState[t]=e[t];clearTimeout(this.nextStateTimer),this.nextStateTimer=setTimeout(()=>{let t=!1;for(const r in this.nextState)this.props[r]=this.nextState[r],(r==="custom"||r==="categories")&&(t=!0);delete this.nextState;const i=this.getInitialState();if(t)return this.reset(i);this.setState(i)})}componentWillUnmount(){this.unregister()}async reset(e={}){await ft(this.props),this.initGrid(),this.unobserve(),this.setState(e,()=>{this.observeCategories(),this.observeRows()})}register(){document.addEventListener("click",this.handleClickOutside),this.observe()}unregister(){document.removeEventListener("click",this.handleClickOutside),this.unobserve()}observe(){this.observeCategories(),this.observeRows()}unobserve({except:e=[]}={}){Array.isArray(e)||(e=[e]);for(const t of this.observers)e.includes(t)||t.disconnect();this.observers=[].concat(e)}initGrid(){const{categories:e}=A;this.refs.categories=new Map;const t=A.categories.map(r=>r.id).join(",");this.navKey&&this.navKey!=t&&this.refs.scroll.current&&(this.refs.scroll.current.scrollTop=0),this.navKey=t,this.grid=[],this.grid.setsize=0;const i=(r,o)=>{const s=[];s.__categoryId=o.id,s.__index=r.length,this.grid.push(s);const a=this.grid.length-1,c=a%_t.rowsPerRender?{}:oe();return c.index=a,c.posinset=this.grid.setsize+1,r.push(c),s};for(let r of e){const o=[];let s=i(o,r);for(let a of r.emojis)s.length==this.getPerLine()&&(s=i(o,r)),this.grid.setsize+=1,s.push(a);this.refs.categories.set(r.id,{root:oe(),rows:o})}}initTheme(e){if(e!="auto")return e;if(!this.darkMedia){if(this.darkMedia=matchMedia("(prefers-color-scheme: dark)"),this.darkMedia.media.match(/^not/))return"light";this.darkMedia.addListener(()=>{this.props.theme=="auto"&&this.setState({theme:this.darkMedia.matches?"dark":"light"})})}return this.darkMedia.matches?"dark":"light"}initDynamicPerLine(e=this.props){if(!e.dynamicWidth)return;const{element:t,emojiButtonSize:i}=e,r=()=>{const{width:s}=t.getBoundingClientRect();return Math.floor(s/i)},o=new ResizeObserver(()=>{this.unobserve({except:o}),this.setState({perLine:r()},()=>{this.initGrid(),this.forceUpdate(()=>{this.observeCategories(),this.observeRows()})})});return o.observe(t),this.observers.push(o),r()}getPerLine(){return this.state.perLine||this.props.perLine}getEmojiByPos([e,t]){const i=this.state.searchResults||this.grid,r=i[e]&&i[e][t];if(r)return ze.get(r)}observeCategories(){const e=this.refs.navigation.current;if(!e)return;const t=new Map,i=s=>{s!=e.state.categoryId&&e.setState({categoryId:s})},r={root:this.refs.scroll.current,threshold:[0,1]},o=new IntersectionObserver(s=>{for(const c of s){const h=c.target.dataset.id;t.set(h,c.intersectionRatio)}const a=[...t];for(const[c,h]of a)if(h){i(c);break}},r);for(const{root:s}of this.refs.categories.values())o.observe(s.current);this.observers.push(o)}observeRows(){const e={...this.state.visibleRows},t=new IntersectionObserver(i=>{for(const r of i){const o=parseInt(r.target.dataset.index);r.isIntersecting?e[o]=!0:delete e[o]}this.setState({visibleRows:e})},{root:this.refs.scroll.current,rootMargin:`${this.props.emojiButtonSize*(_t.rowsPerRender+5)}px 0px ${this.props.emojiButtonSize*_t.rowsPerRender}px`});for(const{rows:i}of this.refs.categories.values())for(const r of i)r.current&&t.observe(r.current);this.observers.push(t)}preventDefault(e){e.preventDefault()}unfocusSearch(){const e=this.refs.searchInput.current;e&&e.blur()}navigate({e,input:t,left:i,right:r,up:o,down:s}){const a=this.state.searchResults||this.grid;if(!a.length)return;let[c,h]=this.state.pos;const l=(()=>{if(c==0&&h==0&&!e.repeat&&(i||o))return null;if(c==-1)return!e.repeat&&(r||s)&&t.selectionStart==t.value.length?[0,0]:null;if(i||r){let u=a[c];const d=i?-1:1;if(h+=d,!u[h]){if(c+=d,u=a[c],!u)return c=i?0:a.length-1,h=i?0:a[c].length-1,[c,h];h=i?u.length-1:0}return[c,h]}if(o||s){c+=o?-1:1;const u=a[c];return u?(u[h]||(h=u.length-1),[c,h]):(c=o?0:a.length-1,h=o?0:a[c].length-1,[c,h])}})();if(l)e.preventDefault();else{this.state.pos[0]>-1&&this.setState({pos:[-1,-1]});return}this.setState({pos:l,keyboard:!0},()=>{this.scrollTo({row:l[0]})})}scrollTo({categoryId:e,row:t}){const i=this.state.searchResults||this.grid;if(!i.length)return;const r=this.refs.scroll.current,o=r.getBoundingClientRect();let s=0;if(t>=0&&(e=i[t].__categoryId),e&&(s=(this.refs[e]||this.refs.categories.get(e).root).current.getBoundingClientRect().top-(o.top-r.scrollTop)+1),t>=0)if(!t)s=0;else{const a=i[t].__index,c=s+a*this.props.emojiButtonSize,h=c+this.props.emojiButtonSize+this.props.emojiButtonSize*.88;if(c<r.scrollTop)s=c;else if(h>r.scrollTop+o.height)s=h-o.height;else return}this.ignoreMouse(),r.scrollTop=s}ignoreMouse(){this.mouseIsIgnored=!0,clearTimeout(this.ignoreMouseTimer),this.ignoreMouseTimer=setTimeout(()=>{delete this.mouseIsIgnored},100)}handleEmojiOver(e){this.mouseIsIgnored||this.state.showSkins||this.setState({pos:e||[-1,-1],keyboard:!1})}handleEmojiClick({e,emoji:t,pos:i}){if(this.props.onEmojiSelect&&(!t&&i&&(t=this.getEmojiByPos(i)),t)){const r=Do(t,{skinIndex:this.state.skin-1});this.props.maxFrequentRows&&oi.add(r,this.props),this.props.onEmojiSelect(r,e)}}closeSkins(){this.state.showSkins&&(this.setState({showSkins:null,tempSkin:null}),this.base.removeEventListener("click",this.handleBaseClick),this.base.removeEventListener("keydown",this.handleBaseKeydown))}handleSkinMouseOver(e){this.setState({tempSkin:e})}handleSkinClick(e){this.ignoreMouse(),this.closeSkins(),this.setState({skin:e,tempSkin:null}),de.set("skin",e)}renderNav(){return f(Jo,{ref:this.refs.navigation,icons:this.props.icons,theme:this.state.theme,dir:this.dir,unfocused:!!this.state.searchResults,position:this.props.navPosition,onClick:this.handleCategoryClick},this.navKey)}renderPreview(){const e=this.getEmojiByPos(this.state.pos),t=this.state.searchResults&&!this.state.searchResults.length;return f("div",{id:"preview",class:"flex flex-middle",dir:this.dir,"data-position":this.props.previewPosition,children:[f("div",{class:"flex flex-middle flex-grow",children:[f("div",{class:"flex flex-auto flex-middle flex-center",style:{height:this.props.emojiButtonSize,fontSize:this.props.emojiButtonSize},children:f(Yt,{emoji:e,id:t?this.props.noResultsEmoji||"cry":this.props.previewEmoji||(this.props.previewPosition=="top"?"point_down":"point_up"),set:this.props.set,size:this.props.emojiButtonSize,skin:this.state.tempSkin||this.state.skin,spritesheet:!0,getSpritesheetURL:this.props.getSpritesheetURL})}),f("div",{class:`margin-${this.dir[0]}`,children:e||t?f("div",{class:`padding-${this.dir[2]} align-${this.dir[0]}`,children:[f("div",{class:"preview-title ellipsis",children:e?e.name:Y.search_no_results_1}),f("div",{class:"preview-subtitle ellipsis color-c",children:e?e.skins[0].shortcodes:Y.search_no_results_2})]}):f("div",{class:"preview-placeholder color-c",children:Y.pick})})]}),!e&&this.props.skinTonePosition=="preview"&&this.renderSkinToneButton()]})}renderEmojiButton(e,{pos:t,posinset:i,grid:r}){const o=this.props.emojiButtonSize,s=this.state.tempSkin||this.state.skin,c=(e.skins[s-1]||e.skins[0]).native,h=Ro(this.state.pos,t),l=t.concat(e.id).join("");return f(Zo,{selected:h,skin:s,size:o,children:f("button",{"aria-label":c,"aria-selected":h||void 0,"aria-posinset":i,"aria-setsize":r.setsize,"data-keyboard":this.state.keyboard,title:this.props.previewPosition=="none"?e.name:void 0,type:"button",class:"flex flex-center flex-middle",tabindex:"-1",onClick:u=>this.handleEmojiClick({e:u,emoji:e}),onMouseEnter:()=>this.handleEmojiOver(t),onMouseLeave:()=>this.handleEmojiOver(),style:{width:this.props.emojiButtonSize,height:this.props.emojiButtonSize,fontSize:this.props.emojiSize,lineHeight:0},children:[f("div",{"aria-hidden":"true",class:"background",style:{borderRadius:this.props.emojiButtonRadius,backgroundColor:this.props.emojiButtonColors?this.props.emojiButtonColors[(i-1)%this.props.emojiButtonColors.length]:void 0}}),f(Yt,{emoji:e,set:this.props.set,size:this.props.emojiSize,skin:s,spritesheet:!0,getSpritesheetURL:this.props.getSpritesheetURL})]})},l)}renderSearch(){const e=this.props.previewPosition=="none"||this.props.skinTonePosition=="search";return f("div",{children:[f("div",{class:"spacer"}),f("div",{class:"flex flex-middle",children:[f("div",{class:"search relative flex-grow",children:[f("input",{type:"search",ref:this.refs.searchInput,placeholder:Y.search,onClick:this.handleSearchClick,onInput:this.handleSearchInput,onKeyDown:this.handleSearchKeyDown,autoComplete:"off"}),f("span",{class:"icon loupe flex",children:mt.search.loupe}),this.state.searchResults&&f("button",{title:"Clear","aria-label":"Clear",type:"button",class:"icon delete flex",onClick:this.clearSearch,onMouseDown:this.preventDefault,children:mt.search.delete})]}),e&&this.renderSkinToneButton()]})]})}renderSearchResults(){const{searchResults:e}=this.state;return e?f("div",{class:"category",ref:this.refs.search,children:[f("div",{class:`sticky padding-small align-${this.dir[0]}`,children:Y.categories.search}),f("div",{children:e.length?e.map((t,i)=>f("div",{class:"flex",children:t.map((r,o)=>this.renderEmojiButton(r,{pos:[i,o],posinset:i*this.props.perLine+o+1,grid:e}))})):f("div",{class:`padding-small align-${this.dir[0]}`,children:this.props.onAddCustomEmoji&&f("a",{onClick:this.props.onAddCustomEmoji,children:Y.add_custom})})})]}):null}renderCategories(){const{categories:e}=A,t=!!this.state.searchResults,i=this.getPerLine();return f("div",{style:{visibility:t?"hidden":void 0,display:t?"none":void 0,height:"100%"},children:e.map(r=>{const{root:o,rows:s}=this.refs.categories.get(r.id);return f("div",{"data-id":r.target?r.target.id:r.id,class:"category",ref:o,children:[f("div",{class:`sticky padding-small align-${this.dir[0]}`,children:r.name||Y.categories[r.id]}),f("div",{class:"relative",style:{height:s.length*this.props.emojiButtonSize},children:s.map((a,c)=>{const h=a.index-a.index%_t.rowsPerRender,l=this.state.visibleRows[h],u="current"in a?a:void 0;if(!l&&!u)return null;const d=c*i,p=d+i,m=r.emojis.slice(d,p);return m.length<i&&m.push(...new Array(i-m.length)),f("div",{"data-index":a.index,ref:u,class:"flex row",style:{top:c*this.props.emojiButtonSize},children:l&&m.map((_,$)=>{if(!_)return f("div",{style:{width:this.props.emojiButtonSize,height:this.props.emojiButtonSize}});const C=ze.get(_);return this.renderEmojiButton(C,{pos:[a.index,$],posinset:a.posinset+$,grid:this.grid})})},a.index)})})]})})})}renderSkinToneButton(){return this.props.skinTonePosition=="none"?null:f("div",{class:"flex flex-auto flex-center flex-middle",style:{position:"relative",width:this.props.emojiButtonSize,height:this.props.emojiButtonSize},children:f("button",{type:"button",ref:this.refs.skinToneButton,class:"skin-tone-button flex flex-auto flex-center flex-middle","aria-selected":this.state.showSkins?"":void 0,"aria-label":Y.skins.choose,title:Y.skins.choose,onClick:this.openSkins,style:{width:this.props.emojiSize,height:this.props.emojiSize},children:f("span",{class:`skin-tone skin-tone-${this.state.skin}`})})})}renderLiveRegion(){const e=this.getEmojiByPos(this.state.pos),t=e?e.name:"";return f("div",{"aria-live":"polite",class:"sr-only",children:t})}renderSkins(){const t=this.refs.skinToneButton.current.getBoundingClientRect(),i=this.base.getBoundingClientRect(),r={};return this.dir=="ltr"?r.right=i.right-t.right-3:r.left=t.left-i.left-3,this.props.previewPosition=="bottom"&&this.props.skinTonePosition=="preview"?r.bottom=i.bottom-t.top+6:(r.top=t.bottom-i.top+3,r.bottom="auto"),f("div",{ref:this.refs.menu,role:"radiogroup",dir:this.dir,"aria-label":Y.skins.choose,class:"menu hidden","data-position":r.top?"top":"bottom",style:r,children:[...Array(6).keys()].map(o=>{const s=o+1,a=this.state.skin==s;return f("div",{children:[f("input",{type:"radio",name:"skin-tone",value:s,"aria-label":Y.skins[s],ref:a?this.refs.skinToneRadio:null,defaultChecked:a,onChange:()=>this.handleSkinMouseOver(s),onKeyDown:c=>{(c.code=="Enter"||c.code=="Space"||c.code=="Tab")&&(c.preventDefault(),this.handleSkinClick(s))}}),f("button",{"aria-hidden":"true",tabindex:"-1",onClick:()=>this.handleSkinClick(s),onMouseEnter:()=>this.handleSkinMouseOver(s),onMouseLeave:()=>this.handleSkinMouseOver(),class:"option flex flex-grow flex-middle",children:[f("span",{class:`skin-tone skin-tone-${s}`}),f("span",{class:"margin-small-lr",children:Y.skins[s]})]})]})})})}render(){const e=this.props.perLine*this.props.emojiButtonSize;return f("section",{id:"root",class:"flex flex-column",dir:this.dir,style:{width:this.props.dynamicWidth?"100%":`calc(${e}px + (var(--padding) + var(--sidebar-width)))`},"data-emoji-set":this.props.set,"data-theme":this.state.theme,"data-menu":this.state.showSkins?"":void 0,children:[this.props.previewPosition=="top"&&this.renderPreview(),this.props.navPosition=="top"&&this.renderNav(),this.props.searchPosition=="sticky"&&f("div",{class:"padding-lr",children:this.renderSearch()}),f("div",{ref:this.refs.scroll,class:"scroll flex-grow padding-lr",children:f("div",{style:{width:this.props.dynamicWidth?"100%":e,height:"100%"},children:[this.props.searchPosition=="static"&&this.renderSearch(),this.renderSearchResults(),this.renderCategories()]})}),this.props.navPosition=="bottom"&&this.renderNav(),this.props.previewPosition=="bottom"&&this.renderPreview(),this.state.showSkins&&this.renderSkins(),this.renderLiveRegion()]})}constructor(e){super(),ee(this,"handleClickOutside",t=>{const{element:i}=this.props;t.target!=i&&(this.state.showSkins&&this.closeSkins(),this.props.onClickOutside&&this.props.onClickOutside(t))}),ee(this,"handleBaseClick",t=>{this.state.showSkins&&(t.target.closest(".menu")||(t.preventDefault(),t.stopImmediatePropagation(),this.closeSkins()))}),ee(this,"handleBaseKeydown",t=>{this.state.showSkins&&t.key=="Escape"&&(t.preventDefault(),t.stopImmediatePropagation(),this.closeSkins())}),ee(this,"handleSearchClick",()=>{this.getEmojiByPos(this.state.pos)&&this.setState({pos:[-1,-1]})}),ee(this,"handleSearchInput",async()=>{const t=this.refs.searchInput.current;if(!t)return;const{value:i}=t,r=await ze.search(i),o=()=>{this.refs.scroll.current&&(this.refs.scroll.current.scrollTop=0)};if(!r)return this.setState({searchResults:r,pos:[-1,-1]},o);const s=t.selectionStart==t.value.length?[0,0]:[-1,-1],a=[];a.setsize=r.length;let c=null;for(let h of r)(!a.length||c.length==this.getPerLine())&&(c=[],c.__categoryId="search",c.__index=a.length,a.push(c)),c.push(h);this.ignoreMouse(),this.setState({searchResults:a,pos:s},o)}),ee(this,"handleSearchKeyDown",t=>{const i=t.currentTarget;switch(t.stopImmediatePropagation(),t.key){case"ArrowLeft":this.navigate({e:t,input:i,left:!0});break;case"ArrowRight":this.navigate({e:t,input:i,right:!0});break;case"ArrowUp":this.navigate({e:t,input:i,up:!0});break;case"ArrowDown":this.navigate({e:t,input:i,down:!0});break;case"Enter":t.preventDefault(),this.handleEmojiClick({e:t,pos:this.state.pos});break;case"Escape":t.preventDefault(),this.state.searchResults?this.clearSearch():this.unfocusSearch();break}}),ee(this,"clearSearch",()=>{const t=this.refs.searchInput.current;t&&(t.value="",t.focus(),this.handleSearchInput())}),ee(this,"handleCategoryClick",({category:t,i})=>{this.scrollTo(i==0?{row:-1}:{categoryId:t.id})}),ee(this,"openSkins",t=>{const{currentTarget:i}=t,r=i.getBoundingClientRect();this.setState({showSkins:r},async()=>{await zo(2);const o=this.refs.menu.current;o&&(o.classList.remove("hidden"),this.refs.skinToneRadio.current.focus(),this.base.addEventListener("click",this.handleBaseClick,!0),this.base.addEventListener("keydown",this.handleBaseKeydown,!0))})}),this.observers=[],this.state={pos:[-1,-1],perLine:this.initDynamicPerLine(e),visibleRows:{0:!0},...this.getInitialState(e)}}}class Zt extends To{async connectedCallback(){const e=li(this.props,re,this);e.element=this,e.ref=t=>{this.component=t},await ft(e),!this.disconnected&&ti(f(Ko,{...e}),this.shadowRoot)}constructor(e){super(e,{styles:Un(Ei)})}}ee(Zt,"Props",re),typeof customElements<"u"&&!customElements.get("em-emoji-picker")&&customElements.define("em-emoji-picker",Zt);var Ei={};Ei=`:host {
  width: min-content;
  height: 435px;
  min-height: 230px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  --border-radius: 10px;
  --category-icon-size: 18px;
  --font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  --font-size: 15px;
  --preview-placeholder-size: 21px;
  --preview-title-size: 1.1em;
  --preview-subtitle-size: .9em;
  --shadow-color: 0deg 0% 0%;
  --shadow: .3px .5px 2.7px hsl(var(--shadow-color) / .14), .4px .8px 1px -3.2px hsl(var(--shadow-color) / .14), 1px 2px 2.5px -4.5px hsl(var(--shadow-color) / .14);
  display: flex;
}

[data-theme="light"] {
  --em-rgb-color: var(--rgb-color, 34, 36, 39);
  --em-rgb-accent: var(--rgb-accent, 34, 102, 237);
  --em-rgb-background: var(--rgb-background, 255, 255, 255);
  --em-rgb-input: var(--rgb-input, 255, 255, 255);
  --em-color-border: var(--color-border, rgba(0, 0, 0, .05));
  --em-color-border-over: var(--color-border-over, rgba(0, 0, 0, .1));
}

[data-theme="dark"] {
  --em-rgb-color: var(--rgb-color, 222, 222, 221);
  --em-rgb-accent: var(--rgb-accent, 58, 130, 247);
  --em-rgb-background: var(--rgb-background, 21, 22, 23);
  --em-rgb-input: var(--rgb-input, 0, 0, 0);
  --em-color-border: var(--color-border, rgba(255, 255, 255, .1));
  --em-color-border-over: var(--color-border-over, rgba(255, 255, 255, .2));
}

#root {
  --color-a: rgb(var(--em-rgb-color));
  --color-b: rgba(var(--em-rgb-color), .65);
  --color-c: rgba(var(--em-rgb-color), .45);
  --padding: 12px;
  --padding-small: calc(var(--padding) / 2);
  --sidebar-width: 16px;
  --duration: 225ms;
  --duration-fast: 125ms;
  --duration-instant: 50ms;
  --easing: cubic-bezier(.4, 0, .2, 1);
  width: 100%;
  text-align: left;
  border-radius: var(--border-radius);
  background-color: rgb(var(--em-rgb-background));
  position: relative;
}

@media (prefers-reduced-motion) {
  #root {
    --duration: 0;
    --duration-fast: 0;
    --duration-instant: 0;
  }
}

#root[data-menu] button {
  cursor: auto;
}

#root[data-menu] .menu button {
  cursor: pointer;
}

:host, #root, input, button {
  color: rgb(var(--em-rgb-color));
  font-family: var(--font-family);
  font-size: var(--font-size);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: normal;
}

*, :before, :after {
  box-sizing: border-box;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.relative {
  position: relative;
}

.flex {
  display: flex;
}

.flex-auto {
  flex: none;
}

.flex-center {
  justify-content: center;
}

.flex-column {
  flex-direction: column;
}

.flex-grow {
  flex: auto;
}

.flex-middle {
  align-items: center;
}

.flex-wrap {
  flex-wrap: wrap;
}

.padding {
  padding: var(--padding);
}

.padding-t {
  padding-top: var(--padding);
}

.padding-lr {
  padding-left: var(--padding);
  padding-right: var(--padding);
}

.padding-r {
  padding-right: var(--padding);
}

.padding-small {
  padding: var(--padding-small);
}

.padding-small-b {
  padding-bottom: var(--padding-small);
}

.padding-small-lr {
  padding-left: var(--padding-small);
  padding-right: var(--padding-small);
}

.margin {
  margin: var(--padding);
}

.margin-r {
  margin-right: var(--padding);
}

.margin-l {
  margin-left: var(--padding);
}

.margin-small-l {
  margin-left: var(--padding-small);
}

.margin-small-lr {
  margin-left: var(--padding-small);
  margin-right: var(--padding-small);
}

.align-l {
  text-align: left;
}

.align-r {
  text-align: right;
}

.color-a {
  color: var(--color-a);
}

.color-b {
  color: var(--color-b);
}

.color-c {
  color: var(--color-c);
}

.ellipsis {
  white-space: nowrap;
  max-width: 100%;
  width: auto;
  text-overflow: ellipsis;
  overflow: hidden;
}

.sr-only {
  width: 1px;
  height: 1px;
  position: absolute;
  top: auto;
  left: -10000px;
  overflow: hidden;
}

a {
  cursor: pointer;
  color: rgb(var(--em-rgb-accent));
}

a:hover {
  text-decoration: underline;
}

.spacer {
  height: 10px;
}

[dir="rtl"] .scroll {
  padding-left: 0;
  padding-right: var(--padding);
}

.scroll {
  padding-right: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.scroll::-webkit-scrollbar {
  width: var(--sidebar-width);
  height: var(--sidebar-width);
}

.scroll::-webkit-scrollbar-track {
  border: 0;
}

.scroll::-webkit-scrollbar-button {
  width: 0;
  height: 0;
  display: none;
}

.scroll::-webkit-scrollbar-corner {
  background-color: rgba(0, 0, 0, 0);
}

.scroll::-webkit-scrollbar-thumb {
  min-height: 20%;
  min-height: 65px;
  border: 4px solid rgb(var(--em-rgb-background));
  border-radius: 8px;
}

.scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--em-color-border-over) !important;
}

.scroll:hover::-webkit-scrollbar-thumb {
  background-color: var(--em-color-border);
}

.sticky {
  z-index: 1;
  background-color: rgba(var(--em-rgb-background), .9);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  font-weight: 500;
  position: sticky;
  top: -1px;
}

[dir="rtl"] .search input[type="search"] {
  padding: 10px 2.2em 10px 2em;
}

[dir="rtl"] .search .loupe {
  left: auto;
  right: .7em;
}

[dir="rtl"] .search .delete {
  left: .7em;
  right: auto;
}

.search {
  z-index: 2;
  position: relative;
}

.search input, .search button {
  font-size: calc(var(--font-size)  - 1px);
}

.search input[type="search"] {
  width: 100%;
  background-color: var(--em-color-border);
  transition-duration: var(--duration);
  transition-property: background-color, box-shadow;
  transition-timing-function: var(--easing);
  border: 0;
  border-radius: 10px;
  outline: 0;
  padding: 10px 2em 10px 2.2em;
  display: block;
}

.search input[type="search"]::-ms-input-placeholder {
  color: inherit;
  opacity: .6;
}

.search input[type="search"]::placeholder {
  color: inherit;
  opacity: .6;
}

.search input[type="search"], .search input[type="search"]::-webkit-search-decoration, .search input[type="search"]::-webkit-search-cancel-button, .search input[type="search"]::-webkit-search-results-button, .search input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
  -ms-appearance: none;
  appearance: none;
}

.search input[type="search"]:focus {
  background-color: rgb(var(--em-rgb-input));
  box-shadow: inset 0 0 0 1px rgb(var(--em-rgb-accent)), 0 1px 3px rgba(65, 69, 73, .2);
}

.search .icon {
  z-index: 1;
  color: rgba(var(--em-rgb-color), .7);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.search .loupe {
  pointer-events: none;
  left: .7em;
}

.search .delete {
  right: .7em;
}

svg {
  fill: currentColor;
  width: 1em;
  height: 1em;
}

button {
  -webkit-appearance: none;
  -ms-appearance: none;
  appearance: none;
  cursor: pointer;
  color: currentColor;
  background-color: rgba(0, 0, 0, 0);
  border: 0;
}

#nav {
  z-index: 2;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: var(--sidebar-width);
  position: relative;
}

#nav button {
  color: var(--color-b);
  transition: color var(--duration) var(--easing);
}

#nav button:hover {
  color: var(--color-a);
}

#nav svg, #nav img {
  width: var(--category-icon-size);
  height: var(--category-icon-size);
}

#nav[dir="rtl"] .bar {
  left: auto;
  right: 0;
}

#nav .bar {
  width: 100%;
  height: 3px;
  background-color: rgb(var(--em-rgb-accent));
  transition: transform var(--duration) var(--easing);
  border-radius: 3px 3px 0 0;
  position: absolute;
  bottom: -12px;
  left: 0;
}

#nav button[aria-selected] {
  color: rgb(var(--em-rgb-accent));
}

#preview {
  z-index: 2;
  padding: calc(var(--padding)  + 4px) var(--padding);
  padding-right: var(--sidebar-width);
  position: relative;
}

#preview .preview-placeholder {
  font-size: var(--preview-placeholder-size);
}

#preview .preview-title {
  font-size: var(--preview-title-size);
}

#preview .preview-subtitle {
  font-size: var(--preview-subtitle-size);
}

#nav:before, #preview:before {
  content: "";
  height: 2px;
  position: absolute;
  left: 0;
  right: 0;
}

#nav[data-position="top"]:before, #preview[data-position="top"]:before {
  background: linear-gradient(to bottom, var(--em-color-border), transparent);
  top: 100%;
}

#nav[data-position="bottom"]:before, #preview[data-position="bottom"]:before {
  background: linear-gradient(to top, var(--em-color-border), transparent);
  bottom: 100%;
}

.category:last-child {
  min-height: calc(100% + 1px);
}

.category button {
  font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif;
  position: relative;
}

.category button > * {
  position: relative;
}

.category button .background {
  opacity: 0;
  background-color: var(--em-color-border);
  transition: opacity var(--duration-fast) var(--easing) var(--duration-instant);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.category button:hover .background {
  transition-duration: var(--duration-instant);
  transition-delay: 0s;
}

.category button[aria-selected] .background {
  opacity: 1;
}

.category button[data-keyboard] .background {
  transition: none;
}

.row {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.skin-tone-button {
  border: 1px solid rgba(0, 0, 0, 0);
  border-radius: 100%;
}

.skin-tone-button:hover {
  border-color: var(--em-color-border);
}

.skin-tone-button:active .skin-tone {
  transform: scale(.85) !important;
}

.skin-tone-button .skin-tone {
  transition: transform var(--duration) var(--easing);
}

.skin-tone-button[aria-selected] {
  background-color: var(--em-color-border);
  border-top-color: rgba(0, 0, 0, .05);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-left-width: 0;
  border-right-width: 0;
}

.skin-tone-button[aria-selected] .skin-tone {
  transform: scale(.9);
}

.menu {
  z-index: 2;
  white-space: nowrap;
  border: 1px solid var(--em-color-border);
  background-color: rgba(var(--em-rgb-background), .9);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  transition-property: opacity, transform;
  transition-duration: var(--duration);
  transition-timing-function: var(--easing);
  border-radius: 10px;
  padding: 4px;
  position: absolute;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, .05);
}

.menu.hidden {
  opacity: 0;
}

.menu[data-position="bottom"] {
  transform-origin: 100% 100%;
}

.menu[data-position="bottom"].hidden {
  transform: scale(.9)rotate(-3deg)translateY(5%);
}

.menu[data-position="top"] {
  transform-origin: 100% 0;
}

.menu[data-position="top"].hidden {
  transform: scale(.9)rotate(3deg)translateY(-5%);
}

.menu input[type="radio"] {
  clip: rect(0 0 0 0);
  width: 1px;
  height: 1px;
  border: 0;
  margin: 0;
  padding: 0;
  position: absolute;
  overflow: hidden;
}

.menu input[type="radio"]:checked + .option {
  box-shadow: 0 0 0 2px rgb(var(--em-rgb-accent));
}

.option {
  width: 100%;
  border-radius: 6px;
  padding: 4px 6px;
}

.option:hover {
  color: #fff;
  background-color: rgb(var(--em-rgb-accent));
}

.skin-tone {
  width: 16px;
  height: 16px;
  border-radius: 100%;
  display: inline-block;
  position: relative;
  overflow: hidden;
}

.skin-tone:after {
  content: "";
  mix-blend-mode: overlay;
  background: linear-gradient(rgba(255, 255, 255, .2), rgba(0, 0, 0, 0));
  border: 1px solid rgba(0, 0, 0, .8);
  border-radius: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: inset 0 -2px 3px #000, inset 0 1px 2px #fff;
}

.skin-tone-1 {
  background-color: #ffc93a;
}

.skin-tone-2 {
  background-color: #ffdab7;
}

.skin-tone-3 {
  background-color: #e7b98f;
}

.skin-tone-4 {
  background-color: #c88c61;
}

.skin-tone-5 {
  background-color: #a46134;
}

.skin-tone-6 {
  background-color: #5d4437;
}

[data-index] {
  justify-content: space-between;
}

[data-emoji-set="twitter"] .skin-tone:after {
  box-shadow: none;
  border-color: rgba(0, 0, 0, .5);
}

[data-emoji-set="twitter"] .skin-tone-1 {
  background-color: #fade72;
}

[data-emoji-set="twitter"] .skin-tone-2 {
  background-color: #f3dfd0;
}

[data-emoji-set="twitter"] .skin-tone-3 {
  background-color: #eed3a8;
}

[data-emoji-set="twitter"] .skin-tone-4 {
  background-color: #cfad8d;
}

[data-emoji-set="twitter"] .skin-tone-5 {
  background-color: #a8805d;
}

[data-emoji-set="twitter"] .skin-tone-6 {
  background-color: #765542;
}

[data-emoji-set="google"] .skin-tone:after {
  box-shadow: inset 0 0 2px 2px rgba(0, 0, 0, .4);
}

[data-emoji-set="google"] .skin-tone-1 {
  background-color: #f5c748;
}

[data-emoji-set="google"] .skin-tone-2 {
  background-color: #f1d5aa;
}

[data-emoji-set="google"] .skin-tone-3 {
  background-color: #d4b48d;
}

[data-emoji-set="google"] .skin-tone-4 {
  background-color: #aa876b;
}

[data-emoji-set="google"] .skin-tone-5 {
  background-color: #916544;
}

[data-emoji-set="google"] .skin-tone-6 {
  background-color: #61493f;
}

[data-emoji-set="facebook"] .skin-tone:after {
  border-color: rgba(0, 0, 0, .4);
  box-shadow: inset 0 -2px 3px #000, inset 0 1px 4px #fff;
}

[data-emoji-set="facebook"] .skin-tone-1 {
  background-color: #f5c748;
}

[data-emoji-set="facebook"] .skin-tone-2 {
  background-color: #f1d5aa;
}

[data-emoji-set="facebook"] .skin-tone-3 {
  background-color: #d4b48d;
}

[data-emoji-set="facebook"] .skin-tone-4 {
  background-color: #aa876b;
}

[data-emoji-set="facebook"] .skin-tone-5 {
  background-color: #916544;
}

[data-emoji-set="facebook"] .skin-tone-6 {
  background-color: #61493f;
}

`;var $t=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let De=class extends V{constructor(){super(...arguments),this.emojiDataUrl="https://unpkg.com/@emoji-mart/data",this.emojiLoading=!1,this.emojiPicker=null,this.emojiPickerWrapperRef=st(),this.textareaRef=st()}async handleOpenEmojiPicker(){var r,o;if((r=this.emojiPickerWrapperRef.value)!=null&&r.children.length)return;this.emojiLoading=!0;const t=await(await fetch(this.emojiDataUrl)).json(),i=new Zt({data:t,onEmojiSelect:({native:s})=>{this.textareaRef.value&&(this.textareaRef.value.value+=s,this.textareaRef.value.focus())}});(o=this.emojiPickerWrapperRef.value)==null||o.appendChild(i),this.emojiLoading=!1}render(){return E`
      <form class="base-form" @submit="${this.onSubmit}">
        <textarea
          class="base-form-editor"
          ${at(this.textareaRef)}
          placeholder="编写评论"
          rows="4"
          name="content"
          required
        ></textarea>
        <div class="base-form-anonymous-inputs">
          <input name="displayName" type="text" placeholder="昵称" required />
          <input name="email" type="email" placeholder="电子邮件" required />
          <input name="website" type="url" placeholder="网站" />
          <a href="#"> （已有该站点的账号） </a>
        </div>
        <div class="base-form-actions">
          <div ${at(this.emojiPickerWrapperRef)}></div>
          <button @click=${this.handleOpenEmojiPicker}>Emoji</button>
          <div>
            <button type="submit" class="base-form-submit">提交</button>
          </div>
        </div>
      </form>
    `}onSubmit(e){e.preventDefault();const t=e.target,i=new FormData(t),r=Object.fromEntries(i.entries()),o=new CustomEvent("submit",{detail:r});this.dispatchEvent(o)}resetForm(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("form");e==null||e.reset()}};De.styles=[qe,X`
      .base-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .base-form-editor {
        height: auto;
      }

      .base-form-anonymous-inputs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5rem;
        align-items: center;
      }

      @media (max-width: 640px) {
        .base-form-anonymous-inputs {
          grid-template-columns: 1fr;
        }
      }

      .base-form-anonymous-inputs a {
        font-size: 0.75rem;
        line-height: 1rem;
        color: #4b5563;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        user-select: none;
      }

      .base-form-anonymous-inputs a:hover {
        color: #111827;
      }

      input,
      textarea {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: #fff;
        border: 0.05rem solid #bcc3ce;
        border-radius: 0.3rem;
        color: #3b4351;
        display: block;
        font-size: 0.875rem;
        height: 2.25rem;
        max-width: 100%;
        outline: 0;
        padding: 0.4rem 0.75rem;
        width: 100%;
        transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
      }

      input:focus,
      textarea:focus {
        border-color: #5755d9;
        box-shadow: 0 0 0 0.1rem rgba(87, 85, 217, 0.2);
      }

      .base-form-actions {
        display: flex;
        justify-content: end;
      }

      .base-form-submit {
      }
    `],$t([Q({context:Tn}),R()],De.prototype,"emojiDataUrl",void 0),$t([R()],De.prototype,"emojiLoading",void 0),$t([R()],De.prototype,"emojiPicker",void 0),De=$t([K("base-form")],De);var ye=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let ue=class extends V{constructor(){super(...arguments),this.baseUrl="",this.group="",this.kind="",this.name="",this.version="v1alpha1",this.allowAnonymousComments=!1,this.baseFormRef=st()}render(){return E`<base-form
      ${at(this.baseFormRef)}
      @submit="${this.onSubmit}"
    ></base-form>`}async onSubmit(e){var o;e.preventDefault();const t=e.detail,i={raw:t.content,content:t.content,allowNotification:!1,subjectRef:{group:this.group,kind:this.kind,name:this.name,version:this.version},owner:{displayName:t.displayName,email:t.email,website:t.website}};await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});const r=new CustomEvent("reload");this.dispatchEvent(r),(o=this.baseFormRef.value)==null||o.resetForm()}};ye([Q({context:Ee}),R()],ue.prototype,"baseUrl",void 0),ye([Q({context:Rn}),R()],ue.prototype,"group",void 0),ye([Q({context:Pn}),R()],ue.prototype,"kind",void 0),ye([Q({context:zn}),R()],ue.prototype,"name",void 0),ye([Q({context:Dn}),R()],ue.prototype,"version",void 0),ye([Q({context:On}),R()],ue.prototype,"allowAnonymousComments",void 0),ue=ye([K("comment-form")],ue);var Ke=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let we=class extends V{constructor(){super(...arguments),this.error=!1,this.loading=!1}async connectedCallback(){super.connectedCallback(),await this.loadImage()}async loadImage(){if(!this.src)return Promise.resolve();this.loading=!0;try{await new Promise(e=>{const t=new Image;t.src=this.src||"",t.onload=()=>{this.error=!1,e(null)},t.onerror=()=>{this.error=!0,e(null)}})}catch{this.error=!0}finally{this.loading=!1}}getPlaceholderText(){if(!this.alt)return;const e=this.alt.split(" ");if(e.length===1)return e[0].charAt(0).toUpperCase();if(e.length>1)return e[0].charAt(0).toUpperCase()+e[1].charAt(0).toUpperCase()}render(){return this.src?this.loading?E`<div class="avatar-wrapper avatar-loading">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              style="opacity: 0.25;"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              style="opacity: 0.75;"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            ></path>
          </svg>
        </div>`:this.error?E`<div class="avatar-wrapper avatar-error">
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm-1-5h2v2h-2v-2Zm0-8h2v6h-2V7Z"
            />
          </svg>
        </div>`:E`<div class="avatar-wrapper">
        <img src="${this.src}" alt="${this.alt||""}" loading="lazy" />
      </div>`:E`<div class="avatar-wrapper">
      <span class="avatar-placeholder">${this.getPlaceholderText()}</span>
    </div>`}};we.styles=X`
    .avatar-wrapper {
      height: 2rem;
      width: 2rem;
      border-radius: 9999px;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: rgb(243 244 246);
    }

    .avatar-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-loading svg {
      height: 1.15rem;
      width: 1.15rem;
      animation: spin 1s linear infinite;
    }

    .avatar-error svg {
      height: 1.15rem;
      width: 1.15rem;
      color: rgb(255 59 48);
    }

    .avatar-placeholder {
      font-weight: 500;
      color: rgb(31 41 55);
      font-size: 0.75rem;
      line-height: 1rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,Ke([T({type:String})],we.prototype,"src",void 0),Ke([T({type:String})],we.prototype,"alt",void 0),Ke([R()],we.prototype,"error",void 0),Ke([R()],we.prototype,"loading",void 0),we=Ke([K("user-avatar")],we);var yt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Kt(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Pi={exports:{}};(function(n,e){(function(t,i){n.exports=i()})(yt,function(){var t=1e3,i=6e4,r=36e5,o="millisecond",s="second",a="minute",c="hour",h="day",l="week",u="month",d="quarter",p="year",m="date",_="Invalid Date",$=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,C=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,j={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(x){var b=["th","st","nd","rd"],v=x%100;return"["+x+(b[(v-20)%10]||b[v]||b[0])+"]"}},H=function(x,b,v){var y=String(x);return!y||y.length>=b?x:""+Array(b+1-y.length).join(v)+x},z={s:H,z:function(x){var b=-x.utcOffset(),v=Math.abs(b),y=Math.floor(v/60),g=v%60;return(b<=0?"+":"-")+H(y,2,"0")+":"+H(g,2,"0")},m:function x(b,v){if(b.date()<v.date())return-x(v,b);var y=12*(v.year()-b.year())+(v.month()-b.month()),g=b.clone().add(y,u),k=v-g<0,S=b.clone().add(y+(k?-1:1),u);return+(-(y+(v-g)/(k?g-S:S-g))||0)},a:function(x){return x<0?Math.ceil(x)||0:Math.floor(x)},p:function(x){return{M:u,y:p,w:l,d:h,D:m,h:c,m:a,s,ms:o,Q:d}[x]||String(x||"").toLowerCase().replace(/s$/,"")},u:function(x){return x===void 0}},P="en",B={};B[P]=j;var J="$isDayjsObject",Z=function(x){return x instanceof kt||!(!x||!x[J])},ae=function x(b,v,y){var g;if(!b)return P;if(typeof b=="string"){var k=b.toLowerCase();B[k]&&(g=k),v&&(B[k]=v,g=k);var S=b.split("-");if(!g&&S.length>1)return x(S[0])}else{var D=b.name;B[D]=b,g=D}return!y&&g&&(P=g),g||!y&&P},O=function(x,b){if(Z(x))return x.clone();var v=typeof b=="object"?b:{};return v.date=x,v.args=arguments,new kt(v)},M=z;M.l=ae,M.i=Z,M.w=function(x,b){return O(x,{locale:b.$L,utc:b.$u,x:b.$x,$offset:b.$offset})};var kt=function(){function x(v){this.$L=ae(v.locale,null,!0),this.parse(v),this.$x=this.$x||v.x||{},this[J]=!0}var b=x.prototype;return b.parse=function(v){this.$d=function(y){var g=y.date,k=y.utc;if(g===null)return new Date(NaN);if(M.u(g))return new Date;if(g instanceof Date)return new Date(g);if(typeof g=="string"&&!/Z$/i.test(g)){var S=g.match($);if(S){var D=S[2]-1||0,L=(S[7]||"0").substring(0,3);return k?new Date(Date.UTC(S[1],D,S[3]||1,S[4]||0,S[5]||0,S[6]||0,L)):new Date(S[1],D,S[3]||1,S[4]||0,S[5]||0,S[6]||0,L)}}return new Date(g)}(v),this.init()},b.init=function(){var v=this.$d;this.$y=v.getFullYear(),this.$M=v.getMonth(),this.$D=v.getDate(),this.$W=v.getDay(),this.$H=v.getHours(),this.$m=v.getMinutes(),this.$s=v.getSeconds(),this.$ms=v.getMilliseconds()},b.$utils=function(){return M},b.isValid=function(){return this.$d.toString()!==_},b.isSame=function(v,y){var g=O(v);return this.startOf(y)<=g&&g<=this.endOf(y)},b.isAfter=function(v,y){return O(v)<this.startOf(y)},b.isBefore=function(v,y){return this.endOf(y)<O(v)},b.$g=function(v,y,g){return M.u(v)?this[y]:this.set(g,v)},b.unix=function(){return Math.floor(this.valueOf()/1e3)},b.valueOf=function(){return this.$d.getTime()},b.startOf=function(v,y){var g=this,k=!!M.u(y)||y,S=M.p(v),D=function(Ae,q){var fe=M.w(g.$u?Date.UTC(g.$y,q,Ae):new Date(g.$y,q,Ae),g);return k?fe:fe.endOf(h)},L=function(Ae,q){return M.w(g.toDate()[Ae].apply(g.toDate("s"),(k?[0,0,0,0]:[23,59,59,999]).slice(q)),g)},I=this.$W,W=this.$M,G=this.$D,Ue="set"+(this.$u?"UTC":"");switch(S){case p:return k?D(1,0):D(31,11);case u:return k?D(1,W):D(0,W+1);case l:var Se=this.$locale().weekStart||0,et=(I<Se?I+7:I)-Se;return D(k?G-et:G+(6-et),W);case h:case m:return L(Ue+"Hours",0);case c:return L(Ue+"Minutes",1);case a:return L(Ue+"Seconds",2);case s:return L(Ue+"Milliseconds",3);default:return this.clone()}},b.endOf=function(v){return this.startOf(v,!1)},b.$set=function(v,y){var g,k=M.p(v),S="set"+(this.$u?"UTC":""),D=(g={},g[h]=S+"Date",g[m]=S+"Date",g[u]=S+"Month",g[p]=S+"FullYear",g[c]=S+"Hours",g[a]=S+"Minutes",g[s]=S+"Seconds",g[o]=S+"Milliseconds",g)[k],L=k===h?this.$D+(y-this.$W):y;if(k===u||k===p){var I=this.clone().set(m,1);I.$d[D](L),I.init(),this.$d=I.set(m,Math.min(this.$D,I.daysInMonth())).$d}else D&&this.$d[D](L);return this.init(),this},b.set=function(v,y){return this.clone().$set(v,y)},b.get=function(v){return this[M.p(v)]()},b.add=function(v,y){var g,k=this;v=Number(v);var S=M.p(y),D=function(W){var G=O(k);return M.w(G.date(G.date()+Math.round(W*v)),k)};if(S===u)return this.set(u,this.$M+v);if(S===p)return this.set(p,this.$y+v);if(S===h)return D(1);if(S===l)return D(7);var L=(g={},g[a]=i,g[c]=r,g[s]=t,g)[S]||1,I=this.$d.getTime()+v*L;return M.w(I,this)},b.subtract=function(v,y){return this.add(-1*v,y)},b.format=function(v){var y=this,g=this.$locale();if(!this.isValid())return g.invalidDate||_;var k=v||"YYYY-MM-DDTHH:mm:ssZ",S=M.z(this),D=this.$H,L=this.$m,I=this.$M,W=g.weekdays,G=g.months,Ue=g.meridiem,Se=function(q,fe,tt,St){return q&&(q[fe]||q(y,k))||tt[fe].slice(0,St)},et=function(q){return M.s(D%12||12,q,"0")},Ae=Ue||function(q,fe,tt){var St=q<12?"AM":"PM";return tt?St.toLowerCase():St};return k.replace(C,function(q,fe){return fe||function(tt){switch(tt){case"YY":return String(y.$y).slice(-2);case"YYYY":return M.s(y.$y,4,"0");case"M":return I+1;case"MM":return M.s(I+1,2,"0");case"MMM":return Se(g.monthsShort,I,G,3);case"MMMM":return Se(G,I);case"D":return y.$D;case"DD":return M.s(y.$D,2,"0");case"d":return String(y.$W);case"dd":return Se(g.weekdaysMin,y.$W,W,2);case"ddd":return Se(g.weekdaysShort,y.$W,W,3);case"dddd":return W[y.$W];case"H":return String(D);case"HH":return M.s(D,2,"0");case"h":return et(1);case"hh":return et(2);case"a":return Ae(D,L,!0);case"A":return Ae(D,L,!1);case"m":return String(L);case"mm":return M.s(L,2,"0");case"s":return String(y.$s);case"ss":return M.s(y.$s,2,"0");case"SSS":return M.s(y.$ms,3,"0");case"Z":return S}return null}(q)||S.replace(":","")})},b.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},b.diff=function(v,y,g){var k,S=this,D=M.p(y),L=O(v),I=(L.utcOffset()-this.utcOffset())*i,W=this-L,G=function(){return M.m(S,L)};switch(D){case p:k=G()/12;break;case u:k=G();break;case d:k=G()/3;break;case l:k=(W-I)/6048e5;break;case h:k=(W-I)/864e5;break;case c:k=W/r;break;case a:k=W/i;break;case s:k=W/t;break;default:k=W}return g?k:M.a(k)},b.daysInMonth=function(){return this.endOf(u).$D},b.$locale=function(){return B[this.$L]},b.locale=function(v,y){if(!v)return this.$L;var g=this.clone(),k=ae(v,y,!0);return k&&(g.$L=k),g},b.clone=function(){return M.w(this.$d,this)},b.toDate=function(){return new Date(this.valueOf())},b.toJSON=function(){return this.isValid()?this.toISOString():null},b.toISOString=function(){return this.$d.toISOString()},b.toString=function(){return this.$d.toUTCString()},x}(),Li=kt.prototype;return O.prototype=Li,[["$ms",o],["$s",s],["$m",a],["$H",c],["$W",h],["$M",u],["$y",p],["$D",m]].forEach(function(x){Li[x[1]]=function(b){return this.$g(b,x[0],x[1])}}),O.extend=function(x,b){return x.$i||(x(b,kt,O),x.$i=!0),O},O.locale=ae,O.isDayjs=Z,O.unix=function(x){return O(1e3*x)},O.en=B[P],O.Ls=B,O.p={},O})})(Pi);var Ri=Pi.exports;const Oe=Kt(Ri);var Go={exports:{}};(function(n,e){(function(t,i){n.exports=i(Ri)})(yt,function(t){function i(s){return s&&typeof s=="object"&&"default"in s?s:{default:s}}var r=i(t),o={name:"zh-cn",weekdays:"星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),weekdaysShort:"周日_周一_周二_周三_周四_周五_周六".split("_"),weekdaysMin:"日_一_二_三_四_五_六".split("_"),months:"一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),ordinal:function(s,a){return a==="W"?s+"周":s+"日"},weekStart:1,yearStart:4,formats:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY/MM/DD",LL:"YYYY年M月D日",LLL:"YYYY年M月D日Ah点mm分",LLLL:"YYYY年M月D日ddddAh点mm分",l:"YYYY/M/D",ll:"YYYY年M月D日",lll:"YYYY年M月D日 HH:mm",llll:"YYYY年M月D日dddd HH:mm"},relativeTime:{future:"%s内",past:"%s前",s:"几秒",m:"1 分钟",mm:"%d 分钟",h:"1 小时",hh:"%d 小时",d:"1 天",dd:"%d 天",M:"1 个月",MM:"%d 个月",y:"1 年",yy:"%d 年"},meridiem:function(s,a){var c=100*s+a;return c<600?"凌晨":c<900?"早上":c<1100?"上午":c<1300?"中午":c<1800?"下午":"晚上"}};return r.default.locale(o,null,!0),o})})(Go);var zi={exports:{}};(function(n,e){(function(t,i){n.exports=i()})(yt,function(){var t={year:0,month:1,day:2,hour:3,minute:4,second:5},i={};return function(r,o,s){var a,c=function(d,p,m){m===void 0&&(m={});var _=new Date(d),$=function(C,j){j===void 0&&(j={});var H=j.timeZoneName||"short",z=C+"|"+H,P=i[z];return P||(P=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:C,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:H}),i[z]=P),P}(p,m);return $.formatToParts(_)},h=function(d,p){for(var m=c(d,p),_=[],$=0;$<m.length;$+=1){var C=m[$],j=C.type,H=C.value,z=t[j];z>=0&&(_[z]=parseInt(H,10))}var P=_[3],B=P===24?0:P,J=_[0]+"-"+_[1]+"-"+_[2]+" "+B+":"+_[4]+":"+_[5]+":000",Z=+d;return(s.utc(J).valueOf()-(Z-=Z%1e3))/6e4},l=o.prototype;l.tz=function(d,p){d===void 0&&(d=a);var m=this.utcOffset(),_=this.toDate(),$=_.toLocaleString("en-US",{timeZone:d}),C=Math.round((_-new Date($))/1e3/60),j=s($,{locale:this.$L}).$set("millisecond",this.$ms).utcOffset(15*-Math.round(_.getTimezoneOffset()/15)-C,!0);if(p){var H=j.utcOffset();j=j.add(m-H,"minute")}return j.$x.$timezone=d,j},l.offsetName=function(d){var p=this.$x.$timezone||s.tz.guess(),m=c(this.valueOf(),p,{timeZoneName:d}).find(function(_){return _.type.toLowerCase()==="timezonename"});return m&&m.value};var u=l.startOf;l.startOf=function(d,p){if(!this.$x||!this.$x.$timezone)return u.call(this,d,p);var m=s(this.format("YYYY-MM-DD HH:mm:ss:SSS"),{locale:this.$L});return u.call(m,d,p).tz(this.$x.$timezone,!0)},s.tz=function(d,p,m){var _=m&&p,$=m||p||a,C=h(+s(),$);if(typeof d!="string")return s(d).tz($);var j=function(B,J,Z){var ae=B-60*J*1e3,O=h(ae,Z);if(J===O)return[ae,J];var M=h(ae-=60*(O-J)*1e3,Z);return O===M?[ae,O]:[B-60*Math.min(O,M)*1e3,Math.max(O,M)]}(s.utc(d,_).valueOf(),C,$),H=j[0],z=j[1],P=s(H).utcOffset(z);return P.$x.$timezone=$,P},s.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},s.tz.setDefault=function(d){a=d}}})})(zi);var Xo=zi.exports;const Qo=Kt(Xo);var Di={exports:{}};(function(n,e){(function(t,i){n.exports=i()})(yt,function(){return function(t,i,r){t=t||{};var o=i.prototype,s={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"};function a(h,l,u,d){return o.fromToBase(h,l,u,d)}r.en.relativeTime=s,o.fromToBase=function(h,l,u,d,p){for(var m,_,$,C=u.$locale().relativeTime||s,j=t.thresholds||[{l:"s",r:44,d:"second"},{l:"m",r:89},{l:"mm",r:44,d:"minute"},{l:"h",r:89},{l:"hh",r:21,d:"hour"},{l:"d",r:35},{l:"dd",r:25,d:"day"},{l:"M",r:45},{l:"MM",r:10,d:"month"},{l:"y",r:17},{l:"yy",d:"year"}],H=j.length,z=0;z<H;z+=1){var P=j[z];P.d&&(m=d?r(h).diff(u,P.d,!0):u.diff(h,P.d,!0));var B=(t.rounding||Math.round)(Math.abs(m));if($=m>0,B<=P.r||!P.r){B<=1&&z>0&&(P=j[z-1]);var J=C[P.l];p&&(B=p(""+B)),_=typeof J=="string"?J.replace("%d",B):J(B,l,P.l,$);break}}if(l)return _;var Z=$?C.future:C.past;return typeof Z=="function"?Z(_):Z.replace("%s",_)},o.to=function(h,l){return a(h,l,this,!0)},o.from=function(h,l){return a(h,l,this)};var c=function(h){return h.$u?r.utc():r()};o.toNow=function(h){return this.to(c(this),h)},o.fromNow=function(h){return this.from(c(this),h)}}})})(Di);var er=Di.exports;const tr=Kt(er);Oe.extend(Qo),Oe.extend(tr),Oe.locale("zh-cn");function nr(n){return n?Oe(n).format("YYYY-MM-DD HH:mm"):""}function ir(n){return n?new Date().getFullYear()-new Date(n).getFullYear()>0?nr(new Date(n)):Oe().to(Oe(n)):""}var Ge=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let xe=class extends V{constructor(){super(...arguments),this.content=""}render(){return E`<div class="base-comment-item">
      <div class="base-comment-item-avatar">
        <user-avatar
          src="${this.userAvatar||""}"
          alt="${this.userDisplayName||""}"
        ></user-avatar>
      </div>
      <div class="base-comment-item-main">
        <div class="base-comment-item-meta">
          <div class="base-comment-item-author">${this.userDisplayName}</div>
          <div class="base-comment-item-date">
            ${ir(this.creationTime)}
          </div>
        </div>

        <div class="base-comment-item-content">
          <pre>${this.content}</pre>
        </div>

        <div class="base-comment-item-actions">
          <slot name="action"></slot>
        </div>

        <slot name="footer"></slot>
      </div>
    </div>`}};xe.styles=[qe,X`
      .base-comment-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 0;
      }

      .base-comment-item-main {
        flex: 1;
      }

      .base-comment-item-meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .base-comment-item-author {
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .base-comment-item-date {
        color: rgb(107 114 128);
        font-size: 0.75rem;
        line-height: 1rem;
      }

      .base-comment-item-content {
        margin-top: 0.5rem;
      }

      .base-comment-item-content pre {
        white-space: pre-wrap;
        overflow-wrap: break-word;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: rgb(31 41 55);
      }

      .base-comment-item-actions {
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
      }
    `],Ge([T({type:String})],xe.prototype,"userAvatar",void 0),Ge([T({type:String})],xe.prototype,"userDisplayName",void 0),Ge([T({type:String})],xe.prototype,"creationTime",void 0),Ge([T({type:String})],xe.prototype,"content",void 0),xe=Ge([K("base-comment-item")],xe);var Oi=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let wt=class extends V{constructor(){super(...arguments),this.text=""}render(){return E`
      <div slot="action" class="base-comment-item-action">
        <div class="base-comment-item-action-icon">
          <slot name="icon"></slot>
        </div>
        <span class="base-comment-item-action-text"> ${this.text} </span>
      </div>
    `}};wt.styles=X`
    .base-comment-item-action {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      margin-right: 0.5rem;
    }

    .base-comment-item-action:hover .base-comment-item-action-icon {
      background-color: rgb(243 244 246);
    }

    .base-comment-item-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 0.15s;
      padding: 0.45rem;
    }

    .base-comment-item-action-icon ::slotted(svg) {
      width: 1rem;
      height: 1rem;
      color: rgb(75 85 99);
    }

    .base-comment-item-action-text {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: rgb(75 85 99);
    }
  `,Oi([T({type:String})],wt.prototype,"text",void 0),wt=Oi([K("base-comment-item-action")],wt);var xt=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let Xe=class extends V{constructor(){super(...arguments),this.baseUrl="",this.baseFormRef=st()}render(){return E`<base-form
      ${at(this.baseFormRef)}
      @submit="${this.onSubmit}"
    ></base-form>`}async onSubmit(e){var r,o;e.preventDefault();const t=e.detail,i={raw:t.content,content:t.content,allowNotification:!0,owner:{displayName:t.displayName,email:t.email,website:t.website}};this.quoteReply&&(i.quoteReply=this.quoteReply.metadata.name),await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${(r=this.comment)==null?void 0:r.metadata.name}/reply`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)}),(o=this.baseFormRef.value)==null||o.resetForm()}};xt([Q({context:Ee}),R()],Xe.prototype,"baseUrl",void 0),xt([T({type:Object})],Xe.prototype,"comment",void 0),xt([T({type:Object})],Xe.prototype,"quoteReply",void 0),Xe=xt([K("reply-form")],Xe);const Gt="halo.upvoted.comments",Xt="halo.upvoted.replies";var Ce=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let se=class extends V{constructor(){super(...arguments),this.baseUrl="",this.showReplyForm=!1,this.upvoted=!1,this.upvoteCount=0}connectedCallback(){var e;super.connectedCallback(),this.checkUpvotedStatus(),this.upvoteCount=((e=this.reply)==null?void 0:e.stats.upvote)||0}checkUpvotedStatus(){var t;JSON.parse(localStorage.getItem(Xt)||"[]").includes((t=this.reply)==null?void 0:t.metadata.name)&&(this.upvoted=!0)}async handleUpvote(){var i,r,o;const e=JSON.parse(localStorage.getItem(Xt)||"[]");if(e.includes((i=this.reply)==null?void 0:i.metadata.name))return;const t={name:(r=this.reply)==null?void 0:r.metadata.name,plural:"replies",group:"content.halo.run"};await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),e.push((o=this.reply)==null?void 0:o.metadata.name),localStorage.setItem(Xt,JSON.stringify(e)),this.upvoteCount+=1,this.upvoted=!0,this.checkUpvotedStatus()}render(){var e,t,i,r;return E`
      <base-comment-item
        .userAvatar="${(e=this.reply)==null?void 0:e.owner.avatar}"
        .userDisplayName="${(t=this.reply)==null?void 0:t.owner.displayName}"
        .content="${((i=this.reply)==null?void 0:i.spec.content)||""}"
        .creationTime="${((r=this.reply)==null?void 0:r.metadata.creationTimestamp)??void 0}"
      >
        <base-comment-item-action
          slot="action"
          class="reply-item-action-upvote"
          .text="${this.upvoteCount+""}"
          @click="${this.handleUpvote}"
        >
          ${this.upvoted?E`<svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                >
                  <path d="M0 0h24v24H0z" />
                  <path
                    fill="red"
                    d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037.033l.034-.03a6 6 0 0 1 4.733-1.44l.246.036a6 6 0 0 1 3.364 10.008l-.18.185l-.048.041l-7.45 7.379a1 1 0 0 1-1.313.082l-.094-.082l-7.493-7.422A6 6 0 0 1 6.979 3.074z"
                  />
                </g>
              </svg>`:E`<svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"
                />
              </svg>`}
        </base-comment-item-action>

        <base-comment-item-action
          slot="action"
          @click="${()=>this.showReplyForm=!this.showReplyForm}"
        >
          <svg
            slot="icon"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c3.255 2.777 3.695 7.266 1.029 10.501C16.608 19.942 11.659 20.922 7.7 19L3 20"
            />
          </svg>
        </base-comment-item-action>

        ${this.showReplyForm?E`
              <div class="reply-form-wrapper" slot="footer">
                <reply-form
                  .comment=${this.comment}
                  .quoteReply=${this.reply}
                ></reply-form>
              </div>
            `:""}
      </base-comment-item>
    `}};se.styles=[qe,X`
      .reply-item-action-upvote {
        margin-left: -0.5rem;
      }

      .reply-form-wrapper {
        margin-top: 0.5rem;
      }
    `],Ce([Q({context:Ee}),R()],se.prototype,"baseUrl",void 0),Ce([T({type:Object})],se.prototype,"comment",void 0),Ce([T({type:Object})],se.prototype,"reply",void 0),Ce([R()],se.prototype,"showReplyForm",void 0),Ce([R()],se.prototype,"upvoted",void 0),Ce([R()],se.prototype,"upvoteCount",void 0),se=Ce([K("reply-item")],se);var or=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let Qt=class extends V{render(){return E` <div class="loading-block">
      <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle
          style="opacity: 0.25;"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          style="opacity: 0.75;"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        ></path>
      </svg>
    </div>`}};Qt.styles=X`
    .loading-block {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .loading-block svg {
      height: 1.25rem;
      width: 1.25rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,Qt=or([K("loading-block")],Qt);var Qe=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let ke=class extends V{constructor(){super(...arguments),this.baseUrl="",this.replies=[],this.loading=!1}render(){return E`<div class="comment-replies">
      <reply-form .comment=${this.comment}></reply-form>
      ${this.loading?E`<loading-block></loading-block>`:E`
            ${An(this.replies,e=>e.metadata.name,e=>E`<reply-item
                  .comment=${this.comment}
                  .reply="${e}"
                ></reply-item>`)}
          `}
    </div>`}async fetchReplies(){var i;this.loading=!0;const t=await(await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${(i=this.comment)==null?void 0:i.metadata.name}/reply`)).json();this.replies=t.items,this.loading=!1}connectedCallback(){super.connectedCallback(),this.fetchReplies()}};ke.styles=X`
    .comment-replies {
      margin-top: 0.5rem;
    }
  `,Qe([Q({context:Ee}),T({attribute:!1})],ke.prototype,"baseUrl",void 0),Qe([T({type:Object})],ke.prototype,"comment",void 0),Qe([R()],ke.prototype,"replies",void 0),Qe([R()],ke.prototype,"loading",void 0),ke=Qe([K("comment-replies")],ke);var Te=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let pe=class extends V{constructor(){super(...arguments),this.baseUrl="",this.showReplies=!1,this.upvoted=!1,this.upvoteCount=0}connectedCallback(){var e;super.connectedCallback(),this.checkUpvotedStatus(),this.upvoteCount=((e=this.comment)==null?void 0:e.stats.upvote)||0}checkUpvotedStatus(){var t;JSON.parse(localStorage.getItem(Gt)||"[]").includes((t=this.comment)==null?void 0:t.metadata.name)&&(this.upvoted=!0)}async handleUpvote(){var i,r,o;const e=JSON.parse(localStorage.getItem(Gt)||"[]");if(e.includes((i=this.comment)==null?void 0:i.metadata.name))return;const t={name:(r=this.comment)==null?void 0:r.metadata.name,plural:"comments",group:"content.halo.run"};await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),e.push((o=this.comment)==null?void 0:o.metadata.name),localStorage.setItem(Gt,JSON.stringify(e)),this.upvoteCount+=1,this.upvoted=!0,this.checkUpvotedStatus()}render(){var e,t,i,r,o,s;return E`<base-comment-item
      .userAvatar="${(e=this.comment)==null?void 0:e.owner.avatar}"
      .userDisplayName="${(t=this.comment)==null?void 0:t.owner.displayName}"
      .content="${((i=this.comment)==null?void 0:i.spec.content)||""}"
      .creationTime="${(r=this.comment)==null?void 0:r.spec.creationTime}"
    >
      <base-comment-item-action
        slot="action"
        class="comment-item-action-upvote"
        .text="${this.upvoteCount+""}"
        @click="${this.handleUpvote}"
      >
        ${this.upvoted?E`<svg
              slot="icon"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <path d="M0 0h24v24H0z" />
                <path
                  fill="red"
                  d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037.033l.034-.03a6 6 0 0 1 4.733-1.44l.246.036a6 6 0 0 1 3.364 10.008l-.18.185l-.048.041l-7.45 7.379a1 1 0 0 1-1.313.082l-.094-.082l-7.493-7.422A6 6 0 0 1 6.979 3.074z"
                />
              </g>
            </svg>`:E`<svg
              slot="icon"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"
              />
            </svg>`}
      </base-comment-item-action>

      <base-comment-item-action
        slot="action"
        .text="${(((s=(o=this.comment)==null?void 0:o.status)==null?void 0:s.visibleReplyCount)||0)+""}"
        @click="${()=>this.showReplies=!this.showReplies}"
      >
        <svg
          slot="icon"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c3.255 2.777 3.695 7.266 1.029 10.501C16.608 19.942 11.659 20.922 7.7 19L3 20"
          />
        </svg>
      </base-comment-item-action>

      <div slot="footer">
        ${this.showReplies?E`<comment-replies .comment="${this.comment}"></comment-replies>`:""}
      </div>
    </base-comment-item>`}};pe.styles=[qe,X`
      .comment-item-action-upvote {
        margin-left: -0.5rem;
      }
    `],Te([Q({context:Ee}),R()],pe.prototype,"baseUrl",void 0),Te([T({type:Object})],pe.prototype,"comment",void 0),Te([R()],pe.prototype,"showReplies",void 0),Te([R()],pe.prototype,"upvoted",void 0),Te([R()],pe.prototype,"upvoteCount",void 0),pe=Te([K("comment-item")],pe);var Ct=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};let Le=class extends V{constructor(){super(...arguments),this.total=0,this.page=1,this.size=10}get totalPages(){return Math.ceil(this.total/this.size)}renderPageNumbers(){const e=[],t=this.page,i=3;let r,o;this.totalPages<=i?(r=1,o=this.totalPages):t<=3?(r=1,o=i):t+2>=this.totalPages?(r=this.totalPages-(i-1),o=this.totalPages):(r=t-2,o=t+2),r>1&&(e.push(1),r>2&&e.push("..."));for(let s=r;s<=o;s++)e.push(s);return o<this.totalPages&&(o<this.totalPages-1&&e.push("..."),e.push(this.totalPages)),e.map(s=>s==="..."?E`<li><span>...</span></li>`:E`<li>
          <button
            @click=${()=>this.gotoPage(s)}
            ?disabled=${s===this.page}
          >
            ${s}
          </button>
        </li>`)}gotoPage(e){e!==this.page&&this.dispatchEvent(new CustomEvent("page-change",{detail:{page:e},bubbles:!0,composed:!0}))}render(){return E`
      <ul class="pagination">
        <li>
          <button
            @click=${()=>this.gotoPage(this.page-1)}
            ?disabled=${this.page===1}
          >
            上一页
          </button>
        </li>
        ${this.renderPageNumbers()}
        <li>
          <button
            @click=${()=>this.gotoPage(this.page+1)}
            ?disabled=${this.page===this.totalPages}
          >
            下一页
          </button>
        </li>
      </ul>
    `}};Le.styles=X`
    :host {
      display: flex;
      justify-content: center;
    }
    .pagination {
      display: flex;
      list-style: none;
      padding: 0;
    }
    .pagination li {
      margin: 0 2px;
      cursor: pointer;
    }
    .pagination li.disabled {
      cursor: default;
      opacity: 0.5;
    }
  `,Ct([T({type:Number})],Le.prototype,"total",void 0),Ct([T({type:Number})],Le.prototype,"page",void 0),Ct([T({type:Number})],Le.prototype,"size",void 0),Le=Ct([K("comment-pagination")],Le);var te=globalThis&&globalThis.__decorate||function(n,e,t,i){var r=arguments.length,o=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(n,e,t,i);else for(var a=n.length-1;a>=0;a--)(s=n[a])&&(o=(r<3?s(o):r>3?s(e,t,o):s(e,t))||o);return r>3&&o&&Object.defineProperty(e,t,o),o};N.CommentWidget=class extends V{constructor(){super(...arguments),this.baseUrl="",this.kind="",this.group="",this.version="",this.name="",this.emojiDataUrl="",this.allowAnonymousComments=!1,this.comments={page:1,size:20,total:0,items:[],first:!0,last:!1,hasNext:!1,hasPrevious:!1,totalPages:0},this.loading=!1}get shouldDisplayPagination(){return this.loading?!1:this.comments.hasNext||this.comments.hasPrevious}render(){return E`<div class="halo-comment-widget">
      <comment-form @reload="${this.fetchComments}"></comment-form>
      ${this.loading?E`<loading-block></loading-block>`:E`${An(this.comments.items,e=>e.metadata.name,e=>E`<comment-item .comment=${e}></comment-item>`)}`}
      ${this.shouldDisplayPagination?E`
            <comment-pagination
              .total=${this.comments.total}
              .page=${this.comments.page}
              .size=${this.comments.size}
              @page-change=${this.onPageChange}
            ></comment-pagination>
          `:""}
    </div>`}async fetchGlobalInfo(){try{const t=await(await fetch(`${this.baseUrl}/actuator/globalinfo`,{method:"get",credentials:"same-origin"})).json();this.allowAnonymousComments=t.allowAnonymousComments}catch(e){console.error("Failed to fetch global info",e)}}async fetchCurrentUser(){const t=await(await fetch(`${this.baseUrl}/apis/api.console.halo.run/v1alpha1/users/-`)).json();this.currentUser=t.user.metadata.name==="anonymousUser"?void 0:t.user}async fetchComments(){try{this.loading=!0;const e=[`group=${this.group}`,`kind=${this.kind}`,`name=${this.name}`,`page=${this.comments.page}`,`size=${this.comments.size}`,`version=${this.version}`],i=await(await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/comments?${e.join("&")}`)).json();this.comments=i}catch(e){console.error("Failed to fetch comments",e)}finally{this.loading=!1}}async onPageChange(e){const t=e.detail;this.comments.page=t.page,await this.fetchComments()}connectedCallback(){super.connectedCallback(),this.fetchCurrentUser(),this.fetchComments(),this.fetchGlobalInfo()}},N.CommentWidget.styles=[qe,X`
      :host {
        width: 100%;
      }

      .halo-comment-widget {
        width: 100%;
      }
    `],te([le({context:Ee}),T({type:String})],N.CommentWidget.prototype,"baseUrl",void 0),te([le({context:Pn}),T({type:String})],N.CommentWidget.prototype,"kind",void 0),te([le({context:Rn}),T({type:String})],N.CommentWidget.prototype,"group",void 0),te([le({context:Dn}),T({type:String})],N.CommentWidget.prototype,"version",void 0),te([le({context:zn}),T({type:String})],N.CommentWidget.prototype,"name",void 0),te([le({context:Tn}),T({type:String})],N.CommentWidget.prototype,"emojiDataUrl",void 0),te([le({context:so}),R()],N.CommentWidget.prototype,"currentUser",void 0),te([le({context:On}),R()],N.CommentWidget.prototype,"allowAnonymousComments",void 0),te([R()],N.CommentWidget.prototype,"comments",void 0),te([R()],N.CommentWidget.prototype,"loading",void 0),N.CommentWidget=te([K("comment-widget")],N.CommentWidget);function rr(n,e){const t=document.querySelector(n);t||console.error("Element not found",n);const i=document.createElement("comment-widget");i.kind=e.kind,i.group=e.group,i.version="v1alpha1",i.name=e.name,i.emojiDataUrl="/plugins/PluginCommentWidget/assets/static/emoji/native.json",new IntersectionObserver(o=>{o.forEach(s=>{s.isIntersecting&&t.childElementCount===0&&(t.appendChild(i),t.animate([{opacity:0},{opacity:1}],{duration:300,fill:"forwards"}))})}).observe(t)}return N.init=rr,Object.defineProperty(N,Symbol.toStringTag,{value:"Module"}),N}({});
