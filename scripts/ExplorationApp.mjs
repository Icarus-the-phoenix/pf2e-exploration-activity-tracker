import { PF2eEATConstants } from "./constants.mjs";
import { getExplorationData, applyEffect, getPartyMembers } from "./utils.mjs";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class ExplorationApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        window:{
            title:"Exploration Activity Tracker",
            icon:"fa-solid fa-trees"
        },
        position: {
            top: 100,
            left: 100,
            width: 600
        },
        actions: {
            applyRaiseAShield: this.prototype.applyRaiseAShield,
            applyScout: this.prototype.applyScout,
            removeEffect: this.prototype.removeEffect,
            reroll: this.prototype.reroll,
            recallKnowledgeMacro: this.prototype.recallKnowledgeMacro
        },
        id: "explortion-activity-tracker-app"
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

    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.EXPLORATIONAPP },
        footer: { template: `templates/generic/form-footer.hbs` }
    }

    async _prepareContext(partId, context) {     
        this.activities = await getExplorationData();
        const activities = this.activities;

        return {
            activities,
            buttons: [
                { type: "submit", icon: "fa-solid fa-rotate-right", label: "Refresh" },
                { type: "reset", action: "reset", icon: "fa-solid fa-undo", label: "SETTINGS.Reset" },
            ]
        }
    }

    applyRaiseAShield(evt, target) {
        applyEffect(game.actors.get(target.getAttribute("actorId")), "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr");
    }

    applyScout(){
        applyEffect(getPartyMembers(), "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF");
    }
}