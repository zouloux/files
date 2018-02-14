
const path = require('path');
const glob = require('glob');
const fs = require("fs");
const fse = require('fs-extra');
const colors = require('colors'); // @see : https://github.com/marak/colors.js/


// Verbose enabled by default
let verbose = true;


/**
 * Files class.
 * Can represent a list of files or folders.
 * Can't represent both files and folders.
 * Target files from a glob.
 * @see https://github.com/isaacs/node-glob
 */
class Files
{
	/**
	 * Shortcut to target existing files from a glob.
	 */
	static getFiles (pGlob)
	{
		return new Files(pGlob, true, false);
	}

	/**
	 * Shortcut to target existing folders from a glob.
	 */
	static getFolders (pGlob)
	{
		return new Files(pGlob, false, true);
	}

	/**
	 * Shortcut to target a non existing file or folder.
	 */
	static new (pPath)
	{
		return new Files(pPath, false, false);
	}

	/**
	 * Enable or disable console log
	 */
	static setVerbose ( pVerbose )
	{
		verbose = pVerbose;
	}


	/**
	 * Target files list or folder from a glog.
	 * Can target files and folder if not filtered.
	 * @param pGlob Glob pattern.
	 * @param pOnlyFiles If true, will only target existing files.
	 * @param pOnlyFolders If true, will only target existing folders.
	 */
	constructor (pGlob, pOnlyFiles, pOnlyFolders)
	{
		// Record glob for logging
		this.glob = pGlob;

		// Target files with glob
		this.files = glob.sync( this.glob );

		// Filter files or folders
		pOnlyFiles && this.onlyExistingFiles();
		pOnlyFolders && this.onlyExistingFolders();
	}

	/**
	 * Filter glob to target only existing files.
	 */
	onlyExistingFiles ()
	{
		// Filter files or folder
		this.files = this.files.filter(
			file => fs.lstatSync( file ).isFile()
		);
	}

	/**
	 * Filter glob to target only existing folders.
	 */
	onlyExistingFolders ()
	{
		// Filter files or folder
		this.files = this.files.filter(
			file => fs.lstatSync( file ).isDirectory()
		);
	}


	/**
	 * Check if this glob is targeting existing files or folders.
	 * @returns {boolean}
	 */
	exists ()
	{
		return (this.files.length > 0);
	}

	/**
	 * Get all files or folders.
	 * @param pHandler First argument will be the file or folder path
	 */
	all ( pHandler )
	{
		return this.files.map( pHandler );
	}

	/**
	 * Delete all targeted files or folders.
	 * No warning.
	 */
	delete ()
	{
		verbose && console.log(`Files.delete ${this.glob} ...`.yellow);

		// Browse files or folders
		this.files.map( file =>
		{
			// Remove
			fse.removeSync( file );
			verbose && console.log( `	Deleted ${file}`.grey );
		});
	}

	/**
	 * Move all targeted files or folders inside a directory
	 * @param pDest Directory path where all files / folders will be moved into. No glob.
	 */
	moveTo ( pDest )
	{
		verbose && console.log(`Files.moveTo ${this.glob} ...`.yellow);

		// Trailing slash means we move the file inside the directory
		const destIsADirectory = (
			(pDest.lastIndexOf('/') === pDest.length - 1)
		);

		// Browse files or folders
		this.files.map( file =>
		{
			// Get file name and compute destination file name
			const fileName = path.basename( file );
			const destination = (
				destIsADirectory
					? path.join(pDest, fileName)
					: pDest
			)

			// Move
			fse.moveSync( file, destination );
			verbose && console.log( `	${file} moved to ${destination}`.grey );
		});
	}

	/**
	 * Copy all targeted files or folders inside a directory.
	 * Add a trailing slash to force directory creation.
	 * @param pDest Directory path where all files / folders will be copied into. No glob.
	 */
	copyTo ( pDest )
	{
		verbose && console.log(`Files.copyTo ${this.glob} ...`.yellow);

		// Trailing slash means we move the file inside the directory
		const destIsADirectory = (
			(pDest.lastIndexOf('/') === pDest.length - 1)
		);

		// Browse files or folders
		this.files.map( file =>
		{
			// Get file name and compute destination file name
			const fileName = path.basename( file );
			const destination = (
				destIsADirectory
				? path.join(pDest, fileName)
				: pDest
			)

			// Copy
			fse.copySync( file, destination );
			verbose && console.log( `	${file} copied to ${destination}`.grey );
		});
	}

	/**
	 * Read file content.
	 * Only work if glob is pointing to an existing file.
	 * @param pEncoding default is utf-8
	 * @returns {Buffer}
	 */
	read (pEncoding = 'utf-8')
	{
		// Read file from disk
		return fs.readFileSync( this.glob, { encoding: pEncoding } );
	}

	/**
	 * Write file content.
	 * Will use glob to create a unique file.
	 * @param pContent Content of the file to write, as a string
	 * @param pEncoding default is utf-8
	 */
	write (pContent = '', pEncoding = 'utf-8')
	{
		// Create parent folders recursively
		fse.ensureDirSync( path.dirname( this.glob ) );

		// Write file to disk
		fs.writeFileSync( this.glob, pContent, { encoding: pEncoding } );
	}

	/**
	 * Create parent folders if they do not exists.
	 * Will use glob.
	 */
	createFolders ()
	{
		fse.ensureDirSync( this.glob );
	}

	/**
	 * Update a file with an handler.
	 * Will read file content and pass it as first argument of the handler.
	 * Will write file content from handler return.
	 * @param pHandler Will have file content as first argument. Return new file content to be written.
	 */
	alter ( pHandler )
	{
		this.write(
			pHandler(
				this.read()
			)
		);
	}

	/**
	 * Update a JSON file with an handler.
	 * @param pHandler Will have JSON content as first argument. Return new JSON content to be written.
	 * @param pSpaces Spaces size. Null to uglify.
	 */
	alterJSON ( pHandler, pSpaces = 2 )
	{
		this.write(
			JSON.stringify(
				pHandler(
					JSON.parse(
						this.read().toString()
					)
				),
				null,
				pSpaces
			)
		);
	}
}

/**
 * Exports public API
 */
module.exports = { Files };