import { ScalarValue, TFunctionalFilter } from "@zouloux/ecma-core";


export type TFileType = 'file'|'directory'|'all';

// @see : https://github.com/isaacs/node-glob
export interface IGlobOptions {
	cwd:string
	dot:boolean
	nosort:boolean
	nodir:boolean
	nocase:boolean
	ignore:string
	// ...
	[key:string] : any
}

export type TGlobOptionsArgument = Partial <IGlobOptions>

export type TRawWritableContent = ScalarValue | null

export type TContentArgument<G> = null | G | TFunctionalFilter <G>

export type TStructuralWritableContent = ScalarValue | object | any[]
