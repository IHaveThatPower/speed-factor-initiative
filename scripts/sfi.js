/**
preCreateCombat hook
createCombat hook
preUpdateCombat hook
	getMonksCombatTrackerEntryContext
	getCombatTrackerEntryContext
	getSidebarTabEntryContext
	renderMonksCombatTracker
	renderCombatTracker
	renderSidebarTab
updateCombat
	getMonksCombatTrackerEntryContext
	getCombatTrackerEntryContext
	getSidebarTabEntryContext
	renderMonksCombatTracker
	renderCombatTracker
	renderSidebarTab
preCreateCombatant
createCombatant

combatStart

	COMBAT.RollAll / rollAll
	COMBAT.RollNPC / rollNPC

combatTurn // when turn changes

combatRound // when round changes

preDeleteCombat
deleteCombat
*/
const SFI_actionModifiers = {
	1: {
		"namePadded": "Medium Action                  (+0)",
		"mod": +0
	},
	2: {
		"namePadded": "Melee, Heavy Weapon            (-2)",
		"mod": -2
	},
	3: {
		"namePadded": "Melee, Light or Finesse Weapon  (+2)",
		"mod": +2
	},
	4: {
		"namePadded": "Melee, Two-Handed Weapon       (-2)",
		"mod": -2
	},
	5: {
		"namePadded": "Ranged, Loading Weapon         (-5)",
		"mod": -5
	},
	6: {
		"namePadded": "Spellcasting, 1st level        (-1)",
		"mod": -1
	},
	7: {
		"namePadded": "Spellcasting, 2nd level        (-2)",
		"mod": -2
	},
	8: {
		"namePadded": "Spellcasting, 3rd level        (-3)",
		"mod": -3
	},
	9: {
		"namePadded": "Spellcasting, 4th level        (-4)",
		"mod": -4
	},
	10: {
		"namePadded": "Spellcasting, 5th level        (-5)",
		"mod": -5
	},
	11: {
		"namePadded": "Spellcasting, 6th level        (-6)",
		"mod": -6
	},
	12: {
		"namePadded": "Spellcasting, 7th level        (-7)",
		"mod": -7
	},
	13: {
		"namePadded": "Spellcasting, 8th level        (-8)",
		"mod": -8
	},
	14: {
		"namePadded": "Spellcasting, 9th level        (-9)",
		"mod": -9
	},
	15: {
		"namePadded": "Very Slow Action               (-5)",
		"mod": -5
	},
	16: {
		"namePadded": "Slow Action                    (-2)",
		"mod": -2
	},
	17: {
		"namePadded": "Fast Action                    (+2)",
		"mod": +2
	},
	18: {
		"namePadded": "Very Fast Action               (+5)",
		"mod": +5
	}
};

// list of sizes present in 5e, optionally it's possible to modify the bonuses (but not the size names "tiny", "sm", etc)
const SFI_sizeModifiers = {
	"tiny" : +5,
	"sm" : +2,
	"med" : +0,
	"lg" : -2,
	"huge" : -5,
	"grg" : -8
};

Hooks.on("createCombat", () => {
	game.socket.on('module.speed-factor-initiative', (data) => {
		doSocket(data);
	});
});
Hooks.on("combatStart", (combat, round) => {
	console.log("Start hook active");
	SFI_handleCombat("start", combat, round);
});
Hooks.on("combatTurn", (combat, round, time) => {
	console.log("Turn hook active");
	SFI_handleCombat("turn", combat, round, time);
});
Hooks.on("combatRound", (combat, round, time) => {
	console.log("Round hook active");
	SFI_handleCombat("round", combat, round, time);
});
Hooks.on("deleteCombat", () => {
	game.socket.off('module.speed-factor-initiative');
});

/**
 * Handle a combat event that we care about
 *
 * @param	string eventType
 * @param	Combat combat
 * @param	object round
 * @param	object time
 * @return	void
 */
function SFI_handleCombat(eventType, combat, round, time)
{
	// At the top of a new round, clear all initiative rolls
	if (eventType == "round")
	{
		combat.resetAll();
		combat.combatants?.forEach((combatant) => {
		if (combatant.getFlag('speed-factor-initiative', 'action-speed'))
		{
			combatant.setFlag('speed-factor-initiative', 'last-action', combatant.getFlag('speed-factor-initiative', 'action-speed'));
			combatant.unsetFlag('speed-factor-initiative', 'action-speed');
		}
	});
	}
	// Then display a prompt to each player to select an action
	if (eventType == "start" || eventType == "round")
	{
		SFI_showActionSelect();
	}
	// If turn advancement occurred, do a sanity check to ensure all combatants chose an action
	if (eventType == "turn")
	{
		SFI_checkActionsChosen(combat, round);
	}
}

function handleSocket(data)
{
	game.macros.getName("Choose Round Action").execute();
}

/**
 * Show the action select dialog to all combatant controllers
 *
 * @return	void
 */
function SFI_showActionSelect()
{
	if (game.user.isGM)
	{
		game.socket.emit('module.speed-factor-initiative', {
			payload: true
		});
	}

 /*
async function doSocket(data) {

}

function emitSocket(type, payload) {
	game.socket.emit('module.speed-factor-initiative', {
		type: type,
		payload: payload
	});
}
*/
}

/**
 * When a round is advanced, check to ensure all combatants have a chosen action
 * and abort advancement if not.
 *
 * @return	void
 */
function SFI_checkActionsChosen(combat, round)
{
	// No combatants = nothing to do
	if (combat.combatants?.size == 0)
	{
		return;
	}
	combat.combatants?.forEach((combatant) => {
		if (!combatant.getFlag('speed-factor-initiative', 'action-speed'))
		{
			combat.turn = 0;
			round.turn = 0;
			if (game.user.isGM)
				ui.notifications.warn("Combatant " + combatant.name + " must choose an action!");
		}
	});
}

/**
 * Invoked by the user macro when an action is chosen
 * 
 * @param	token
 * @param	html
 * @return	void
 */
async function SFI_setAction(token, html)
{
	const formData = (new FormDataExtended(html[0].querySelector('form.speedFactorInitiative'))).object;
	let modDex = parseInt(token.actor.system.abilities.dex.mod);
	let modSize = parseInt(SFI_sizeModifiers[token.actor.system.traits.size]);
	let modAction = 0;
	if (formData['init-mod-action'] in SFI_actionModifiers)
	{
		modAction = parseInt(SFI_actionModifiers[formData['init-mod-action']].mod);
	}
	else
	{
		ui.notifications.error("Invalid action selection");
		return;
	}
	let rollExplicit = formData['init-roll'];
	if (typeof rollExplicit != undefined && rollExplicit != '')
	{
		rollExplicit = parseInt(rollExplicit);
		if (rollExplicit > 0 && rollExplicit <= 20)
		{
			// Actually set initiative
			let initTotal = rollExplicit + modDex + modSize + modAction;
			await game.combat.setInitiative(token.combatant.id, initTotal);
			return;
		}
	}

	await token.combatant.setFlag('speed-factor-initiative', 'action-speed', parseInt(formData['init-mod-action']));
}