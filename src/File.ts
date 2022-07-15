import { FileEntity } from './FileEntity'
import * as fs from "fs";
import { TContentArgument, TGlobOptionsArgument, TRawWritableContent } from "./Struct";
import { FileFinder } from "./FileFinder";
import { ScalarObject, ScalarValue, TFunctionalFilter } from "@solid-js/core";
import { DotEnvParser, JSON5Parser, JSONParser, YAMLParser } from "./FileParsers";
import { resolveHome } from "./index";


export class File extends FileEntity
{
	/**
	 * Create a new File object from a file path.
	 * Home directory as ~ will be resolved.
	 * File will be ready (stats updated but file content not loaded)
	 * If file is not found, exists property will be false.
	 */
	static async create ( filePath:string ) {
		filePath = resolveHome( filePath )
		const fileInstance = new File( filePath )
		await fileInstance.update()
		return fileInstance
	}

	/**
	 * Find some files from a glob pattern.
	 * Home directory as ~ will be resolved.
	 */
	static async find ( pattern:string, globOptions ?:TGlobOptionsArgument ):Promise<File[]> {
		return await FileFinder.find<File>( "file", pattern, globOptions );
	}

	// ------------------------------------------------------------------------- DATA & ENCODING

	/**
	 * File content as string.
	 */
	protected _data			:string;
	get data ():string { return this._data; }

	/**
	 * Read and write encoding for this file.
	 * Default is node default ("utf8").
	 * @see Node doc to know more about supported encodings.
	 */
	encoding:BufferEncoding;

	// ------------------------------------------------------------------------- READ FILE

	/**
	 * Read and update file data asynchronously.
	 * Will read data on drive and put them as string in data.
     * Will fail silently and get empty string if file can't be accessed.
	 */
	async load ():Promise<"loaded"|"error"|"notFound">
	{
		if ( !this._stats )
			await this.update();

		if ( !this._exists )
			return "notFound"

		try {
			const rawData = await fs.promises.readFile( this._path, {
				encoding: this.encoding
			})
			this._data = rawData.toString();
			return "loaded"
		}
		catch (e) {
		    this._data = '';
		    return "error"
        }
	}

	// ------------------------------------------------------------------------- CREATE EMPTY FILE

	/**
	 * Create empty file if not existing and parents directories if needed.
	 * @param force if true, will empty currently existing file.
	 */
	async create ( force = true )
	{
		// Create parent folders
		await this.ensureParents();

		// Do not create empty file if file already exists
		await this.update();
		if ( this._exists && !force ) return;

		// Create empty file and mark data as loaded
		this._data = '';
		await this.save();
	}

	// ------------------------------------------------------------------------- STATS - SIZE

	/**
	 * Get file size ( as bytes )
	 */
	async size ():Promise<number|false> {
		await this.update();
		return this._exists ? this._stats.size : false;
	}

    // ------------------------------------------------------------------------- WRITE

    /**
     * Write content to file. A new path can be given to keep original file.
     * @param newPath Change path to keep original file.
     */
    async save ( newPath?:string )
    {
    	// Patch home dir
		newPath = resolveHome( newPath );

        // Do not save file that were never loaded.
        if ( this._data == null ) return;

        // Save this content to a new file
        if ( newPath )
        	this._path = await this.safeTo( newPath );

		// Save data
        await fs.writeFileSync( this._path, this._data, { encoding: this.encoding } );

		// Update file props with new path
		if ( newPath ) {
			this.updatePath( newPath );
			await this.update()
		}
    }

	// ------------------------------------------------------------------------- PROCESS AND PARSE DATA

	protected initEmptyData () {
		if ( this._data === null || this._data === undefined )
			this._data = ''
	}

	protected processData <G> ( content : null|G|TFunctionalFilter<G>, decode:(source:string) => G, encode:(data:G) => string ) : G|File
	{
		const type = typeof content;
		let dataToStore:string;

		// No content is passed
		// Read data from file and return it, no chaining here
		if ( type === 'undefined' )
			return decode( this._data );

		// Content is a function.
		// Call handler, pass it current file data, get back file data
		else if ( type === 'function' )
			dataToStore = encode(
				(content as any)( decode(this._data) )
			);

		// We have data to save so we encode
		else
			dataToStore = encode( content as G );

		// Save raw data
		if ( dataToStore != null )
			this._data = dataToStore as string;

		return this;
	}

	// ------------------------------------------------------------------------- RAW CONTENT PARSING

	/**
	 * Append content at end of file.
	 * @param content Content to add ( numbers and booleans will be converted to string )
	 * @param newLine New line character to add before content. Set as empty string to append without new line.
	 */
	append ( content ?: TRawWritableContent, newLine = '\n' ) {
		this.initEmptyData()
		this._data += newLine + content;
	}

	/**
	 * TODO DOC
	 * @param content
	 */
	content ( content ?: TContentArgument<TRawWritableContent>) {
		this.initEmptyData()
		return this.processData<TRawWritableContent>( content, d => d, d => d + '' );
	}

	// ------------------------------------------------------------------------- OBJECTS PARSING

	json ( content ?: TContentArgument<any>, spaces = 2, replacers = null )
	{
		this.initEmptyData()
		return this.processData<any>(
			content,
			b => JSONParser().decode( b ),
			d => JSONParser().encode( d, replacers, spaces )
		)
	}

	json5 ( content ?: TContentArgument<any>, spaces = 2, replacers = null )
	{
		this.initEmptyData()
		return this.processData<any>(
			content,
			b => JSON5Parser().decode( b ),
			d => JSON5Parser().encode( d, replacers, spaces )
		)
	}

	yaml ( content ?: TContentArgument<any> )
	{
		this.initEmptyData()
		return this.processData<any>(
			content,
			b => YAMLParser().decode( b ),
			d => YAMLParser().encode( d )
		)
	}

	dotEnv ( content ?: TContentArgument<ScalarObject> )
	{
		this.initEmptyData()
		return this.processData<ScalarObject>(
			content,
			b => DotEnvParser().decode( b ),
			d => DotEnvParser().encode( d )
		);
	}

	// ------------------------------------------------------------------------- LINE BASED MANAGEMENT

	/**
	 * TODO DOC
	 * TODO TEST
	 * TODO : Un replace qui est une fonction qui passe la ligne identifiée en entrée et attend la nouvelle ligne en sortie
	 * @param startOrNumber
	 * @param replaceBy
	 *//*
	line ( startOrNumber?: string | number, replaceBy ?: string )
	{
		// Split content in lines
		const lines = this._data.split("\n");
		const totalLines = lines.length;

		// Return total lines count if no parameters sent
		if ( startOrNumber == null ) return totalLines;

		// If we need to treat lines by number
		if ( typeof startOrNumber === 'number' )
		{
			// Count backward if line number is negative
			// -1 is the last line, -2 the line before, etc ...
			if ( startOrNumber < 0 )
				startOrNumber = totalLines + startOrNumber;

			// Replace string and return chain
			if ( replaceBy != null )
			{
				// TODO opt with line 362
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content or null
			else return ( startOrNumber in lines ) ? lines[ startOrNumber ] : null;
		}

		// Otherwise treat lines by starting identification
		let currentLine:string;
		for ( let i = 0; i < lines.length; i ++ )
		{
			// Get current line content
			currentLine = lines[ i ];

			// Continue to search if not starting with startOrNumber
			// TODO : Less strict find ? Whitespaces ?
			if ( currentLine.indexOf(startOrNumber) === -1 ) continue;

			// Replace string and return chain
			if ( replaceBy != null )
			{
				// TODO opt with line 336
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content
			else return lines[ startOrNumber ]
		}

		// Return awaited default type
		return replaceBy != null ? this : null;
	}*/

	/*removeLines ( lineNumbers:number|number[] )
	{
		if ( typeof lineNumbers == 'number' )
			lineNumbers = [ lineNumbers ];

		// Split content in lines
		let lines = this._data.split("\n");
		const totalLines = lines.length;

		lines = lines.filter( (line, i) => {
			const lineIndex = ( i < 0 ? totalLines - i : i );
			return (lineNumbers as number[]).indexOf( lineIndex ) !== 0;
		});

		this._data = lines.join("\n");
		return this;
	}*/

	//
	/**
	 * TODO : lines, same as line but with mutli-lines optimisations
	 * Par example, ajouter '-> ' au début de chaque ligne :
	 * lines('*', content => '->' + content);
	 */

	// ------------------------------------------------------------------------- REPLACE & TEMPLATE

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param search
	 * @param replace
	 */
	replace ( search:string|RegExp, replace:ScalarValue )
	{
		this.initEmptyData()
		this._data = this._data.replace( search, replace + '' );
		return this;
	}

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param values
	 */
	template ( values:object|ScalarObject )
	{
		this.initEmptyData()
        this._data = require('@solid-js/nanostache').Nanostache( this._data, values );
        return this;
	}

	// ------------------------------------------------------------------------- DESTRUCT

	dispose ()
	{
		// TODO ...
		delete this.encoding;
		delete this._data;
		delete this._stats;
	}
}
