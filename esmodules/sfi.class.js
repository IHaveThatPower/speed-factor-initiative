import { PropertyAttribution } from './PropertyAttribution.class.js';

export class SFI
{
	static MODULE_NAME = 'speed-factor-initiative';
	static SOCKET_NAME = 'module.speed-factor-initiative';

	static FLAG_ACTION_CHOSEN = 'action-chosen';
	static FLAG_ACTION_TARGET = 'action-target';
	static FLAG_LAST_ACTION = 'last-action';

	static FLAG_BONUS_ACTION_CHOSEN = 'bonus-action-chosen';
	static FLAG_BONUS_ACTION_TARGET = 'bonus-action-target';
	static FLAG_LAST_BONUS_ACTION = 'last-bonus-action';

	static FLAG_ROLL_RESULT = 'roll-result';

	static actionModifiers = [
		{
			"name": "Attack/Cantrip",
			"nameFull": "Attack &mdash; General, Cantrip",
			"tooltip": "A weapon attack or Cantrip",
			"mod": +0
		},
		{
			"name": "Dash/Help/Hide",
			"nameFull": "Dash, Help, Hide",
			"mod": +0
		},
		{
			"name": "Medium Action",
			"nameFull": "Medium Action",
			"tooltip": "An action comparable to Attack, Dash, Help, or Hide",
			"mod": +0
		},
		{
			"name": "Attack, Light/Finesse/Unarmed",
			"nameFull": "Attack &mdash; Light/Finesse/Unarmed",
			"tooltip": "Attacking with a weapon that has the 'light' or 'finesse' properties, or an unarmed attack",
			"mod": +2
		},
		{
			"name": "Fast Action",
			"nameFull": "Fast Action",
			"mod": +2
		},
		{
			"name": "Very Fast Action",
			"nameFull": "Very Fast Action",
			"tooltip": "Something done almost reflexively (e.g. Dodge)",
			"mod": +5
		},
		{
			"name": "Dodge",
			"nameFull": "Dodge",
			"mod": +5
		},
		{
			"name": "Melee, Heavy Weapon",
			"nameFull": "Attack &mdash; Melee, Heavy Weapon",
			"tooltip": "Melee attack with a weapon that has the 'heavy' property",
			"mod": -2
		},
		{
			"name": "Slow Action",
			"nameFull": "Slow Action",
			"tooltip": "Something that requires some precision to complete (e.g. retrieving an accessible item)",
			"mod": -2
		},
		{
			"name": "Melee, Two-Handed Weapon",
			"nameFull": "Attack &mdash; Melee, Two-Handed Weapon",
			"tooltip": "Melee attack with a weapon that has the 'two-handed' property",
			"mod": -5
		},
		{
			"name": "Ranged, Loading Weapon",
			"nameFull": "Attack &mdash; Ranged, Loading Weapon",
			"tooltip": "Ranged attack with a weapon that has the 'loading' property (e.g. crossbow)",
			"mod": -5
		},
		{
			"name": "Very Slow Action",
			"nameFull": "Very Slow/Complex Action",
			"tooltip": "Something that requires the whole round to complete (e.g. retrieving a stowed item)",
			"mod": -5
		},
		{
			"name": "Incapacitated",
			"nameFull": "Incapacitated",
			"tooltip": "Incapacitated, stunned, etc.",
			"mod": -5
		},
		{
			"name": "Spellcasting, 1st level",
			"nameFull": "Spellcasting, 1st level",
			"mod": -1
		},
		{
			"name": "Spellcasting, 2nd level",
			"nameFull": "Spellcasting, 2nd level",
			"mod": -2
		},
		{
			"name": "Spellcasting, 3rd level",
			"nameFull": "Spellcasting, 3rd level",
			"mod": -3
		},
		{
			"name": "Spellcasting, 4th level",
			"nameFull": "Spellcasting, 4th level",
			"mod": -4
		},
		{
			"name": "Spellcasting, 5th level",
			"nameFull": "Spellcasting, 5th level",
			"mod": -5
		},
		{
			"name": "Spellcasting, 6th level",
			"nameFull": "Spellcasting, 6th level",
			"mod": -6
		},
		{
			"name": "Spellcasting, 7th level",
			"nameFull": "Spellcasting, 7th level",
			"mod": -7
		},
		{
			"name": "Spellcasting, 8th level",
			"nameFull": "Spellcasting, 8th level",
			"mod": -8
		},
		{
			"name": "Spellcasting, 9th level",
			"nameFull": "Spellcasting, 9th level",
			"mod": -9
		},
		{
			"name": "None",
			"nameFull": "No action",
			"mod": 0
		}
	];

	static sizeModifiers = {
		"tiny" : +5,
		"sm" : +2,
		"med" : +0,
		"lg" : -2,
		"huge" : -5,
		"grg" : -8
	};

	/**
	 * Execute socket calls or respond to them
	 *
	 * @param	string settingName
	 * @param	object settingPayload
	 * @param	bool [optional] reRenderUI
	 * @param	bool [optional] fromSocket
	 * @return	void
	 */
	static async handleUpdate(payload)
	{
		// To be the "update GM" the user must be both a GM and the
		// "active" GM with the lowest user ID
		const isUpdateGM = game.user.isGM && !(game.users.filter(user => user.isGM && user.active).some(other => other._id < game.user._id));
		if (payload.showSelect && !isUpdateGM)
		{
			SFI.chooseRoundAction();
		}
		else if (payload.token && payload.actionChosen && payload.bonusActionChosen)
		{
			if (isUpdateGM)
			{
				// Set the action flags
				const combatant = game.combats.active.combatants.find((c) => c.token.id == payload.token);
				if (!combatant)
				{
					ui.notifications.warn(`Tried to update token ${payload.token}, but it wasn't in the combatant list`);
					return;
				}
				await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN, payload.actionChosen);
				await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN, payload.bonusActionChosen);
				if (payload.actionTarget)
					await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_TARGET, payload.actionTarget);
				if (payload.bonusActionTarget)
					await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_TARGET, payload.bonusActionTarget);
				if (payload.explicitRoll)
					await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_ROLL_RESULT, payload.explicitRoll);
			}
			else
			{
				// Sanity check this user is allowed to do this
				const affectableTokens = SFI.getLegalTokens();
				if (!(affectableTokens.find((token) => token.id == payload.token)))
					return;

				console.log("SFI | Emitting socket event with payload", payload);
				game.socket.emit(SFI.SOCKET_NAME, payload);
			}
		}
	}

	/**
	 * Assuming conditions permit, display the dialog to choose round
	 * actions for selected tokens.
	 *
	 * @param {string} combatantId  Optional ID of a combatant to choose an action for
	 * @return	bool
	 */
	static chooseRoundAction(combatantId)
	{
		// Make sure an encounter exists!
		if (!game.combat)
		{
			ui.notifications.error('Cannot choose a round action outside of combat!');
			return false;
		}

		// Determine what tokens we can affect
		const affectTokens = SFI.getTokenListForDialog(combatantId);
		if (!affectTokens)
			return false;

		(async function(affectTokens)
		{
			const sortedActionModifiers = SFI.getSortedActionModifiers();
			for (let i = 0; i < affectTokens.length; i++)
			{
				if (!SFI.canTokenChooseAction(affectTokens[i]))
				{
					ui.notifications.warn("Only the GM can modify actions once initiative has been rolled for the round");
					continue;
				}
				const dialogData = {
						'actions': sortedActionModifiers,
						'action-width': sortedActionModifiers.reduce((a, b) => {
															return a.action.nameFull.replace('&mdash;', 'm').length > b.action.nameFull.replace('&mdash;', 'm').length ? a : b;
														}).action.nameFull.replace('&mdash;', 'm').length,
						'init-mod-size': SFI.sizeModifiers[affectTokens[i].actor.system.traits.size],
						'init-mod-dex': affectTokens[i].actor.system.abilities.dex.mod,
						'action-target': affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_TARGET),
						'bonus-action-target': affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_TARGET),
						'last-action': affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN) ?? affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_LAST_ACTION),
						'last-bonus-action': affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN) ?? affectTokens[i].combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_LAST_BONUS_ACTION)
				};
				const dialogContent = await renderTemplate(
					"modules/speed-factor-initiative/templates/initiative.html",
					dialogData
				);
				const name = affectTokens[i].name;
				new Dialog({
					title: `Choose Round Action: ${name}`,
					content: dialogContent,
					buttons: {
						yes:{
							icon: '<i class="fas fa-dice-d20"></i>',
							label: 'Set Action',
							callback: (html) => {
								SFI.setAction(affectTokens[i], html);
							}
						},
						no:{
							icon: '<i class="fas fa-times-circle"></i>',
							label: 'Cancel'
						}
					}
				}).render(true);
			}
		})(affectTokens);
		return true;
	}

	/**
	 * Determine what set of tokens should be operated on for
	 * chooseRoundAction()
	 *
	 * @param {string} combatantId	Optional specific combatant
	 * @return {mixed}	Array of tokens on success, false on error
	 */
	static getTokenListForDialog(combatantId)
	{
		const activeCombatants = game.combats.active.combatants;
		let affectTokens = [];
		if (combatantId)
		{
			// Find token corresponding to combatant
			const combatant = activeCombatants.find(ac => ac.id == combatantId);
			const affectableTokens = SFI.getLegalTokens();
			affectTokens = affectableTokens.filter(at => at.id == combatant.tokenId);
			if (affectTokens.length == 0)
			{
				if (game.user.isGM)
					ui.notifications.error("Token for that combatant was not found");
				else
					ui.notifications.error("You don't own that combatant's token");
				return false;
			}
		}
		else
		{
			const controlledTokens = canvas.tokens.controlled;
			const ownedTokens = canvas.tokens.ownedTokens;
			// Start with controlled tokens
			if (controlledTokens.length > 0)
				affectTokens = activeCombatants.filter(ac => controlledTokens.find((ct) => ct.id == ac.token.id))?.map(ac => ac.token);
			// Failing that, go to all owned tokens --- TODO: Maybe?
			if (affectTokens.length == 0 && game.user.isGM)
				affectTokens = activeCombatants.filter(ac => ownedTokens.find((ot) => ot.id == ac.token.id))?.map(ac => ac.token);

			// If we get here, something went screwy; let the user know
			if (affectTokens.length == 0)
			{
				ui.notifications.error("No tokens found that could be affected");
				return false;
			}
		}
		return affectTokens;
	}

	/**
	 * Determine what tokens the current user can legally affect
	 *
	 * @return	{array}
	 */
	static getLegalTokens()
	{
		const controlledTokens = canvas.tokens.controlled;
		const ownedTokens = canvas.tokens.ownedTokens;
		let affectableTokens = controlledTokens.concat(ownedTokens);
		affectableTokens = [...new Map(affectableTokens.map((m) => [m.id, m])).values()];
		return affectableTokens;
	}

	/**
	 * Determine if the token's in a state where it's legal for it to
	 * choose its next action
	 *
	 * @param	{Token} token
	 * @return	bool
	 */
	static canTokenChooseAction(token)
	{
		if (game.user.isGM)
			return true;
		// Initiative has already been rolled for all active combatants?
		const combatants = game.combats.active.combatants;
		let allRolled = true;
		for (let c of combatants)
		{
			// Only truly dead combatants are ignored
			const isDead = SFI.isDead(c.token)
			if (!isDead && (c.initiative == null || typeof c.initiative == 'undefined'))
			{
				allRolled = false;
				break;
			}
		}
		return !allRolled;
	}

	/**
	 * Sort the action modifiers while preserving their keys
	 *
	 * @return {array}
	 */
	static getSortedActionModifiers()
	{
		let sortedActionModifiers = [];
		for (let a = 0; a < SFI.actionModifiers.length; a++)
		{
			sortedActionModifiers.push({'index': a, 'action': SFI.actionModifiers[a]});
		}
		sortedActionModifiers.sort((a, b) => {
			// "None" goes to the top
			const aIsNone = a.action.name.startsWith('None');
			const bIsNone = b.action.name.startsWith('None');
			if (aIsNone && !(bIsNone))
				return -1;
			if (bIsNone && !(aIsNone))
				return 1;
			// Incapacitated goes to the bottom
			const aIsIncap = a.action.name.startsWith('Incapacitated');
			const bIsIncap = b.action.name.startsWith('Incapacitated');
			if (aIsIncap && !(bIsIncap))
				return -1;
			if (bIsIncap && !(aIsIncap))
				return 1;
			// Spellcasting always sorts to the end
			const aIsSpell = a.action.name.startsWith('Spellcasting');
			const bIsSpell = b.action.name.startsWith('Spellcasting');
			if (aIsSpell && !(bIsSpell))
				return 1;
			if (bIsSpell && !(aIsSpell))
				return -1;
			if (a.action.mod > b.action.mod)
				return -1;
			if (a.action.mod < b.action.mod)
				return 1;
			return a.action.name.localeCompare(b.action.name);
		});
		return sortedActionModifiers;
	}

	/**
	 * Invoked by the Choose Round Action dialog when an action is chosen
	 *
	 * @param	token
	 * @param	html
	 * @return	void
	 */
	static async setAction(token, html)
	{
		const formData = (new FormDataExtended(html[0].querySelector('form.speedFactorInitiative'))).object;
		if (!(formData['init-mod-action'] in SFI.actionModifiers) || !(formData['init-mod-bonus-action'] in SFI.actionModifiers))
		{
			ui.notifications.error("Invalid action selection");
			SFI.chooseRoundAction(token.combatant.id);
			return;
		}
		if (formData['init-roll'] && (!(Number.isNumeric(formData['init-roll'])) || !(Number.isInteger(Number.fromString(formData['init-roll'])))))
		{
			ui.notifications.error("Initiative roll must be a valid integer");
			SFI.chooseRoundAction(token.combatant.id);
			return;
		}
		const payload = {
			token: token.id,
			actionChosen: formData['init-mod-action'],
			actionTarget: formData['action-target'],
			bonusActionChosen: formData['init-mod-bonus-action'],
			bonusActionTarget: formData['bonus-action-target'],
			explicitRoll: formData['init-roll']
		};
		SFI.handleUpdate(payload);
	}

	/**
	 * Handle a combat event that we care about
	 *
	 * @param	string eventType
	 * @param	Combat combat
	 * @param	object round
	 * @param	object time
	 * @return	void
	 */
	static async handleCombatEvent(eventType, combat, round, time)
	{
		console.log("SFI | event type", eventType, "combat", combat, "round", round, "time", time);
		// At the top of a new round, clear all initiative rolls
		if (eventType == "round")
		{
			await combat.resetAll();
			for (let combatant of combat.combatants)
			{
				if (combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN))
				{
					await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_LAST_ACTION, combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN));
					await combatant.setFlag(SFI.MODULE_NAME, SFI.FLAG_LAST_BONUS_ACTION, combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN));
					await combatant.unsetFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN);
					await combatant.unsetFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN);
				}
			}
		}
		// Then display a prompt to each player to select an action
		if ((eventType == "start" || eventType == "round") && game.user.isGM)
		{
			game.socket.emit(SFI.SOCKET_NAME, {'showSelect': true});
		}
		// If turn advancement occurred, do a sanity check to ensure all combatants chose an action
		if (eventType == "turn")
		{
			if (!SFI.checkActionsChosen(combat, round))
				return;
			if (!SFI.checkInitiativeRolled(combat, round))
				return;
		}
	}

	/**
	 * When a turn is advanced, check to ensure all combatants have a
	 * chosen action and abort advancement if not.
	 *
	 * @return	{bool}
	 */
	static checkActionsChosen(combat, round)
	{
		// No combatants = nothing to do
		if (combat.combatants?.size == 0)
		{
			return true;
		}
		for (let combatant of combat.combatants)
		{
			const isDead = SFI.isDead(combatant.token);
			if (!(isDead) && (!combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN) || !combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN)))
			{
				if (combatant.isNPC == false || game.user.isGM) // TODO: Should check player-is-owner, not isNPC; wrap into function
				{
					ui.notifications.warn(`Combatant ${combatant.name} must choose actions!!`);
				}
				else
				{
					ui.notifications.warn("A combatant still needs to choose actions!");
				}
				if (game.user.isGM)
				{
					combat.update({'turn': 0});
					round.turn = 0;
				}
				return false;
			}
		}
		return true;
	}

	/**
	 * When a turn is advanced, check to ensure all combatants have rolled
	 * initiative and abort advancement if not.
	 *
	 * @return	{bool}
	 */
	static checkInitiativeRolled(combat, round)
	{
		// No combatants = nothing to do
		if (combat.combatants?.size == 0)
		{
			return true;
		}
		for (let combatant of combat.combatants)
		{
			const isDead = SFI.isDead(combatant.token);
			if (!(isDead) && (typeof combatant.initiative == 'undefined' || combatant.initiative == null))
			{
				if (combatant.isNPC == false || game.user.isGM) // TODO: Should check player-is-owner, not isNPC; wrap into function
				{
					ui.notifications.warn(`Combatant ${combatant.name} must roll initiative!`);
				}
				else
				{
					ui.notifications.warn("A combatant still needs to roll initiative!");
				}
				if (game.user.isGM)
				{
					combat.update({'turn': 0});
					round.turn = 0;
				}
				return false;
			}
		}
		return true;
	}

	/**
	 * Check that an imminent updateCombatant call can be made
	 *
	 * @param {object} combatant
	 * @param {object} update
	 * @params {object} args
	 * @params {string} userId
	 * @retur	bool
	 */
	static validateCanUpdate(combatant, update, args, userId)
	{
		if (update.initiative && !game.users.get(userId).isGM)
		{
			combatant.initiative = null;
			update.initiative = null;
			update._id = undefined;
			args.diff = false;
			args.render = false;
			console.log("SFI | Combatant:", combatant);
			console.log("SFI | Update:", update);
			console.log("SFI | Args:", args);
			console.log("SFI | userID:", userId);
			console.trace();
			ui.notifications.error("You cannot affect initiative manually");
			return false;
		}
		return true;
	}

	/**
	 * Determine if the indicated token is dead
	 *
	 * @param	{Token}
	 * @return	{bool}
	 */
	static isDead(token)
	{
		return token?.actorData?.effects?.find((e) => e.label == 'Dead');
	}

	/**
	 * The remaining static methods are used by patch functions
	 */

	/**
	 * Logic for prepareInitiativeAttribution, which is called by an
	 * extension of the behavior of ActorSheet._onPropertyAttribution
	 *
	 * @param {object} rollData
	 * @return {array}
	 */
	static initiativeAttribution(rollData)
	{
		const attribution = [];
		// Dex mod
		attribution.push({
			label: "DEX Mod",
			mode: CONST.ACTIVE_EFFECT_MODES.ADD,
			value: rollData.abilities.dex?.mod ?? 0
		});

		// Size mod
		attribution.push({
			label: "Size",
			mode: CONST.ACTIVE_EFFECT_MODES.ADD,
			value: SFI.sizeModifiers[rollData.traits.size]
		});

		// Bonus to Dex checks
		const dexCheckBonus = rollData.abilities.dex?.bonuses?.check ?? 0;
		if (dexCheckBonus != 0)
		{
			attribution.push({
				label: "DEX Check",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: rollData.abilities.dex?.bonuses?.check
			});
		}

		// Bonus to initiative (e.g. Alert)
		if (rollData.attributes.init.bonus != 0)
		{
			attribution.push({
				label: "Bonus",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: rollData.attributes.init.bonus
			});
		}

		// Bonus from proficiency, if any
		if (Number.isNumeric(rollData.attributes.init.prof.term) && rollData.attributes.init.prof.flat != 0)
		{
			attribution.push({
				label: "Proficiency",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: rollData.attributes.init.prof.flat
			});
		}
		return attribution;
	}

	/**
	 * Modify the combat tracker to support additional behavior
	 *
	 * @param	{} html
	 * @return	void
	 */
	static modifyCombatTracker(html)
	{
		// Patch the buttons
		const initButtons = html[0].querySelectorAll('.token-initiative .combatant-control.roll');
		for (let i of initButtons)
		{
			let j = i.cloneNode(true);
			i.parentNode.replaceChild(j, i);
			j.dataset.tooltip = "Initiative not yet rolled";
			j.dataset.control = undefined;
			j.addEventListener('click', function()
			{
				SFI.chooseRoundAction(this.closest('.combatant')?.dataset?.combatantId);
			}, true);
		}

		// Add the action display
		const combatantItems = html[0].querySelectorAll('li.combatant');
		const getActionData = function(combatant, flag) {
			const actionData = {};
			actionData.idx = combatant.getFlag(SFI.MODULE_NAME, flag);
			actionData.ready = false;
			if (actionData.idx)
			{
				actionData.name = SFI.actionModifiers[actionData.idx].name;
				if (flag == SFI.FLAG_ACTION_CHOSEN)
					actionData.target = combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_TARGET) ?? '';
				else if (flag == SFI.FLAG_BONUS_ACTION_CHOSEN)
					actionData.target = combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_TARGET) ?? '';
				actionData.ready = true;
			}
			/*
			else
				actionData.name = "choose actions";
			*/
			return actionData;
		};
		for (let c of combatantItems)
		{
			// Get needed combatant information
			const combatantId = c.dataset.combatantId;
			const combatant = game.combats.active.combatants.get(combatantId);

			const actionData = getActionData(combatant, SFI.FLAG_ACTION_CHOSEN);
			const bonusActionData = getActionData(combatant, SFI.FLAG_BONUS_ACTION_CHOSEN);

			const nameElement = c.querySelector('h4');
			const actionRow = document.createElement('div');
			actionRow.classList.add('sfi-action-row');
			let displayString = 'choose actions';
			let titleString = 'Actions have not yet been chosen';
			if (actionData.ready && bonusActionData.ready)
			{
				actionRow.classList.add('sfi-action-chosen');
				if (combatant.players.length || combatant.hasPlayerOwner || game.user.isGM)
				{
					if (actionData.name == 'None' && bonusActionData.name == 'None')
					{
						displayString = 'Not taking actions';
						titleString = displayString;
					}
					else
					{
						displayString = '';
						titleString = '';
						if (!(actionData.name == 'None'))
						{
							displayString = actionData.name;
							titleString = `Action: ${actionData.name}` + (actionData.target.trim().length > 0 ? ` -> ${actionData.target}` : '');
						}
						if (!(bonusActionData.name == 'None'))
						{
							if (displayString.length)
								displayString += ', ';
							if (titleString.length)
								titleString += ', ';
							displayString += bonusActionData.name;
							titleString += `Bonus Action: ${bonusActionData.name}` + (bonusActionData.target.trim().length > 0  ? ` -> ${bonusActionData.target}` : '');
						}
					}
				}
				else
				{
					displayString = 'actions selected';
					titleString = "Actions have been selected";
				}
			}
			actionRow.innerHTML = displayString;
			actionRow.setAttribute('title', titleString);
			// nameElement.parentNode.insertBefore(actionRow, nameElement.nextSibling);
			nameElement.appendChild(actionRow);
		}
	}

	/**
	 * Given a roll string from Combatant._getInitiativeFormulaBase(),
	 * modify it with the extra parameters we want to support
	 *
	 * @param	{Combatant} combatant
	 * @param {string} baseResult
	 * @return {string}
	 */
	static modifyBaseInitiative(combatant, baseResult)
	{
		// First, clean up "+ -" instances in the base result
		baseResult = baseResult.replaceAll('+ -', '- ');
		// console.log("SFI | Base Result: " + baseResult);

		// Add size mod
		const sizeMod = SFI.sizeModifiers[combatant.actor.system.traits.size];
		if (sizeMod >= 0)
			baseResult = `${baseResult} + ${sizeMod}`;
		else
			baseResult = `${baseResult} - ${Math.abs(sizeMod)}`;
		// console.log(`SFI | Base Result + Size: ${baseResult}`);

		// Add action mod
		let actionMod;
		if (SFI.isDead(combatant.token))
			actionMod = SFI.actionModifiers.find((a) => a.name == 'Incapacitated')?.mod;
		else
		{
			const action = SFI.actionModifiers[combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ACTION_CHOSEN)];
			const bonusAction = SFI.actionModifiers[combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_BONUS_ACTION_CHOSEN)];
			if (action && bonusAction)
			{
				if (action?.name?.startsWith("None") && bonusAction?.name?.startsWith("None"))
					actionMod = 0;
				else if (action?.name?.startsWith("None") && !bonusAction?.name?.startsWith("None"))
					actionMod = bonusAction.mod;
				else if (!action?.name?.startsWith("None") && bonusAction?.name?.startsWith("None"))
					actionMod = action.mod;
				else
					actionMod = Math.min(action.mod, bonusAction.mod);
			}
		}
		if (actionMod == null || typeof actionMod == 'undefined')
		{
			const msg = `Cannot roll initiative without action chosen for ${combatant.name}`;
			ui.notifications.error(msg);
			throw new Error(msg); // To actually prevent it
		}
		if (actionMod >= 0)
			baseResult = `${baseResult} + ${actionMod}`;
		else
			baseResult = `${baseResult} - ${Math.abs(actionMod)}`;
		// console.log(`SFI | Base Result + Size + Action: ${baseResult}`);

		// If an explicit result was provided, use it instead of rolling
		const explicitRoll = combatant.getFlag(SFI.MODULE_NAME, SFI.FLAG_ROLL_RESULT);
		if (explicitRoll)
		{
			baseResult = baseResult.replace(/(1d20|2d20k.)/, explicitRoll);
			// console.log(`SFI | Roll With Explicit Result: ${baseResult}`);
		}
		return baseResult;
	}
}

/**
 * Everything hereafter are patch functions to alter behavior of dnd5e
 */

export const SFIPatchActor5e = (ActorDocumentClass) => {
	class SFIActor5e extends ActorDocumentClass
	{
		/**
		 * Prepare the initiative data for an actor.
		 * Mutates the value of the `system.attributes.init` object.
		 * @param {object} bonusData				 Data produced by `getRollData` to be applied to bonus formulas.
		 * @param {number} globalCheckBonus	Global ability check bonus.
		 * @protected
		 */
		_prepareInitiative(bonusData, globalCheckBonus)
		{
			// Do the normal prepare first
			super._prepareInitiative(bonusData, globalCheckBonus);

			// Now modify the total based on size
			const init = this.system.attributes.init ??= {};
			const sizeMod = SFI.sizeModifiers[this.system.traits.size];
			init.total += sizeMod;
		}

		async rollInitiative({createCombatants, rerollInitiative, initiativeOptions})
		{
			let baseResult = await super.rollInitiative({createCombatants, rerollInitiative, initiativeOptions});
			console.log(`SFI | Base Result for rollInitiative on ${this.actor.name}: `, baseResult);
			return baseResult;
		}
	}

	const constructorName = "SFIActor5e";
	Object.defineProperty(SFIActor5e.prototype.constructor, "name", { value: constructorName });
	return SFIActor5e;
};

export const SFIPatchActorSheet5e = (ActorSheet) => {
	ActorSheet._onPropertyAttribution = async function(event)
	{
		// Repeat base logic
		const existingTooltip = event.currentTarget.querySelector("div.tooltip");
		const property = event.currentTarget.dataset.property;
		if (existingTooltip || !property) return;
		const rollData = this.actor.getRollData({ deterministic: true });
		let attributions;
		switch (property)
		{
			case "attributes.ac":
				attributions = this._prepareArmorClassAttribution(rollData);
				break;
			case "attributes.init":
				attributions = this._prepareInitiativeAttribution(rollData);
				break;
		}
		if ( !attributions ) return;
		const html = await new PropertyAttribution(this.actor, attributions, property).renderTooltip();
		event?.currentTarget?.insertAdjacentElement("beforeend", html[0]);
	}

	ActorSheet._prepareInitiativeAttribution = function(rollData)
	{
		return SFI.initiativeAttribution(rollData);
	}

	return ActorSheet;
};

export const SFIPatchAddInitiativeListeners = (sheet, html) => {
	const initEl = html[0].querySelector('.attribute.initiative .attribute-value');
	initEl.dataset.property = 'attributes.init';
	initEl.classList.add('attributable');
	initEl.addEventListener('mouseover', sheet._onPropertyAttribution.bind(sheet));

	// Patch the Initiative header
	const initHeader = html[0].querySelector('.attribute.initiative .rollable');
	let newHeader = initHeader.cloneNode(true);
	initHeader.parentNode.replaceChild(newHeader, initHeader);
	Object.keys(newHeader.dataset).forEach(dataKey => { delete newHeader.dataset[dataKey]; });
	newHeader.addEventListener('click', function()
	{
		const activeCombatant = game.combats.active.combatants.find((c) => c.actor.id == sheet.actor.id);
		if (activeCombatant)
			SFI.chooseRoundAction(activeCombatant.id);
	}, true);
};

export const SFIPatchCombatTracker = (html) => {
	SFI.modifyCombatTracker(html);
};

export const SFIPatchInitiativeFormula = (Combatant) => {
	console.log("SFI | Patching Combatant initiative formula");
	function _getInitiativeFormula()
	{
		const baseResult = this._getInitiativeFormulaBase();
		return SFI.modifyBaseInitiative(this, baseResult);
	}
	Combatant.prototype._getInitiativeFormulaBase = Combatant.prototype._getInitiativeFormula;
	Combatant.prototype._getInitiativeFormula = _getInitiativeFormula;

	function getInitiativeRoll(formula)
	{
		// Ensure the formula is what we expect it to be; get outta here DAE
		formula = SFI.modifyBaseInitiative(this, this._getInitiativeFormulaBase());
		const baseResult = this.getInitiativeRollBase(formula);
		return baseResult;
	}
	Combatant.prototype.getInitiativeRollBase = Combatant.prototype.getInitiativeRoll;
	Combatant.prototype.getInitiativeRoll = getInitiativeRoll;

	return Combatant;
};