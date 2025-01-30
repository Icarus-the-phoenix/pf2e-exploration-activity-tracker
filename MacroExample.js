/*
Macro created by Icarus

Exploration Adjudicator
This macro will check party members for their currently active exploration activities
and show them to the GM in an easily readable way.
Several sudo-automations are included:
    Avoid Notice and Search will show the GM what the character rolled, and allow rerolls.
    Defend and Follow the Expert show a button that applies the coresponding effect to the user.
    Investigate will show a button that rolls a recall knowledge check based on PF2e Workbench's Recall Knowledge Macro
    Scout effect will automatically apply to all party members and a button will display to remove the effect.
    Exploration activities with no automation are still shown for GM adjudication
*/

// Get party member actors
const partyMembers = game.actors.party.members;
if (partyMembers.length === 0){
    return ui.notifications.error("No Actors in the primary Party")
}

// UUids of supported sudo-automations
const avoidNoticeID = "Compendium.pf2e.actionspf2e.Item.IE2nThCmoyhQA0Jn";
const defendID = "Compendium.pf2e.actionspf2e.Item.cYtYKa1gDEl7y2N0";
const followTheExpertID = "Compendium.pf2e.actionspf2e.Item.tfa4Sh7wcxCEqL29";
const investigateID = "Compendium.pf2e.actionspf2e.Item.EwgTZBWsc8qKaViP";
const scoutID = "Compendium.pf2e.actionspf2e.Item.kV3XM0YJeS2KCSOb";
const searchID = "Compendium.pf2e.actionspf2e.Item.TiNDYUGlMmxzxBYU";

// HTML content container for the Application Window
let content = ``;

let tableContent = `<table style="margin: 0.5em 0; border-top: 1px solid #a16a37; border-bottom: 1px solid #a16a37; border-radius: 0px;">
    <tr>
        <th colspan="3">Activities with Checks</th>
    </tr>
    <tr>
        <th style="text-align:left">Name</th>
        <th style="text-align:center">Activity</th>
        <th style="text-align:center">Total</th>
    </tr>`;

// Check each party member for their exploration activity, create html for it, and run automations.
for (const a of partyMembers){
    const userId = Object.keys(a.ownership).find(f => f !== "default" && !game.users.get(f)?.isGM);
    const userColor = game.users.get(userId)?.color ?? "grey";

    if(a.system.exploration.length == 0){
        content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> has no exploration activity.</p>`;
        continue;
    }

    for (const e of a.system.exploration){
        const activity = a.items.get(e);
        //Avoid Notice
        if(activity.sourceId === avoidNoticeID){
            await rollSkill(a, a.skills.stealth.mod, avoidNoticeID);
        }
        //Defend
        else if (activity.sourceId === defendID){
            content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> is using @UUID[${activity.sourceId}]
            <a class="content-link" actorid="${a.id}" effectid="Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr" data-action="applyEffect">
                <i class="fas fa-code"></i>
            Apply Effect</a>
            </p>`;
        }
        //Follow the Expert
        else if (activity.sourceId === followTheExpertID){
            content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> is using @UUID[${activity.sourceId}]
            <a class="content-link" actorid="${a.id}" effectid="Compendium.pf2e.other-effects.Item.VCSpuc3Tf3XWMkd3" data-action="applyEffect">
                <i class="fas fa-code"></i>
            Apply Effect</a>
            </p>`;
        }
        //Investigate
        else if (activity.sourceId === investigateID){
            content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> is using @UUID[${activity.sourceId}]
            <a class="content-link" actorid="${a.id}" data-action="recallKnowledgeMacro">
                <i class="fas fa-code"></i>
            Recall Knowledge</a>
            </p>`;
        }
        //Scout
        else if (activity.sourceId === scoutID){
            content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> is using @UUID[${activity.sourceId}], and the effect was automatically applied
            <a class="content-link" effectid="Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF" data-action="removeEffect">
                <i class="fas fa-code"></i>
            Remove Effect</a>
            </p>`;
            applyEffect(partyMembers, "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF");
        }
        //Search
        else if (activity.sourceId === searchID){
            await rollSkill(a, a.perception.mod, searchID);
        }
        //Other Actions
        else{
            content += `<p><strong style="color:${userColor};text-shadow: 1px 1px 1px black">${a.name}</strong> is using @UUID[${activity.sourceId}]</p>`;
        }
    } 
}

tableContent += `</table>`;
content += tableContent;

// Create Application that holds Macro content
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
class ExplorationApp extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        window:{
            title:"Exploration Adjudicator",
            icon:"fa-solid fa-person-running-fast",

        },
        position: {
            top: 100,
            left: 100
        },
        actions: {
            applyEffect: this.prototype.applyEffect,
            removeEffect: this.prototype.removeEffect,
            reroll: this.prototype.reroll,
            recallKnowledgeMacro: this.prototype.recallKnowledgeMacro
        }
    }, {inplace: false});

    applyEffect(evt, target) {
        applyEffect(game.actors.get(target.getAttribute("actorid")), target.getAttribute("effectid"));
    }

    removeEffect(evt, target){
        removeEffect(partyMembers, target.getAttribute("effectid"))
    }

    async reroll(evt, target){
        const skillMod = target.getAttribute("skillmod");
        const{result, total, dice} = await new Roll(`1d20 + ${skillMod}`).evaluate();
        const color = getRollColor(dice[0]);

        target.parentNode.children[0].setAttribute("style", color);
        target.parentNode.children[0].setAttribute("data-tooltip", result);
        target.parentNode.children[0].innerHTML = `${total}`;
    }

    async recallKnowledgeMacro(evt, target){
        recallKnowledgeMacro(game.actors.get(target.getAttribute("actorid")));
    }
    
    async _renderHTML(...args) {
        const div = document.createElement('div');
        div.innerHTML = await TextEditor.enrichHTML(content);
        return [div];
    }
    
    _replaceHTML(result, content, options) {
        content.replaceChildren(...result);
    }
}
new ExplorationApp().render({force: true})

// Rolls a skill with an actor's modifier, then creates the html table entry to display it
async function rollSkill(actor, skillMod, activity){
    const {result, total, dice} = await new Roll(`1d20 + ${skillMod}`).evaluate();
    const userId = Object.keys(actor.ownership).find(f => f !== "default" && !game.users.get(f).isGM);
    const userColor = game.users.get(userId)?.color ?? "grey";
    const color = getRollColor(dice[0]);
    tableContent += `
        <tr>
        <th style="color:${userColor}; text-shadow: 1px 1px 1px black; text-align:left;">${actor.name}</th>
        <td style="text-align:center">@UUID[${activity}]</th>
        <th>  
            <span style="${color}" data-tooltip="${result}">${total}</span>
            <a style="justify-content:end;" data-action="reroll" data-tooltip="Reroll Check" skillmod="${skillMod}"><i class="fa-solid fa-rotate rotate"></i></a>
        </th>
        </tr>`;
}

// Applies an effect to an actor or set of actors
async function applyEffect(actors, effectUUID){
    const item = await fromUuid(effectUUID);
    if (!Array.isArray(actors)) actors = [actors];
    if (item?.type === "effect") {
        const source = item.toObject();
        source._stats.compendiumSource = effectUUID;

        for (const actor of actors) {
            const existing = actor.itemTypes.effect.find((e) => e._stats.compendiumSource === effectUUID);
            if (!existing) {
                await actor.createEmbeddedDocuments("Item", [source]);
            } 
            else if (effectUUID !== "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF"){
                ui.notifications.info(`${actor.name} already has that effect.`)
            }
        }
    } else {
        ui.notifications.error(game.i18n.format("PF2E.ErrorMessage.ItemNotFoundByUUID", { uuid: effectUUID }));
    }
}

// Removes an effect from and actor or set of actors
async function removeEffect(actors, effectUUID){
    const item = await fromUuid(effectUUID);
    if (!Array.isArray(actors)) actors = [actors];
    if (item?.type === "effect") {
        const source = item.toObject();
        source._stats.compendiumSource = effectUUID;

        for (const actor of actors) {
            const existing = actor.itemTypes.effect.find((e) => e._stats.compendiumSource === effectUUID);
            if (existing) {
                await existing.delete();
            }
        }
    } else {
        ui.notifications.error(game.i18n.format("PF2E.ErrorMessage.ItemNotFoundByUUID", { uuid: effectUUID }));
    }
}

// Gets a color based on nat 1 or 20
function getRollColor(dieRoll){
    if (dieRoll.total === 1) {
        color = `font-size:115%;color:red;`;
    }
    else if (dieRoll.total === 20) {
        color = `font-size:115%;color:green;`;
    }
    else {
        color = `font-size:115%;color:#87cefa;`;
    }
    return color;
}

async function recallKnowledgeMacro(actor){
    /*
    Based on the macro by bipedalshark and WesBelmont and Allalinor.
    updated by darkim, Dalvyn, julie.winchester, and xyzzy42
    modified for use in this macro by Icarus

    Recall Knowledge
    This macro will roll several knowledge checks if no target is selected.
    If one ore more targets are selected it will only roll the relevant knowledge skills and compare the result to the DC.
    Handles lore skills (as far as possible)
    Handles Cognitive Mutagen and other Bonus effects
    Should pick up most single target trait based mods automatically now if predicates are set properly.

    Limitations:
    * Does not handle assurance.
    * Does not handle things like bardic knowledge.
    */


    /**
     * Check wether the current actor has a feature.
     *
     * @param {string} slug
     * @returns {boolean} true if the feature exists, false otherwise
     */
    const checkFeat = (slug) => actor.itemTypes.feat.some((item) => item.slug === slug);

    const breakdownMode = (() => {
        try { return game.settings.get("xdy-pf2e-workbench", "rkBreakdown"); } catch { return "all"; }
    })();

    const SKILL_OPTIONS = ["arcana", "crafting", "medicine", "nature", "occultism", "religion", "society"];

    const IDENTIFY_SKILLS = {
        aberration: ["occultism"],
        astral: ["occultism"],
        animal: ["nature"],
        beast: ["arcana", "nature"],
        celestial: ["religion"],
        construct: ["arcana", "crafting"],
        dragon: ["arcana"],
        elemental: ["arcana", "nature"],
        ethereal: ["occultism"],
        fey: ["nature"],
        fiend: ["religion"],
        fungus: ["nature"],
        giant: ["society"],
        humanoid: ["society"],
        monitor: ["religion"],
        ooze: ["occultism"],
        plant: ["nature"],
        spirit: ["occultism"],
        undead: ["religion"],
    };

    const RANK_COLORS = ["#443730", "#171f69", "#3c005e", "#5e4000", "#5e0000"];
    const RANK_NAMES = ["UNTRAINED", "TRAINED", "EXPERT", "MASTER", "LEGENDARY"];

    // Get token skills infos by simulating fake rolls
    // ===============================================

    /**
     * Do a skill check for RK, using the skill supplied.  The value of the D20 roll can be injected using rollResult.
     * There is no message generated.
     *
     * @param {string} skillSlug    The skill to use. Can be a lore.
     * @param {Number} rollResult   Value to use as d20 result.
     * @param {Actor} target        The target actor/hazard to RK about, optional.
     */
    async function getSkillResult(skillSlug, rollResult = undefined, target = undefined) {
        const skill = actor.skills[skillSlug];
        const rank = skill.rank;
        const extraRollOptions = [
            "action:recall-knowledge",
            `action:recall-knowledge:${skillSlug}`,
            `skill:rank:${rank}`,
        ];
        if (target) {
            extraRollOptions.push(...target.getSelfRollOptions('target'));
        }

        const [fakeRoll, fakeMsg ] = await new Promise((resolve) =>
            skill.roll({
                callback: (roll, outcome, msg) => resolve([roll, msg]),
                createMessage: false,
                rollMode: CONST.DICE_ROLL_MODES.BLIND,
                skipDialog: true,
                extraRollOptions,
            })
        );

        // Get the actual options the pf2e system roll code came up with
        const rollOptions = fakeMsg.getFlag('pf2e','context.options');

        // Extract tags text from roll, but possibly remove ability and proficiency
        let breakdown = null;
        if (breakdownMode !== 'none') {
            const div = document.createElement('div');
            div.innerHTML = fakeMsg.flavor;
            breakdown = div.querySelector("div.modifiers");
            if (breakdownMode === "extra") {
                // Drop the ability and proficiency modifiers, possibly less interesting since they are always there.
                const uninteresting = new Set([...Object.keys(CONFIG.PF2E.abilities), "proficiency"]);
                breakdown?.querySelectorAll("[data-slug]").forEach((e) => { if (uninteresting.has(e.dataset.slug)) e.remove(); });
            }
        }

        // find conditional RK modifiers
        const appliedModifiers = [], unappliedModifiers = [];
        const recallKnowledgeModifiers = skill.modifiers.filter((mod) => Array.from(predicateRollOptions(mod.predicate)).some(r => r === "action:recall-knowledge"));
        for (const mod of recallKnowledgeModifiers) {
            (mod.predicate.test(rollOptions) ? appliedModifiers : unappliedModifiers).push(mod);
        }

        return {
            label: skill.label,
            modifier: fakeRoll.options.totalModifier,
            total: fakeRoll.total,
            unappliedModifiers,
            appliedModifiers,
            breakdown,
            rank,
            rollOptions,
            domains: fakeMsg.getFlag('pf2e', 'context.domains'),
        };
    }

    // Global d20 roll used for all skills
    // ===================================

    const rollD20 = new Roll("1d20");
    const globalRoll = (await rollD20.roll({allowInteractive: false})).total;
    const rollColor = globalRoll == 20 ? "green" : globalRoll == 1 ? "red" : "royalblue";

    // Skill list output
    // =================

    const skillListOutput = (title, skillResults) => {
        let output = `<table><tr><th>${title}</th><th>Prof</th><th>Mod</th><th>Result</th></tr>`;
        for (const skillResult of skillResults) {
            const { label, modifier, rank, breakdown } = skillResult;
            const adjustedResult = globalRoll + modifier;
            output += `<tr><th>${label}</th>
                <td class="tags"><div class="tag" style="background-color: ${RANK_COLORS[rank]}; white-space:nowrap">${
                RANK_NAMES[rank]
            }</td>
                <td>${modifier >= 0 ? "+" : ""}${modifier}</td>
                <td><span style="color: ${rollColor}">${adjustedResult}</span></td></tr>`;
            if (breakdown?.childElementCount > 0) {
                output += `<tr><td colspan="7">${breakdown.outerHTML}</td></tr>`;
            }
        }
        output += "</table>";
        return output;
    };

    // Creating output
    // ===============

    let output = `<strong>${actor.name}'s Recall Knowledge</strong> (Roll: <span style="color: ${rollColor}">${globalRoll}</span>)`;

    // No target - roll all Recall Knowledge and lore skills
    const lores = Object.values(actor.skills).filter((s) => s.lore).map((s) => s.slug);
    const skillResults = await Promise.all([...SKILL_OPTIONS, ...lores].map((s) => getSkillResult(s, globalRoll)));

    output += skillListOutput("Skill", skillResults);


    // Notification and chat card
    // ==========================

    ui.notifications.info(`${actor.prototypeToken?.name ?? actor.name} tries to remember if they've heard something related to this.`);
    await ChatMessage.create({
        user: game.userId,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        content: output,
        whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
        visible: false,
        blind: true,
        speaker: ChatMessage.getSpeaker(),
        rolls: [rollD20],
    });

    // Recursively return every roll option in a predicate expression tree
    function* predicateRollOptions(predicate) {
        for (const t of predicate) {
            if (typeof t === 'object') {
                for (const v of Object.values(t)) {
                    yield *predicateRollOptions(v);
                }
            } else {
                yield t;
            }
        }
    }
    /* # source "https://gitlab.com/symonsch/my-foundryvtt-macros/-/tree/main/PF2e/Contributions by others/Recall_Knowledge.js" - Fetched on 2025-01-15T15:10:24.282Z */
}