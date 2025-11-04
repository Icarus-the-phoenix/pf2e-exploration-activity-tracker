import { PF2eEATConstants } from "./constants.mjs";
import { getPartyMembers } from "./utils.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class FollowTheExpertApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        window:{
            title:"Follow the Expert",
            icon:"fa-solid fa-trees"
        },
        tag: 'form',
        form: {
            handler: FollowTheExpertApp.formHandler,
            closeOnSumbit: true
        }
    }, {inplace: false});

    static PARTS = {
        body: { template: PF2eEATConstants.TEMPLATES.FOLLOW_THE_EXPERT_APP }.template,
        footer: { template: "templates/generic/form-footer.hbs" }
    }

    constructor(options ={}){
        super(options);
        this.data = {};
    }

    async _prepareContext(partId, context) {     
        const partyMembers = getPartyMembers();

        if(Object.keys(this.data).length === 0){
            const data = partyMembers.map((m) => {
                return {
                    name: m.name,
                    id: m.id,
                    skills : {
                        ...Object.keys(m.skills).reduce((r,e) => {
                            if(m.skills[e].rank >= 2) r[e] = { label: m.skills[e].label, rank: m.skills[e].rank };
                            return r
                        }, {})
                    }
                }
            })
            data[0].selected = true;

            data.buttons = [
                {type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
            ]

            this.data = data;
            console.log(data);
            
        }

        return this.data;
    }

    //TODO: Rerender app and figure out how to hide/show the proper skills automatically
    _onChangeForm(formConfig, event){
        if(event.target.name === "party-member"){           
            const playerId = event.target.value;
            const newData = this.data.map((d) => {
                if(d.id === playerId){
                    d.selected = true;
                    return d;
                }
                else{
                    d.selected = false;
                    return d;
                }
            });
            this.data = newData;
            this.render(true);
        }
    }

    static async formHandler (event, form, formData){
        console.log(event, form, formData);
    }   
}