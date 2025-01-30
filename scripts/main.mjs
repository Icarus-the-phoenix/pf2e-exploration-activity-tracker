import { PF2eEATConstants } from "./constants.mjs";
import { ExplorationApp } from "./ExplorationApp.mjs"

Hooks.once("init", () => {
    const module = game.modules.get(PF2eEATConstants.MODULE_ID);

    module.api = {
        ExplorationApp,
    }

    const handlebarHelpers = {
        "eat-obj-length": (value, options) => {
            return Object.keys(value).length;
        },
        "isPositive": (value, options) =>{
            return value >= 0 ? "+" : "";
        }
    }
    Handlebars.registerHelper(handlebarHelpers);

    console.log(`PF2e Exploration Activity Tracker | Ready`)
});

Hooks.on("renderPlayerList", (playerlist, [html]) => {
    const buttonHtml = `
        <button class="exploration-button">
            <i class="window-icon fa-fw fa-solid fa-trees"></i>
            Exploration
        </button>
    `
    html.insertAdjacentHTML("beforeend",`${buttonHtml}`);
    
    html.querySelector('.exploration-button').addEventListener('click', ev => {
        new ExplorationApp().render({force:true});
    })
});