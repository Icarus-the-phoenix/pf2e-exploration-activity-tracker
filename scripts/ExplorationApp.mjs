import { PF2eEATConstants } from "./constants.mjs";
import { getExplorationData, applyEffect, getPartyMembers, htmlClosest } from "./utils.mjs";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class ExplorationApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        id: "pf2e-eat",
        window:{
            title:"Exploration Activity Tracker",
            icon:"fa-solid fa-trees",
            resizable: true
        },
        position: {
            top: 100,
            left: 100
        },
        actions: {
            applyFollowTheExpert: this.prototype.applyFollowTheExpert,
            applyRaiseAShield: this.prototype.applyRaiseAShield,
            applyScout: this.prototype.applyScout,
            removeEffect: this.prototype.removeEffect,
            reroll: this.prototype.reroll,
            recallKnowledgeMacro: this.prototype.recallKnowledgeMacro,
            openActorSheet: this.prototype.openActorSheet,
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

    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.EXPLORATION_APP, scrollable: [''] }
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

    _onRender(context, options) {
        const collapsibleElements = this.element.querySelectorAll('.collapsible');
        for(const collapsible of collapsibleElements){
            this.expandCollapsibleElementOnHover(collapsible);
        }

        const actorInfoElements = this.element.querySelectorAll('.actor-info');
        for(const actorInfo of actorInfoElements){
            
            this.highlightTokenOnHoverElement(actorInfo);
        }
    }

    expandCollapsibleElementOnHover(element) {
        element.addEventListener("mouseover", (event) => {
            element.querySelector('.collapsible-content').classList.add("expanded");
        });
        element.addEventListener("mouseout", (event) => {
            element.querySelector('.collapsible-content').classList.remove("expanded");
        });
    }

    highlightTokenOnHoverElement(element){
        const token = canvas.tokens.placeables.find(x => x.actor.id === element.dataset.actorId);
        element.addEventListener("mouseover", (event) => {
            token._onHoverIn(event);
        });
        element.addEventListener("mouseout", (event) => {
            token._onHoverOut(event);
        });
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

    async reroll(evt, target){
        const activities = this.activities;

        const htmlDOM = htmlClosest(target, "[data-activity-name]");
        const activityName = htmlDOM?.dataset.activityName;
        const actorName = htmlDOM?.dataset.actorName;
        const totalModifier = htmlDOM?.dataset.totalModifier;
        const roll = await new Roll("1d20").evaluate();

        activities[activityName].players[actorName].roll.rollValue = roll.total;

        this.activities = activities;
        this.render(true);
    }

    openActorSheet(evt, target){
        const htmlDOM = htmlClosest(target, "[data-actor-id]");
        const actorId = htmlDOM?.dataset.actorId;
        const tab = htmlDOM?.dataset.tab;
        const actor = game.actors.get(actorId);
        actor.sheet.rendered ? actor.sheet.close() : actor.sheet.render(true, { tab });
    }

    async openItemSheet(evt, target){
        const htmlDOM = htmlClosest(target, "[data-item-uuid]");
        const itemUuid = htmlDOM?.dataset.itemUuid;
        const item = await fromUuid(itemUuid);
        console.log(item);
        item.sheet.rendered ? item.sheet.close() : item.sheet.render(true);
    }
}