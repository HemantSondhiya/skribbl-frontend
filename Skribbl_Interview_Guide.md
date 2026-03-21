# SkribblClone - Full Stack Developer Interview Guide
**Project:** Real-time Multiplayer Drawing & Chat Game
**Tech Stack:** React.js, Vite, Tailwind CSS, Spring Boot, STOMP WebSockets, Canvas API

> **Note for Interview:** Interviewer ko show karna hai ki aapne sirf basic components nahi banaye, balki *Real-time Networking*, *Concurrency*, aur *Browser Rendering* ke deep edge-cases khud solve kiye hain. Niche diye gaye answers issi approach par based hain.

---

## 1. Core Architecture: WebSockets vs REST API
**Question:** Aapne is real-time drawing game ke liye HTTP REST APIs kyun nahi use kiye? STOMP WebSockets kyun chuna?

**Answer:** 
REST APIs ek **request-response** protocol par kaam karte hain. Agar main REST API use karta, toh frontend ko har second server se poochna padta (jise short/long polling kehte hain) ki "kya kisi aur player ne draw kiya?" Yeh database aur server par bohot heavy load daalta.
Iske opposite, **WebSockets ek persistent, bi-directional (two-way) connection banate hain**. Jis second koi player mouse move karke draw karta hai, mera frontend `/app/draw.add` endpoint par payload bhejta hai, aur Spring Boot server instantly us stroke ko pure room mein `/topic/rooms/{roomCode}/state` par push kar deta hai. Isse 0 milliseconds ka delay aata hai aur live drawing bilkul smooth sync hoti hai.

---

## 2. Canvas Synchronization & Math (Crucial Feature)
**Question:** Agar ek player 32-inch monitor pe draw kar raha hai, aur dusra player 5-inch mobile screen pe game dekh raha hai, toh drawings exact same position pe kaise dikhti hain?

**Answer:** 
Is screen-scaling problem ko solve karne ke liye maine frontend par **Canvas ki internal raw rendering resolution ko fixed rakha hai (800x600 px)**.
CSS style (`w-full h-auto`) us fixed board ko visual screen-size ke hisaab se chota-bada dikhata hai. Par jab user screen par click karke draw karta hai, mera Javascript pehle `getBoundingClientRect()` call karke screen size nikalta hai, aur phir current visual width ko internal absolute 800px width se divide karke ek `scaleX` aur `scaleY` ratio banata hai. Is ratio ko multiply karke main humesha coordinates ko waapis exact 800x600 format mein translate kar leta hu.
Isliye backend pe coordinates hamesha perfect fixed-scale mein aate hain aur scaling mismatch issue kabhi nahi hota!

---

## 3. The Race Condition Bug (Component Lifecycle)
**Question:** Aapne transition phases (Lobby se Game me start hona) ke beech mein aane wale STOMP messages ko lose hone se kaise bachaya?

**Answer:** 
Yeh project ka ek bohot interesting bug tha. Jab host "Start Game" click karta hai, backend phase ko `WORD_PICK` karta hai aur instantly drawer ko uske random 3 words bhejta tha. Par react me us waqt Lobby unmount ho rahi hoti thi aur GamePage mount hone wala tha (approx 50ms delay). React Component load hone se pehle hi WebSocket message aakar chala jata tha.
**Fix:** Maine socket connection ko kisi specific React Component ke andar limit nahi kiya. Maine ek **Singleton `socket.js`** file banayi taaki connection globally alive rahe. Uske baad, maine Lobby page par hi word-options ka topic secretly subscribe karva liya aur jaise hi words transition me fire hue, maine unhe `sessionStorage` mein catch kar liya. GamePage ne mount hote hi chupchap `sessionStorage` se aage ka process resume kar liya!

---

## 4. Preventing Backend Server Crashes (NPEs)
**Question:** Multiplayer game me backend server threads ke crash hone ka sabse bada risk kya tha, aur aapne isey handle kaise kiya?

**Answer:** 
Frontend se jab mouse Canvas se bahar (hover-off) nikalta tha, toh `onMouseLeave` event trigger hoke backend ko `/app/draw.end` bhej deta tha—bina kisi actual drawing ke! Kyunki drawing thi hi nahi, toh `strokeId: null` payload ja raha tha, jo Spring Boot ke `ConcurrentHashMap` ko hit karte hi **NullPointerException** de kar server threads crash kar deta tha.
**Fix:** Is anomaly ke liye mere frontend mein maine explicit checks lagaye (`if (!drawing) return;`) taaki empty/garbage states network pe jaye hi na. Aur backend Java mein maine `isBlank()` ya `null` null-safety checks guard kiye. Ek multiplayer app me frontend payloads par andha vishwas nahi karna chahiye, dono sides par strict guardrails zaroori hain.

---

## 5. Bypassing Spring Security for Private DMs
**Question:** Aapne Private User-to-User Chatging (DMs) kaise banayi jabki aap JWT ya Spring Security Principal sessions use nahi kar rahe the?

**Answer:** 
Spring Boot STOMP mein natively `convertAndSendToUser()` directly work nahi karta agar Principal authentication map na ho.
Mujhe Auth architecture ko halka rakhna tha, isliye maine DMs ko literal custom-topics bana kar solve kiya. Har player GamePage mount hote hi ek specific address subscribe kar leta hai: `/topic/users/{playerId}/private`. 
Ab agar Player A ko Player B ko DM karna hai, toh chatbox json mein `receiverId` bhejta hai. Java Backend `sendPrivateMessage()` me intercept karke seedha `messagingTemplate.convertAndSend("/topic/users/" + receiver.getId() + "/private", message)` run kar deta hai. Security bypass bhi ho gayi aur private specific-delivery bhi perfect kaam karti hai!

---

## 6. The "Mid-Stroke Wiping" Redraw Loop
**Question:** Jab timer tick har 1 second me Server State broadcast karta hai, toh canvas drawing glitch kyun karti thi aur stroke wipe kyun ho raha tha?

**Answer:** 
Jab backend game-tick broadcast bhejta hai, toh frontend poore strokes list ko iterate karke Canvas ko redraw aur clear (`ctx.clearRect()`) karta hai synchronization ke liye. Problem yeh thi ki jab user literal mouse click karke curve bana raha hota tha, aur beech me timer update aa gaya, toh Canvas current action clear kar deta tha. Isse screen flash flash hoti thi!
**Fix:** Is visual gliche ko solve karne ke liye maine React `useEffect` ke andar ek dependency bypass rule banaya: `if (!drawing) { drawSavedStrokes(); }`. 
Matlab agar Drawer strictly canvas pe present moment me touch kar raha hai toh background redrawing completely PAUSE ho jayegi. Jaise hi user mouse lift karega, next second me definitive server state smoothly update ho jayegi bina kisi flickering ke! 
