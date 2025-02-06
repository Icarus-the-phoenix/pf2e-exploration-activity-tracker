import { PF2eEATConstants } from "./constants.mjs";
import { getExplorationData, applyEffect, getPartyMembers, htmlClosest } from "./utils.mjs";


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
            existing.activities = { };
            return existing;
        }
        else{
            this.activities = { };
        }
    }

    // TODO: figure out scrollable
    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.EXPLORATIONAPP }
    }

    async _prepareContext(partId, context) {     
        this.activities = await getExplorationData();
        const activities = this.activities;

        return {
            activities
        }
    }

    applyRaiseAShield(evt, target) {
        applyEffect(game.actors.get(target.getAttribute("actorId")), "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr");
    }

    applyScout(){
        applyEffect(getPartyMembers(), "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF");
    }

    openItemSheet(evt, target){
        const itemId = htmlClosest(target, "[data-item-id]")?.dataset.itemId;
        const playerId = htmlClosest(target, "[data-player-id]")?.dataset.playerId;
        const item = game.actors.get(playerId).items.get(itemId);
        item.sheet.rendered ? item.sheet.close() : item.sheet.render(true);
    }
}

