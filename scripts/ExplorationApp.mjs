import { PF2eEATConstants } from "./constants.mjs";
import { getExplorationData, applyEffect, getPartyMembers, htmlClosest, getRollColor } from "./utils.mjs";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class ExplorationApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        id: "explortion-activity-tracker-app",
        window:{
            title:"Exploration Activity Tracker",
            icon:"fa-solid fa-trees"
        },
        position: {
            top: 100,
            left: 100,
            width: 600,
            height: 800
        },
        actions: {
            applyFollowTheExpert: this.prototype.applyFollowTheExpert,
            applyRaiseAShield: this.prototype.applyRaiseAShield,
            applyScout: this.prototype.applyScout,
            removeEffect: this.prototype.removeEffect,
            reroll: this.prototype.reroll,
            recallKnowledgeMacro: this.prototype.recallKnowledgeMacro,
            openItemSheet: this.prototype.openItemSheet
        }
    }, {inplace: false});

    constructor(options ={}){
        super(options);
        const existing = foundry.applications.instances.get(this.constructor.DEFAULT_OPTIONS.id);
        if(existing){
            //existing.activities = { };
            return existing;
        }
        else{
            this.activities = { };
        }
    }

    // TODO: figure out scrollable
    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.EXPLORATIONAPP, scrollable: [''] }
    }

    async _prepareContext(partId, context) {     
        // Create Activities if non-exist
        if(Object.keys(this.activities).length === 0){
            this.activities = await getExplorationData();
        }

        const activities = this.activities;

        return {
            activities
        }
    }

    applyFollowTheExpert(evt, target){
        console.log(target);
        applyEffect(game.actors.get(target.dataset.actorId), "Compendium.pf2e.other-effects.Item.VCSpuc3Tf3XWMkd3");
    }

    applyRaiseAShield(evt, target) {
        applyEffect(game.actors.get(target.dataset.actorId), "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr");
    }

    applyScout(){
        applyEffect(getPartyMembers(), "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF");
    }

    // TODO: Store Data needed for roll in activities and reroll.
    async reroll(evt, target){
        const activities = this.activities;

        const htmlDOM = htmlClosest(target, "[data-activity-name]");
        const activityName = htmlDOM?.dataset.activityName;
        const actorName = htmlDOM?.dataset.actorName;
        const totalModifier = htmlDOM?.dataset.totalModifier;
        const roll = await new Roll("1d20").evaluate();
        const color = getRollColor(roll);

        activities[activityName].players[actorName].roll.rollValue = roll.total;
        activities[activityName].players[actorName].roll.color = color;

        /*
        const rollHtml = target.previousElementSibling;
        rollHtml.setAttribute("style", color);
        rollHtml.setAttribute("data-tooltip", `${roll.total} + ${totalModifier}`);
        rollHtml.innerHTML = `${roll.total+totalModifier}`
        */

        this.activities = activities;
        this.render(true);
    }

    openItemSheet(evt, target){
        const htmlDOM = htmlClosest(target, "[data-item-id]");
        const itemId = htmlDOM?.dataset.itemId;
        const playerId = htmlDOM?.dataset.playerId;
        const item = game.actors.get(playerId).items.get(itemId);
        item.sheet.rendered ? item.sheet.close() : item.sheet.render(true);
    }
}

