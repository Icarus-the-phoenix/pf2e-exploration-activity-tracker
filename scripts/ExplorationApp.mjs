import { PF2eEATConstants } from "./constants.mjs";
import { getExplorationData } from "./utils.mjs";


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
            applyEffect: this.prototype.applyEffect,
            removeEffect: this.prototype.removeEffect,
            reroll: this.prototype.reroll,
            recallKnowledgeMacro: this.prototype.recallKnowledgeMacro
        }
    }, {inplace: false});

    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.EXPLORATIONAPP },
        footer: { template: `templates/generic/form-footer.hbs` }
    }

    async _prepareContext(partId, context) {
        const activities = await getExplorationData();

        return {
            activities,
            buttons: [
                { type: "submit", icon: "fa-solid fa-rotate-right", label: "Refresh" },
                { type: "reset", action: "reset", icon: "fa-solid fa-undo", label: "SETTINGS.Reset" },
            ]
        }
    }
}