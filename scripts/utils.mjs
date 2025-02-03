const AVOID_NOTICE_ID = "Compendium.pf2e.actionspf2e.Item.IE2nThCmoyhQA0Jn";
const DEFEND_ID = "Compendium.pf2e.actionspf2e.Item.cYtYKa1gDEl7y2N0";
const FOLLOW_THE_EXPERT_ID = "Compendium.pf2e.actionspf2e.Item.tfa4Sh7wcxCEqL29";
const INVESTIGATE_ID = "Compendium.pf2e.actionspf2e.Item.EwgTZBWsc8qKaViP";
const SCOUT_ID = "Compendium.pf2e.actionspf2e.Item.kV3XM0YJeS2KCSOb";
const SEARCH_ID = "Compendium.pf2e.actionspf2e.Item.TiNDYUGlMmxzxBYU";

function getPartyMembers(){
    return game.actors.party.members.filter((m) => m.isOfType("character"));
}

// TODO: Create Refresh Data and rerender when data is refreshed
async function getExplorationData(){
    const partyMembers = getPartyMembers();
    let activities = {};
    for(const partyMember of partyMembers){
        //if(!partyMember.isOfType("character")) continue;
        for(const activityId of partyMember.system.exploration){
            const activity = partyMember.items.get(activityId);

            // If activity already exist in activities add to that instead of creating another.
            if(activities[activity.name]){
                activities[activity.name].players = { ...activities[activity.name].players,
                    [partyMember.name]: {
                        name: partyMember.name,
                        id: partyMember.id,
                        color: getUserColor(partyMember)
                    }
                };
            }
            else{
                activities = {...activities,
                    [activity.name]:{
                        name: activity.name,
                        enrichedHTML: await TextEditor.enrichHTML(`@UUID[${activity.sourceId}]`),
                        players: {
                            [partyMember.name]: {
                                name: partyMember.name,
                                id: partyMember.id,
                                color: getUserColor(partyMember)
                            }
                        }
                    }
                }
            }

            // Add data to activities object based on if requires Roll, Buttons, or tips
            let skill, result;
            switch(activity.sourceId){
                case AVOID_NOTICE_ID:
                    skill = partyMember.skills.stealth;
                    result = await getRollResult(partyMember, skill, "avoid-notice");
                    activities[activity.name].players[partyMember.name].roll = result;
                break;
                case DEFEND_ID:
                    // TODO: IDEA is to have defend hook onto combat creation and apply effect with duration lasting until player's turn
                    activities[activity.name].players[partyMember.name].button = {
                        label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                        actorId: partyMember.id,
                        dataAction: "applyRaiseAShield"
                    }
                break;
                case FOLLOW_THE_EXPERT_ID:

                break;
                case INVESTIGATE_ID:

                break;
                case SCOUT_ID:
                    activities[activity.name].players[partyMember.name].button = {
                        label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                        dataAction: "applyScout"
                    }
                break;
                case SEARCH_ID:
                    skill = partyMember.perception;
                    result = await getRollResult(partyMember, skill, "search", "seek");
                    activities[activity.name].players[partyMember.name].roll = result;                  
                break;
            }
        }
    }

    // Turn activities into Array for sorting then back into object
    const sortedActivities = Object.fromEntries(Object.entries(activities).sort((a, b) => {
        if(a[1].name < b[1].name) { return -1; }
        if(a[1].name > b[1].name) { return 1; }
        return 0;
    }));
    console.log(sortedActivities);
    return sortedActivities;
}

function getUserColor(actor){
    const userId = Object.keys(actor.ownership).find(f => f !== "default" && !game.users.get(f).isGM);
    const color = game.users.get(userId)?.color ?? "grey";
    return color;
}

function getRollColor(dieRoll){
    let color;
    if (dieRoll.total === 1) {
        color = `color:red;`;
    }
    else if (dieRoll.total === 20) {
        color = `color:green;`;
    }
    else {
        color = `color:#87cefa;`;
    }
    return color;
}

async function getRollResult(actor, skill, actionSlug, subordinateActionSlug){
    const domains = ['all', 'check', 'skill-check', `${skill.slug}`, `${skill.slug}-check`, `${skill.attribute}-based`, `${skill.attribute}-skill-check`]
    const options = actor.getRollOptions(domains);
    options.push(
        `action:${actionSlug}`,
        "secret",
        `action:${subordinateActionSlug}`
    );
    const checkModifiers = new game.pf2e.CheckModifier(`${actionSlug} (${skill.label})`, skill);
    const rollData = await game.pf2e.Check.roll(
        checkModifiers, 
        {
            actor: actor,
            type: `skill-check`,
            traits: ['exploration'],
            options,
            domains,
            createMessage: true,
            skipDialog: true
        }
    );
    const color = getRollColor(rollData.dice[0]);
    const enabledModifiers = getEnabledRollModifiers(checkModifiers);
    const potentialModifiers = getPotentialRollModifiers(checkModifiers);
    return {
        rollData: {
            total: rollData.total,
            result: rollData.result,
            color: color
        },
        enabledModifiers : enabledModifiers,
        potentialModifiers : potentialModifiers,
    };
}

function getEnabledRollModifiers(checkModifiers){
    const enabledModifiers = checkModifiers.modifiers.filter((m) => 
        m.enabled === true
    );
    
    return enabledModifiers;
}

function getPotentialRollModifiers(checkModifiers){  
    console.log(checkModifiers);
    // TODO: change this to check for predicates on subordinate actions instead of Rolloptions that are toggleable
    const potentialModifiers = checkModifiers.modifiers.filter((m) =>
        m.rule?.parent.rules.filter(r =>    // Get parent of modifier with a rule element
            r.key === "RollOption"          // Check if any of the parents children is a RollOption Rule Element
        ).find(r => r.toggleable === true)  // Find if toggleable is true
    );

    // TODO: Instead of showing description in tooltip make button clickable to open relevant item.
    /*potentialModifiers.forEach(async (m) => {
        console.log(m.rule.parent.description);
        m.description = await TextEditor.enrichHTML(m.rule.parent.description);
        console.log(m);
    });*/

    return potentialModifiers;
}

async function applyEffect(actors, effectUUID, effectModifications) {
    const item = await fromUuid(effectUUID);
    if(!Array.isArray(actors)) actors = [actors];
    if (item?.type === "effect") {
        const source = item.toObject();
        source._stats.compendiumSource = effectUUID;

        for (const actor of actors) {
            const existing = actor.itemTypes.effect.find((e) => e._stats.compendiumSource === effectUUID);
            if (!existing) {
                const effect = await actor.createEmbeddedDocuments("Item", [source]);
                foundry.utils.mergeObject(effect, effectModifications);
            } 
            else {
                existing.delete();
            }
        }
    } else {
        ui.notifications.error(game.i18n.format("PF2E.ErrorMessage.ItemNotFoundByUUID", { uuid: effectUUID }));
    }
}

function htmlClosest(child, selectors) {
    return child instanceof Element ? child.closest(selectors) : null
}

export {
    getPartyMembers,
    getExplorationData,
    applyEffect,
    htmlClosest
}