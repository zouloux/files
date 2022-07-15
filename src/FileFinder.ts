import { Directory, File, resolveHome } from "./index";
import { FileEntity } from "./FileEntity";
import { TFileType, TGlobOptionsArgument } from "./Struct";
const glob = require('glob');
import * as fs from "fs";
import path from "path";

// ----------------------------------------------------------------------------- STRUCT

export class FileFinder
{
	// ------------------------------------------------------------------------- DEFAULT GLOB OPTIONS

	protected static getDefaultGlobOptions = ( options?:TGlobOptionsArgument ):TGlobOptionsArgument => ({
		dot: true,
		cwd: process.cwd(),
		...options
	})

	// ------------------------------------------------------------------------- COMPUTE CWD

	protected static cwdFilePath ( filePath:string, cwd?:string ) {
		return (
			// Do not add cwd if we filePath is already absolute
			( !cwd || filePath.indexOf('/') === 0 )
			? filePath
			: path.join( cwd, filePath )
		);
	}

	// ------------------------------------------------------------------------- EXISTS

	static async exists ( filePath:string, cwd?:string ):Promise<boolean>
	{
		filePath = resolveHome( filePath )
		filePath = FileFinder.cwdFilePath(filePath, cwd)
		return new Promise( resolve  => {
			fs.access( filePath, fs.constants.F_OK, err => resolve(!err) );
		});
	}

	static existsSync ( filePath:string, cwd?:string ):boolean
	{
		filePath = resolveHome( filePath )
		filePath = FileFinder.cwdFilePath(filePath, cwd)
		try {
			fs.accessSync( filePath, fs.constants.F_OK);
			return true
		}
		catch (e) {
			return false
		}
	}

	// ------------------------------------------------------------------------- LIST

	static async list ( pattern:string, globOptions ?:TGlobOptionsArgument ) : Promise<string[]>
	{
		pattern = resolveHome( pattern )
		return new Promise( (resolve, reject) => {
			globOptions = FileFinder.getDefaultGlobOptions( globOptions )
			glob( pattern, globOptions, ( error, paths ) => {
				error ? reject( error ) : resolve( paths );
			})
		});
	}

	// ------------------------------------------------------------------------- FIND

	static async find <G extends FileEntity = (File|Directory)> ( type:TFileType, pattern:string, globOptions ?:TGlobOptionsArgument ) : Promise<G[]>
	{
		pattern = resolveHome( pattern )
		const paths = await FileFinder.list( pattern, globOptions )
		const allEntities:G[] = await Promise.all(
			paths.map(
				async path => await FileFinder.createEntityFromPath( path, globOptions?.cwd ?? '' ) as unknown as G
			)
		)
		return allEntities.filter( async fileEntity => await FileFinder.isFileEntityTypeOf(fileEntity, type) )
	}

	// ------------------------------------------------------------------------- FILE ENTITY TYPE CHECK

	static async isFileEntityTypeOf ( fileEntity:FileEntity, fileType:TFileType ):Promise<boolean>
	{
		return fileEntity != null && (
			( fileType == 'directory' && await fileEntity.isDirectory() )
			|| ( fileType == 'file' && await fileEntity.isFile() )
			|| ( fileType == 'all' )
		)
	}

	// ------------------------------------------------------------------------- CREATE ENTITY

	static createFileEntityFromStat ( filePath:string, fileStat:fs.Stats ):File|Directory
	{
		if ( fileStat.isFile() )
			return new File( filePath, fileStat )
		else if ( fileStat.isDirectory() )
			return new Directory( filePath, fileStat )
		else
			return null
	}

	static async createEntityFromPath ( filePath:string, cwd?:string ):Promise<File|Directory>
	{
		filePath = FileFinder.cwdFilePath( filePath, cwd )
		const fileStat = await fs.promises.stat( filePath )
		return FileFinder.createFileEntityFromStat( filePath, fileStat );
	}
}
