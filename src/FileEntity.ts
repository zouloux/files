const rimraf = require('rimraf');
const ncp = require('ncp');
import * as fs from "fs";
import path from "path";
import { FileFinder, resolveHome } from "./index";


export class FileEntity
{
	// If this file entity exists
	// Got from stats
	protected _exists:boolean;

	/**
	 * File stats ( size, last modified date, stuff like that ).
	 * Call await File.updateStats() to update stats from disk.
	 */
	protected _stats			:fs.Stats;
	get stats ():fs.Stats { return this._stats; }

	/**
	 * Path pointing to the file or directory.
	 * Updating path will update those properties : base / name / fullName / extensions / extension
	 * Update path will not reload file, update status, or change content.
	 */
	get path ():string { return this._path; }
	set path ( newPath:string ) {
		this.updatePath( newPath )
	}
	protected _path:string;

	/**
	 * Get base (parent directories from cwd)
	 * This property is set by FileEntity.path
	 */
	get base () { return this._base }
	protected _base:string;

	/**
	 * File name, without base and without extensions
	 * This property is set by FileEntity.path
	 */
	get name () { return this._name }
	protected _name:string;

	/**
	 * File name, without base, with extensions
	 * This property is set by FileEntity.path
	 */
	get fullName () { return this._fullName }
	protected _fullName:string;

	/**
	 * All file extensions, lowercase and reversed.
	 * Directories can have extension too.
	 * This property is set by FileEntity.path
	 */
	get extensions () { return this._extensions }
	protected _extensions:string[];

	/**
	 * Main extension, lowercase.
	 * This property is set by FileEntity.path
	 */
	get extension () { return this._extensions[ 0 ] || null }

	// ------------------------------------------------------------------------- CONSTRUCT

	constructor ( filePath:string, stats?:fs.Stats )
	{
		if ( !filePath )
			throw new Error(`FileEntity.constructor // FileEntity needs a filePath to be initialized.`);

		// Save stats and if file exists
		this._stats = stats;
		this._exists = !!stats;

		// Set path info
		this.updatePath( filePath );
	}

	// ------------------------------------------------------------------------- UPDATE FILE PROPERTIES

	protected updatePath ( filePath:string )
	{
		// Resolve home
		this._path = resolveHome( filePath );

		// Get full name (name without base but with extensions)
		this._fullName = path.basename( this._path );

		// Get extensions, lower case and reverse them
		const dotIndex = this._fullName.indexOf('.');
		if ( dotIndex >= 0 )
			this._extensions = this._path.toLowerCase().substr( dotIndex + 1, this._path.length ).split('.').reverse();

		// Get name (full name without extensions)
		this._name = (
			dotIndex === -1
			? this._fullName
			: this._fullName.substr(0, dotIndex)
		)

		// Get base (parents directories from cwd)
		this._base = path.dirname( this._path );
	}

	// ------------------------------------------------------------------------- STATS

	/**
	 * Update file stats from disk asynchronously ( size, last modified date, stuff like that ).
	 */
	async update ()
	{
		// Get stats and try to detect if file really exists
		try {
			this._stats = await fs.promises.stat( this._path );
			this._exists = true;
		}
		// Fail silently here
		catch (e) {
			// File does not exists
			if ( e.code === 'ENOENT')
			{
				this._stats = null;
				this._exists = false;
			}
		}
	}

	// ------------------------------------------------------------------------- STATS - EXISTS

	/**
	 * If this file or directory exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	async exists () {
		if ( !this._stats )
			await this.update();
		return this._exists;
	}

	// ------------------------------------------------------------------------- STATS - IS REAL

	/**
	 * File exists and is not a symbolic link
	 */
	async isReal () {
		if ( !this._stats )
			await this.update();
		return this._exists && !this._stats.isSymbolicLink()
	}

	/**
	 * File exists and is a symbolic link
	 */
	async isSymbolicLink () {
		return !( await this.isReal() )
	}

	// ------------------------------------------------------------------------- STATS - LAST MODIFIED

	/**
	 * Get last modified timestamp ( as ms )
	 */
	async lastModified ():Promise<number|false> {
		await this.update();
		return this._exists && this._stats.mtimeMs;
	}

	// ------------------------------------------------------------------------- STATS - IS REAL

	/**
	 * If file exists and is a directory, not a file.
	 */
	async isDirectory () {
		if ( !this._stats )
			await this.update();
		return this._exists && this._stats.isDirectory()
	}

	/**
	 * If file exists and is a file, not a directory.
	 */
	async isFile () {
		if ( !this._stats )
			await this.update();
		return this._exists && this._stats.isFile()
	}

	// ------------------------------------------------------------------------- ENSURE

	/**
	 * Create all needed parent directory to this file / directory.
	 */
	async ensureParents () {
		return require('mkdirp')( this._base );
	}

	// ------------------------------------------------------------------------- SAFE-TO ARGUMENT

	/**
	 * Will add file name to "to" if "to" is a directory.
	 * Will create parent directories if it does not exists.
	 *
	 * Ex : manipulate ".htaccess" to "dist".
	 * "to" will become dist/.htaccess if dist is a folder
	 * Ex : manipulate "template.htaccess" to "dist/.htaccess"
	 * "to" will still be "dist/.htaccess" because this is a folder
	 *
	 * @param to
	 */
	protected async safeTo ( to:string )
	{
		// Split slashes
		const toSlashSplit = to.split('/');

		// If last part of to path seems to be a file (contains a dot)
		const fileNameContainsADot = (
			toSlashSplit.length > 0 && toSlashSplit[ toSlashSplit.length -1 ]
			&&
			toSlashSplit[ toSlashSplit.length -1 ].indexOf('.') !== -1
		);

		// Then remove last part
		if ( fileNameContainsADot ) toSlashSplit.pop();

		// Create all parent folders if needed
		await require('mkdirp')( toSlashSplit.join('/') );

		try
		{
			// Get end directory stats
			const toStats = await fs.promises.stat( to );
			if ( toStats.isDirectory() )
				to = path.join(to, this._fullName);
		}
		catch ( e ) {}
		return to;
	}

	// ------------------------------------------------------------------------- COPY TO / MOVE TO

	/**
	 * Copy this FileEntity recursively.
	 * Asynchronous call only.
	 * @param to path of the clone
	 * @param override will override destination files if true
	 */
	async copyTo ( to:string, override = false )
	{
		to = resolveHome( to )
		return new Promise<void>( async (resolve, reject) => {
			to = await this.safeTo(to);
			ncp(
				this._path, to,
				{ clobber: override, stopOnErr: true },
				err => err ? reject( err ) : resolve()
			);
		});
	}

	/**
	 * Move a file, and keep it in same directory.
	 * Important : path is relative to current file base.
	 * Can also be used to simply rename a file.
	 *
	 * Ex : ( new File('warzone/from.txt') ).moveTo('destination/to.txt')
	 * 		will move file to 'warzone/destination/to.txt'
	 *
	 * @param to Destination or new file name, relative to current base.
	 * @param override will override destination files if true
	 */
	async moveTo ( to:string, override = false )
	{
		return new Promise<"alreadyExists"|"overridden"|"moved">( async (resolve, reject) => {
			// Check that we are not moving this file
			// if ( newFileName.indexOf('/') !== -1 )
			// 	reject( new Error(`FileEntity.rename // newFileName cannot contain directory.`) )

			// Compute destination from base
			to = path.resolve( this._base, to )

			// Destination already exists
			let exists = await FileFinder.exists( to )
			if ( exists && !override ) {
				resolve("alreadyExists")
				return
			}

			fs.rename( this._path, to, err => {
				err
				? reject( new Error(`FileEntity.moveTo // Unable to rename file.`) )
				: resolve( exists ? "overridden" : "moved" )
			});
		});
	}

	// ------------------------------------------------------------------------- SYMBOLIC LINKS

	/**
	 * Create a symbolic link to this FileEntity.
	 * @param to Path of created symbolic link.
	 */
	async linkTo ( to:string ) {
		to = resolveHome( to )
		await fs.promises.symlink( this._path, to );
	}

	// ------------------------------------------------------------------------- DELETE

	/**
	 * Delete this file or folder.
	 * TODO : Safe needs to be false to remove files parent to process.cwd
	 */
	async delete ( safe = true ) {
		return new Promise( resolve => rimraf( this._path, resolve ) );
	}
}
