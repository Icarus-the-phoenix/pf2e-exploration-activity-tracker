

// TODO: Update to have all relevant information in SUPPORTED_ACTIVITES const
// {
//     AVOID_NOTICE_DATA : {
//         sourceId: "Compendium.pf2e.actionspf2e.Item.IE2nThCmoyhQA0Jn",
//         skillToCheck: "stealth",
//         activityName: "Avoid Notice",
//         activitySlug: "avoid-notice"
//     }
// }
//      Then rework getExplorationData() to use generic functions example:
// function getRollData(actor, skillToCheck, name){ }

const SUPPORTED_ACTIVITIES = [
    {
        activityName: "Avoid Notice",
        sourceId: "Compendium.pf2e.actionspf2e.Item.IE2nThCmoyhQA0Jn",
        skillsToCheck: ["stealth"],
    },
    {
        activityName: "Defend",
        sourceId: "Compendium.pf2e.actionspf2e.Item.cYtYKa1gDEl7y2N0",
        applyEffect: { effectUUID: "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr", toAll: false },
    },
    {
        activityName: "Follow the Expert",
        sourceId: "Compendium.pf2e.actionspf2e.Item.tfa4Sh7wcxCEqL29",
        applyEffect: { effectUUID: "Compendium.pf2e.other-effects.Item.VCSpuc3Tf3XWMkd3", toAll: false },
    },
    {
        activityName: "Gather Information",
        sourceId: "Compendium.pf2e.actionspf2e.Item.plBGdZhqq5JBl1D8",
        skillsToCheck: ["diplomacy"],
    },
    {
        activityName: "Impersonate",
        sourceId: "Compendium.pf2e.actionspf2e.Item.AJstokjdG6iDjVjE",
        skillsToCheck: ["deception"],
    },
    {
        activityName: "Investigate",
        sourceId: "Compendium.pf2e.actionspf2e.Item.EwgTZBWsc8qKaViP",
        skillsToCheck: ["arcana","crafting","medicine","nature","occultism","religion","society","lores"],
        subordinateActionSlug: "recall-knowledge"
    },
    {
        activityName: "Scout",
        sourceId: "Compendium.pf2e.actionspf2e.Item.kV3XM0YJeS2KCSOb",
        applyEffect: { effectUUID: "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF", toAll: true } ,
    },
    {
        activityName: "Search",
        sourceId: "Compendium.pf2e.actionspf2e.Item.TiNDYUGlMmxzxBYU",
        skillsToCheck: ["perception"],
        subordinateActionSlug: "seek",
    },
    {
        activityName: "Track",
        sourceId: "Compendium.pf2e.actionspf2e.Item.EA5vuSgJfiHH7plD",
        skillsToCheck: ["survival"],
    },
]


function getPartyMembers(){
    return game.actors.party.members.filter((m) => m.isOfType("character"));
}

async function getExplorationData(){
    const partyMembers = getPartyMembers();
    let activityData = {};

    for(const partyMember of partyMembers){
        for(const activityId of partyMember.system.exploration){
            const activity = partyMember.items.get(activityId);
            activityData = await prepareActivityData(activityData, activity, partyMember);
        }
    }
    console.log("New Activity DATA", activityData);

    return activityData;
}

async function prepareActivityData(activityData, activity, actor){
    const supportedActivity = SUPPORTED_ACTIVITIES.find(item => item.sourceId === activity.sourceId);
    
    // If Activity doesn't exist in list, create data for it
    if(!activityData[activity.name]) {
        activityData = { ...activityData, 
            [activity.name]:{
                activity: activity,
                traits: activity.traits.map((trait) => ({ 
                    name: trait,
                    tooltip: CONFIG.PF2E.traitsDescriptions[trait]
                })),
                ...(supportedActivity) && { supported: true },
                players: {
                    ...await prepareActorData(actor, supportedActivity)
                }
            }
        }
    }
    else {
        activityData[activity.name].players = { ...activityData[activity.name].players,
            ...await prepareActorData(actor, supportedActivity)
        };
    }

    return activityData;
}

async function prepareActorData(actor, supportedActivity) {
    return {
        [actor.name]: {
            actor: actor,
            ...(supportedActivity?.applyEffect) && { applyEffect: supportedActivity.applyEffect },
            ...await prepareRollData(actor, supportedActivity),

        }
    }
}

async function prepareRollData(actor, supportedActivity){
    if(!supportedActivity?.skillsToCheck) return false;

    const roll = await game.pf2e.Check.roll(
        new game.pf2e.StatisticModifier('d20Roll', []),
        {
            actor: {},
            type: "flat-check",
            options: ["flat-check"],
            createMessage: false,
            skipDialog: true,
            rollMode: "blindroll"
        }
    );
    const rollValue = roll.total;

    let rollModifiers = [];
    for(const skillToCheck of supportedActivity.skillsToCheck){
        if(skillToCheck === "lores"){
            const loreSkills = Object.values(actor.skills).filter((s) => s.lore).map((s) => s.slug).sort();
            loreSkills.forEach( loreSkill => {
                rollModifiers.push(prepareRollModifiers(actor, supportedActivity, loreSkill));
            })
        }else{
            rollModifiers.push(prepareRollModifiers(actor, supportedActivity, skillToCheck));
        }
    }

    return {
        roll : {
            rollValue: rollValue,
            rollModifiers: rollModifiers
        }
    }
}

function prepareRollModifiers(actor, supportedActivity, skillToCheck){
    const skill = actor.getStatistic(skillToCheck);
    const domains =  ['all', 'check', 'skill-check', `${skill.slug}`, `${skill.slug}-check`, `${skill.attribute}-based`, `${skill.attribute}-skill-check`]
    const actionPredicates = [`action:${supportedActivity.activityName.slugify()}`];
    if(supportedActivity.subordinateActionSlug) actionPredicates.push(`action:${supportedActivity.subordinateActionSlug}`);

    const options = actor.getRollOptions(domains);
    options.concat("secret",actionPredicates);

    const checkModifiers = new game.pf2e.CheckModifier(`${supportedActivity.activityName} (${skill.label})`, skill);
    const {enabledModifiers, remainingModifiers} = getEnabledRollModifiers(checkModifiers);
    const potentialModifiers = getPotentialRollModifiers(remainingModifiers, actionPredicates);

    return {
        skillName: skill.label,
        totalModifier: checkModifiers.totalModifier,
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