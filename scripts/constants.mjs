
export class PF2eEATConstants{
    static MODULE_ID = "pf2e-exploration-activity-tracker";

    static TEMPLATES = {
        EXPLORATION_APP: `modules/${this.MODULE_ID}/templates/exploration-app.hbs`,
        FOLLOW_THE_EXPERT_APP: `modules/${this.MODULE_ID}/templates/follow-the-expert-app.hbs`,
    }
    
    // TODO: Create Settings for foundry
    static SETTINGS = {
        PLAYER_LIST_BUTTON: 'player-list-button',
        TOKEN_CONTROLS_BUTTON: 'token-controls-button'
    }
}

