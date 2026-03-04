import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";

/* ─── Dark Mode context ─────────────────────────────────── */
const DM = createContext(false);
const PaintCtx = createContext("#c8cfd3");
const usePaintBg = () => useContext(PaintCtx);
const useDM = () => useContext(DM);

/* ─── Theme helper ──────────────────────────────────────── */
function th(dm, light, dark){ return dm ? dark : light; }

/* ─── Data ──────────────────────────────────────────────── */
const MOCK_FRIENDS = [];
const BASE_CONTACTS = [
  {id:21,name:"Aaron",initial:"A"},{id:22,name:"Bella",initial:"B"},
  {id:23,name:"Carlos",initial:"C"},{id:24,name:"Diana",initial:"D"},
  {id:25,name:"Ethan",initial:"E"},{id:26,name:"Fiona",initial:"F"},
  {id:27,name:"George",initial:"G"},{id:28,name:"Hannah",initial:"H"},
  {id:29,name:"Ivan",initial:"I"},{id:30,name:"Julia",initial:"J"},
  {id:31,name:"Kevin",initial:"K"},{id:32,name:"Laura",initial:"L"},
  {id:33,name:"Mike",initial:"M"},{id:34,name:"Nina",initial:"N"},
  {id:35,name:"Oscar",initial:"O"},
];
const MOCK_CONTACTS = [...BASE_CONTACTS,...MOCK_FRIENDS].sort((a,b)=>a.name.localeCompare(b.name));

const SEAT_IDS = ["fl","fr","ml","mr","rl","rc","rr"];
const INITIAL_SEATS = Object.fromEntries(SEAT_IDS.map(id=>[id,null]));
const TRUNK_IDS = ["t1","t2","t3","t4","t5","t6"];
const INITIAL_TRUNK = Object.fromEntries(TRUNK_IDS.map(id=>[id,null]));

/* ─── Colors ────────────────────────────────────────────── */
const GRAY_PALETTE = ["#5a5a5e","#6e6e72","#7a7a7e","#888888","#929296","#9e9ea2","#ababae","#b8b8ba"];
const getGray = n => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return GRAY_PALETTE[Math.abs(h)%GRAY_PALETTE.length]; };
const getFriendColor = id => GRAY_PALETTE[id % GRAY_PALETTE.length];
const getSeatColor = n => getGray(n);

/* ─── Van geometry ─────────────────────────────────────── */
const OUTER_W=300, BODY_W=240, MARGIN=30, CX=150;
const NL=42, NR=258;
const NOSE_H=15, WIND_H=30, FIREWALL=7, GAP=14;
const FS_H=109, FS_W=92, FS_AV=88;
const MS_H=95, MS_W=80, MS_AV=77;
const RS_H=80, RS_W=68, RS_AV=64;
const TRUNK_H=102;
const TOTAL_H=NOSE_H+WIND_H+FIREWALL+FS_H+GAP+MS_H+GAP+RS_H+TRUNK_H;
const FS_Y=NOSE_H+WIND_H+FIREWALL;
const MS_Y=FS_Y+FS_H+GAP;
const RS_Y=MS_Y+MS_H+GAP;
const TRUNK_Y=RS_Y+RS_H;
const MIR_XL=NL-23, MIR_XR=NR+9, MIR_Y=NOSE_H+WIND_H-10;
const MIR_W=14, MIR_H=9;
const WW=14, WTH=58, WTH_R=67, WRX=5;
const WXL=21, WXR=OUTER_W-21-WW;
const WYF=50, WYR=340;
const OCT="polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)";

/* ─── Trunk slot geometry ───────────────────────────────── */
const TRUNK_RECT = {x:MARGIN+10, y:TRUNK_Y+6, w:BODY_W-20, h:TRUNK_H-12};
const TRUNK_AV = 28;
const TRUNK_AV_CY = TRUNK_Y + 40;
const TRUNK_PAD = 18;
function getTrunkAvatarPos(avatarIndex, total){
  const avail = TRUNK_RECT.w - TRUNK_PAD*2;
  let cx;
  if(total === 1){ cx = 108; }
  else if(total === 2){ cx = avatarIndex === 0 ? 108 : 192; }
  else {
    const spacing = avail / (total + 1);
    cx = TRUNK_RECT.x + TRUNK_PAD + spacing * (avatarIndex + 1);
  }
  return {cx, cy: TRUNK_AV_CY};
}

/* ─── Emoji categories ──────────────────────────────────── */
const EMOJI_CATEGORIES = {
  "😊 Faces": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 Hands": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄"],
  "🤟 ASL": ["🤟","🤙","☝️","✌️","🤞","🖖","🤘","🤏","👌","✋","🖐","👋","🤚","🫱","🫲","🫳","🫴","🫵","🤜","🤛","👊","✊","🤝","🙏","🫶","💪","🖕","👆","👇","👈","👉","🫰","🤙","🫵","🤲","👐","🙌","👏"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"],
  "🎉 Party": ["🎉","🎊","🎈","🎁","🎀","🎗","🎟","🎫","🏆","🥇","🥈","🥉","🏅","🎖","🎗","🏵","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🎷","🎸","🎹","🎺","🎻","🪕","🥁","🪘","🎙","🎚","🎛","📻","📺","📷","📸","📹","🎥","📽","🎞","📞","☎️","📟","📠"],
  "🚗 Travel": ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣","🛤","⛽","🚧","⚓","🪝","⛵","🚤","🛥","🛳","⛴","🚢","✈️","🛩","🛫","🛬","🪂","💺","🚁","🛰","🚀","🛸","🌍","🌎","🌏","🗺","🧭","🏔","⛰","🌋","🗻","🏕","🏖","🏜","🏝","🏞","🏟","🏛","🏗","🏘","🏚","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🦆","🐔","🐧","🐦","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🦋","🐛","🐌","🐞","🐜","🦗","🪲","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🕊","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿","🦔"],
  "🍕 Food": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🧄","🧅","🥔","🍠","🫘","🌰","🥜","🍞","🥐","🥖","🫓","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫔","🌮","🌯","🥙","🧆","🥚","🍲","🫕","🥘","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍙","🍚","🍱","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽","🥢","🧂"],
  "⚽ Sports": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🪀","🪆","🎮","🕹","🎲","🧩","♟","🪅","🎭","🎨","🖼","🎰","🚵","🧗","🏇","⛷","🏂","🪂","🏋","🤼","🤸","⛹","🤺","🤾","🏌","🏄","🚣","🧘","🏊","🚴","🏆","🥇"],
  "🌟 Symbols": ["💯","🔥","✨","⭐","🌟","💫","⚡","❄️","🌊","💥","🎆","🎇","🌈","☀️","🌤","⛅","🌥","☁️","🌦","🌧","⛈","🌩","🌨","❄️","☃️","⛄","🌬","💨","💧","💦","🫧","☔","☂️","🌀","🌪","🌫","🌈","🌂","🌡","⛱","⚡","🔆","🔅","🔕","🔔","🔊","🔉","🔈","🔇","📣","📢","🔔","🛎","🎵","🎶","🎼","🎤","🎧","🎷","🎸","🎹","🎺","🎻","🥁","📯","🎙","📻","📺","📷","📸","📹","🎥","📽","🎞","☎","📞","📟","📠","📺","📻","🧭","⏱","⏰","🕰","⌚","📡"],
};

function buildVanPath(){
  const BL=MARGIN,BR=OUTER_W-MARGIN,TCR=20,BCR=14,T=0,B=TOTAL_H;
  return[`M ${NL+TCR} ${T}`,`L ${NR-TCR} ${T}`,`Q ${NR} ${T} ${NR} ${T+TCR}`,
    `L ${BR} ${T+44}`,`L ${BR} ${B-BCR}`,`Q ${BR} ${B} ${BR-BCR} ${B}`,
    `L ${BL+BCR} ${B}`,`Q ${BL} ${B} ${BL} ${B-BCR}`,
    `L ${BL} ${T+44}`,`L ${NL} ${T+TCR}`,`Q ${NL} ${T} ${NL+TCR} ${T}`,`Z`
  ].join(" ");
}
const VAN_PATH=buildVanPath();

/* ─── OctAvatar ─────────────────────────────────────────── */
function OctAvatar({initial,color,size=52,expelDim=false,expelFocus=false,seatBg="#e4e4e8"}){
  let wrapTransform="scale(1)", opacity=1;
  if(expelDim){ opacity=0.55; }
  if(expelFocus){ wrapTransform="scale(1.22) translateY(-4px)"; opacity=1; }
  const uid = (color||"default").replace(/[^a-zA-Z0-9]/g,"_")+size;
  const blur = 9;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{flexShrink:0,transform:wrapTransform,opacity,userSelect:"none",pointerEvents:"none",
              transition:"transform 0.2s cubic-bezier(.34,1.56,.64,1),opacity 0.2s",overflow:"visible"}}
    >
      <defs>
        <filter id={`bf${uid}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={blur} result="blur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="3" intercept="-0.6"/>
          </feComponentTransfer>
        </filter>
        <mask id={`bm${uid}`} maskContentUnits="userSpaceOnUse">
          <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30"
            fill="white" filter={`url(#bf${uid})`}/>
        </mask>
      </defs>
      <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill={seatBg}/>
      <rect x="0" y="0" width="100" height="100" fill={color} mask={`url(#bm${uid})`}/>
      <text x="50" y="50" textAnchor="middle" dy="0.35em"
        fill="#fff" fontSize={75} fontWeight="700"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
        mask={`url(#bm${uid})`}
        style={{userSelect:"none"}}>{initial}</text>
      {/* Water gloss top streak */}
      <ellipse cx="50" cy="22" rx="28" ry="14" fill="rgba(255,255,255,0.38)" mask={`url(#bm${uid})`}/>
      {/* Bottom refraction */}
      <ellipse cx="50" cy="82" rx="22" ry="10" fill="rgba(255,255,255,0.18)" mask={`url(#bm${uid})`}/>
      {/* Edge highlight */}
      <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30"
        fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="4" mask={`url(#bm${uid})`}/>
    </svg>
  );
}

/* ─── BootIcon ───────────────────────────────────────────── */
function BootIcon({sz=56, animate=false}){
  return(
    <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none"
      style={{animation:animate?"bootKick 0.55s ease-in-out infinite alternate":undefined,
              transformOrigin:"37% 9%",display:"block",flexShrink:0}}
    >
      <path d="M13 6 Q13 4 17 4 L31 4 Q35 4 35 8 L35 40 L13 40 Z" fill="rgba(180,50,50,0.82)"/>
      <path d="M17 28 Q24 24 33 28 L33 40 L17 40 Z" fill="rgba(160,38,38,0.9)"/>
      <rect x="11" y="4" width="26" height="5" rx="3" fill="rgba(200,70,70,0.9)"/>
      <path d="M13 38 L13 44 Q13 54 20 56 L50 56 Q60 56 60 49 Q60 43 52 42 L35 41 L35 38 Z"
        fill="rgba(180,50,50,0.82)" stroke="rgba(0,0,0,0.10)" strokeWidth="0.8"/>
      <path d="M14 53 Q14 58 22 59 L50 59 Q58 59 59 54 L19 54 Q15 54 14 53 Z" fill="rgba(60,30,30,0.55)"/>
      <rect x="11" y="42" width="9" height="14" rx="3" fill="rgba(150,35,35,0.9)"/>
      <circle cx="19" cy="16" r="2" fill="rgba(255,255,255,0.55)"/>
      <circle cx="29" cy="16" r="2" fill="rgba(255,255,255,0.55)"/>
      <circle cx="19" cy="24" r="2" fill="rgba(255,255,255,0.55)"/>
      <circle cx="29" cy="24" r="2" fill="rgba(255,255,255,0.55)"/>
      <line x1="19" y1="16" x2="29" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
      <line x1="29" y1="16" x2="19" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
      <path d="M44 43 Q56 43 59 47" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {animate && <>
        <line x1="2" y1="36" x2="10" y2="36" stroke="rgba(180,50,50,0.82)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
        <line x1="4" y1="43" x2="10" y2="43" stroke="rgba(180,50,50,0.82)" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
        <line x1="2" y1="50" x2="9"  y2="50" stroke="rgba(180,50,50,0.82)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
      </>}
    </svg>
  );
}

/* ─── KickConfirmBubble ─────────────────────────────────── */
function KickConfirmBubble({person,onConfirm,onCancel,fromTrunk}){
  const bg = usePaintBg();
  const dm=useDM();
  return(
    <div style={{position:"absolute",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}} onClick={onCancel}>
      <style>{`@keyframes bootKick{from{transform:rotate(-30deg);}to{transform:rotate(15deg);}}`}</style>
      <div onClick={e=>e.stopPropagation()} style={{background:dm?"#22223a":bg,borderRadius:22,padding:"26px 22px 20px",width:280,textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.3512)",animation:"popIn 0.22s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
          <BootIcon sz={56} animate={true}/>
          <OctAvatar initial={person.initial} color={person.friendColor||getSeatColor(person.name)} size={56} seatBg={dm?"#1e1a30":bg}/>
        </div>
        <p style={{fontSize:17,fontWeight:700,color:dm?"#e0e0f0":"#1c1c1e",marginBottom:20,whiteSpace:fromTrunk?"nowrap":"normal",overflow:"hidden",textOverflow:"ellipsis"}}>
          {fromTrunk
            ? <>Boot <span style={{color:dm?"#d4a820":"#b8840a",fontWeight:800,textShadow:dm?"0 1px 0 rgba(0,0,0,0.8), 0 -1px 0 rgba(255,220,80,0.4)":"0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(100,70,0,0.3)"}}>{person.name}</span> from <span style={{color:dm?"#d4a820":"#b8840a",fontWeight:800,textShadow:dm?"0 1px 0 rgba(0,0,0,0.8), 0 -1px 0 rgba(255,220,80,0.4)":"0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(100,70,0,0.3)"}}>Trunk</span>{"\u200a??!!"}</>
            : <>Give "<span style={{color:"rgba(180,50,50,0.82)",fontWeight:800,textShadow:"0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(100,20,20,0.35)"}}>{person.name}</span>" Da <span style={{color:"rgba(180,50,50,0.82)",fontWeight:800,textShadow:"0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(100,20,20,0.35)"}}>Boot</span>?</>
          }
        </p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} className="btn3d" style={{flex:1,padding:"12px 0",borderRadius:12,border:"1px solid #e0e0e6",background:"#d8d8de",fontSize:15,cursor:"pointer",color:"#555",fontWeight:500}}>Cancel</button>
          <button onClick={onConfirm} className="btn3d btn3d-danger" style={{flex:1.4,padding:"11px 14px",border:"2px solid rgba(180,50,50,0.82)",background:"rgba(180,50,50,0.15)",cursor:"pointer",color:"rgba(140,30,30,0.95)",fontWeight:700,fontSize:14,borderRadius:"12px 24px 24px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <BootIcon sz={22}/><span>Boot out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Seat ──────────────────────────────────────────────── */
function Seat({id,person,onTap,onLongPress,onOccupiedTap,w,h,av,expelMode,expelFocus,onExpelTap,onDragStart,dragOverId,isDragSource,seatColor="#e4e4e8",dmOverlay=false}){
  const pressTimer = useRef(null);
  const color = person ? (person.friendColor || getSeatColor(person.name)) : null;
  const shaking = expelMode && !!person;
  const isDropTarget = dragOverId === id;
  const didDrag = useRef(false);

  const endPress = () => clearTimeout(pressTimer.current);

  const handlePointerDown = (e) => {
    didDrag.current = false;
    if(expelMode) return;
    if(!person) return;
    pressTimer.current = setTimeout(() => { clearTimeout(pressTimer.current); onLongPress && onLongPress(id); }, 750);
    onDragStart(id, e);
  };

  const handlePointerUp = () => { setTimeout(() => { didDrag.current = false; }, 50); };

  const handleClick = (e) => {
    e.stopPropagation();
    if(expelMode){ if(person) onExpelTap(id); return; }
    if(person && !didDrag.current){ onOccupiedTap && onOccupiedTap(id); return; }
    if(!person && !didDrag.current) onTap(id);
  };

  const borderColor = isDropTarget ? "#4a90d9" : expelFocus ? "#cc1111" : expelMode ? "rgba(200,80,80,0.45)" : "none";
  const bg = person
    ? isDropTarget ? "rgba(74,144,217,0.14)"
    : isDragSource ? "rgba(200,200,210,0.5)"
    : expelFocus ? "rgba(200,30,30,0.16)"
    : expelMode ? "rgba(255,100,100,0.09)"
    : (dmOverlay ? "rgba(20,18,40,0.72)" : seatColor)
    : isDropTarget ? "rgba(74,144,217,0.10)" : (dmOverlay ? "#252535" : seatColor);

  return (
    <div
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={e=>{ if(Math.abs(e.movementX)+Math.abs(e.movementY)>2){ didDrag.current=true; clearTimeout(pressTimer.current); } }}
      onPointerUp={e=>{ endPress(); handlePointerUp(); }}
      onPointerLeave={endPress}
      style={{
        width:w,height:h,borderRadius:12,position:"relative",background:bg,
        border:(isDropTarget||expelMode)?`2px solid ${borderColor}`:(!person&&!isDropTarget?`1.5px solid ${dmOverlay?"rgba(130,125,170,0.38)":"rgba(175,172,195,0.6)"}` :"none"),
        outline:"none",
        display:"flex",alignItems:"center",justifyContent:"center",cursor:person?"grab":"pointer",
        boxShadow:isDropTarget
          ?"0 0 0 3px rgba(74,144,217,0.25), inset 0 1px 3px rgba(0,0,0,0.06)"
          :dmOverlay
            ?"inset 0 -2px 0 rgba(255,255,255,0.07), inset 0 3px 0 rgba(0,0,0,0.45), inset -2px 0 0 rgba(0,0,0,0.18), inset 2px 0 0 rgba(255,255,255,0.05), inset 0 0 12px rgba(0,0,0,0.35)"
            :"inset 0 -2px 0 rgba(255,255,255,0.90), inset 0 3px 0 rgba(120,118,145,0.45), inset -2px 0 0 rgba(160,158,185,0.20), inset 2px 0 0 rgba(255,255,255,0.60), inset 0 0 10px rgba(140,138,165,0.18)",
        animation:shaking?"seatShake 0.38s infinite":"none",
        transition:"background 0.15s,border 0.15s,box-shadow 0.15s",
        overflow:"visible",
        opacity:isDragSource?0.38:1,
        touchAction:person?"none":"auto",
      }}
    >
      {person ? (
        <>
          <OctAvatar initial={person.initial} color={color} size={av} expelDim={expelMode&&!expelFocus} expelFocus={expelFocus} seatBg={dmOverlay?"#1e1a30":seatColor}/>
          {expelFocus && <div style={{position:"absolute",bottom:3,left:0,right:0,textAlign:"center",fontSize:7,fontWeight:800,color:"#cc1111",letterSpacing:"0.04em",textTransform:"uppercase",lineHeight:1.3,textShadow:"0 1px 2px rgba(255,255,255,0.7)"}}>Tap again</div>}
        </>
      ) : (
        <div style={{
          width:22,height:22,borderRadius:"50%",
          background:isDropTarget?"rgba(74,144,217,0.18)":(dmOverlay?"rgba(130,125,170,0.22)":"rgba(175,172,195,0.28)"),
          border:`1.5px solid ${isDropTarget?"rgba(74,144,217,0.6)":(dmOverlay?"rgba(140,135,180,0.5)":"rgba(175,172,200,0.6)")}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"inset 0 1px 2px rgba(255,255,255,0.4)",
        }}>
          <span style={{fontSize:13,lineHeight:1,color:isDropTarget?"#4a90d9":(dmOverlay?"#9e9ac0":"#a8a5c0"),fontWeight:300,marginTop:-1}}>+</span>
        </div>
      )}
    </div>
  );
}

/* ─── VanSVG ────────────────────────────────────────────── */
function VanSVG({trunkFillCount, onSettings, paintColors}){
  const dm=useDM();
  const trunkMidY = TRUNK_Y + TRUNK_H / 2;
  const showTrunkLabel = trunkFillCount < 3;
  const subtitleY = TRUNK_Y + TRUNK_H - 10;
  return(
    <svg viewBox={`0 0 ${OUTER_W} ${TOTAL_H}`} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none"}}>
      <defs>
        <linearGradient id="windGloss" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.38)"/>
          <stop offset="55%" stopColor="rgba(255,255,255,0.08)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.20)"/>
        </linearGradient>
        <filter id="glareBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <filter id="vs" x="-12%" y="-6%" width="124%" height="118%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(0,0,0,0.4767)"/>
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(0,0,0,0.3512)"/>
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="rgba(0,0,0,0.2760)"/>
        </filter>
        <filter id="vsDark" x="-12%" y="-6%" width="124%" height="118%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(0,0,0,1.0)"/>
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(0,0,0,0.825)"/>
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="rgba(0,0,0,0.63)"/>
        </filter>
        <radialGradient id="vig" cx="50%" cy="55%" r="55%" fx="50%" fy="55%">
          <stop offset="0%" stopColor="rgba(185,180,198,0.22)"/>
          <stop offset="40%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)"/>
        </radialGradient>
        <filter id="wf" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feComponentTransfer in="blur">
            <feFuncA type="linear" slope="4" intercept="-1.2"/>
          </feComponentTransfer>
        </filter>
        <clipPath id="vc"><path d={VAN_PATH}/></clipPath>
        {/* Perimeter fade filter — blurs the stroke outward so it halos the van silhouette */}
        <filter id="perimFade" x="-15%" y="-5%" width="130%" height="110%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <filter id="trunkEmboss" x="-20%" y="-50%" width="140%" height="200%">
          <feOffset dx="0.5" dy="0.5" result="offset"/>
          <feFlood floodColor="rgba(255,255,255,0.55)" result="light"/>
          <feComposite in="light" in2="offset" operator="in" result="lightEdge"/>
          <feOffset dx="-0.5" dy="-0.5" in="SourceGraphic" result="offset2"/>
          <feFlood floodColor="rgba(0,0,0,0.18)" result="dark"/>
          <feComposite in="dark" in2="offset2" operator="in" result="darkEdge"/>
          <feMerge><feMergeNode in="darkEdge"/><feMergeNode in="lightEdge"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Headlight beam filter — softens beam edges */}
        <filter id="beamBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>
      {/* Tires */}
      <rect x={WXL} y={WYF} width={WW} height={WTH} rx={WRX} fill={dm?"#5f5f6e":"#a6a6b1"} stroke={dm?"#4f4f5e":"#9797a4"} strokeWidth="1"/>
      <rect x={WXR} y={WYF} width={WW} height={WTH} rx={WRX} fill={dm?"#5f5f6e":"#a6a6b1"} stroke={dm?"#4f4f5e":"#9797a4"} strokeWidth="1"/>
      <rect x={WXL} y={WYR} width={WW} height={WTH_R} rx={WRX} fill={dm?"#5f5f6e":"#a6a6b1"} stroke={dm?"#4f4f5e":"#9797a4"} strokeWidth="1"/>
      <rect x={WXR} y={WYR} width={WW} height={WTH_R} rx={WRX} fill={dm?"#5f5f6e":"#a6a6b1"} stroke={dm?"#4f4f5e":"#9797a4"} strokeWidth="1"/>
      {/* Solid opaque base — always covers tires */}
      <path d={VAN_PATH} fill={dm?"#1e1e2a":"#e8e8ec"} stroke="none"/>
      {/* Colored fill */}
      <path d={VAN_PATH} fill={paintColors?.van||"#ecedf0"} stroke={dm?"#3a3a50":"#ababb4"} strokeWidth="1.5" filter={dm?"url(#vsDark)":"url(#vs)"}/>
      {/* Vignette for 3D depth */}
      <path d={VAN_PATH} fill="url(#vig)" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>
      {/* Highlight streak */}
      <path d={VAN_PATH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>
      {dm && <path d={VAN_PATH} fill="rgba(0,0,20,0.30)" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>}
      {/* Perimeter dark fade — OUTSIDE van only, sides + rear only.
          mask=outsideMask ensures nothing bleeds inside the van.
          perimClip excludes front edge and tire outer sides. */}
      {dm && (
        <g style={{pointerEvents:"none"}}>
          <defs>
            <mask id="outsideMask">
              <rect x="-50" y="-50" width={OUTER_W+100} height={TOTAL_H+100} fill="white"/>
              <path d={VAN_PATH} fill="black"/>
            </mask>
            <clipPath id="perimClip">
              <rect x={WXL+WW+2} y={54} width={WXR-(WXL+WW)-4} height={TOTAL_H-54}/>
            </clipPath>
            <linearGradient id="beamLGrad" x1="0" y1="0" x2="0" y2="-220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,225,110,0.26)"/>
              <stop offset="55%" stopColor="rgba(255,220,100,0.10)"/>
              <stop offset="100%" stopColor="rgba(255,215,90,0)"/>
            </linearGradient>
            <linearGradient id="beamRGrad" x1="0" y1="0" x2="0" y2="-220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,225,110,0.26)"/>
              <stop offset="55%" stopColor="rgba(255,220,100,0.10)"/>
              <stop offset="100%" stopColor="rgba(255,215,90,0)"/>
            </linearGradient>
          </defs>
          {/* Dark fade stroke — clipped to sides+rear zone, masked to outside van only */}
          <g clipPath="url(#perimClip)">
            <path d={VAN_PATH}
              fill="none"
              stroke="rgba(0,0,6,0.88)"
              strokeWidth="32"
              strokeLinejoin="round"
              mask="url(#outsideMask)"
              filter="url(#perimFade)"
            />
          </g>
          {/* Left headlight beam — centered under "W" in "Who's" (SVG x~72) */}
          <polygon
            points={`59,0 85,0 96,-220 48,-220`}
            fill="url(#beamLGrad)"
            filter="url(#beamBlur)"
          />
          {/* Right headlight beam — base at NR (x=258), aimed under "n" in "van?"
              SVG x~227 = center. Base ±13px, top spreads ±24px. Extends to y=-220. */}
          <polygon
            points={`214,0 240,0 251,-220 203,-220`}
            fill="url(#beamRGrad)"
            filter="url(#beamBlur)"
          />
        </g>
      )}
      {/* Windshield */}
      <path d="M 57,15 Q 57,10 62,10 L 238,10 Q 243,10 243,15 L 256,45 L 44,45 Z"
        fill={dm?"#2a3a4a":"#c8dae8"} stroke="none" filter="url(#wf)" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>
      <path d="M 57,15 Q 57,10 62,10 L 238,10 Q 243,10 243,15 L 256,45 L 44,45 Z"
        fill="rgba(200,225,242,0.18)" stroke="none" filter="url(#wf)" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>
      {/* Windshield glare streak */}
      {!dm && <path d="M 100,10 L 160,10 L 140,45 L 80,45 Z"
        fill="rgba(255,255,255,0.22)" stroke="none" filter="url(#glareBlur)" clipPath="url(#vc)" style={{pointerEvents:"none"}}/>}
      {/* Mirrors */}
      <rect x={MIR_XL} y={MIR_Y} width={MIR_W} height={MIR_H} rx="3" fill={dm?"#4a4a5a":"#d0d0d8"} stroke={dm?"#3a3a4a":"#c2c2cc"} strokeWidth="1" style={{pointerEvents:"none"}}/>
      <rect x={MIR_XR} y={MIR_Y} width={MIR_W} height={MIR_H} rx="3" fill={dm?"#4a4a5a":"#d0d0d8"} stroke={dm?"#3a3a4a":"#c2c2cc"} strokeWidth="1" style={{pointerEvents:"none"}}/>
      {/* Trunk */}
      <rect x={TRUNK_RECT.x+4} y={TRUNK_RECT.y+4} width={TRUNK_RECT.w-8} height={TRUNK_RECT.h-8} rx="8"
        fill={dm?"#252535":"#d0cedd"} stroke="none" filter="url(#wf)" style={{pointerEvents:"none"}}/>
      {/* Gear */}
      <text x={CX} y={NOSE_H - 10} textAnchor="middle" fontSize="11" fill="#a8a8b4" style={{pointerEvents:"none",userSelect:"none"}} transform={`rotate(145,${CX},${NOSE_H-10})`}>⚙️</text>
      <rect x={CX-9} y={NOSE_H-18} width={18} height={14} fill="transparent" style={{cursor:onSettings?"pointer":"default",pointerEvents:onSettings?"all":"none"}} onClick={onSettings}/>
      {showTrunkLabel && (
        <text x={CX} y={trunkMidY-2} textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2.8" fill="#b0b4be" fontFamily="-apple-system,sans-serif" style={{pointerEvents:"none",userSelect:"none",filter:"url(#trunkEmboss)"}}>TRUNK</text>
      )}
      <text x={CX} y={subtitleY} textAnchor="middle" fontSize="7.5" fontWeight="500" letterSpacing="0.8" fill="#a0a0aa" fontFamily="-apple-system,sans-serif" fontStyle="italic" style={{pointerEvents:"none",userSelect:"none"}}>(my ride or dies)</text>
    </svg>
  );
}

/* ─── SEAT_ROWS & centers ───────────────────────────────── */
const SEAT_ROWS = [
  {ids:["fl","fr"], top:FS_Y, W:FS_W, H:FS_H, AV:FS_AV},
  {ids:["ml","mr"], top:MS_Y, W:MS_W, H:MS_H, AV:MS_AV},
  {ids:["rl","rc","rr"], top:RS_Y, W:RS_W, H:RS_H, AV:RS_AV},
];
function getSeatCenters(){
  const centers = {};
  SEAT_ROWS.forEach(row=>{
    const count = row.ids.length;
    const unit = BODY_W / count;
    row.ids.forEach((id,i)=>{ centers[id] = { cx: MARGIN + unit*i + unit/2, cy: row.top + row.H/2, w: row.W, h: row.H }; });
  });
  return centers;
}
const SEAT_CENTERS = getSeatCenters();

/* ─── VanIllustration ───────────────────────────────────── */
function VanIllustration({seats,trunkOccupants,onTap,onLongPress,onOccupiedTap,expelMode,expelFocus,onExpelTap,incomingPerson,onSwapSeats,onSwapTrunk,onPickTrunkSlot,onRemoveTrunk,onKickConfirm,onSettings,onDragStateChange,paintColors}){
  const dm=useDM();
  const vanRef = useRef(null);
  const [dragSrc, setDragSrc] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [outsideVan, setOutsideVan] = useState(false);
  const dragSrcRef = useRef(null);
  const dragOverRef = useRef(null);
  const outsideRef = useRef(false);
  const activeDrag = useRef(false);
  const dragStartPos = useRef(null);
  const pressTimerRef = useRef(null);
  const trunkOccupantsRef = useRef(trunkOccupants);
  trunkOccupantsRef.current = trunkOccupants;

  const getVanRect = () => vanRef.current?.getBoundingClientRect();
  const isInsideVan = useCallback((px,py) => {
    const rect = getVanRect(); if(!rect) return false;
    return px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
  },[]);

  const hitTest = useCallback((px, py) => {
    const rect = getVanRect(); if(!rect) return null;
    const scale = rect.width / OUTER_W;
    const vx = (px - rect.left) / scale;
    const vy = (py - rect.top) / scale;
    for(const id of SEAT_IDS){
      const c = SEAT_CENTERS[id];
      if(vx >= c.cx - c.w/2 && vx <= c.cx + c.w/2 && vy >= c.cy - c.h/2 && vy <= c.cy + c.h/2) return {zone:"seat", id};
    }
    const trunkOcc = trunkOccupantsRef.current;
    const filledTrunkIds = TRUNK_IDS.filter(tid => trunkOcc[tid]);
    const total = filledTrunkIds.length;
    for(let i=0; i<total; i++){
      const {cx,cy} = getTrunkAvatarPos(i, total);
      const half = TRUNK_AV/2 + 10;
      if(vx >= cx-half && vx <= cx+half && vy >= cy-half && vy <= cy+half) return {zone:"trunk", id:filledTrunkIds[i]};
    }
    if(vx >= TRUNK_RECT.x && vx <= TRUNK_RECT.x+TRUNK_RECT.w && vy >= TRUNK_RECT.y && vy <= TRUNK_RECT.y+TRUNK_RECT.h) return {zone:"trunk", id:"__empty__"};
    return null;
  }, []);

  const startDrag = useCallback((zone, id, person, e) => {
    if(!person || expelMode) return;
    dragStartPos.current = {x:e.clientX, y:e.clientY};
    activeDrag.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    const onMove = me => {
      const dx = me.clientX - dragStartPos.current.x;
      const dy = me.clientY - dragStartPos.current.y;
      if(!activeDrag.current && Math.sqrt(dx*dx+dy*dy) > 8){
        activeDrag.current = true;
        onDragStateChange && onDragStateChange(true);
        clearTimeout(pressTimerRef.current);
        const src = {zone, id};
        setDragSrc(src); dragSrcRef.current = src;
      }
      if(activeDrag.current){
        setDragPos({x:me.clientX, y:me.clientY});
        const inside = isInsideVan(me.clientX, me.clientY);
        outsideRef.current = !inside; setOutsideVan(!inside);
        const hit = inside ? hitTest(me.clientX, me.clientY) : null;
        const over = hit && !(hit.zone===zone && hit.id===id) ? hit : null;
        setDragOver(over); dragOverRef.current = over;
      }
    };
    const onUp = () => {
      if(activeDrag.current && dragSrcRef.current){
        const src = dragSrcRef.current;
        if(outsideRef.current && src.zone==="seat") onKickConfirm(src.id, seats[src.id]);
        else if(outsideRef.current && src.zone==="trunk") onKickConfirm("__trunk__"+src.id, trunkOccupants[src.id]);
        else if(dragOverRef.current){
          const dst = dragOverRef.current;
          if(src.zone==="seat" && dst.zone==="seat") onSwapSeats(src.id, dst.id);
          else if(src.zone==="trunk" && dst.zone==="trunk") onSwapTrunk(src.id, dst.id);
          else if(src.zone==="seat" && dst.zone==="trunk") onSwapSeats(src.id, "__trunk__"+dst.id);
          else if(src.zone==="trunk" && dst.zone==="seat") onSwapSeats("__trunk__"+src.id, dst.id);
        }
      }
      activeDrag.current = false; outsideRef.current = false;
      onDragStateChange && onDragStateChange(false);
      setDragSrc(null); setDragPos(null); setDragOver(null); setOutsideVan(false);
      dragSrcRef.current = null; dragOverRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [expelMode, hitTest, isInsideVan, onSwapSeats, onSwapTrunk, onKickConfirm, onRemoveTrunk, seats]);

  const handleSeatDragStart = useCallback((seatId, e) => { startDrag("seat", seatId, seats[seatId], e); }, [seats, startDrag]);
  const handleTrunkDragStart = useCallback((slotId, e) => { startDrag("trunk", slotId, trunkOccupants[slotId], e); }, [trunkOccupants, startDrag]);

  const dragPerson = dragSrc ? (dragSrc.zone==="seat" ? seats[dragSrc.id] : trunkOccupants[dragSrc.id]) : null;
  const dragColor = dragPerson ? (dragPerson.friendColor||getSeatColor(dragPerson.name)) : null;
  const trunkFillCount = TRUNK_IDS.filter(id=>trunkOccupants[id]).length;

  return(
    <div ref={vanRef} style={{position:"relative",width:OUTER_W,height:TOTAL_H,margin:"0 auto",flexShrink:0,touchAction:"none",alignSelf:"center"}}>
      <VanSVG trunkFillCount={trunkFillCount} onSettings={onSettings} paintColors={paintColors}/>
      {SEAT_ROWS.map(row=>{
        const isFront = row.ids[0]==="fl";
        const isRear = row.ids.length===3;
        return(
          <div key={row.ids[0]} style={{position:"absolute",top:row.top,left:MARGIN,width:BODY_W,display:"flex",justifyContent:"space-around"}}>
            {row.ids.map((id,i)=>{
              const innerPull = 10, outerPush = 10;
              let style = {};
              if(isFront){
                if(id==="fl") style = {marginLeft:-outerPush, marginRight:-innerPull};
                if(id==="fr") style = {marginLeft:-innerPull, marginRight:-outerPush};
              } else if(isRear){
                if(id==="rl") style = {marginLeft:8};
                if(id==="rr") style = {marginRight:8};
              }
              return(
                <div key={id} style={style}>
                  <Seat id={id} person={seats[id]} onTap={onTap} onLongPress={onLongPress} onOccupiedTap={onOccupiedTap}
                    w={row.W} h={row.H} av={row.AV} expelMode={expelMode} expelFocus={expelFocus===id} onExpelTap={onExpelTap}
                    onDragStart={handleSeatDragStart} dragOverId={dragOver && dragOver.zone==="seat" ? dragOver.id : null}
                    isDragSource={dragSrc && dragSrc.zone==="seat" && dragSrc.id===id}
                    seatColor={paintColors?.seats||"#e4e4e8"} dmOverlay={dm}/>
                </div>
              );
            })}
          </div>
        );
      })}
      {(()=>{
        const filled = TRUNK_IDS.map(id=>({id,person:trunkOccupants[id]})).filter(x=>x.person);
        const total = filled.length;
        return filled.map(({id:slotId,person},avatarIdx)=>{
          const {cx,cy} = getTrunkAvatarPos(avatarIdx, total);
          const color = person.friendColor||getSeatColor(person.name);
          const isOver = dragOver && dragOver.zone==="trunk" && dragOver.id===slotId;
          const isSrc = dragSrc && dragSrc.zone==="trunk" && dragSrc.id===slotId;
          return(
            <div key={slotId} onPointerDown={e=>{ e.currentTarget.setPointerCapture(e.pointerId); handleTrunkDragStart(slotId,e); }}
              style={{position:"absolute",left:cx-TRUNK_AV/2-5,top:cy-TRUNK_AV/2-5,width:TRUNK_AV+10,height:TRUNK_AV+10,
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",borderRadius:"50%",
                background:isOver?"rgba(74,144,217,0.18)":"transparent",
                border:isOver?"2px solid rgba(74,144,217,0.6)":"2px solid transparent",
                transition:"background 0.15s,border 0.15s",opacity:isSrc?0.3:1,touchAction:"none"}}>
              <OctAvatar initial={person.initial} color={color} size={TRUNK_AV} seatBg="#d2d2da"/>
            </div>
          );
        });
      })()}
      {outsideVan && dragSrc && (dragSrc.zone==="seat" || dragSrc.zone==="trunk") && (
        <div style={{position:"absolute",inset:-8,borderRadius:18,border:"3px solid rgba(200,40,40,0.55)",boxShadow:"0 0 0 4px rgba(200,40,40,0.12)",pointerEvents:"none",animation:"fadeIn 0.15s"}}/>
      )}
      {dragSrc && dragPos && dragPerson && (
        <div style={{position:"fixed",left:dragPos.x-35,top:dragPos.y-35,zIndex:1000,pointerEvents:"none",filter:outsideVan?"drop-shadow(0 8px 20px rgba(200,40,40,0.6))":"drop-shadow(0 12px 24px rgba(0,0,0,0.4767))",transform:"scale(1.15)",transition:"filter 0.15s"}}>
          <div style={{width:70,height:70,clipPath:OCT,background:outsideVan?"#c82828":dragColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:700,transition:"background 0.15s"}}>{dragPerson.initial}</div>
        </div>
      )}
      {incomingPerson&&(
        <div style={{position:"absolute",right:-72,top:"36%",display:"flex",flexDirection:"column",alignItems:"center",gap:6,animation:"ghostPulse 1.8s ease-in-out infinite",pointerEvents:"none"}}>
          <div style={{width:52,height:52,clipPath:OCT,background:incomingPerson.friendColor||getSeatColor(incomingPerson.name),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:700,opacity:0.5,filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.2760))"}}>{incomingPerson.initial}</div>
          <span style={{fontSize:8,color:"#555",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap",opacity:0.6}}>{incomingPerson.name}</span>
        </div>
      )}
    </div>
  );
}

/* ─── EmojiSheet ─────────────────────────────────────────── */
function EmojiSheet({person,onClose}){
  const bg = usePaintBg();
  const dm=useDM();
  const[sent,setSent]=useState(null);
  const[activeCategory,setActiveCategory]=useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const[message,setMessage]=useState("");
  const[showHistory,setShowHistory]=useState(false);
  const[history,setHistory]=useState([
    {from:"them",text:"Hey, saving you a seat 🙌",time:"2:14 PM"},
    {from:"me",text:"On my way! 🚗",time:"2:15 PM"},
  ]);
  const catKeys = Object.keys(EMOJI_CATEGORIES);
  const MAX = 140;
  const remaining = MAX - message.length;
  const nearLimit = remaining <= 20;
  const atLimit = remaining <= 0;
  const appendEmoji = emoji => { setMessage(cur => (cur + emoji).slice(0, MAX)); };
  const handleSend = () => {
    if(!message.trim()) return;
    const newMsg = {from:"me", text:message, time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setHistory(h=>[...h, newMsg]); setSent(message); setMessage("");
    setTimeout(()=>{ setSent(null); }, 1100);
  };
  const personColor = person?.friendColor||getSeatColor(person?.name||"");

  return(
    <div style={{position:"absolute",inset:0,zIndex:450,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/>
      {showHistory && (
        <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column",background:dm?"#1a1a2c":bg,animation:"fadeIn 0.2s"}}>
          <div style={{background:dm?"#22223a":bg,padding:"14px 16px 10px",borderBottom:`0.5px solid ${dm?"#3a3a54":"#e0e0e8"}`,flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#007aff",padding:"0 4px 0 0"}}>‹</button>
            <div style={{width:36,height:36,clipPath:OCT,background:personColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>setShowHistory(false)}>{person?.initial}</div>
            <span style={{fontSize:16,fontWeight:600,color:dm?"#e0e0f0":"#1c1c1e",flex:1}}>{person?.name}</span>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 14px",display:"flex",flexDirection:"column",gap:8,minHeight:0}}>
            {history.map((msg,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.from==="me"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"72%",padding:"9px 13px",borderRadius:18,borderBottomRightRadius:msg.from==="me"?4:18,borderBottomLeftRadius:msg.from==="me"?18:4,background:msg.from==="me"?"#007aff":(dm?"#2e2e48":"#fff"),color:msg.from==="me"?"#fff":(dm?"#d8d8f0":"#1c1c1e"),fontSize:14,lineHeight:1.4,boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>{msg.text}</div>
                <span style={{fontSize:10,color:"#aeaeb2",marginTop:3,marginLeft:4,marginRight:4}}>{msg.time}</span>
              </div>
            ))}
          </div>
          <div style={{height:"50%",background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -4px 20px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
            <div style={{flexShrink:0,display:"flex",gap:4,padding:"8px 12px 6px",overflowX:"scroll",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
              {catKeys.map(cat=>(<button key={cat} onClick={()=>setActiveCategory(cat)} style={{flexShrink:0,padding:"5px 10px",border:"none",cursor:"pointer",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:activeCategory===cat?"#3a3a42":"#d4d4da",color:activeCategory===cat?"#e8e8f0":"#8e8e93"}}>{cat}</button>))}
            </div>
            <div style={{flex:1,overflowY:"scroll",WebkitOverflowScrolling:"touch",padding:"2px 10px 6px",minHeight:0}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                {(EMOJI_CATEGORIES[activeCategory]||[]).map((e,i)=>(<button key={i} onClick={()=>appendEmoji(e)} style={{fontSize:24,background:"none",border:"none",cursor:"pointer",padding:"4px 3px",borderRadius:8,lineHeight:1,opacity:atLimit?0.35:1}}>{e}</button>))}
              </div>
            </div>
            <div style={{flexShrink:0,padding:"8px 12px 20px",borderTop:`0.5px solid ${dm?"#3a3a54":"#ebebef"}`,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,position:"relative"}}>
                <textarea value={message} onChange={e=>setMessage(e.target.value.slice(0,MAX))} placeholder="Type a message…" rows={2} style={{width:"100%",resize:"none",border:"1.5px solid #e0e0e8",borderRadius:18,padding:"8px 40px 8px 12px",fontSize:14,fontFamily:"inherit",lineHeight:1.4,outline:"none",color:dm?"#e0e0f0":"#1c1c1e",background:dm?"#2a2a44":"#d8d8de",boxSizing:"border-box",WebkitAppearance:"none"}} onFocus={e=>e.target.style.borderColor="#4a90d9"} onBlur={e=>e.target.style.borderColor="#e0e0e8"}/>
                <span style={{position:"absolute",bottom:7,right:10,fontSize:9,fontWeight:600,color:atLimit?"#cc2222":nearLimit?"#e07000":"#c0c0c8",pointerEvents:"none"}}>{remaining}</span>
              </div>
              <button onClick={handleSend} disabled={!message.trim()} style={{flexShrink:0,width:40,height:40,border:"none",cursor:message.trim()?"pointer":"default",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,opacity:message.trim()?1:0.3,filter:"hue-rotate(80deg) saturate(2.2) brightness(0.88)",padding:0}}>📣</button>
            </div>
          </div>
        </div>
      )}
      <div onTouchStart={e=>{ if(!e.target.closest("textarea,button,canvas")) e.currentTarget._sw=e.touches[0].clientY; }} onTouchEnd={e=>{ if(e.currentTarget._sw && e.changedTouches[0].clientY - e.currentTarget._sw > 70) onClose(); }}
        style={{position:"relative",zIndex:1,background:dm?"#1e1e30":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.14)",display:"flex",flexDirection:"column",height:"72vh",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",flexShrink:0,cursor:"grab"}} onMouseDown={e=>{ e.currentTarget._sy=e.clientY; }} onMouseUp={e=>{ if(e.clientY - e.currentTarget._sy > 44) onClose(); }}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px 8px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setShowHistory(true)}>
            <div style={{width:32,height:32,clipPath:OCT,background:personColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{person?.initial}</div>
            <div>
              <span style={{fontSize:15,fontWeight:600,color:dm?"#e0e0f0":"#1c1c1e"}}>{person?.name}</span>
              <p style={{fontSize:10,color:"#007aff",margin:0,marginTop:1}}>tap to see history</p>
            </div>
          </div>
        </div>
        {sent ? (
          <div style={{textAlign:"center",padding:"32px 20px",flexShrink:0,animation:"fadeIn 0.25s"}}>
            <div style={{fontSize:40,marginBottom:10}}>📣</div>
            <p style={{fontSize:16,fontWeight:700,color:dm?"#e0e0f0":"#1c1c1e",marginBottom:6}}>Sent!</p>
            <p style={{fontSize:14,color:dm?"#8888aa":"#8e8e93",fontStyle:"italic",wordBreak:"break-word"}}>"{sent}"</p>
          </div>
        ) : (
          <>
            <div style={{flexShrink:0,display:"flex",gap:4,padding:"0 12px 8px",overflowX:"scroll",WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none"}}>
              {catKeys.map(cat=>(<button key={cat} onClick={()=>setActiveCategory(cat)} style={{flexShrink:0,padding:"6px 12px",border:"none",cursor:"pointer",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:activeCategory===cat?(dm?"#3a3a54":"#1c1c1e"):(dm?"#2a2a44":"#d4d4da"),color:activeCategory===cat?"#fff":(dm?"#8888aa":"#8e8e93"),transition:"background 0.15s,color 0.15s",WebkitTapHighlightColor:"transparent"}}>{cat}</button>))}
            </div>
            <div style={{flex:1,overflowY:"scroll",WebkitOverflowScrolling:"touch",padding:"2px 12px 8px",minHeight:0}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                {(EMOJI_CATEGORIES[activeCategory]||[]).map((e,i)=>(<button key={i} onClick={()=>appendEmoji(e)} style={{fontSize:28,background:"none",border:"none",cursor:"pointer",padding:"5px 4px",borderRadius:10,lineHeight:1,WebkitTapHighlightColor:"transparent",opacity:atLimit?0.35:1}}>{e}</button>))}
              </div>
            </div>
            <div style={{flexShrink:0,padding:"10px 12px env(safe-area-inset-bottom,16px)",borderTop:`0.5px solid ${dm?"#3a3a54":"#ebebef"}`,background:dm?"#1e1e30":bg}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,position:"relative"}}>
                  <textarea value={message} onChange={e=>setMessage(e.target.value.slice(0,MAX))} placeholder="Type a message or pick an emoji…" rows={2}
                    style={{width:"100%",resize:"none",border:`1.5px solid ${dm?"#3a3a54":"#e0e0e8"}`,borderRadius:20,padding:"10px 44px 10px 14px",fontSize:15,fontFamily:"inherit",lineHeight:1.4,outline:"none",color:dm?"#e0e0f0":"#1c1c1e",background:dm?"#2a2a44":"#d8d8de",boxSizing:"border-box",WebkitAppearance:"none"}}
                    onFocus={e=>e.target.style.borderColor="#4a90d9"} onBlur={e=>e.target.style.borderColor="#e0e0e8"}/>
                  <span style={{position:"absolute",bottom:9,right:12,fontSize:10,fontWeight:600,color:atLimit?"#cc2222":nearLimit?"#e07000":"#c0c0c8",pointerEvents:"none"}}>{remaining}</span>
                </div>
                <button onClick={handleSend} disabled={!message.trim()} style={{flexShrink:0,width:44,height:44,border:"none",cursor:message.trim()?"pointer":"default",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,opacity:message.trim()?1:0.3,filter:"hue-rotate(80deg) saturate(2.2) brightness(0.88)",transition:"opacity 0.2s,transform 0.1s",padding:0,WebkitTapHighlightColor:"transparent"}}>📣</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── PickerSheet ───────────────────────────────────────── */
function PickerSheet({seatId,friends,onSelect,onClose,seats,trunkOccupants,bootedIds,friendOverrides,onOpenFriends,onOpenContacts}){
  const bg = usePaintBg();
  const dm=useDM();
  return(
    <div style={{position:"absolute",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2760)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.14)",display:"flex",flexDirection:"column",overflow:"hidden"}}
        onTouchStart={e=>{ e.currentTarget._sy=e.touches[0].clientY; }} onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sy > 44) onClose(); }}
        onMouseDown={e=>{ e.currentTarget._sy=e.clientY; }} onMouseUp={e=>{ if(e.clientY - e.currentTarget._sy > 44) onClose(); }}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",flexShrink:0,cursor:"grab"}}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"4px 20px 0px",flexShrink:0,minHeight:36}}>
          <span style={{fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:dm?"#e0e0f0":"#1c1c1e"}}>Add to Seat</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"12px 24px 20px",paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px)"}}>
          <button onClick={onOpenFriends} className={dm?"btn3d btn3d-dark":"btn3d"} style={{width:"100%",padding:"15px 0",borderRadius:14,cursor:"pointer",fontSize:15,fontWeight:600,background:dm?"#2e2e48":"#d4d4da",color:dm?"#c0c0e0":"#5a5a62",border:dm?"1px solid #3a3a54":"1px solid #e4e4ea"}}>Recent Riders</button>
          <button onClick={onOpenContacts} className={dm?"btn3d btn3d-dark":"btn3d"} style={{width:"100%",padding:"15px 0",borderRadius:14,cursor:"pointer",fontSize:15,fontWeight:600,background:dm?"#2e2e48":"#d4d4da",color:dm?"#c0c0e0":"#5a5a62",border:dm?"1px solid #3a3a54":"1px solid #e4e4ea"}}>Contacts</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ColorPicker ────────────────────────────────────────── */
function parseColorInput(val){
  if(!val) return {hex:"#e06060", op:15};
  const rm = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if(rm){
    const hex="#"+[rm[1],rm[2],rm[3]].map(v=>parseInt(v).toString(16).padStart(2,"0")).join("");
    const op = rm[4]!=null ? Math.round(parseFloat(rm[4])*100) : 15;
    return {hex, op};
  }
  if(val.startsWith("#") && val.length>=7) return {hex:val, op:15};
  return {hex:"#e06060", op:15};
}

function ColorPicker({value, onChange, onSliderHold, onSliderRelease, peeking}){
  const canvasRef = useRef(null);
  const pickFnRef = useRef(null);
  const holdTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const parsed = parseColorInput(value);
  const [picked, setPicked] = useState(parsed.hex);
  const [opacity, setOpacity] = useState(parsed.op);

  const emitColor = useCallback((hex, op) => {
    if(!hex||!hex.startsWith("#")) return;
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    if(isNaN(r)||isNaN(g)||isNaN(b)) return;
    onChange(`rgba(${r},${g},${b},${(op/100).toFixed(2)})`);
  },[onChange]);

  useEffect(()=>{
    const cv = canvasRef.current; if(!cv) return;
    const ctx = cv.getContext("2d");
    const W=cv.width, H=cv.height;
    const hGrad = ctx.createLinearGradient(0,0,W,0);
    for(let i=0;i<=360;i+=30) hGrad.addColorStop(i/360,`hsl(${i},100%,50%)`);
    ctx.fillStyle=hGrad; ctx.fillRect(0,0,W,H);
    const wGrad = ctx.createLinearGradient(0,0,0,H);
    wGrad.addColorStop(0,"rgba(255,255,255,0.9)"); wGrad.addColorStop(0.5,"rgba(255,255,255,0)");
    ctx.fillStyle=wGrad; ctx.fillRect(0,0,W,H);
    const bGrad = ctx.createLinearGradient(0,0,0,H);
    bGrad.addColorStop(0.5,"rgba(0,0,0,0)"); bGrad.addColorStop(1,"rgba(0,0,0,0.85)");
    ctx.fillStyle=bGrad; ctx.fillRect(0,0,W,H);
  },[]);

  const doPick = useCallback((clientX,clientY)=>{
    const cv = canvasRef.current; if(!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = Math.max(0,Math.min(cv.width-1, Math.round((clientX-rect.left)*(cv.width/rect.width))));
    const y = Math.max(0,Math.min(cv.height-1, Math.round((clientY-rect.top)*(cv.height/rect.height))));
    const d = cv.getContext("2d").getImageData(x,y,1,1).data;
    const hex="#"+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,"0")).join("");
    setPicked(hex); emitColor(hex, opacity);
  },[emitColor, opacity]);
  pickFnRef.current = doPick;

  const attachCanvas = useCallback(node=>{
    if(!node) return;
    canvasRef.current = node;
    const onTS = e => pickFnRef.current(e.touches[0].clientX, e.touches[0].clientY);
    const onTM = e => { e.preventDefault(); pickFnRef.current(e.touches[0].clientX, e.touches[0].clientY); };
    node.addEventListener('touchstart', onTS, {passive:true});
    node.addEventListener('touchmove',  onTM, {passive:false});
  },[]);

  const handleSliderDown = () => {
    holdTimerRef.current = setTimeout(()=>{ isHoldingRef.current = true; onSliderHold && onSliderHold(); }, 1000);
  };
  const handleSliderUp = () => {
    clearTimeout(holdTimerRef.current);
    if(isHoldingRef.current){ isHoldingRef.current = false; onSliderRelease && onSliderRelease(); }
  };

  const r=parseInt(picked.slice(1,3),16)||0;
  const g=parseInt(picked.slice(3,5),16)||0;
  const b=parseInt(picked.slice(5,7),16)||0;

  return(
    <div style={{marginBottom:14}}>
      <canvas ref={attachCanvas} width={260} height={160}
        style={{width:"100%",height:160,borderRadius:12,cursor:"crosshair",display:"block",border:"1.5px solid #e0e0e8",touchAction:"none",visibility:peeking?"hidden":"visible"}}
        onMouseDown={e=>doPick(e.clientX,e.clientY)}
        onMouseMove={e=>{if(e.buttons===1)doPick(e.clientX,e.clientY);}}/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:2}}>
        <span style={{fontSize:11,color:"#8e8e93",fontWeight:600,flexShrink:0,visibility:peeking?"hidden":"visible"}}>Opacity</span>
        <div style={{flex:1,position:"relative",height:4,borderRadius:2,overflow:"visible"}}>
          <div style={{position:"absolute",inset:0,borderRadius:2,overflow:"hidden",visibility:peeking?"hidden":"visible"}}>
            <div style={{position:"absolute",inset:0,borderRadius:2,background:`linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))`}}/>
          </div>
          <input type="range" min={0} max={100} value={opacity}
            onMouseDown={handleSliderDown} onMouseUp={handleSliderUp}
            onTouchStart={handleSliderDown} onTouchEnd={handleSliderUp}
            onChange={e=>{ const v=Number(e.target.value); setOpacity(v); emitColor(picked,v); }}
            style={{position:"absolute",top:"50%",left:0,right:0,width:"100%",transform:"translateY(-50%)",appearance:"none",WebkitAppearance:"none",background:"transparent",cursor:"pointer",height:28,margin:0,padding:0,touchAction:"none"}}/>
        </div>
        <span style={{fontSize:11,color:"#555",fontFamily:"monospace",fontWeight:600,flexShrink:0,minWidth:28,textAlign:"right",visibility:peeking?"hidden":"visible"}}>{opacity}%</span>
      </div>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#e8e8f0;border:1.5px solid #c0c0c8;box-shadow:0 1px 3px rgba(0,0,0,0.2760);cursor:pointer;}input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#e8e8f0;border:1.5px solid #c0c0c8;box-shadow:0 1px 3px rgba(0,0,0,0.2760);cursor:pointer;}`}</style>
    </div>
  );
}

/* ─── AvatarEditSheet ───────────────────────────────────── */
function AvatarEditSheet({person,onClose,onSave,onHonk}){
  const bg = usePaintBg();
  const dm=useDM();
  const isBooted = !!person.isBooted;
  const[step,setStep]=useState("ask");
  const[text,setText]=useState(person.initial||"");
  const[bgColor,setBgColor]=useState(person.friendColor||getFriendColor(person.id));
  const titleMap={ask:"",menu:"",text:"Text or Emoji",color:"Colour",photo:"Photo Album"};
  const avatarColor = isBooted ? "rgba(180,50,50,0.72)" : bgColor;
  return(
    <div style={{position:"absolute",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={()=>{ if(step==="color") onSave({...person,initial:text||person.initial,friendColor:bgColor}); onClose(); }} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3512)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}/>
      <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.15)",padding:"14px 20px 20px",paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))"}}
        onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
        onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sw > 60){ if(step==="color") onSave({...person,initial:text||person.initial,friendColor:bgColor}); onClose(); } }}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12,cursor:"grab"}} onMouseDown={e=>{ e.currentTarget._sy=e.clientY; }} onMouseUp={e=>{ if(e.clientY - e.currentTarget._sy > 44) onClose(); }}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        {step!=="ask" && (
          <div style={{display:"flex",alignItems:"center",marginBottom:16,minHeight:28}}>
            <button onClick={()=>setStep(step==="menu"?"ask":"menu")} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:dm?"#b0b0d0":"#8e8e93",padding:"0 12px 0 0",lineHeight:1}}>←</button>
            <span style={{fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:dm?"#e0e0f0":"#1c1c1e"}}>{titleMap[step]||step}</span>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",marginBottom:32}}>
          <OctAvatar initial={text||person.initial} color={avatarColor} size={66}/>
        </div>
        {step==="ask"&&(<div style={{display:"flex",gap:10,alignItems:"stretch"}}>
          <button onClick={()=>setStep("menu")} className="btn3d" style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #c0c0c8",background:"radial-gradient(ellipse at center, #f4f4f6 0%, #d8d8de 100%)",fontSize:14,cursor:"pointer",color:"#5a5a62",fontWeight:600}}>Edit</button>
          <button onClick={()=>{ onClose(); onHonk && onHonk(person); }} className="btn3d" style={{flex:2,padding:"13px 0",borderRadius:12,border:isBooted?"1px solid #c8b0b0":"1px solid #c8d4e0",background:isBooted?"rgba(180,50,50,0.13)":"#c8d4e0",fontSize:15,cursor:"pointer",color:isBooted?"rgba(160,45,45,0.9)":"#8aaccc",fontWeight:600,letterSpacing:"0.01em"}}>Honk @ {person.name}</button>
        </div>)}
        {step==="menu"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[{k:"text",label:"⌨️  Text or Emoji"},{k:"color",label:"🎨  Background Colour"},{k:"photo",label:"📷  Photo Album"}].map(o=>(<button key={o.k} onClick={()=>setStep(o.k)} className="btn3d" style={{padding:"14px 16px",borderRadius:12,border:"1px solid #e8e8ee",background:"#d8d8de",fontSize:15,textAlign:"left",cursor:"pointer",color:"#1c1c1e",fontWeight:500}}>{o.label}</button>))}
        </div>)}
        {step==="text"&&(
          <div>
            <p style={{fontSize:12,color:"#8e8e93",marginBottom:8,textAlign:"center"}}>Type a letter, word, or tap 😊 for emoji</p>
            <input ref={el=>{ if(el) setTimeout(()=>{ try{el.focus();}catch(e){} },120); }} value={text} onChange={e=>setText(e.target.value.slice(0,3))} placeholder="A, 🔥, hi…" inputMode="text" enterKeyHint="done" style={{width:"100%",fontSize:28,textAlign:"center",padding:"12px",borderRadius:12,border:"1.5px solid #d0d0d8",marginBottom:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",WebkitAppearance:"none"}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep("menu")} className="btn3d" style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid #e0e0e6",background:"#d8d8de",cursor:"pointer",fontSize:14,color:"#555"}}>← Back</button>
              <button onClick={()=>{onSave({...person,initial:text,friendColor:bgColor});onClose();}} className="btn3d btn3d-primary" style={{flex:2,padding:"11px 0",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600}}>Save</button>
            </div>
          </div>
        )}
        {step==="color"&&(<div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={()=>setBgColor(getFriendColor(person.id))} className="btn3d" style={{padding:"6px 14px",borderRadius:10,border:"1px solid #e0e0e6",background:"#d8d8de",cursor:"pointer",fontSize:12,color:"#555",fontWeight:600}}>Default</button>
          </div>
          <ColorPicker value={bgColor} onChange={setBgColor}/>
        </div>)}
        {step==="photo"&&(<div style={{textAlign:"center",padding:"10px 0 6px"}}>
          <p style={{color:"#8e8e93",fontSize:14,marginBottom:18}}>Photo library access would be<br/>requested on a real device.</p>
          <button onClick={()=>setStep("menu")} className="btn3d" style={{padding:"11px 28px",borderRadius:10,border:"1px solid #e0e0e6",background:"#d8d8de",cursor:"pointer",fontSize:14,color:"#555"}}>← Back</button>
        </div>)}
      </div>
    </div>
  );
}

const PAINT_DEFAULTS={van:'#ecedf0',seats:'#e4e4e8',background:'#c8cfd3',friends:'#b8bdc3',contacts:'#b8bdc3'};

/* ─── PaintShopSheet ─────────────────────────────────────── */
function PaintShopSheet({colors,onClose,onChange,onPeekTab,onPeekEnd}){
  const dm=useDM();
  const[target,setTarget]=useState(null);
  const[peeking,setPeeking]=useState(false);

  const handlePeekStart = () => {
    setPeeking(true);
    if(target==="friends") onPeekTab&&onPeekTab("friends");
    else if(target==="contacts") onPeekTab&&onPeekTab("contacts");
  };
  const handlePeekEnd = () => { setPeeking(false); onPeekEnd&&onPeekEnd(); };

  const targets=[
    {key:"van",      label:"Van"},
    {key:"seats",    label:"Seats"},
    {key:"background",label:"Background"},
    {key:"friends",  label:"Friends Side Window     ←"},
    {key:"contacts", label:"Contacts Side Window     →"},
  ];
  const sheetBg = dm?"#22223a":"#d4d4da";
  return(
    <div style={{position:"absolute",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3512)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)",visibility:peeking?"hidden":"visible"}}/>
      <div style={{position:"relative",zIndex:1,background:peeking?"transparent":sheetBg,borderRadius:"22px 22px 0 0",boxShadow:peeking?"none":"0 -6px 32px rgba(0,0,0,0.15)",padding:"14px 0 12px",paddingBottom:"calc(12px + env(safe-area-inset-bottom, 0px))",maxHeight:"80vh",display:"flex",flexDirection:"column"}}
        onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
        onTouchEnd={e=>{ if(!peeking && e.changedTouches[0].clientY - e.currentTarget._sw > 60) onClose(); }}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12,cursor:"grab",visibility:peeking?"hidden":"visible"}}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        <div style={{padding:"0 20px 16px",display:"flex",alignItems:"center",position:"relative",minHeight:36,visibility:peeking?"hidden":"visible"}}>
          {target && (<button onClick={()=>setTarget(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:dm?"#b0b0d0":"#8e8e93",padding:"0",position:"absolute",left:20,lineHeight:1}}>←</button>)}
          <span style={{flex:1,textAlign:"center",fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:dm?"#e0e0f0":"#1c1c1e"}}>
            {target ? targets.find(t=>t.key===target)?.label : "Paint Shop"}
          </span>
        </div>
        <div style={{flex:1,overflowY:peeking?"hidden":"auto",padding:"0 20px"}}>
          {!target && (
            <div style={{display:"flex",flexDirection:"column",gap:10,visibility:peeking?"hidden":"visible"}}>
              {targets.map(t=>(
                <button key={t.key} onClick={()=>setTarget(t.key)} className={dm?"btn3d btn3d-dark":"btn3d"} style={{padding:"14px 16px",borderRadius:12,border:"1px solid #e8e8ee",background:dm?"#2a2a44":"#d8d8de",fontSize:15,textAlign:"left",cursor:"pointer",color:dm?"#d0d0e8":"#1c1c1e",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>{t.label}</span>
                  <span style={{width:22,height:22,borderRadius:6,background:colors[t.key],display:"inline-block",border:"1px solid rgba(0,0,0,0.12)",flexShrink:0}}/>
                </button>
              ))}
            </div>
          )}
          {target && (
            <div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14,visibility:peeking?"hidden":"visible"}}>
                <div style={{position:"relative",width:48,height:48,borderRadius:12,border:"2px solid #e0e0e8",boxShadow:"0 2px 8px rgba(0,0,0,0.12)",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",backgroundSize:"8px 8px",backgroundPosition:"0 0,0 4px,4px -4px,-4px 0"}}/>
                  <div style={{position:"absolute",inset:0,background:colors[target]}}/>
                </div>
              </div>
              <ColorPicker value={colors[target]} onChange={v=>onChange(target,v)} onSliderHold={handlePeekStart} onSliderRelease={handlePeekEnd} peeking={peeking}/>
              <button onClick={()=>onChange(target,PAINT_DEFAULTS[target])} className="btn3d" style={{width:"100%",marginTop:14,padding:"12px 0",borderRadius:12,border:"1px solid #d8d8de",background:"#d2d2d8",fontSize:14,cursor:"pointer",color:"#6e6e76",fontWeight:500,visibility:peeking?"hidden":"visible"}}>↩ Restore to Default</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── PlateEditor ────────────────────────────────────────── */
function PlateEditor({plate, dm, bg, onSave, onClose}){
  const raw = plate.replace('-','');
  const [chars, setChars] = React.useState(raw.split(''));
  const refs = [useRef(null),useRef(null),useRef(null),useRef(null),useRef(null),useRef(null),useRef(null)];
  const handleChar = (i, val) => {
    const v = val.toUpperCase().slice(-1);
    const next = [...chars];
    next[i] = v || chars[i];
    setChars(next);
    if(v && i < 6) refs[i+1].current?.focus();
  };
  const handleKey = (i, e) => {
    if(e.key==='Backspace'){ 
      const next=[...chars]; next[i]=' '; setChars(next);
      if(i>0) refs[i-1].current?.focus();
    }
  };
  const formatted = chars.slice(0,3).join('').trim()+'-'+chars.slice(3).join('').trim();
  return(
    <div style={{position:"absolute",inset:0,zIndex:30,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}/>
      <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.2)",padding:"20px 20px 28px",paddingBottom:"calc(28px + env(safe-area-inset-bottom, 0px))"}}
        onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
        onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sw > 60) onClose(); }}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:dm?"#8888aa":"#9a9aa8",marginBottom:4}}>Demo Plate</div>
          <div style={{fontSize:11,color:dm?"#66668a":"#b0b0bc"}}>For demonstration only — does not change your actual plate</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <div style={{background:"#f0ebe0",border:"2px solid #2a2a2a",borderRadius:8,padding:"8px 20px",fontFamily:"'Courier New',monospace",fontSize:32,fontWeight:700,letterSpacing:"0.15em",color:"#1a1a1a",boxShadow:"inset 0 2px 5px rgba(0,0,0,0.15)"}}>
            {chars.slice(0,3).join('')}-{chars.slice(3).join('')}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginBottom:24}}>
          {chars.map((c,i)=>(
            <React.Fragment key={i}>
              {i===3 && <div style={{color:dm?"#8888aa":"#9a9aa8",fontSize:22,fontWeight:700,marginBottom:2}}>-</div>}
              <input
                ref={refs[i]}
                value={c.trim()}
                onChange={e=>handleChar(i,e.target.value)}
                onKeyDown={e=>handleKey(i,e)}
                onFocus={e=>e.target.select()}
                maxLength={2}
                inputMode="text"
                autoCapitalize="characters"
                style={{width:36,height:48,textAlign:"center",fontSize:20,fontWeight:700,fontFamily:"'Courier New',monospace",
                  background:dm?"#2a2a44":"#f5f0e8",border:`2px solid ${dm?"#4a4a64":"#b8b2a0"}`,borderRadius:6,
                  color:dm?"#e0e0f0":"#1a1a1a",outline:"none",textTransform:"uppercase",
                  boxShadow:"inset 0 2px 4px rgba(0,0,0,0.12)",WebkitAppearance:"none"
                }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} className="btn3d" style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #c0c0c8",background:dm?"#2a2a44":"#d4d4da",fontSize:15,color:dm?"#c0c0e0":"#5a5a62",fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onSave(chars.slice(0,3).join('')+'-'+chars.slice(3).join(''))} className="btn3d btn3d-primary" style={{flex:2,padding:"13px 0",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>Use This Plate</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SettingsSheet ─────────────────────────────────────── */
/* ─── License Plate Utils ───────────────────────────────── */
function getOrCreatePlate(){
  const key = 'vanapp_plate';
  let p = null;
  try { p = localStorage.getItem(key); } catch(e){}
  if(p) return p;
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let plate = '';
  for(let i=0;i<7;i++) plate += chars[Math.floor(Math.random()*chars.length)];
  const formatted = plate.slice(0,3)+'-'+plate.slice(3);
  try { localStorage.setItem(key, formatted); } catch(e){}
  return formatted;
}
const NEARBY_DEMO = [
  {plate:'XXX-000', avatarType:'emoji', avatar:'🚐', dist:'.02m'},
  {plate:'B4Z-739', avatarType:'emoji', avatar:'🦊', dist:'1.3km'},
  {plate:'Pum-kin', avatarType:'initial', initial:'G', color:'#8a8a8a', dist:'9.4m'},
  {plate:'QQQQ', dist:'660.7m', avatarType:'photo', photo:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABQAHgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC+rFRgbh/unI/I0NKOh2nPY/L+hpuWHXf+jUjycY+T6Zx+hr6Znz533wUZV8WHAIzA+AenSs/4uF08fX/GPli74z8g554rQ+COP+Es6Fcwvx2PFZfxix/wsPUMMM7YuMf9M1rx6P8Av8/T/I9Oq/8AZI/13OZ8wNgOoOfXivZ/h/Eo+Hlmq/KPtEh6V4ohcEdT+te1eBbO9vfAWnQ2G0SefIxy+3gVrjWlUpt9xYLVTNOfcijBGScdapQahDhFkZgzEjp3HX+dcD8S/H+n+FtQW21HVLa3uYmOYXJLnBKkgAHIznmvMv8Ahd2j2N5vQ3t6mdxCxbQGxjjcR7VcqqTsbqF1c9/8STyIYVRlaNgd3PUj+tcQtz9ivdkc8fmxhmQKRzk4U/qa8p8QfG6/8TKljofhkBlAO+4u1wCD1PRQPqazYYfiFq9yLiDWPB2myHG0Pr1orL19ZGPf9BWc63YuET6r8O3Qksoonl3zIRG2epbGa+VP2nvFF/e+L5fD2oS6df6bp12p3WcgW4cEEhW4JVlDMhI+UnaSMitdfh18c9XhAtfE1jeR53BbXxJEBn1+QisC7/Z5+MSSM8nhqOYsdxeO+ik3E987smoqVFUVrkqPK7ns3w5+KPww8PfDjR7RNdhsRFB81kwllmjcks6n5ST8xOCeoxUWr/tI+CLQMunWOs6k3YiFYVP4u2f0rw24+CXxJtZRHeeHNVjz/FFaNKo+rICKpz/De+sjjVF1G3PcSWrp/wChUe3jFWuHsm2el6z+07qj5GkeFbG2HZ7u6eU/koUfrRXiHh5dG1HWlsEsLgg78yPOv8OewHt60VLxMSlRbPoAkhud4+qZ/lQXGcFlP4kfzqMk7uSR9UNL5mCPnB+pNeweIehfBM/8VYuAOYX6dPums34w4/4WBqB+f7sXbIP7tav/AAScf8JenTJicZHf5TWd8ZCf+FhagMEtsi5B/wCmYrx6X+/z9P8AI9Kr/ukf67nKISSuCOvbivQtR+Ic/wANvhfoWtw6ZFqP2jUntHieUx4DKW3AgHn5cdO9ee7kaTKq6L2Vjux+OKg/aULD9nfw60Yfd/b+NynpmGTtSzVu0bDy615XPN/jtrUfinXYdbltTDctDKXhEhwN025QT3ID4rn9O8NQXupWdpaW8Shiz3Ms2WWKJV3O554wPzOB3pniidr77DN50kQFqA6opYlvlz16812Ol2B0TwrFp01w51LWpA1w8nLRWyHOzHbLDn/dPtWF3Jqz3O12jfQyrvwpo1roK3c8NxI8h3KZJNu1D93IXvjH51zV7oUahhHZTn5Qy7Xz8pGc8mu+1aQXl4bQ3UmQOQEwuB0FcrdG1uZpEF1d4iQucrgYFdUoU0rGMZzOT+xtaxST7LqAqPkP2fAJz3YYIGK998F61P8ADT4UQeKdY8ReIbS71RgtjaW96WyDyCI5CU6AklhhR2JIFeceBPDdv4u8XWOjW4uTG8nmXjsR8sCYL9O7ZCj3atr4t+L9P8WeOpdAtDMdN0gNZxCNgIWZPvsMdsgKPZBXHVjHmsjsp1JKDv1Ot039pbWUIP8Awletgf3b3Q7K6H/fUUkTfpXV6X+1BcthbrUfC14vdbmxvbBj9SBMlfMv/FPtcm3OlyNNuIB3j5ucVL4y0iy0ywSS0glSYtwFYlSoGWyDnt6Vk422YlJPdH1/4P8AHvgTx/rAs5/h54dvr114lsLy0uW57ZYRyLn3AB6ZzgUV8n/A+e70n4z+DbphJEs19tViCA6MrAj3GcflRWbm0VyX2R7cuRyXz+B4p3J6OB9SayYdUukwHzJzyQ+3+lRa1qE1zYeXBHcRSK6uWjmJyAckY9K9z+0KbdkmeN/Z9RbtHc/DrxTpHh/xZDcapcAQGNgZI8MAdp46+4pPiZq2l614tn1XTruJraWOIL5nyMSFAOAee1eQR6/ZaGb7T9DWM2zFpDqCriZkdj5cfzDKjaOi45OTngCXwHJ/a+q3Nxc3M1vYW0fnXsv35NvYIT1dunP1rhVV/WHNLX8D1ng6ToKLk7LU7uCGRsMkalfUsBVn4mWP/CY/DHS/CdncxWl3aaibt5pTvQr5bLgBec5YflWTN4k1Rr6G38J6Fp9hZSx7op7m3FzcEjG4M8mRkZB+VR16V1+iaP8AFDU1Ux+JLyEN2gCxAf8AfIFTiqqqNRqdDswOUp0/aU9n1bPMvDHwe1W1hbzNXju7jKtDKmmTSGIhgcgE4Ocd/qMVY1D4UfFRNX/tPT2vtVQ5DxvYyRrs4+VVOQPbHTFe0wfDn4mTqDN4x1kexvnH9amX4VeOpOJfF2qH63z/AONYKpFbI3lgafWpH7z5o8R6Z4w8O6tI+r+G7q3MgJVZQY5NpOeQeCfocVx8lxMtvMircQTOFXaYSdw5z2Ir661D4Ha5qBX7fq810U5UzXJfb9Mk4qC0+BqaPI+o6jp9rq9vAjSPbzyEK2Bnqpz26UOvIccBht/aK/r/AJnjfhC4t/h54DbUr6QWev8AiiB/srjANrAq4R8HqSSX2jr8vpXl95baRoEEEuii6eV3O5rmUMHBXrgAYOc96+tvid8JNY8bQ6VPaaHp2mX1krRSyM2QUaNMKoH3dp3AezGu+i+GvhafTbWDVPh/pt1NFCqPK0UHzsAMt04ycms1PU5qtNWW3/gS/wAz87LdZLvVYnwUPmAkgn1zXZ+I7mExRQ3jhUZZcFuP4cf1r7Ruvgr8M7lSs3w0tlB5PllF/wDQWFUbn4A/CueHyj4JvYFByPKuGGD9fMocr7mHJ/V1/mfGvh7UJG8feAmCCG3truJI08zcQeN5OeRk84or63f9nX4Zw39tf2uk+I7a5tZBLCyXDOFccg4JOee1FZSt0OqhaKd0eGfacZDZ/Cs/Xbotps62pmjmCFkcLkAgdD7Gpy6Y9qyvEj2bWSWtzDPKLh9g8mTYyH+/0O4Drtxz7V069DifmUtJ1S8lt2tHhjv4on2k3EEbqg29/utyc4IbjHSuj0O5trewks7bShYxXDGS8ljufMVkRScIjAOG/NcA85rktCkRrXUNjq+ycZ9QOcHHbtya3NC1CK31W2lYhxG4d4ycbh36kE5GRk+tb03aNznk3zWLdx46uNG1u30K1lhmsLeR5ldogJC7IobLA9PavY/A3xMeOOPnBx2NfLHjPTbXQ/HN5Z2V+l5Zxzn7NcJJvVom+ZenfBAI7EEV1Gh380MH7qRZCgzhSQceuK87FSfM2j6/JZQ9h7Koro+2dC+JGn3SKLnCH1rfTxfobDP2oCvgrVPiP/Y+YMSXV3jIgR9u33du306/SsWb4tePXYPay6VaqOiG035+rOSf5VNN15LQ58dQyqlO13fsv+CfoTd+N9Ct0LfaC+OwFczf/Ei1vLuKztrUG3Lb5yzclAeg+pwPoDXxdovxx1Eaglr4v0uKKJiN1zYKVZR6mMsVYf7pH416pp3iKC6sUvrORWiuFDxlGyNnYZ+nX3zWVapXp7nVl2XZZil+7u31T3X3H0lZfEHTp2nOxhtkA65x8oP9asnx1pgBzzXzXpesuGucOeZBnn/ZWrD6xLnG84+tY/Wqnc9BcOYN9/vPoOf4iadH0h3f8DFVX+JtkPu2o/7+f/WrwF9SZur1DJqIVev61P1qr3NVw7gY7xv82e2+IPG8epCKSO6nsvJDbVRlZGYjhmBHJXqOcZ6g0V4NLqjnjdRS+s1e5cclwMVZQPKm1u96h1H/AAAVR1DUry6ntnM+3yX37kO0r9MVlS3BGfSqM96V6tX0PKj86bZ1F5qXhjVL1pb63u9CvegurZv3bH+8cgdeuCacjeIrizV9Ki/ttbOR4yFXBxnPmDH97HfNcRdaijKVdQ69wRkVAniC7sDE2mXNzZSRjGYXIDDsCOhqJWEvMt6hFriXgivrC7hK/wCrilUgqCc8Z9ya1LzU7nS9LEjRTQXJwIt6lTu9fwq3onxj1jTp4ZL/AEzTdYaJQFNwjLnHTdtIzWT8RPHl/wDETxFaanqGmaXpzW9slqsVhD5asFJIZuTlucZ9AKyqUadlyP5WO2hj6lJSVtX1uY8Ns727397dm2ty5BlZS7yv1IUdz6ngCte80QafLbpHq7QTzFljF3HsjeRSA0e8EgEZHUY5611uhaZqT3VhaLo7X+nDSFuo4hKqCYspaU7CP3205JA5ULnpkHpfEWqLaeCJLO18O2cd4lxMh1GK7UM8T7f3auwJjBIIKjB5xweao4r3PHryA3cE9rcQm3u7dyskbDmN+n5Z4Irpvgtrc0f2vRJXOxB58Kk/dOcOP1B/OubvJZ21GCe4XZPPZK0wIxzyBx24C1Q0LVJNG8R/2lFH5qo7CSPON6HqM9j/AIVlWhzwcTty/FfVsRGpfTr6H0BY3ZEk5LEAsD/46Ktf2goP3siuHtvFfh7Y7y6jNCzBWaPajFcgcE7utNm8aeF4uVvbmX6YGf0P868z2E30Pt1nGFivjO0l1HHQ4qH+0sk/NmuFvfHvh9UQpFcybgcqZNuP/Hayp/iBpuSI9PYj3kY/yIprCzfQznnuFX2j0g3+TwaK8vb4iRq4MWmpwf4iSPyOaKr6nM53xDhl3P/Z'},
];

function SettingsSheet({settings,onClose,onToggle,onOpenPaintShop,onHonk,onCode}){
  const bg = usePaintBg();
  const dm=useDM();
  const [showHitchhikers, setShowHitchhikers] = React.useState(false);
  const [selectedHitchhiker, setSelectedHitchhiker] = React.useState(null);
  const [showPlateEditor, setShowPlateEditor] = React.useState(false);
  const [demoPlate, setDemoPlate] = React.useState(null);
  const plate = React.useMemo(()=>getOrCreatePlate(),[]);
  const displayPlate = demoPlate || plate;
  const rows = [
    {key:"lights", label:"Lights off", sub:"Dark Mode"},
    {key:"invisible", label:"Invisible", sub:"Hitchhikers can not see you"},
    {key:"notifyReceive", label:"Notify me when my seat changes", sub:"Get a notification when someone moves you"},
    {key:"notifySend", label:"Notify others when I move them", sub:"Send a notification when you change someone's seat"},
  ];
  return(
    <div style={{position:"absolute",inset:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3512)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}/>
      <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.15)",padding:"14px 0 0",paddingBottom:"env(safe-area-inset-bottom, 0px)"}}
        onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
        onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sw > 60) onClose(); }}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12,cursor:"grab"}} onMouseDown={e=>{ e.currentTarget._sy=e.clientY; }} onMouseUp={e=>{ if(e.clientY - e.currentTarget._sy > 44) onClose(); }}>
          <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
        </div>
        <div style={{padding:"0 20px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:dm?"#e0e0f0":"#1c1c1e"}}>Settings</span>
        </div>
        {/* License Plate */}
        <div style={{margin:"0 20px 16px",display:"flex",justifyContent:"center"}} onClick={()=>setShowPlateEditor(true)}>
          <div style={{position:"relative",display:"inline-block",cursor:"pointer"}}>
            {/* Outer surface / wall top */}
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 220 80" preserveAspectRatio="none">
              {/* Top wall */}
              <polygon points="0,0 220,0 208,12 12,12" fill="#9aa0a8"/>
              {/* Bottom wall */}
              <polygon points="0,80 220,80 208,68 12,68" fill="#d0d5da"/>
              {/* Left wall */}
              <polygon points="0,0 0,80 12,68 12,12" fill="#b0b8bf"/>
              {/* Right wall */}
              <polygon points="220,0 220,80 208,68 208,12" fill="#bcc2c8"/>
              {/* Drop shadow rim */}
              <rect x="12" y="12" width="196" height="56" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
            </svg>
            {/* Plate sitting at the bottom of the well */}
            <div style={{
              margin:"12px 12px",
              background:"#f0ebe0",
              borderRadius:4,
              padding:"6px 18px",
              display:"inline-flex",flexDirection:"column",alignItems:"center",
              minWidth:180,position:"relative",
              boxShadow:"inset 0 2px 5px rgba(0,0,0,0.2), inset 0 1px 2px rgba(0,0,0,0.12)",
              border:"1px solid #b8b2a0"
            }}>
              <div style={{fontSize:9,letterSpacing:"0.18em",color:"#555",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>· · · · · · ·</div>
              <div style={{fontSize:28,fontWeight:700,fontFamily:"'Courier New',monospace",letterSpacing:"0.12em",color:"#1a1a1a",lineHeight:1}}>{displayPlate}</div>
              <div style={{fontSize:8,letterSpacing:"0.14em",color:"#888",marginTop:2,textTransform:"uppercase"}}>who's in your van</div>
              <div style={{position:"absolute",top:5,left:8,width:10,height:10,borderRadius:"50%",border:"1.5px solid #888",background:"#e0dbd0"}}/>
              <div style={{position:"absolute",top:5,right:8,width:10,height:10,borderRadius:"50%",border:"1.5px solid #888",background:"#e0dbd0"}}/>
              <div style={{position:"absolute",bottom:5,left:8,width:10,height:10,borderRadius:"50%",border:"1.5px solid #888",background:"#e0dbd0"}}/>
              <div style={{position:"absolute",bottom:5,right:8,width:10,height:10,borderRadius:"50%",border:"1.5px solid #888",background:"#e0dbd0"}}/>
            </div>
          </div>
        </div>
        {rows.map(row=>(
          <div key={row.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderTop:dm?"0.5px solid #3a3a54":"0.5px solid #f0f0f4"}}>
            <div style={{flex:1,marginRight:16}}>
              <p style={{fontSize:15,color:row.key==="invisible"&&settings.invisible?(dm?"#6a6a8a":"#b0b0bc"):(dm?"#d8d8f0":"#1c1c1e"),fontWeight:500,margin:0}}>{row.key==="lights"?(settings.lights?"Lights on":"Lights off"):row.label}</p>
              <p style={{fontSize:12,color:"#8e8e93",margin:"2px 0 0"}}>{row.sub}</p>
            </div>
            <div onClick={()=>onToggle(row.key)} style={{width:50,height:30,borderRadius:15,background:settings[row.key]?"#34c759":"#a0a0aa",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0,outline:"none",WebkitTapHighlightColor:"transparent"}}>
              <div style={{position:"absolute",top:3,left:settings[row.key]?22:3,width:24,height:24,borderRadius:"50%",background:"#e8e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.2760)",transition:"left 0.2s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          </div>
        ))}
        <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>setShowHitchhikers(true)} className="btn3d" style={{width:"100%",padding:"13px 0",borderRadius:12,border:"1px solid #c8d4e0",background:"#c8d4e0",fontSize:15,cursor:"pointer",color:"#3a8a5a",fontWeight:600}}>🧍 Hitchhikers</button>
          <button onClick={onOpenPaintShop} className="btn3d" style={{width:"100%",padding:"13px 0",borderRadius:12,border:"1px solid #c8d4e0",background:"#c8d4e0",fontSize:15,cursor:"pointer",color:"#6a9cbf",fontWeight:600}}>🎨  Paint Shop</button>
        </div>
      </div>
      {showHitchhikers && (
        <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div onClick={()=>setShowHitchhikers(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3512)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}/>
          <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.15)",padding:"14px 0 0",paddingBottom:"env(safe-area-inset-bottom, 0px)",maxHeight:"70%",display:"flex",flexDirection:"column"}}
            onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
            onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sw > 60) setShowHitchhikers(false); }}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
              <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
            </div>
            <div style={{padding:"0 20px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:17,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:dm?"#e0e0f0":"#1c1c1e"}}>Nearby</span>
              <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:dm?"#6a6a8a":"#a0a0a8"}}>Distance</span>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {NEARBY_DEMO.map((h,i)=>(
                <div key={i} onClick={()=>setSelectedHitchhiker(h)}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",
                    borderTop:dm?"0.5px solid #3a3a54":"0.5px solid #f0f0f4",
                    background:dm?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",
                    cursor:"pointer",transition:"background 0.15s"
                  }}>
                  <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",flexShrink:0,
                    boxShadow:"0 1px 4px rgba(0,0,0,0.18)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    background:h.avatarType==='initial'?h.color:(dm?"#2a2a3a":"#e8e8ec")
                  }}>
                    {h.avatarType==='emoji' && <span style={{fontSize:26}}>{h.avatar}</span>}
                    {h.avatarType==='initial' && <span style={{color:"#fff",fontSize:20,fontWeight:700}}>{h.initial}</span>}
                    {h.avatarType==='photo' && <img src={h.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>}
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                    <div style={{
                      display:"inline-block",flexShrink:0,
                      background:"#f5f0e8",border:"2px solid #2a2a2a",borderRadius:6,
                      padding:"3px 10px",fontFamily:"'Courier New',monospace",
                      fontSize:16,fontWeight:700,letterSpacing:"0.1em",color:"#1a1a1a",
                      boxShadow:"1px 2px 0 rgba(0,0,0,0.15)"
                    }}>{h.plate}</div>
                    <div style={{flex:1,overflow:"hidden",display:"flex",alignItems:"center",paddingBottom:2}}>
                      <div style={{
                        flex:1,borderBottom:`2px dotted ${dm?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.18)"}`,
                        boxShadow:dm?"none":"0 1px 0 rgba(255,255,255,0.7)",
                        height:1,marginTop:2
                      }}/>
                    </div>
                    <div style={{flexShrink:0,fontSize:12,fontWeight:600,fontFamily:"'Courier New',monospace",
                      color:dm?"#8888aa":"#6a6a7a",letterSpacing:"0.02em"
                    }}>{h.dist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedHitchhiker && (
        <div style={{position:"absolute",inset:0,zIndex:20,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div onClick={()=>setSelectedHitchhiker(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3512)",backdropFilter:"blur(5px)",WebkitBackdropFilter:"blur(5px)"}}/>
          <div style={{position:"relative",zIndex:1,background:dm?"#22223a":bg,borderRadius:"22px 22px 0 0",boxShadow:"0 -6px 32px rgba(0,0,0,0.15)",padding:"14px 20px 20px",paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))"}}
            onTouchStart={e=>{ e.currentTarget._sw=e.touches[0].clientY; }}
            onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._sw > 60) setSelectedHitchhiker(null); }}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <div style={{width:38,height:4,borderRadius:2,background:"#a0a0a8"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.18)",display:"flex",alignItems:"center",justifyContent:"center",background:selectedHitchhiker.avatarType==='initial'?selectedHitchhiker.color:(dm?"#2a2a3a":"#e8e8ec")}}>
                {selectedHitchhiker.avatarType==='emoji' && <span style={{fontSize:26}}>{selectedHitchhiker.avatar}</span>}
                {selectedHitchhiker.avatarType==='initial' && <span style={{color:"#fff",fontSize:20,fontWeight:700}}>{selectedHitchhiker.initial}</span>}
                {selectedHitchhiker.avatarType==='photo' && <img src={selectedHitchhiker.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>}
              </div>
              <div style={{display:"inline-block",background:"#f5f0e8",border:"2px solid #2a2a2a",borderRadius:6,padding:"3px 10px",fontFamily:"'Courier New',monospace",fontSize:16,fontWeight:700,letterSpacing:"0.1em",color:"#1a1a1a",boxShadow:"1px 2px 0 rgba(0,0,0,0.15)"}}>{selectedHitchhiker.plate}</div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>{ setSelectedHitchhiker(null); onHonk&&onHonk(selectedHitchhiker); }}
                className="btn3d" style={{flex:1,padding:"14px 0",borderRadius:12,border:"1px solid #b8d4b8",background:"#c8dac8",fontSize:16,cursor:"pointer",color:"#3a8a3a",fontWeight:700}}><span style={{filter:"hue-rotate(80deg) saturate(2.2) brightness(0.88)"}}>📣</span> Honk</button>
              <button onClick={()=>{ setSelectedHitchhiker(null); onCode&&onCode(); }}
                className="btn3d" style={{flex:1,padding:"14px 0",borderRadius:12,border:"1px solid #f0d080",background:"#e8dfc8",fontSize:16,cursor:"pointer",color:"#b08020",fontWeight:700}}>🔢 Code</button>
            </div>
          </div>
        </div>
      )}
      {showPlateEditor && <PlateEditor plate={displayPlate} dm={dm} bg={bg} onSave={p=>{setDemoPlate(p);setShowPlateEditor(false);}} onClose={()=>setShowPlateEditor(false)}/>}
    </div>
  );
}

/* ─── ghost cleanup ─────────────────────────────────────── */
if(typeof window!=="undefined"){
  const nukeGhosts=()=>{ document.querySelectorAll('[data-listghost]').forEach(g=>g.remove()); };
  window.addEventListener('pointerup', nukeGhosts, {passive:true, capture:true});
  window.addEventListener('pointercancel', nukeGhosts, {passive:true, capture:true});
  window.addEventListener('touchend', nukeGhosts, {passive:true, capture:true});
  window.addEventListener('touchcancel', nukeGhosts, {passive:true, capture:true});
}

/* ─── DraggablePersonRow ────────────────────────────────── */
function DraggablePersonRow({person,color,shape,onMoveToVan,onAvatarTap,onChatTap,inVan,clickDisabled=false,isBooted=false,pillActive=false,seatBg="#b8bdc3"}){
  const dm=useDM();
  const startXY = useRef(null);
  const ghost   = useRef(null);
  const moved   = useRef(false);
  const tmRef   = useRef(null);
  const justDragged = useRef(false);

  const makeGhost = (x,y) => {
    const g = document.createElement('div');
    g.setAttribute('data-listghost','1');
    g.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;width:48px;height:48px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 18px rgba(0,0,0,0.32));'+`left:${x-24}px;top:${y-24}px;`;
    const inner = document.createElement('div');
    inner.style.cssText = 'width:42px;height:42px;border-radius:50%;'+`background:${color};`+'display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700;';
    inner.textContent = person.initial;
    g.appendChild(inner); document.documentElement.appendChild(g); ghost.current = g;
  };
  const moveGhost = (x,y) => { if(ghost.current){ ghost.current.style.left=(x-24)+'px'; ghost.current.style.top=(y-24)+'px'; } };
  const killGhost = () => { if(ghost.current){ ghost.current.remove(); ghost.current=null; } };

  const isDragRef = useRef(false);
  const isScrollingRef = useRef(false);
  const onTouchStart = e => {
    if(inVan) return;
    const t = e.touches[0]; startXY.current = {x:t.clientX, y:t.clientY}; moved.current = false; isDragRef.current = false; isScrollingRef.current = false;
  };
  const onTouchMove = e => {
    if(!startXY.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startXY.current.x, dy = t.clientY - startXY.current.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if(!isDragRef.current && !isScrollingRef.current && dist > 6) {
      if(Math.abs(dy) >= Math.abs(dx)){ isScrollingRef.current = true; return; }
    }
    if(isScrollingRef.current) return;
    if(!isDragRef.current && dist > 14 && Math.abs(dx) > Math.abs(dy)){ isDragRef.current = true; moved.current = true; makeGhost(t.clientX, t.clientY); }
    if(isDragRef.current){ try{ e.preventDefault(); }catch(_){} moveGhost(t.clientX, t.clientY); }
  };
  tmRef.current = onTouchMove;

  const onTouchEnd = e => {
    const wasDrag = isDragRef.current;
    const endX = e.changedTouches[0]?.clientX;
    const startX = startXY.current?.x;
    killGhost(); moved.current = false; isDragRef.current = false; isScrollingRef.current = false; startXY.current = null;
    if(wasDrag && endX != null && startX != null && endX < startX){ justDragged.current = true; setTimeout(()=>{ justDragged.current=false; }, 300); onMoveToVan(person); }
  };

  const onMouseDown = e => {
    if(inVan || e.button !== 0) return;
    startXY.current = {x:e.clientX, y:e.clientY}; moved.current = false;
    const onMM = ev => {
      const dx=ev.clientX-startXY.current.x, dy=ev.clientY-startXY.current.y;
      if(!moved.current && Math.sqrt(dx*dx+dy*dy)>10){ moved.current=true; makeGhost(ev.clientX,ev.clientY); }
      if(moved.current) moveGhost(ev.clientX,ev.clientY);
    };
    const onMU = () => {
      window.removeEventListener('mousemove',onMM); window.removeEventListener('mouseup',onMU);
      const was=moved.current; killGhost(); moved.current=false; startXY.current=null;
      if(was) onMoveToVan(person);
    };
    window.addEventListener('mousemove',onMM); window.addEventListener('mouseup',onMU);
  };

  const onClick = e => {
    if(moved.current || justDragged.current) return;
    if(inVan){ if(onAvatarTap) onAvatarTap(person); return; }
    if(clickDisabled) return;
    if(shape==="circle") return;
    onMoveToVan(person);
  };

  const divRef = useCallback(node => {
    if(!node) return;
    const fn = e => tmRef.current(e);
    node.addEventListener('touchmove', fn, {passive:false});
  }, []);

  return(
    <div ref={divRef} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:dm?"0.5px solid rgba(255,255,255,0.07)":"0.5px solid rgba(0,0,0,0.06)",cursor:inVan?"default":"pointer",userSelect:"none",WebkitUserSelect:"none"}}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} onMouseDown={onMouseDown} onClick={onClick}>
      {shape==="oct"
        ? <div onTouchEnd={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();if(onAvatarTap)onAvatarTap(person);}} style={{cursor:"pointer",flexShrink:0}}>
            <OctAvatar initial={person.initial} color={isBooted?"rgba(180,50,50,0.35)":color} size={36} seatBg={seatBg}/>
          </div>
        : <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:inVan?"rgba(170,208,240,0.15)":color,border:inVan?"1.5px solid #aad0f0":"none",display:"flex",alignItems:"center",justifyContent:"center",color:inVan?"#8ab8e8":"#fff",fontSize:14,fontWeight:600,filter:inVan?"none":"none",position:"relative",overflow:"hidden"}}>
            {person.initial}
            {/* Dark base overlay to deepen color without affecting gloss */}
            {!inVan && <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,0.28)",pointerEvents:"none",zIndex:0}}/>}
            {/* Main gloss blob */}
            <div style={{position:"absolute",top:-3,left:"3%",right:"3%",height:"58%",borderRadius:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.82) 0%,rgba(255,255,255,0.08) 100%)",pointerEvents:"none",zIndex:1}}/>
            {/* Secondary tight gloss */}
            <div style={{position:"absolute",top:2,left:"18%",width:"38%",height:"28%",borderRadius:"50%",background:"rgba(255,255,255,0.42)",pointerEvents:"none",zIndex:1}}/>
            {/* Bottom refraction */}
            <div style={{position:"absolute",bottom:-2,left:"8%",right:"8%",height:"38%",borderRadius:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.45) 100%)",pointerEvents:"none",zIndex:1}}/>
            {/* Edge ring */}
            <div style={{position:"absolute",inset:0,borderRadius:"50%",boxShadow:"inset 0 0 0 2px rgba(255,255,255,0.6), inset 0 2px 5px rgba(255,255,255,0.45)",pointerEvents:"none",zIndex:1}}/>
          </div>
      }
      <span style={{fontSize:13,color:isBooted?"rgba(160,50,50,0.85)":inVan?(dm?"#5a5a7a":"#8a8e9a"):(dm?"#d0d0e8":"#1c1c1e"),fontWeight:400,textShadow:inVan&&!isBooted?(dm?"1px 1px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,255,255,0.06)":"1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.12)"):"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{person.name}</span>
      {(inVan||isBooted) && (
        isBooted
          ? <svg width="14" height="16" viewBox="0 0 64 64" fill="none" style={{flexShrink:0,opacity:0.7}}>
              <path d="M13 6 Q13 4 17 4 L31 4 Q35 4 35 8 L35 40 L13 40 Z" fill="rgba(180,50,50,0.7)"/>
              <path d="M13 38 L13 44 Q13 54 20 56 L50 56 Q60 56 60 49 Q60 43 52 42 L35 41 L35 38 Z" fill="rgba(180,50,50,0.7)"/>
              <rect x="11" y="42" width="9" height="14" rx="3" fill="rgba(150,35,35,0.8)"/>
            </svg>
          : shape==="oct"
          ? <span style={{fontSize:11,color:"#8ab8e8",fontWeight:500,border:"1.5px solid #aad0f0",borderRadius:20,padding:"2px 9px",whiteSpace:"nowrap",background:"rgba(170,208,240,0.15)"}}>In van</span>
          : <svg width="22" height="14" viewBox="0 0 22 14" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,transform:"scaleX(-1)",marginLeft:-10}}>
              <rect x="1" y="4" width="20" height="8" rx="2" fill="#aad0f0"/>
              <rect x="2" y="1" width="12" height="5" rx="1.5" fill="#8ab8e8"/>
              <rect x="1.5" y="3" width="7" height="3.5" rx="1" fill="rgba(220,238,252,0.9)"/>
              <circle cx="5" cy="12.2" r="1.8" fill="#7aaac8"/>
              <circle cx="16" cy="12.2" r="1.8" fill="#7aaac8"/>
            </svg>
      )}
    </div>
  );
}

/* ─── FriendsTab ─────────────────────────────────────────── */
function FriendsTab({friends,rideOrDies,friendOverrides,onMoveToVan,onAvatarTap,onChatTap,seats,trunkOccupants,bootedIds,bgColor="#c8cfd3",pillActive=false}){
  const dm=useDM();
  const inVanIds = new Set([...Object.values(seats||{}).filter(Boolean).map(p=>p.id),...Object.values(trunkOccupants||{}).filter(Boolean).map(p=>p.id)]);
  const trunkIds = new Set(Object.values(trunkOccupants||{}).filter(Boolean).map(p=>p.id));
  const rideOrDieIds = new Set((rideOrDies||[]).map(p=>p.id));
  // Upper list: exclude trunk occupants (they show in ride or dies section) and ride or dies
  const upperFriends = friends.filter(p=>!trunkIds.has(p.id)&&!rideOrDieIds.has(p.id));
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",minHeight:0,scrollbarWidth:"none",msOverflowStyle:"none"}}>
        {upperFriends.length===0 ? null :
          [...upperFriends].sort((a,b)=>(bootedIds&&bootedIds.has(a.id)?1:0)-(bootedIds&&bootedIds.has(b.id)?1:0)).map(p=>{
            const ov=friendOverrides[p.id]||{}; const merged={...p,...ov};
            return <DraggablePersonRow key={p.id} person={merged} color={merged.friendColor||getFriendColor(p.id)} shape="oct" onMoveToVan={onMoveToVan} onAvatarTap={onAvatarTap} onChatTap={onChatTap} inVan={inVanIds.has(p.id)} clickDisabled={true} isBooted={bootedIds&&bootedIds.has(p.id)} pillActive={pillActive}/>;
          })
        }
      </div>
      <div style={{flexShrink:0,background:dm?"linear-gradient(90deg,#2e2848 0%,#1a1a2e 100%)":"linear-gradient(90deg,#e8ddb8 0%,#d8dce1 100%)",boxShadow:dm?"inset 0 2px 0 rgba(160,160,170,0.08), 0 -6px 24px rgba(0,0,0,0.2760)":"inset 0 2px 0 rgba(120,120,130,0.12), 0 -6px 24px rgba(180,145,35,0.09)",position:"relative",zIndex:1,paddingBottom:"calc(62px + env(safe-area-inset-bottom, 0px))"}}>
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:28,pointerEvents:"none",zIndex:2,background:dm?"linear-gradient(to right,transparent,#1a1a2e)":`linear-gradient(to right,transparent,${bgColor})`}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"1.5px",background:dm?"linear-gradient(90deg,rgba(160,160,175,0.45) 0%,rgba(160,160,175,0.08) 100%)":"linear-gradient(90deg,rgba(120,120,132,0.40) 0%,rgba(120,120,132,0.04) 100%)"}}/>
        {(rideOrDies||[]).length > 0 && (<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"13px 14px 5px"}}>
            <span style={{fontSize:13,letterSpacing:"0.04em",color:dm?"#f0dc8a":"transparent",background:dm?"none":"linear-gradient(90deg,#b8840a,#d4a820,#9a6e06,#d4a820,#b8840a)",WebkitBackgroundClip:dm?"unset":"text",WebkitTextFillColor:dm?"#f0dc8a":"transparent",backgroundClip:dm?"unset":"text",fontWeight:800,fontFamily:"'Nunito',sans-serif",textShadow:dm?"0 0 12px rgba(240,210,80,0.9), 0 0 24px rgba(240,190,50,0.6)":"none",textTransform:"uppercase"}}>♛ My Ride or Dies ♛</span>
          </div>
          <div style={{height:1,margin:"0 14px 4px",background:dm?"linear-gradient(90deg,rgba(180,180,190,0.35) 0%,rgba(180,180,190,0.04) 100%)":"linear-gradient(90deg,rgba(140,140,148,0.30) 0%,rgba(140,140,148,0.03) 100%)"}}/>
          {rideOrDies.filter(p=>!(bootedIds&&bootedIds.has(p.id))).map(p=>{
            const ov=friendOverrides[p.id]||{}; const merged={...p,...ov};
            const rodColor = merged.friendColor||getFriendColor(p.id);
            const isInTrunk = Object.values(trunkOccupants||{}).some(o=>o&&o.id===p.id);
            return (
              <div key={p.id} style={{position:"relative"}} onClick={e=>{ if(inVanIds.has(p.id)&&onChatTap){e.stopPropagation();onChatTap(merged);} }}>
                {isInTrunk && <div style={{position:"absolute",left:0,top:4,bottom:4,width:3,borderRadius:"0 2px 2px 0",background:dm?"linear-gradient(180deg,#f0d870,#d4a830)":"linear-gradient(180deg,#e8c040,#c09010)"}}/>}
                <DraggablePersonRow person={merged} color={rodColor} shape="oct" onMoveToVan={onMoveToVan} onAvatarTap={onAvatarTap} inVan={inVanIds.has(p.id)} clickDisabled={true} isBooted={bootedIds&&bootedIds.has(p.id)} seatBg={dm?"#231e33":"#f0e6cc"}/>
              </div>
            );
          })}
        </>)}
      </div>
    </div>
  );
}

/* ─── ContactsTab ────────────────────────────────────────── */
function ContactsTab({onMoveToVan,seats,trunkOccupants,pillActive=false}){
  const inVanIds = new Set([...Object.values(seats||{}).filter(Boolean).map(p=>p.id),...Object.values(trunkOccupants||{}).filter(Boolean).map(p=>p.id)]);
  const grouped=MOCK_CONTACTS.reduce((a,p)=>{const l=p.name[0];if(!a[l])a[l]=[];a[l].push(p);return a;},{});
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",minHeight:0,scrollbarWidth:"none",msOverflowStyle:"none"}}>
        <div style={{paddingTop:4,paddingBottom:72}}>
      {Object.entries(grouped).map(([l,ppl])=>(
        <div key={l}>
          <p style={{fontSize:10,color:"#aeaeb2",letterSpacing:"0.07em",textTransform:"uppercase",padding:"5px 14px 2px",margin:0,fontWeight:600}}>{l}</p>
          {ppl.map(p=><DraggablePersonRow key={p.id} person={p} color={getSeatColor(p.name)} shape="circle" onMoveToVan={onMoveToVan} inVan={inVanIds.has(p.id)} clickDisabled={true} pillActive={pillActive}/>)}
        </div>
      ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TabBar ─────────────────────────────────────────────── */
function TabBar({active,onChange}){
  const dm=useDM();
  const tabs=[{id:"friends",label:"Friends"},{id:"van",label:"Van"},{id:"contacts",label:"Contacts"}];
  const idx = tabs.findIndex(t=>t.id===active);
  const trackRef = useRef(null);
  const dragRef = useRef({dragging:false,startX:0,startIdx:0});

  const onDragStart = (clientX) => {
    dragRef.current = {dragging:true, startX:clientX, startIdx:idx};
  };
  const onDragEnd = (clientX) => {
    if(!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const dx = clientX - dragRef.current.startX;
    const trackW = trackRef.current?.offsetWidth || 300;
    const threshold = trackW * 0.15;
    if(dx < -threshold) onChange(tabs[Math.max(0, dragRef.current.startIdx - 1)].id);
    else if(dx > threshold) onChange(tabs[Math.min(2, dragRef.current.startIdx + 1)].id);
  };

  return(
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:dm?"#1e1e30":"#c8cfd3",border:`1px solid ${dm?"#3a3a54":"#c8cfd3"}`,borderBottom:"none",borderRadius:"14px 14px 0 0",padding:"6px 14px 6px",zIndex:100,transition:"background 0.3s"}}>
      <div ref={trackRef}
        onMouseDown={e=>onDragStart(e.clientX)}
        onMouseUp={e=>onDragEnd(e.clientX)}
        onMouseLeave={e=>{ if(dragRef.current.dragging) onDragEnd(e.clientX); }}
        onTouchStart={e=>onDragStart(e.touches[0].clientX)}
        onTouchEnd={e=>onDragEnd(e.changedTouches[0].clientX)}
        style={{background:dm?"#16162a":"#c8ccd2",borderRadius:12,padding:3,display:"flex",position:"relative",boxShadow:dm?"inset 0 3px 8px rgba(0,0,0,0.7), inset 0 1px 3px rgba(0,0,0,0.5), inset 3px 0 6px rgba(0,0,0,0.2)":"inset 0 3px 8px rgba(0,0,0,0.28), inset 0 1px 3px rgba(0,0,0,0.18), inset 0 -1px 0 rgba(255,255,255,0.6)",cursor:"grab"}}>
        <div style={{position:"absolute",top:3,left:3,width:`calc((100% - 6px) / 3)`,height:"calc(100% - 6px)",borderRadius:9,
          background:dm
            ?"linear-gradient(160deg, rgba(120,120,180,0.9) 0%, rgba(60,60,120,0.95) 45%, rgba(40,40,100,0.85) 100%)"
            :"linear-gradient(175deg, rgba(255,255,255,0.95) 0%, rgba(225,232,248,0.78) 40%, rgba(200,212,238,0.62) 60%, rgba(220,228,245,0.88) 100%)",
          boxShadow:dm
            ?"0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3)"
            :"0 3px 10px rgba(80,90,110,0.22), 0 1px 3px rgba(80,90,110,0.12), inset 0 1px 0 rgba(255,255,255,1), inset 0 -2px 3px rgba(160,170,185,0.35), inset -1px 0 2px rgba(200,205,215,0.4)",
          transform:`translateX(${idx * 100}%)`,
          transition:"transform 0.056s ease",
          pointerEvents:"none",
          overflow:"hidden"
        }}>
          {/* main gloss streak top */}
          <div style={{position:"absolute",top:1,left:"10%",right:"10%",height:"45%",borderRadius:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.88) 0%,rgba(255,255,255,0.0) 100%)",pointerEvents:"none"}}/>
          {/* bottom refraction shimmer */}
          <div style={{position:"absolute",bottom:1,left:"20%",right:"20%",height:"20%",borderRadius:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.35) 100%)",pointerEvents:"none"}}/>
        </div>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"6px 0",border:"none",cursor:"pointer",borderRadius:9,fontSize:12,fontWeight:active===t.id?700:500,
            background:"transparent",
            boxShadow:"none",
            color:active===t.id?(dm?"#eeeeff":"#4a4a58"):(dm?"#5a5a7a":"#8a8e9a"),
            transition:"color 0.18s ease, font-weight 0.18s ease",position:"relative",zIndex:1,
            textShadow:active===t.id
              ? dm
                ? "0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.9)"
                : "0 -1px 0 rgba(255,255,255,1), 0 1px 0 rgba(0,0,0,0.3512), 0 2px 6px rgba(0,0,0,0.18), 0 -2px 0 rgba(255,255,255,0.9)"
              : dm
                ? "0 1px 2px rgba(0,0,0,0.5)"
                : "1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.12)",
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────── */
/* ─── NumberOverlay ─────────────────────────────────────────── */
function NumberOverlay({num, dims, onSwipe}){
  const [localDims, setLocalDims] = React.useState(dims||{w:getVW(), h:getVH()});
  React.useEffect(()=>{
    const fn = () => { setTimeout(()=>{ setLocalDims({w:getVW(), h:getVH()}); }, 80); };
    window.addEventListener('resize', fn);
    window.addEventListener('orientationchange', fn);
    return ()=>{ window.removeEventListener('resize', fn); window.removeEventListener('orientationchange', fn); };
  },[]);
  const fs = Math.floor(Math.min(localDims.w * 0.85, localDims.h * 0.82));
  const shadow = "0 2px 0 #b8860b, 0 4px 0 #a07808, 0 6px 0 #8a6606, 0 8px 0 #745404, 0 10px 0 #5e4202, 0 12px 0 #483000, 0 14px 20px rgba(0,0,0,0.6), 0 20px 40px rgba(0,0,0,0.4)";
  return (
    <div
      onTouchStart={e=>{ e.currentTarget._sx=e.touches[0].clientX; e.currentTarget._sy=e.touches[0].clientY; }}
      onTouchEnd={e=>{
        const dx=Math.abs(e.changedTouches[0].clientX - e.currentTarget._sx);
        const dy=Math.abs(e.changedTouches[0].clientY - e.currentTarget._sy);
        if(dx>30||dy>30) onSwipe();
      }}
      style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:10000,background:"#FFD600",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{
        fontSize:fs,
        fontWeight:800,
        fontFamily:"'Nunito',sans-serif",
        lineHeight:1,
        color:"#1a1a1a",
        WebkitTextStroke:"3px rgba(255,255,255,0.9)",
        textShadow:shadow,
        userSelect:"none"
      }}>{num}</div>
      {(num===6||num===9) && <div style={{width:fs*0.44,height:Math.max(4,fs*0.03),background:"#1a1a1a",borderRadius:4,marginTop:fs*0.04,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}}/>}
      </div>
    </div>
  );
}

/* ─── BigTitleOverlay ────────────────────────────────────── */
function BigTitleOverlay({bg, onClose, showNumber, setShowNumber, randomNum, setRandomNum}){
  const [dims, setDims] = React.useState({w:getVW(), h:getVH()});
  React.useEffect(()=>{
    const fn = () => { setTimeout(()=>{ setDims({w:getVW(), h:getVH()}); }, 80); };
    window.addEventListener('resize', fn);
    window.addEventListener('orientationchange', fn);
    return ()=>{ window.removeEventListener('resize', fn); window.removeEventListener('orientationchange', fn); };
  },[]);
  const isLandscape = dims.w > dims.h;
  const dm = useDM();
  const shadow = dm
    ? "0 1px 0 #000, 0 2px 0 #000, 0 3px 0 #0a0a18, 0 4px 0 #0e0e20, 0 5px 0 #121228, 0 6px 0 #161630, 0 7px 0 #1a1a38, 0 8px 0 #1e1e40, 0 9px 12px rgba(0,0,0,0.8), 0 12px 20px rgba(0,0,0,0.6)"
    : "0 1px 0 #888, 0 2px 0 #7a7a7a, 0 3px 0 #6e6e6e, 0 4px 0 #626262, 0 5px 0 #565656, 0 6px 0 #4a4a4a, 0 7px 0 #3e3e3e, 0 8px 0 #323232, 0 9px 12px rgba(0,0,0,0.5), 0 12px 20px rgba(0,0,0,0.35)";
  const base = {fontWeight:800, fontFamily:"'Nunito',sans-serif", lineHeight:1, textAlign:"center", color:dm?"#e8e8f0":"#2a2a2a", textShadow:shadow};

  const lastTap = React.useRef(0);

  const swipeHandlers = {
    onTouchStart: e => { e.currentTarget._sx=e.touches[0].clientX; e.currentTarget._sy=e.touches[0].clientY; },
    onTouchEnd: e => {
      const dx=Math.abs(e.changedTouches[0].clientX - e.currentTarget._sx);
      const dy=Math.abs(e.changedTouches[0].clientY - e.currentTarget._sy);
      if(dx>30||dy>30){ onClose(); return; }
      // double tap detection
      const now = Date.now();
      if(now - lastTap.current < 350){
        setRandomNum(Math.floor(Math.random()*10));
        setShowNumber(true);
      }
      lastTap.current = now;
    }
  };

  if(showNumber){
    return <NumberOverlay num={randomNum} dims={dims} onSwipe={()=>setShowNumber(false)}/>;
  }

  if(isLandscape){
    const fsByH = Math.floor((dims.h - 60) / 2);
    const fsByW = Math.floor(dims.w / (8 * 0.58));
    const fs = Math.min(fsByH, fsByW);
    return (
      <div {...swipeHandlers} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,background:bg,display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"space-evenly",cursor:"pointer",padding:"20px 0"}}>
        <div style={{...base, fontSize:fs}}>Who's in</div>
        <div style={{...base, fontSize:fs}}>Your Van<span style={{display:"inline-block",width:"0.06em"}}/><em>?</em></div>
      </div>
    );
  }

  const fsByW = Math.floor(dims.w / (5 * 0.62));
  const fsByH = Math.floor((dims.h - 80) / 4);
  const fs = Math.min(fsByW, fsByH);
  return (
    <div {...swipeHandlers} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,background:bg,display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"space-evenly",cursor:"pointer",padding:"40px 0"}}>
      <div style={{...base, fontSize:fs}}>Who's</div>
      <div style={{...base, fontSize:fs}}>in</div>
      <div style={{...base, fontSize:fs, fontStyle:"italic"}}>Your</div>
      <div style={{...base, fontSize:fs}}>Van<span style={{display:"inline-block",width:"0.06em"}}/><em>?</em></div>
    </div>
  );
}

const getVW=()=>(window.visualViewport?.width||getVW());
const getVH=()=>(window.visualViewport?.height||getVH());
export default function App(){
  useEffect(()=>{
    // Ensure correct viewport for iOS
    let meta = document.querySelector('meta[name="viewport"]');
    if(!meta){ meta=document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
    meta.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    // Prevent iOS overscroll bounce
    document.body.style.overscrollBehavior='none';
    document.documentElement.style.overscrollBehavior='none';
  },[]);
  const[tab,setTab]=useState("van");
  const vanDraggingRef = useRef(false);
  const[seats,setSeats]=useState(INITIAL_SEATS);
  const[trunkOccupants,setTrunkOccupants]=useState(INITIAL_TRUNK);
  const[friends,setFriends]=useState([]);
  const[rideOrDies,setRideOrDies]=useState([]);
  const[picking,setPicking]=useState(null);
  const[pickingTrunk,setPickingTrunk]=useState(null);
  const[friendOverrides,setFriendOverrides]=useState({});
  const[avatarEdit,setAvatarEdit]=useState(null);
  const[emojiTarget,setEmojiTarget]=useState(null);
  const[emojiPerson,setEmojiPerson]=useState(null);
  const[bootedIds,setBootedIds]=useState(new Set());
  const[incomingPerson,setIncomingPerson]=useState(null);
  const[expelMode,setExpelMode]=useState(false);
  const[expelFocus,setExpelFocus]=useState(null);
  const[kickPending,setKickPending]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[showBigTitle,setShowBigTitle]=useState(false);
  const[showNumber,setShowNumber]=useState(false);
  const[randomNum,setRandomNum]=useState(0);
  const[emojiFromHitchhiker,setEmojiFromHitchhiker]=useState(false);
  const[showPaintShop,setShowPaintShop]=useState(false);
  const[paintColors,setPaintColors]=useState({van:'#ecedf0',seats:'#e4e4e8',background:'#c8cfd3',friends:'#b8bdc3',contacts:'#b8bdc3'});
  const[settings,setSettings]=useState({lights:false,invisible:false,notifyReceive:true,notifySend:false});

  const findNextSeat=useCallback((s)=>{
    let lastIdx=-1;
    SEAT_IDS.forEach((id,i)=>{if(s[id])lastIdx=i;});
    for(let i=lastIdx+1;i<SEAT_IDS.length;i++){if(!s[SEAT_IDS[i]])return SEAT_IDS[i];}
    for(let i=0;i<=lastIdx;i++){if(!s[SEAT_IDS[i]])return SEAT_IDS[i];}
    return null;
  },[]);

  const isFull=s=>SEAT_IDS.every(id=>s[id]);
  const trunkRef = useRef(trunkOccupants);
  trunkRef.current = trunkOccupants;

  const addToFriendsRef = useRef(null);
  addToFriendsRef.current = (person) => {
    setFriends(cur => { if(cur.some(f=>f.id===person.id)) return cur; return [...cur, {id:person.id,name:person.name,initial:person.initial,friendColor:person.friendColor||getFriendColor(person.id)}]; });
  };
  const addToFriends = (p) => addToFriendsRef.current(p);

  const addToRideOrDiesRef = useRef(null);
  addToRideOrDiesRef.current = (person) => {
    setRideOrDies(cur => { if(cur.some(r=>r.id===person.id)) return cur; return [...cur, {id:person.id,name:person.name,initial:person.initial,friendColor:person.friendColor||getFriendColor(person.id)}]; });
  };
  const addToRideOrDies = (p) => addToRideOrDiesRef.current(p);

  const moveToVan=useCallback((person)=>{
    const ov=friendOverrides[person.id]||{};
    const p={...person,...ov,friendColor:ov.friendColor||person.friendColor||getFriendColor(person.id)};
    setSeats(cur=>{
      const alreadySeated = Object.values(cur).some(s=>s&&s.id===person.id);
      const alreadyTrunked = Object.values(trunkRef.current).some(s=>s&&s.id===person.id);
      if(alreadySeated||alreadyTrunked) return cur;
      if(isFull(cur)){setIncomingPerson(p);setExpelMode(true);setExpelFocus(null);setTab("van");return cur;}
      const seat=findNextSeat(cur);
      if(seat){ setTab("van"); addToFriends(p); setRideOrDies(cur=>cur.filter(r=>r.id!==person.id)); setBootedIds(s=>{const n=new Set(s);n.delete(person.id);return n;}); return{...cur,[seat]:p}; }
      return cur;
    });
  },[findNextSeat,addToFriends,friendOverrides]);

  const findNextTrunkSlot = useCallback((trunk) => { return TRUNK_IDS.find(id => !trunk[id]) || null; }, []);

  const handleSwapSeats=useCallback((srcId,dstId)=>{
    const srcT=srcId.startsWith("__trunk__"), dstT=dstId.startsWith("__trunk__");
    const rSrc=srcT?srcId.replace("__trunk__",""):srcId;
    const rDst=dstT?dstId.replace("__trunk__",""):dstId;
    if(!srcT&&!dstT){ setSeats(s=>{const n={...s};const t=n[rSrc];n[rSrc]=n[rDst];n[rDst]=t;return n;}); }
    else if(srcT&&dstT){ setTrunkOccupants(s=>{const n={...s};const t=n[rSrc];n[rSrc]=n[rDst];n[rDst]=t;return n;}); }
    else if(!srcT&&dstT){
      const movingPerson = seats[rSrc];
      if(!movingPerson) return;
      const targetSlot = (rDst === "__empty__" || trunkOccupants[rDst]) ? findNextTrunkSlot(trunkOccupants) : rDst;
      if(!targetSlot) return;
      addToRideOrDies(movingPerson);
      setSeats(s=>({...s,[rSrc]:null}));
      setTrunkOccupants(cur=>({...cur,[targetSlot]:movingPerson}));
    } else { const moving=trunkOccupants[rSrc]; setTrunkOccupants(t=>({...t,[rSrc]:null})); setSeats(s=>({...s,[rDst]:moving})); setRideOrDies(cur=>cur.filter(r=>r.id!==moving?.id)); }
  },[seats,trunkOccupants,findNextTrunkSlot]);

  const handleSwapTrunk=useCallback((srcId,dstId)=>{ setTrunkOccupants(s=>{const n={...s};const t=n[srcId];n[srcId]=n[dstId];n[dstId]=t;return n;}); },[]);

  const handleSeatTap=useCallback((id)=>{
    if(expelMode){
      if(!seats[id])return;
      if(expelFocus===id){ setSeats(s=>({...s,[id]:incomingPerson})); setIncomingPerson(null);setExpelMode(false);setExpelFocus(null); }
      else { setExpelFocus(id); }
    } else { if(!seats[id])setPicking(id); }
  },[expelMode,expelFocus,seats,incomingPerson]);

  const handleBgTap=()=>{
    if(expelMode){ if(expelFocus){setExpelFocus(null);}else{setExpelMode(false);setIncomingPerson(null);setExpelFocus(null);} }
  };

  const handleLongPress=useCallback((id)=>{if(seats[id])setEmojiTarget(id);},[seats]);
  const handleOccupiedSeatTap=useCallback((id)=>{if(seats[id])setEmojiTarget(id);},[seats]);
  const handleKickConfirm=useCallback((seatId,person)=>{ setKickPending({seatId,person}); },[]);

  const assign=(id,p)=>{
    setSeats(cur=>{
      const alreadySeated=Object.values(cur).some(s=>s&&s.id===p.id);
      const alreadyTrunked=Object.values(trunkRef.current).some(s=>s&&s.id===p.id);
      if(alreadySeated||alreadyTrunked){setPicking(null);return cur;}
      const ov=friendOverrides[p.id]||{};
      const fp={...p,...ov,friendColor:ov.friendColor||p.friendColor||getFriendColor(p.id)};
      addToFriends(fp); setBootedIds(s=>{const n=new Set(s);n.delete(p.id);return n;});
      return {...cur,[id]:fp};
    });
    setPicking(null);
  };
  const assignTrunk=(slotId,p)=>{
    const alreadySeated=Object.values(seats).some(s=>s&&s.id===p.id);
    const alreadyTrunked=Object.values(trunkOccupants).some(s=>s&&s.id===p.id);
    if(alreadySeated||alreadyTrunked){setPickingTrunk(null);return;}
    const ov=friendOverrides[p.id]||{};
    const fp2={...p,...ov,friendColor:ov.friendColor||p.friendColor||getFriendColor(p.id)};
    addToRideOrDies(fp2);
    setBootedIds(s=>{const n=new Set(s);n.delete(p.id);return n;});
    setTrunkOccupants(t=>({...t,[slotId]:fp2}));
    setPickingTrunk(null);
  };
  const remove=id=>setSeats(s=>({...s,[id]:null}));
  const removeTrunk=slotId=>setTrunkOccupants(s=>({...s,[slotId]:null}));
  const toggleSetting=key=>setSettings(s=>({...s,[key]:!s[key]}));

  const vanPanel = (
    <VanIllustration seats={seats} trunkOccupants={trunkOccupants}
      onTap={handleSeatTap} onLongPress={handleLongPress} onOccupiedTap={handleOccupiedSeatTap}
      expelMode={expelMode} expelFocus={expelFocus} onExpelTap={handleSeatTap}
      incomingPerson={incomingPerson} onSwapSeats={handleSwapSeats} onSwapTrunk={handleSwapTrunk}
      onPickTrunkSlot={slotId=>setPickingTrunk(slotId)} onRemoveTrunk={removeTrunk}
      onKickConfirm={handleKickConfirm}
      onSettings={tab==="van" ? ()=>setShowSettings(true) : undefined}
      onDragStateChange={active=>{ vanDraggingRef.current=active; }}
      paintColors={paintColors}/>
  );

  return(
    <PaintCtx.Provider value={paintColors?.background||"#c8cfd3"}>
    <DM.Provider value={settings.lights}>
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;-webkit-font-smoothing:antialiased;overflow:hidden;width:100%;position:fixed;display:block!important;place-items:unset!important;-webkit-text-size-adjust:100%;touch-action:manipulation;}
        h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit;line-height:inherit;margin:0;padding:0;}
        *:focus{outline:none;}
        button{box-sizing:border-box;font-family:inherit;font-size:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;background-color:transparent;border:none;padding:0;margin:0;text-align:center;display:inline-flex;align-items:center;justify-content:center;border-radius:0;outline:none;color:inherit;}
        @keyframes seatShake{0%,100%{transform:rotate(0deg);}20%{transform:rotate(-2.8deg) scale(1.02);}50%{transform:rotate(2.8deg) scale(1.02);}80%{transform:rotate(-2deg);}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateX(8px);}to{opacity:1;transform:translateX(0);}}
        @keyframes ghostPulse{0%,100%{opacity:0.45;transform:scale(1);}50%{opacity:0.62;transform:scale(1.05);}}
        @keyframes emojiPop{0%{transform:scale(0.3);opacity:0;}70%{transform:scale(1.25);}100%{transform:scale(1);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes popIn{0%{transform:scale(0.7);opacity:0;}100%{transform:scale(1);opacity:1;}}
        .btn3d{position:relative;background:linear-gradient(180deg,#d8d8e2 0%,#b8b8c4 100%);border:1px solid #c8c8d2 !important;box-shadow:0 3px 0 #a8a8b4, 0 4px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.85) !important;transition:box-shadow 0.08s,transform 0.08s,background 0.08s !important;}
        .btn3d::after{content:"";position:absolute;top:0;left:0;right:0;height:52%;background:linear-gradient(180deg,rgba(255,255,255,0.92) 0%,rgba(255,255,255,0.15) 100%);border-radius:inherit;pointer-events:none;z-index:0;}
        .btn3d::before{content:"";position:absolute;bottom:0;left:8%;right:8%;height:30%;background:linear-gradient(180deg,rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.45) 100%);border-radius:inherit;pointer-events:none;z-index:0;}
        .btn3d *{position:relative;z-index:1;}
        .btn3d:active{box-shadow:0 1px 0 #a8a8b4, 0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6) !important;transform:translateY(2px);}
        .btn3d-dark{background:linear-gradient(180deg,#4a4a66 0%,#333350 100%) !important;border:1px solid #252540 !important;box-shadow:0 3px 0 #18182e, 0 4px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10) !important;}
        .btn3d-dark:active{box-shadow:0 1px 0 #18182e, 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06) !important;transform:translateY(2px);}
        .btn3d-primary{background:linear-gradient(180deg,#8a8a94 0%,#6a6a74 100%) !important;border:1px solid #505058 !important;box-shadow:0 3px 0 #404048, 0 4px 8px rgba(0,0,0,0.2760), inset 0 1px 0 rgba(255,255,255,0.18) !important;color:#f0f0f2 !important;}
        .btn3d-primary:active{box-shadow:0 1px 0 #404048, 0 1px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10) !important;transform:translateY(2px);}
        .btn3d-danger{background:linear-gradient(180deg,rgba(200,60,60,0.22) 0%,rgba(160,30,30,0.28) 100%) !important;border:2px solid rgba(180,50,50,0.82) !important;box-shadow:0 3px 0 rgba(120,20,20,0.4), 0 4px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15) !important;}
        .btn3d-danger:active{box-shadow:0 1px 0 rgba(120,20,20,0.35), 0 1px 3px rgba(0,0,0,0.14) !important;transform:translateY(2px);}
        *{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;}
        input,textarea{-webkit-touch-callout:default;}
        body{background:#d8dce1;}
        @media(min-width:500px){
          html,body{position:static;overflow:auto;}
          .phone-shell{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:390px;height:844px;border-radius:50px;overflow:hidden;box-shadow:0 0 0 10px #c8cfd3,0 0 0 13px #a8aaaf,0 40px 80px rgba(0,0,0,0.3512);}
          .phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:126px;height:37px;background:transparent;border-radius:0 0 22px 22px;z-index:9999;pointer-events:none;}
          .modal-root{position:absolute!important;border-radius:50px;overflow:hidden;}
        }
        @media(max-width:499px){
          html{overflow:hidden;max-width:100vw;}
          body{overflow:hidden;max-width:100vw;display:block!important;}
          .phone-shell{width:100vw;height:100%;height:100dvh;border-radius:0;position:fixed;top:0;left:0;right:0;bottom:0;box-shadow:none;overflow:hidden;max-width:100vw;}
          .phone-notch{display:none;}
          .modal-root{position:fixed!important;border-radius:0;}
        }
      `}</style>
      <div style={{height:"100dvh",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",maxWidth:"100vw"}} onClick={handleBgTap}>
        <div className="phone-shell" style={{background:settings.lights?"#1a1a2e":(paintColors?.background||"#c8cfd3"),position:"relative",transition:"background 0.3s"}}>


          <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",paddingTop:"env(safe-area-inset-top, 0px)"}}>
            <div style={{padding:"14px 24px 0",textAlign:"center",flexShrink:0,width:"100%"}}
              onTouchStart={e=>{ e.currentTarget._ty=e.touches[0].clientY; }}
              onTouchEnd={e=>{ if(e.changedTouches[0].clientY - e.currentTarget._ty > 40) setShowBigTitle(true); }}>
              {settings.lights ? (
                <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Nunito',sans-serif",letterSpacing:"-0.01em",margin:0,
                  background:"linear-gradient(90deg, #1e1c2c 0%, #d4c070 10%, #e8d880 16%, #c0aa60 26%, #5a5240 38%, #4a4438 48%, #504838 58%, #b8a458 72%, #e0d070 82%, #d0be68 90%, #1e1c2c 100%)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Who's in<em style={{marginLeft:"0.15em"}}>Your</em><span style={{display:"inline-block",width:"0.06em"}}/> Van<em>?</em></h1>
              ) : (
                <h1 style={{fontSize:22,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:"#3a3a40",letterSpacing:"-0.01em",textShadow:"0 0 20px rgba(50,50,64,0.14)",margin:0}}>Who's in<em style={{marginLeft:"0.15em"}}>Your</em><span style={{display:"inline-block",width:"0.06em"}}/> Van<em>?</em></h1>
              )}
            </div>
            <div style={{flex:1,overflow:"hidden",minHeight:0,position:"relative",touchAction:"pan-y"}}
              onTouchStart={e=>{ const t=e.touches[0]; e.currentTarget._sx=t.clientX; e.currentTarget._sy=t.clientY; e.currentTarget._swiped=false; }}
              onTouchMove={e=>{
                if(e.currentTarget._swiped) return;
                if(vanDraggingRef.current) return;
                const dx=e.touches[0].clientX - e.currentTarget._sx;
                const dy=Math.abs(e.touches[0].clientY - e.currentTarget._sy);
                if(Math.abs(dx) < 8) return;
                if(dy > Math.abs(dx)) return;
                e.currentTarget._swiped=true;
                if(dx < 0){ if(tab==="friends") setTab("van"); else if(tab==="van") setTab("contacts"); }
                else { if(tab==="contacts") setTab("van"); else if(tab==="van") setTab("friends"); }
              }}>
              <div style={{display:"flex",width:"300%",height:"100%",transform:tab==="friends"?"translateX(0%)":tab==="van"?"translateX(-33.333%)":"translateX(-66.666%)",transition:"transform 0.32s cubic-bezier(.4,0,.2,1)"}}>
                {/* Panel 1 — Friends */}
                <div style={{width:"33.333%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden"}}>
                  <div style={{width:"54%",height:"100%",overflow:"hidden",background:settings.lights?"#1e1e30":(paintColors?.friends||"#b8bdc3"),position:"relative"}}>
                    <FriendsTab friends={friends} rideOrDies={rideOrDies} friendOverrides={friendOverrides} onMoveToVan={moveToVan} onAvatarTap={p=>setAvatarEdit({...p,isBooted:bootedIds&&bootedIds.has(p.id)})} onChatTap={p=>{const merged={...p,...(friendOverrides[p.id]||{})};setEmojiPerson(merged);}} seats={seats} trunkOccupants={trunkOccupants} bootedIds={bootedIds} bgColor={settings.lights?"#1a1a2e":(paintColors?.background||"#c8cfd3")} pillActive={tab==="friends"}/>
                    {/* Top fade */}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:28,pointerEvents:"none",background:settings.lights?"linear-gradient(to bottom,#1a1a2e,transparent)":`linear-gradient(to bottom,${paintColors?.background||"#c8cfd3"},transparent)`}}/>
                    {/* Right-edge fade toward main screen */}
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:28,pointerEvents:"none",
                      background:settings.lights
                        ?"linear-gradient(to right,transparent,#1a1a2e)"
                        :`linear-gradient(to right,transparent,${paintColors?.background||"#c8cfd3"})`
                    }}/>
                  </div>
                  <div onClick={()=>setTab("van")} style={{width:"46%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",background:settings.lights?"#1a1a2e":(paintColors?.background||"#c8cfd3"),position:"relative"}}>
                    <div style={{transform:"scale(0.52)",transformOrigin:"center center",pointerEvents:"none",opacity:0.85}}>{vanPanel}</div>
                    <div style={{position:"absolute",inset:0}}/>
                  </div>
                </div>
                {/* Panel 2 — The Van */}
                <div style={{width:"33.333%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",paddingBottom:"calc(62px + env(safe-area-inset-bottom, 0px))"}}>
                  {vanPanel}
                </div>
                {/* Panel 3 — Contacts */}
                <div style={{width:"33.333%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden"}}>
                  <div onClick={()=>setTab("van")} style={{width:"46%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",flexShrink:0,background:settings.lights?"#1a1a2e":(paintColors?.background||"#c8cfd3"),position:"relative"}}>
                    <div style={{transform:"scale(0.52)",transformOrigin:"center center",pointerEvents:"none",opacity:0.85}}>{vanPanel}</div>
                    <div style={{position:"absolute",inset:0}}/>
                  </div>
                  <div style={{flex:1,height:"100%",overflow:"hidden",background:settings.lights?"#1e1e30":(paintColors?.contacts||"#b8bdc3"),position:"relative"}}>
                    {/* Top fade */}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:28,pointerEvents:"none",zIndex:10,background:settings.lights?"linear-gradient(to bottom,#1a1a2e,transparent)":`linear-gradient(to bottom,${paintColors?.background||"#c8cfd3"},transparent)`}}/>
                    {/* Left-edge fade toward main screen */}
                    <div style={{position:"absolute",top:0,left:0,bottom:0,width:28,pointerEvents:"none",zIndex:10,
                      background:settings.lights
                        ?"linear-gradient(to left,transparent,#1a1a2e)"
                        :`linear-gradient(to left,transparent,${paintColors?.background||"#c8cfd3"})`
                    }}/>
                    <ContactsTab onMoveToVan={moveToVan} seats={seats} trunkOccupants={trunkOccupants} pillActive={tab==="contacts"}/>
                  </div>
                </div>
              </div>
            </div>
            {tab==="van"&&expelMode&&(
              <div style={{padding:"6px 20px 4px",flexShrink:0,textAlign:"center",animation:"fadeIn 0.2s"}}>
                <p style={{fontSize:12,color:"#cc2222",fontWeight:700,lineHeight:1.5}}>{expelFocus?"Tap again to confirm · tap elsewhere to go back":"Van is full — tap a seat to replace them"}</p>
              </div>
            )}
          </div>
        </div>
        <TabBar active={tab} onChange={setTab}/>
        <div className="modal-root" style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,pointerEvents:"none",display:(picking||pickingTrunk||avatarEdit||emojiTarget||emojiPerson||showSettings||showPaintShop||kickPending)?"block":"none"}}>
          <div style={{pointerEvents:"auto",position:"absolute",top:0,left:0,right:0,bottom:0}}>
            {picking&&<PickerSheet seatId={picking} friends={friends} seats={seats} trunkOccupants={trunkOccupants} bootedIds={bootedIds} friendOverrides={friendOverrides} onSelect={assign} onClose={()=>setPicking(null)} onOpenFriends={()=>{setPicking(null);setTab("friends");}} onOpenContacts={()=>{setPicking(null);setTab("contacts");}}/>}
            {pickingTrunk&&<PickerSheet seatId={pickingTrunk} friends={friends} seats={seats} trunkOccupants={trunkOccupants} bootedIds={bootedIds} friendOverrides={friendOverrides} onSelect={(slotId,p)=>assignTrunk(slotId,p)} onClose={()=>setPickingTrunk(null)} onOpenFriends={()=>{setPickingTrunk(null);setTab("friends");}} onOpenContacts={()=>{setPickingTrunk(null);setTab("contacts");}}/>}
            {avatarEdit&&(
              <AvatarEditSheet person={avatarEdit} onClose={()=>setAvatarEdit(null)}
                onSave={updated=>{
                  setFriendOverrides(fo=>({...fo,[updated.id]:updated}));
                  setSeats(cur=>{const n={...cur};Object.keys(n).forEach(k=>{if(n[k]&&n[k].id===updated.id)n[k]={...n[k],...updated};});return n;});
                  setTrunkOccupants(cur=>{const n={...cur};Object.keys(n).forEach(k=>{if(n[k]&&n[k].id===updated.id)n[k]={...n[k],...updated};});return n;});
                  setFriends(cur=>cur.map(f=>f.id===updated.id?{...f,...updated}:f));
                  setRideOrDies(cur=>cur.map(r=>r.id===updated.id?{...r,...updated}:r));
                  setAvatarEdit(null);
                }}
                onHonk={p=>{ setAvatarEdit(null); const merged={...p,...(friendOverrides[p.id]||{})}; setEmojiPerson(merged); }}/>
            )}
            {emojiTarget&&<EmojiSheet person={seats[emojiTarget]} onClose={()=>setEmojiTarget(null)}/>}
            {showSettings&&<SettingsSheet settings={settings} onClose={()=>setShowSettings(false)} onToggle={toggleSetting} onOpenPaintShop={()=>{setShowSettings(false);setShowPaintShop(true);}}
              onHonk={h=>{ setEmojiPerson({name:h.plate, initial:h.avatarType==='initial'?h.initial:'?', friendColor:'#8a8a8a'}); setEmojiFromHitchhiker(true); }}
              onCode={()=>{ setRandomNum(Math.floor(Math.random()*10)); setShowNumber(true); }}
            />}
            {emojiPerson&&<EmojiSheet person={emojiPerson} onClose={()=>{ setEmojiPerson(null); if(emojiFromHitchhiker){ setEmojiFromHitchhiker(false); } }}/>}
            {showPaintShop&&<PaintShopSheet colors={paintColors} onClose={()=>setShowPaintShop(false)} onChange={(k,v)=>setPaintColors(p=>({...p,[k]:v}))} onPeekTab={t=>setTab(t)} onPeekEnd={()=>setTab("van")}/>}
            {kickPending&&(
              <KickConfirmBubble person={kickPending.person} fromTrunk={kickPending.seatId.startsWith("__trunk__")}
                onConfirm={()=>{
                  setBootedIds(s=>{const n=new Set(s);n.add(kickPending.person.id);return n;});
                  if(kickPending.seatId.startsWith("__trunk__")){ removeTrunk(kickPending.seatId.replace("__trunk__","")); setRideOrDies(cur=>cur.filter(r=>r.id!==kickPending.person.id)); }
                  else remove(kickPending.seatId);
                  setKickPending(null);
                }}
                onCancel={()=>setKickPending(null)}/>
            )}
          </div>
        </div>
      </div>
      {showBigTitle && (
        <BigTitleOverlay bg={paintColors?.background||"#c8cfd3"} onClose={()=>setShowBigTitle(false)} showNumber={showNumber} setShowNumber={setShowNumber} randomNum={randomNum} setRandomNum={setRandomNum}/>
      )}
      {!showBigTitle && showNumber && (
        <NumberOverlay num={randomNum} dims={{w:getVW(),h:getVH()}} onSwipe={()=>setShowNumber(false)}/>
      )}
    </>
    </DM.Provider>
    </PaintCtx.Provider>
  );
}
