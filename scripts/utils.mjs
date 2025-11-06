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

async function getExplorationData(){
    const partyMembers = getPartyMembers();
    let activities = {};
    for(const partyMember of partyMembers){
        for(const activityId of partyMember.system.exploration){
            const activity = partyMember.items.get(activityId);

            //If supported add data to supported activities
            if(Object.values(SUPPORTED_ACTIVITIES).includes(activity?.sourceId)){
                if(activities[activity.name]){
                    activities[activity.name].players = { ...activities[activity.name].players,
                        [partyMember.name]: {
                            actor: partyMember
                        }
                    };
                }
                else{
                    activities = {...activities,
                        [activity.name]:{
                            activity: activity,
                            traits: activity.traits.map((trait) => ({ 
                                name: trait,
                                tooltip: CONFIG.PF2E.traitsDescriptions[trait]
                            })),
                            supported: true,
                            enrichedHTML: await TextEditor.enrichHTML(`@UUID[${activity.sourceId}]`),
                            players: {
                                [partyMember.name]: {
                                    actor: partyMember
                                }
                            }
                        }
                    }
                }

                let skill, result;
                switch(activity.sourceId){
                    // Avoid Notice
                    case SUPPORTED_ACTIVITIES.AVOID_NOTICE_ID:
                        skill = partyMember.skills.stealth;
                        result = await getRollResult(partyMember, skill, activity.name);
                        activities[activity.name].players[partyMember.name].roll = result;
                    break;
                    // Defend
                    case SUPPORTED_ACTIVITIES.DEFEND_ID:
                        // TODO: IDEA is to have defend hook onto combat creation and apply effect with duration lasting until player's turn
                        activities[activity.name].players[partyMember.name].button = {
                            label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                            dataAction: "applyRaiseAShield"
                        }
                    break;
                    // Follow the Expert
                    case SUPPORTED_ACTIVITIES.FOLLOW_THE_EXPERT_ID:
                        activities[activity.name].players[partyMember.name].button = {
                            label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                            dataAction: "applyFollowTheExpert"
                        }
                    break;
                    // Gather Information
                    case SUPPORTED_ACTIVITIES.GATHER_INFORMATION_ID:
                        skill = partyMember.skills.diplomacy;
                        result = await getRollResult(partyMember, skill, activity.name);
                        activities[activity.name].players[partyMember.name].roll = result;  
                    break;
                    // Impersonate
                    case SUPPORTED_ACTIVITIES.IMPERSONATE_ID:
                        skill = partyMember.skills.deception;
                        result = await getRollResult(partyMember, skill, activity.name);
                        activities[activity.name].players[partyMember.name].roll = result;
                    break;
                    // Investigate
                    case SUPPORTED_ACTIVITIES.INVESTIGATE_ID:
                        
                        activities[activity.name].players[partyMember.name].roll = await getRecallKnowledgeResults(partyMember);
                        
                        // let results = [];
                        // RECALL_KNOWLEDGE_SKILLS.forEach( async (recallKnowledgeSkill) => {
                        //     skill = partyMember.skills[recallKnowledgeSkill];
                        //     result = await getRollResult(partyMember, skill, activity.name, "recall-knowledge");
                        //     results.push(result);
                        // });
                        // activities[activity.name].players[partyMember.name].rolls = results;
                    break;
                    // Scout
                    case SUPPORTED_ACTIVITIES.SCOUT_ID:
                        activities[activity.name].players[partyMember.name].button = {
                            label: game.i18n.localize("PF2e-EAT.toggle-effect-button"),
                            dataAction: "applyScout"
                        }
                    break;
                    // Search
                    case SUPPORTED_ACTIVITIES.SEARCH_ID:
                        skill = partyMember.perception;
                        result = await getRollResult(partyMember, skill, activity.name, "seek");
                        activities[activity.name].players[partyMember.name].roll = result;                  
                    break;
                    // Track
                    case SUPPORTED_ACTIVITIES.TRACK_ID:
                        skill = partyMember.skills.survival;
                        result = await getRollResult(partyMember, skill, activity.name);
                        activities[activity.name].players[partyMember.name].roll = result;
                    break;
                }
            }
            else {
                if(activities[activity.name]){
                    activities[activity.name].players = { ...activities[activity.name].players,
                        [partyMember.name]: {
                            actor: partyMember
                        }
                    };
                }
                else{
                    activities = {...activities,
                        [activity.name]:{
                            activity: activity,
                            traits: activity.traits.map((trait) => ({ 
                                name: trait,
                                tooltip: CONFIG.PF2E.traitsDescriptions[trait]
                            })),
                            unsupported: true,
                            enrichedHTML: await TextEditor.enrichHTML(`@UUID[${activity.sourceId}]`),
                            players: {
                                [partyMember.name]: {
                                    actor: partyMember
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Turn activities into Array for sorting then back into object
    activities = Object.fromEntries(Object.entries(activities).sort((a, b) => {
        if(a[1].activity.name < b[1].activity.name) { return -1; }
        if(a[1].activity.name > b[1].activity.name) { return 1; }
        return 0;
    }));
    console.log(activities);

    return activities;
}

async function getRecallKnowledgeResults(actor){
    const recallKnowledgeSkills = ["arcana","crafting","medicine","nature","occultism","religion","society"];
    const loreSkills = Object.values(actor.skills).filter((s) => s.lore).map((s) => s.slug);
    const skills = recallKnowledgeSkills.concat(loreSkills);

    const dummySkill = actor.skills.arcana;
    const dummyCheckModifiers = new game.pf2e.CheckModifier(`Dummy Roll`, dummySkill);
    const rollData = await game.pf2e.Check.roll(
        dummyCheckModifiers, 
        {
            actor: actor,
            type: `skill-check`,
            traits: ['exploration'],
            createMessage: false,
            skipDialog: true
        }
    );
    
    let rollModifiers = [];
    skills.forEach((s) => {
        const skill = actor.skills[s];
        const domains = ['all', 'check', 'skill-check', `${skill.slug}`, `${skill.slug}-check`, `${skill.attribute}-based`, `${skill.attribute}-skill-check`]
        const actionPredicates = [`action:investigate`, `action:recall-knowledge`];

        const options = actor.getRollOptions(domains);
        options.push("secret");
        options.concat(actionPredicates);

        const checkModifiers = new game.pf2e.CheckModifier(`Investigate (${skill.label})`, skill);
        const {enabledModifiers, remainingModifiers} = getEnabledRollModifiers(checkModifiers);
        const potentialModifiers = getPotentialRollModifiers(remainingModifiers, actionPredicates);

        rollModifiers.push({
            skillName: skill.label,
            totalModifier: checkModifiers.totalModifier,
            enabledModifiers: enabledModifiers,
            potentialModifiers: potentialModifiers
        })
    });

    return {
        rollValue: rollData.dice[0].total,
        rollModifiers: rollModifiers
    }
}

async function getRollResult(actor, skill, activityName, subordinateActionSlug){
    const domains = ['all', 'check', 'skill-check', `${skill.slug}`, `${skill.slug}-check`, `${skill.attribute}-based`, `${skill.attribute}-skill-check`]

    const actionPredicates = [`action:${activityName.slugify()}`];
    if(subordinateActionSlug) actionPredicates.push(`action:${subordinateActionSlug}`);
    
    const options = actor.getRollOptions(domains);
    options.push("secret");
    options.concat(actionPredicates);

    const checkModifiers = new game.pf2e.CheckModifier(`${activityName} (${skill.label})`, skill);
    const rollData = await game.pf2e.Check.roll(
        checkModifiers, 
        {
            actor: actor,
            type: `skill-check`,
            traits: ['exploration'],
            options,
            domains,
            createMessage: false,
            skipDialog: true
        }
    );
    const {enabledModifiers, remainingModifiers} = getEnabledRollModifiers(checkModifiers);
    const potentialModifiers = getPotentialRollModifiers(remainingModifiers, actionPredicates);
    return {
        rollValue: rollData.dice[0].total,
        totalModifier: rollData.options.totalModifier,
        enabledModifiers: enabledModifiers,
        potentialModifiers: potentialModifiers
    };
}

function getEnabledRollModifiers(checkModifiers){
    let enabledModifiers = [];
    let remainingModifiers = [];

    checkModifiers.modifiers.forEach((m) => {
        m.enabled ? enabledModifiers.push(m) : remainingModifiers.push(m)
    });
    
    return {
        enabledModifiers: enabledModifiers, 
        remainingModifiers: remainingModifiers
    };
}

// Check's Modifier's predicates to see if any match the predicateToSearch
function getPotentialRollModifiers(checkModifiers, predicatesToSearch){  
    //hardcoded predicates to search for (potentially change this to check toggleable roll-options)
    const hardCodedPotentialPredicates = ["pursue-a-lead"];
    hardCodedPotentialPredicates.forEach((p) => predicatesToSearch.push(p));
    const potentialModifiers = checkModifiers?.
        filter((m) => m.type !== "proficiency").                            // Filter out proficiency modifiers
        filter((m) => isStringInObject(m.predicate, predicatesToSearch)     // Checks for predicates matching
    );   

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