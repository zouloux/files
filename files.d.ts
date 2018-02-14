


declare export class Files
{
	/**
	 * Enable or disable console log
	 */
	static setVerbose (value:boolean):void;

	/**
	 * Shortcut to target existing files from a glob.
	 */
	static getFiles (pGlob):Files;

	/**
	 * Shortcut to target existing folders from a glob.
	 */
	static getFolders (pGlob):Files;

	/**
	 * Shortcut to target a non existing file or folder.
	 */
	static new (pPath):Files;


	/**
	 * Glob pattern targeting files or folders.
	 */
	glob	:string;

	/**
	 * Existing files from glob.
	 * Can be empty if you create a new file or folder.
	 */
	files	:string[];


	/**
	 * Target files list or folder from a glog.
	 * Can target files and folder if not filtered.
	 * @param pGlob Glob pattern.
	 * @param pOnlyFiles If true, will only target existing files.
	 * @param pOnlyFolders If true, will only target existing folders.
	 */
	constructor (pGlob:boolean, pOnlyFiles?:boolean, pOnlyFolders?:boolean);


	/**
	 * Filter glob to target only existing files.
	 */
	onlyExistingFiles ();

	/**
	 * Filter glob to target only existing folders.
	 */
	onlyExistingFolders ();

	/**
	 * Check if this glob is targeting existing files or folders.
	 * @returns {boolean}
	 */
	exists ():boolean;

	/**
	 * Get all files or folders.
	 * @param pHandler First argument will be the file or folder path
	 */
	all( pHandler : (file:string) => void ):string[];

	/**
	 * Delete all targeted files or folders.
	 * No warning.
	 */
	delete ();

	/**
	 * Move all targeted files or folders inside a directory
	 * @param pDest Directory path where all files / folders will be moved into. No glob.
	 */
	moveTo (pDest:string);

	/**
	 * Copy all targeted files or folders inside a directory
	 * @param pDest Directory path where all files / folders will be copied into. No glob.
	 */
	copyTo (pDest:string);

	/**
	 * Read file content.
	 * Only work if glob is pointing to an existing file.
	 * @param pEncoding default is utf-8
	 * @returns {Buffer}
	 */
	read (pEncoding = 'utf-8');

	/**
	 * Write file content.
	 * Will use glob to create a unique file.
	 * @param pContent Content of the file to write, as a string
	 * @param pEncoding default is utf-8
	 */
	write (pContent = '', pEncoding = 'utf-8');

	/**
	 * Update a file with an handler.
	 * Will read file content and pass it as first argument of the handler.
	 * Will write file content from handler return.
	 * @param pHandler Will have file content as first argument. Return new file content to be written.
	 */
	alter ( pHandler );

	/**
	 * Update a JSON file with an handler.
	 * @param pHandler Will have JSON content as first argument. Return new JSON content to be written.
	 * @param pSpaces Spaces size. Null to uglify.
	 */
	alterJSON ( pHandler, pSpaces = 2 );
}