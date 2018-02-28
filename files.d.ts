


declare class Files
{

	/**
	 * Target existing files from a glob.
	 */
	static getFiles (pGlob):Files;

	/**
	 * Target existing folders from a glob.
	 */
	static getFolders (pGlob):Files;

	/**
	 * Target any file or folders.
	 */
	static any (pPath):Files;

	/**
	 * Target a non existing file or folder.
	 */
	static new (pPath):Files;

	/**
	 * Enable or disable console log
	 */
	static setVerbose (value:boolean):void;


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
	 * @param pNew If true, will target nothing.
	 * @param pOnlyFiles If true, will only target existing files.
	 * @param pOnlyFolders If true, will only target existing folders.
	 */
	constructor (pGlob, pNew?:boolean, pOnlyFiles?:boolean, pOnlyFolders?:boolean)


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
	 * Browse through all targeted files or folders from glob.
	 * @param pHandler First argument will be the file or folder path
	 */
	all ( pHandler : (file:string) => void ):string[];

	/**
	 * Delete all targeted files or folders.
	 * No warning.
	 * @return {number} Total removed files.
	 */
	delete ():number

	/**
	 * Delete all targeted files or folders.
	 * No warning.
	 * @return {number} Total removed files.
	 */
	remove ():number

	/**
	 * Move all targeted files or folders inside a directory.
	 * Add a trailing slash to force directory creation.
	 * Files list will be updated with new moved file paths.
	 * @param pDestination Directory path where all files / folders will be moved into. No glob.
	 * @return {number} Total moved files.
	 */
	moveTo (pDestination:string):number

	/**
	 * Copy all targeted files or folders inside a directory.
	 * Add a trailing slash to force directory creation.
	 * Files list will stay the same after using this method.
	 * @param pDestination Directory path where all files / folders will be copied into. No glob.
	 * @return {number} Total copied files.
	 */
	copyTo (pDestination:string):number

	/**
	 * Read file content.
	 * Only work if glob is pointing to an existing file.
	 * Returns null if the file is not found.
	 * @param pEncoding default is utf-8
	 * @returns {Buffer}
	 */
	read (pEncoding);

	/**
	 * Write file content.
	 * Will use glob to create a unique file.
	 * @param pContent Content of the file to write, as a string
	 * @param pEncoding default is utf-8
	 */
	write (pContent, pEncoding)
	
	/**
	 * Write file content as JSON.
	 * @param pContent Javascript object to write.
	 * @param pSpaces Spaces size. Null to uglify.
	 */
	writeJSON ( pContent, pSpaces )

	/**
	 * Add content to an existing file.
	 * Will create file if it does not exists
	 * @param pContent Content to append
	 * @param pNewLine If true, will create a new line.
	 * @param pEncoding default is utf-8
	 */
	append (pContent, pNewLine, pEncoding)

	/**
	 * Create parent folders if they do not exists.
	 * Will use glob if there is no targeted files.
	 */
	createFolders ():void

	/**
	 * Create parent folders if they do not exists.
	 * Will use glob if there is no targeted files.
	 */
	ensureFolders ():void

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
	alterJSON ( pHandler, pSpaces );
}