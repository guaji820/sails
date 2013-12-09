var _ = require('lodash');

/**
 * Interpret and validate command-line arguments.
 * Then take the appropriate action.
 *
 * Calls one of:
 *		- handler.sails
 *		- handler.console
 *		- handler.lift
 *		- handler.generate
 *		- handler.new
 *		- handler.run
 *		- handler.version
 */

module.exports = function interpretArguments ( argv, handlers ) {

	if ( !_.isObject(argv) ) return handlers.invalid();
	if ( !_.isArray(argv._) ) return handlers.invalid();
	if ( !argv._.length ) return handlers.sails();
	
	var first	= argv._[0] || '',
		second	= argv._[1] || '',
		third	= argv._[2] || '',
		fourth	= argv._[3] || '',
		fifth	= argv._[4] || '',
		all		= _.map(argv._, function (arg) {return arg + '';});


	var isLift		= _.contains(['lift', 'raise', 'start', 'server', 's', 'l'], first),
		isConsole	= _.contains(['console'], first),
		isGenerate	= _.contains(['generate'], first),
		isNew		= _.contains(['new'], first),
		isVersion	= _.contains(['version'], first),
		isWWW		= _.contains(['www', 'build'], first),
		isRun		= _.contains(['run','issue'], first);


	// Interpret/validate arguments to `sails generate`
	if ( isGenerate ) {

		// Second argument is the type of module to generate
		var module = second;

		// If it's invalid, or doesn't exist, we have a usage error
		// on our hands.
		if ( !second ) {
			return handlers.invalid(
				'What type of module would you like to generate?'
			);
		}

		switch ( second ) {
			case 'controller': break;
			case 'model': break;

			// TODO:
			case 'view':
			case 'policy':
			case 'adapter':
				return handlers.error(
				'Sorry, `sails generate ' + 
				second + '` is currently out of commission.');


			// A `generate` without a specified type is assumed to
			// be the combination of `sails generate model` and `sails generate controller`
			default: 
				return handlers.error(
					'Sorry, I don\'t know how to generate a "' +
					second + '".');
		}


		// Third argument is the id of the module we're creating
		// (otherwise it's the second argument-- we'll generate a model AND controller)
		var id = third || second;

		// If no third argument exists, this is a usage error
		// TODO: support `sails generate` again
		// 		 (for creating a model AND controller at the same time)
		if ( !id ) {
			return handlers.invalid(
				'Please specify the name for the new ' + module + '.'
			);
		}
		if ( !id.match(/^[a-z]([a-z]|[0-9])+$/i) ) {
			return handlers.invalid(
				'Sorry, "' + id + '" is not a valid name for a ' + module + '.',
				'Only letters and numbers are allowed, and it must start with a letter.',
				'(Sails ' + module + 's are case-insensitive.)'
			);
		}
		// Allow cli user to specify `FooController` and really mean `foo`
		id = id.replace(/Controller$/, '');


		// Figure out whether subsequent cmdline args are
		// supposed to be controller actions or model attributes.
		var arrayOfArgs = argv._.splice(3);
		var argsLookLikeAttributes = ( arrayOfArgs[0] && arrayOfArgs[0].match(/:/) );

		var actions = argsLookLikeAttributes ? [] : arrayOfArgs;
		var attributes = argsLookLikeAttributes ? arrayOfArgs : [];


		// Build options
		var options = _.extend({}, argv, {
			id: id,
			module: second,
			actions:  actions,
			attributes: attributes
		});

		handlers.generate(options);
		return;

		// // Determine which generators to use
		// switch ( second ) {
		// 	case 'controller':
		// 		return handlers.generate(_.extend(options, {
		// 			actions		: argv._.splice(3)
		// 		}));

		// 	case 'model':
		// 		return handlers.generate(_.extend(options, {
		// 			attributes	: argv._.splice(3)
		// 		}));

		// 	// case 'api': 

				

		// 		// // Then generate a model AND controller.
		// 		// handlers.generate(_{
		// 		// 	id			: id,
		// 		// 	module		: 'controller',
		// 		// 	actions		: !argsLookLikeAttributes ? arrayOfArgs : [],
		// 		// 	dry			: argv.dry
		// 		// });
		// 		// handlers.generate({
		// 		// 	id			: id,
		// 		// 	module		: 'model',
		// 		// 	attributes	: argsLookLikeAttributes ? arrayOfArgs : [],
		// 		// 	dry			: argv.dry
		// 		// });
		// 		// return;


	}




	/**
	 * `sails new <APPNAME>`
	 *
	 * Asset auto-"linker" is enabled by default
	 */
	if ( isNew ) {

		var linkerExplicitlyDisabled = (argv['linker'] === false) || (argv['linker'] === 'false');

		handlers['new']({
			appName: second,
			assetLinker: {
				enabled: linkerExplicitlyDisabled ? false : true,
				src: argv['linker-src'] || 'assets/linker/**/*'
			},
			dry : argv.dry
		});
		return;
	}





	if ( isLift )		return handlers.lift();
	if ( isConsole )	return handlers.console();
	if ( isVersion )	return handlers.version();
	if ( isRun )		return handlers.run();
	if ( isWWW )		return handlers.www();


	// Unknown action
	return handlers.invalid( { first: first } );
};