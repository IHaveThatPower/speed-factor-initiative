import {
	SFI,
	SFIPatchActor5e,
	SFIPatchActorSheet5e,
	SFIPatchAddInitiativeListeners,
	SFIPatchCombatTracker,
	SFIPatchInitiativeFormula
} from './sfi.class.js';

Handlebars.registerHelper('json', function (obj)
{
	return JSON.stringify(obj);
});
Handlebars.registerHelper('numEq', function (a, b)
{
	return (Number.fromString(a) === Number.fromString(b));
});

/**
 * On initialization, patch the actor document and the Combatant
 * prototype's initiative formula.
 */
Hooks.once("init", function() {
	CONFIG.Actor.documentClass = SFIPatchActor5e(CONFIG.Actor.documentClass);
	// CONFIG.Combat = SFIPatchCombat(CONFIG.Combat);
	Combatant = SFIPatchInitiativeFormula(Combatant);
	libWrapper.register(SFI.MODULE_NAME, 'Combat.prototype.rollAll', function(wrapped, ...args) {
		const result = wrapped(...args);
		SFI.rollInitiativeCallback();
		return result;
	}, 'WRAPPER');
	libWrapper.register(SFI.MODULE_NAME, 'Combat.prototype.rollNPC', function(wrapped, ...args) {
		const result = wrapper(...args);
		SFI.rollInitiativeCallback();
		return result;
	}, 'WRAPPER');
});

/**
 * When the game environment is ready, if a combat is already active,
 * turn on our socket.
 */
Hooks.once("ready", function() {
	if (!game.modules.get('lib-wrapper')?.active && game.user.isGM)
	{
		ui.notifications.error("Module SFI requires the 'libWrapper' module. Please install and activate it.");
	}
	if (game.combats.active)
	{
		console.log("SFI | Active combat detected; activating SFI socket");
		game.socket.on(SFI.SOCKET_NAME, SFI.handleUpdate);
	}
});

/**
 * When a combat is created, activate our socket!
 */
Hooks.on("createCombat", () => {
	console.log("SFI | New combat detected; activating SFI socket");
	game.socket.on(SFI.SOCKET_NAME, SFI.handleUpdate);
});

/**
 * Turn our socket off when combat ends.
 */
Hooks.on("deleteCombat", () => {
	console.log("SFI | Dectivating SFI socket");
	game.socket.off(SFI.SOCKET_NAME);
});

/**
 * When a user executes the Choose Round Action macro, fire off an event
 * so the class handles it
 */
Hooks.on('SFI_chooseRoundAction', () => {
	return SFI.chooseRoundAction();
});

/**
 * When the combat tracker is rendered, patch its functionality
 */
Hooks.on("renderCombatTracker", function(tracker, html, data) {
	SFIPatchCombatTracker(html);
});

/**
 * When a character sheet is rendered, patch how it shows initiative
 */
Hooks.on("renderActorSheet5eCharacter", function(sheet, html, data) {
	sheet = SFIPatchActorSheet5e(sheet);
	SFIPatchAddInitiativeListeners(sheet, html);
});

/**
 * When various combat events occur -- start, round advance, turn
 * advance, pass that data to our class for handling
 */
Hooks.on("combatStart", (combat, round) => {
	SFI.handleCombatEvent("start", combat, round);
});
Hooks.on("combatTurn", (combat, round, time) => {
	SFI.handleCombatEvent("turn", combat, round, time);
});
Hooks.on("combatRound", (combat, round, time) => {
	SFI.handleCombatEvent("round", combat, round, time);
});

Hooks.on("preUpdateCombatant", (combatant, update, args, userId) => {
	return SFI.validateCanUpdate(combatant, update, args, userId);
});

Hooks.on("updateCombatant", (combatant, update, args, userId) => {
	return SFI.validateCanUpdate(combatant, update, args, userId);
});