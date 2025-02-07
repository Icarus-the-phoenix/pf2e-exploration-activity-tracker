const SUPPORTED_ACTIVITIES = {
    AVOID_NOTICE_ID : "Compendium.pf2e.actionspf2e.Item.IE2nThCmoyhQA0Jn",
    DEFEND_ID :"Compendium.pf2e.actionspf2e.Item.cYtYKa1gDEl7y2N0",
    FOLLOW_THE_EXPERT_ID : "Compendium.pf2e.actionspf2e.Item.tfa4Sh7wcxCEqL29",
    GATHER_INFORMATION_ID : "Compendium.pf2e.actionspf2e.Item.plBGdZhqq5JBl1D8",
    IMPERSONATE_ID : "Compendium.pf2e.actionspf2e.Item.AJstokjdG6iDjVjE",
    INVESTIGATE_ID : "Compendium.pf2e.actionspf2e.Item.EwgTZBWsc8qKaViP",
    SCOUT_ID : "Compendium.pf2e.actionspf2e.Item.kV3XM0YJeS2KCSOb",
    SEARCH_ID : "Compendium.pf2e.actionspf2e.Item.TiNDYUGlMmxzxBYU",
    TRACK_ID : "Compendium.pf2e.actionspf2e.Item.EA5vuSgJfiHH7plD",
}

function getPartyMembers(){
    return game.actors.party.members.filter((m) => m.isOfType("character"));
}

// TODO: Create Refresh Data and rerender when data is refreshed
// TODO: Split Activities into Supported and Unsupported. Unsupported activities will only have 2 columns
async function getExplorationData(){
    const partyMembers = getPartyMembers();
    let supportedActivities = {};
    let otherActivities = {};
    for(const partyMember of partyMembers){
        for(const activityId of partyMember.system.exploration){
            const activity = partyMember.items.get(activityId);

            //If supported add data to supported activities
            if(Object.values(SUPPORTED_ACTIVITIES).includes(activity.sourceId)){
                if(supportedActivities[activity.name]){
                    supportedActivities[activity.name].players = { ...supportedActivities[activity.name].players,
                        [partyMember.name]: {
                            name: partyMember.name,
                            id: partyMember.id,
                            color: getUserColor(partyMember)
                        }
                    };
                }
                else{
                    supportedActivities = {...supportedActivities,
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
                const activityName = supportedActivities[activity.name].name;
                let skill, result;             
                switch(activity.sourceId){
                    // Avoid Notice
                    case SUPPORTED_ACTIVITIES.AVOID_NOTICE_ID:
                        skill = partyMember.skills.stealth;
                        result = await getRollResult(partyMember, skill, activityName, "avoid-notice");
                        supportedActivities[activity.name].players[partyMember.name].roll = result;
                    break;
                    // Defend
                    case SUPPORTED_ACTIVITIES.DEFEND_ID:
                        // TODO: IDEA is to have defend hook onto combat creation and apply effect with duration lasting until player's turn
                        supportedActivities[activity.name].players[partyMember.name].button = {
                            label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                            actorId: partyMember.id,
                            dataAction: "applyRaiseAShield"
                        }
                    break;
                    // Follow the Expert
                    case SUPPORTED_ACTIVITIES.FOLLOW_THE_EXPERT_ID:
                        
                    break;
                    // Gather Information
                    case SUPPORTED_ACTIVITIES.GATHER_INFORMATION_ID:
                        skill = partyMember.skills.diplomacy;
                        result = await getRollResult(partyMember, skill, activityName, "gather-information");
                        supportedActivities[activity.name].players[partyMember.name].roll = result;  
                    break;
                    // Impersonate
                    case SUPPORTED_ACTIVITIES.IMPERSONATE_ID:
                        skill = partyMember.skills.deception;
                        result = await getRollResult(partyMember, skill, activityName, "impersonate");
                        supportedActivities[activity.name].players[partyMember.name].roll = result;
                    break;
                    // Investigate
                    case SUPPORTED_ACTIVITIES.INVESTIGATE_ID:

                    break;
                    // Scout
                    case SUPPORTED_ACTIVITIES.SCOUT_ID:
                        supportedActivities[activity.name].players[partyMember.name].button = {
                            label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                            dataAction: "applyScout"
                        }
                    break;
                    // Search
                    case SUPPORTED_ACTIVITIES.SEARCH_ID:
                        skill = partyMember.perception;
                        result = await getRollResult(partyMember, skill, activityName, "search", "seek");
                        supportedActivities[activity.name].players[partyMember.name].roll = result;                  
                    break;
                    // Track
                    case SUPPORTED_ACTIVITIES.TRACK_ID:
                        skill = partyMember.skills.survival;
                        result = await getRollResult(partyMember, skill, activityName, "track");
                        supportedActivities[activity.name].players[partyMember.name].roll = result;
                    break;
                }
            }
            else {
                if(otherActivities[activity.name]){
                    otherActivities[activity.name].players = { ...otherActivities[activity.name].players,
                        [partyMember.name]: {
                            name: partyMember.name,
                            id: partyMember.id,
                            color: getUserColor(partyMember)
                        }
                    };
                }
                else{
                    otherActivities = {...otherActivities,
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
            }
        }
    }

    // Turn activities into Array for sorting then back into object
    supportedActivities = Object.fromEntries(Object.entries(supportedActivities).sort((a, b) => {
        if(a[1].name < b[1].name) { return -1; }
        if(a[1].name > b[1].name) { return 1; }
        return 0;
    }));

    // Turn activities into Array for sorting then back into object
    otherActivities = Object.fromEntries(Object.entries(otherActivities).sort((a, b) => {
        if(a[1].name < b[1].name) { return -1; }
        if(a[1].name > b[1].name) { return 1; }
        return 0;
    }));

    const activities = {supportedActivities, otherActivities}
    console.log(activities);

    return activities;
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

async function getRollResult(actor, skill, actionName, actionSlug, subordinateActionSlug){
    const domains = ['all', 'check', 'skill-check', `${skill.slug}`, `${skill.slug}-check`, `${skill.attribute}-based`, `${skill.attribute}-skill-check`]
    
    const actionPredicates = [`action:${actionSlug}`];
    if(subordinateActionSlug) actionPredicates.push(`action:${subordinateActionSlug}`);
    
    const options = actor.getRollOptions(domains);
    options.push("secret");
    actionPredicates.forEach((p) => {options.push(p)});


    const checkModifiers = new game.pf2e.CheckModifier(`${actionName} (${skill.label})`, skill);
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
    console.log(rollData);
    const color = getRollColor(rollData.dice[0]);
    const {enabledModifiers, remainingModifiers} = getEnabledRollModifiers(checkModifiers);
    const potentialModifiers = getPotentialRollModifiers(remainingModifiers, actionPredicates);
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
    let enabledModifiers = [];
    let remainingModifiers = [];

    checkModifiers.modifiers.forEach((m) => {
        m.enabled ? enabledModifiers.push(m) : remainingModifiers.push(m)
    });
    
    return {enabledModifiers: enabledModifiers, remainingModifiers: remainingModifiers};
}

// Check's Modifier's predicates to see if any match the predicateToSearch
function getPotentialRollModifiers(checkModifiers, predicatesToSearch){  
    const potentialModifiers = checkModifiers?.
        filter((m) => m.type !== "proficiency").                            // Filter out proficiency modifiers
        filter((m) => isStringInObject(m.predicate, predicatesToSearch));   // Checks for predicates matching

    return potentialModifiers;
}

function isStringInObject(obj, strings){
    const found = Object.keys(obj).some(key => {
        if(typeof obj[key] === "object"){
            return isStringInObject(obj[key], strings);
        }
        if(typeof obj[key] === "string"){
            return strings.some((s) => {
                return obj[key] === s
            });
        }
    });
    return found;
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