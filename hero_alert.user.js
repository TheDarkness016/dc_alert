// ==UserScript==
// @name         DCMonsterAlert
// @namespace    http://tampermonkey.net/
// @version      1.5-final
// @description  Wersja prywatna.
// @author       Private
// @match        https://tempest.margonem.pl/
// @grant        none
// @updateURL    https://github.com/TheDarkness016/dc_alert/raw/refs/heads/main/hero_alert.user.js
// @downloadURL  https://github.com/TheDarkness016/dc_alert/raw/refs/heads/main/hero_alert.user.js
// ==/UserScript==

const MEMORY_MANAGER = {
    STORAGE_KEY: 'SYSTEM_DC_ALERT_CACHE_V1',

    initialize() {
        this.cleanupExpiredMobs();
    },

    getCache() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { lastReport: 0, mobs: {} };
        } catch (e) {
            return { lastReport: 0, mobs: {} };
        }
    },

    saveCache(cache) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
        } catch (e) {
            // Cichy błąd
        }
    },

    shouldSendDailyReport() {
        return false;
    },

    canSendMobAlert(mobName) {
        const cache = this.getCache();
        const now = Date.now();
        const oneMinute = 60 * 1000;
        const lastAlert = cache.mobs[mobName] || 0;
        return (now - lastAlert) > oneMinute;
    },

    updateMobAlertTime(mobName) {
        const cache = this.getCache();
        cache.mobs[mobName] = Date.now();
        this.saveCache(cache);
    },

    cleanupExpiredMobs() {
        const cache = this.getCache();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        let cleaned = false;
        for (const mobName in cache.mobs) {
            if ((now - cache.mobs[mobName]) > oneHour) {
                delete cache.mobs[mobName];
                cleaned = true;
            }
        }
        if (cleaned) {
            this.saveCache(cache);
        }
    }
};

// ==========================================
// ⚙️ KONFIGURACJA WEBHOOKÓW
// ==========================================
const WEBHOOKS_LINKS = {
    moj_kanal: "https://discord.com/api/webhooks/1458951390872469608/_d-s0Is_22ua0K7DrBx4GVNlSwWXBlUdrIiJ3RO-TLwCNFJStM1rBIUfvSHzfJhLQu8_",
    kanal_tytany: "https://discord.com/api/webhooks/1546521336019550308/EBmln9-EIeEtaMS-pDFNw-b3buBEW0MnCDcEgCMv1cxGO1jEqK6C13cUy5NNrCaditdl"
}

// ==========================================
// 👾 LISTA POTWORÓW
// ==========================================
const TARGET_MOBS = [
{
    name: "Mroczny Patryk",
    lvl: 35,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1276996345898598420" }
    ]
},
{
    name: "Karmazynowy Mściciel",
    lvl: 45,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1276996504648941569" }
    ]
},
{
    name: "Złodziej",
    lvl: 51,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1276996566682435676" }
    ]
},
{
    name: "Zły Przewodnik",
    lvl: 63,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1278641705163165810" }
    ]
},
{
    name: "Opętany Paladyn",
    lvl: 74,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1514319383306965113" }
    ]
},
{
    name: "Piekielny Kościej",
    lvl: 85,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1519457940128665672" }
    ]
},
{
    name: "Tepeyollotl",
    lvl: 258,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1519457940128665672" }
    ]
},
{
    name: "Widmo Triady",
    lvl: 265,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1519457940128665672" }
    ]
},
{
    name: "Negthotep Czarny Kapłan",
    lvl: 271,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1519457940128665672" }
    ]
},
{
    name: "Młody Smok",
    lvl: 282,
    webhooks: [
        { url: WEBHOOKS_LINKS.moj_kanal, roleId: "1519457940128665672" }
    ]
},
// --- TYTANY ---
{
    name: "Dziewicza Orlica",
    lvl: 51,
    webhooks: [
        { url: WEBHOOKS_LINKS.kanal_tytany, roleId: "1323116346308821032" }
    ]
}
];

function olog(message) {
    console.log(`[System] ${message}`);
}

function isHeroInClan(){
    try {
        if (!Engine.hero.d.clan) return false;
        const clanIds = [3373, 3573];
        if (clanIds.includes(Engine.hero.d.clan.id)) return true;
        return false;
    } catch (error) {
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ownCallbackToEvent(npc){
    function isKindNull(npc) {
        if (!npc.d) return false;
        if (typeof npc.getKind !== 'function') return false;
        return npc.getKind() === null;
    }

    function handleClanTargetMob(npc){
        function findTargetMobToClan(npc) {
            if (!npc || typeof npc.getNick !== 'function') return null;
            const npcName = npc.getNick();

            const foundByName = TARGET_MOBS.find(mob => mob.name.toLowerCase() === npcName.toLowerCase());
            if (foundByName) return foundByName;

            const tropiciele = ["Tropiciel Herosów", "Wtajemniczony Tropiciel Herosów", "Doświadczony Tropiciel Herosów"];
            if (tropiciele.includes(npcName)) {
                if (typeof npc.getLevel === 'function') {
                    return TARGET_MOBS.find(mob => mob.lvl === npc.getLevel()) || null;
                }
            }
            return null;
        }

        function prepareMessageToChatAndSend(npc){
            function sendMessageToClanChat(message) {
                _g('chat&channel=clan', !1, { c: message });
            }
            const npcNick = `${npc.getNick()} ${npc.getLevel()}lvl`;
            const mapName = Engine.map.d.name;
            const npcX = npc.getX();
            const npcY = npc.getY();
            let message = `${npcNick} - ${mapName} (${npcX}, ${npcY})`;
            sendMessageToClanChat(message);
        }

        const targetMobToClan = findTargetMobToClan(npc);
        if (targetMobToClan === null) return;
        if (!MEMORY_MANAGER.canSendMobAlert(npc.getNick())) return;

        prepareMessageToChatAndSend(npc);
        prepareMessagesToWebhookAndSend(targetMobToClan, npc);
        MEMORY_MANAGER.updateMobAlertTime(npc.getNick());
    }

    if (isKindNull(npc)){
        return true;
    }

    handleClanTargetMob(npc);
}

function prepareMessagesToWebhookAndSend(targetMob, npc) {
    if (!targetMob || !targetMob.webhooks || !npc) return;

    const heroNick = Engine.hero.getNick();
    const heroLvl = Engine.hero.getLvl();
    const npcNick = npc.getNick();
    const mapName = Engine.map.d.name;
    const npcX = npc.getX();
    const npcY = npc.getY();

    targetMob.webhooks.forEach(webhook => {
        let message = ``;
        const roleId = webhook.roleId;
        if(roleId && roleId !== "") message += `<@&${roleId}>\n`;
        message += `${npcNick} - **${mapName} (${npcX}, ${npcY})**\nWykrył: ${heroNick} ${heroLvl}lvl`;

        sendMessageToWebhook(message, webhook.url);
    });
}

function sendMessageToWebhook(message, webhookUrl) {
    const request = new XMLHttpRequest();
    request.open("POST", webhookUrl, true);
    request.setRequestHeader("Content-Type", "application/json");
    const payload = { content: message };

    request.onload = function() {};
    request.onerror = function() {};
    request.send(JSON.stringify(payload));
}

(async function() {
    'use strict';
    while (!Engine || !Engine.map || !Engine.map.d || !Engine.map.d.name || !Engine.hero || !Engine.hero.d || !Engine.hero.d.x || !Engine.npcs.getDrawableList()) {
        await sleep(150);
    }
    MEMORY_MANAGER.initialize();

    if (isHeroInClan()) {
        olog("System gotowy.");
        try{
            API.addCallbackToEvent("newNpc", ownCallbackToEvent);
        }
        catch (error) {};
    }
})();
