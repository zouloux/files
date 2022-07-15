import { FileEntity } from './FileEntity'
import { File, FileFinder, resolveHome } from "./index";
import { TFileType, TGlobOptionsArgument } from "./Struct";
import path from "path";


export class Directory extends FileEntity
{
	/**
	 * Create a new Directory object from a file path.
	 * Home directory as ~ will be resolved.
	 * Directory will be ready (stats updated)
	 * If file is not found, exists property will be false.
	 */
	static async create ( filePath:string ) {
		filePath = resolveHome( filePath )
		const fileInstance = new Directory( filePath )
		await fileInstance.update()
		return fileInstance
	}

	/**
	 * Find some directories from a glob pattern.
	 * Home directory as ~ will be resolved.
	 */
	static async find ( pattern:string, globOptions ?:TGlobOptionsArgument ):Promise<Directory[]> {
		return await FileFinder.find<Directory>( "directory", pattern, globOptions );
	}

	// ------------------------------------------------------------------------- CREATE

	/**
	 * Create directory and parents directories if needed.
	 */
	async create () {
		return require('mkdirp')( this._path );
	}

	// ------------------------------------------------------------------------- STATS - SIZE

	/**
	 * Get directory size recursively ( as bytes )
	 * Asynchronous call only.
	 */
	async size ()
	{
		return new Promise( resolve => {
			require('get-folder-size')(
				( error, size ) => resolve( error ? 0 : size )
			);
		});
	}

	// ------------------------------------------------------------------------- LIST

	async list ( globOptions?:TGlobOptionsArgument ) : Promise<string[]> {
		return await FileFinder.list( path.join(this._path, '*'), globOptions );
	}

	// ------------------------------------------------------------------------- CHILDREN

	/**
	 * Match list of direct children file or directories.
	 * @param type Type of file to list. "file", "directory", or "all"
	 * @param globOptions Options passed to glob @see https://www.npmjs.com/package/glob
	 */
	async children <G extends FileEntity = (File|Directory)> ( type:TFileType = 'all', globOptions:TGlobOptionsArgument = {} ) : Promise<G[]> {
		return await FileFinder.find<G>( type, path.join(this._path, '*'), globOptions );
	}

	// ------------------------------------------------------------------------- CLEAN

	/**
	 * Remove every file in this folder
	 */
	async clean ()
	{
		await this.delete();
		await this.create();
	}
}