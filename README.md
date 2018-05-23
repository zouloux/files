# Files

Files is a NodeJS file management helper with a deadly simple API, with the power of [glob](https://github.com/isaacs/node-glob) and [fs-extra](https://github.com/jprichardson/node-fs-extra).
Used in [Solidify](https://github.com/solid-js/) framework to handle files easily inside NodeJS.


# Philosophy

This package is meant to do powerful files operations with a simple API, inside NodeJS applications.
All methods will not throw anything if there is something wrong, so it will not break your running server.

Targeted files which does not exists are just ignored, the same way JQuery target DOM nodes.


# Typescript

By default, console logs are enabled to show you what this package does.
A [Typescript definition](https://github.com/zouloux/files/blob/master/files.d.ts) file is along the main Javasript file.
It's all automatic if you use Typescript.


# Colors

If you install the [colors npm package](https://github.com/marak/colors.js/), you'll have nice logs.
Colors is not a dependency so the bundle stays light if you don't need colors.


# Documentation

The best documentation are bellow [usage](https://github.com/zouloux/files#usage) and the [Typescript definition](https://github.com/zouloux/files/blob/master/files.d.ts) file.


# Usage

### Target files and folders

##### Target an existing file
- `Files.getFiles('path/to-my-file.txt')`

##### Target an existing folder
- `Files.getFolders('path/to-my-file')`

##### Target a file or a folder
- `Files.any('path/to-a-thing')`

##### Target a file or a folder which does not exist yet
- `Files.new('path/to-not-existing-file.txt')`
- `Files.new('path/to-not-existing-folder')`

##### Target all files inside a folder
- `Files.getFiles('folder/*')`

##### Target all folders inside a folder
- `Files.getFolders('folder/*')`

##### Target all files and folders inside a folder
- `Files.any('folder/*')`

##### Target all images inside a folder
- `Files.getFiles('folder/*.+(jpg|jpeg|png|gif)')`

##### Target files that have an extension and are inside sub-folders of a folder
- `Files.getFiles('folder/*/*.*')`

##### Target all images wherever they are inside a sub-folder
- `Files.getFiles('folder/**/*.+(jpg|jpeg|png|gif)')`
 
##### Target all files wherever they are inside a sub-folder but do not target images
- `Files.getFiles('folder/**/*.!(jpg|jpeg|png|gif)')`



### Browse files, folders and globs

##### Targeted files 
- `Files.getFiles('*').files`
> Returns an array of targeted existing files as strings.

##### Browse a list
- `Files.getFiles('*').all( file => console.log(file) )`
> Will browse through existing files. Here, file is a string, not a Files object.

##### Show glob used to target files or folders
- `Files.getFiles('*').glob`
> Will return '*' as a string.

- `Files.new('not-existing-yet-file.txt').glob`
> Will return 'not-existing-yet-file.txt' as a string.

##### Check if a file exists
- `Files.getFiles('folder/*.txt).exists()`
> Will return true if there is a txt file inside the folder.
> In fact, it will just check that files.length is more than 0.




### Manage files and folders

##### Delete a file
- `Files.getFiles('my-file.txt').delete()`
> **Be careful with this method !**
> Will show deleted files in console if verbose is not disabled.
> If file does not exists, nothing will happen. Check files.length to now how many files are deleted.

##### Delete files and folders inside a folder
- `Files.any('folder/*').delete()`

##### Move a file
- `Files.getFiles('my-existing-file.txt').moveTo('my-directory/')`
> Note the trailing slash. This is important here otherwise the file will be renamed.

##### Rename a file
- `Files.getFiles('my-existing-file.txt').moveTo('my-renamed-file.txt')`
> No trailing slash here, so this is a renaming.

##### Copy files into a new folder
- `Files.getFiles('input/files-*').copyTo('output/')`

##### Copy a file
- `Files.getFiles('file-a.txt').copyTo('file-b.txt')`




### File content

##### Read a file
- `Files.getFiles('my-file.txt').read()`
> Will return file content as string

##### Write a new file
- `Files.new('my-new-file.txt').write('hello !')`

##### Override an existing file
- `Files.getFiles('my-existing-file').write('hello !')`

##### Append a line to a file
- `Files.any('existing-or-not.log').append('new log line')`

##### Append content to a file without new line
- `Files.any('existing-or-not.log').append('new log part', false)`

##### Alter content of a file
```javascript
Files.getFiles('file.txt').alter( fileContent =>
{
	// Replace words and save the file
	return fileContent.replace(/to-replace/, 'replaced');
});
```

##### Alter JSON content
```javascript
Files.getFiles('package.json').alterJSON( packageObject =>
{
	packageObject.version = '0.1.0';
	packageObject.name = 'project-name';
	packageObject.author = 'author';
	return packageObject;
});
```




### Combine !

##### Rename several files
```javascript
Files.getFiles('input/*.jpg').all(
	(file, index) => Files.any( file ).moveTo(`output/${index}.jpg`)
);
```

TODO : Other examples.



### Verbose

##### Enable or disable logs
`Files.setVerbose( true / false )`




# Common issues with API

### Single files operations

You will face problems if you try to do single files operation on multiple targeted files.

Single file methods :
- read
- write
- append
- alter
- alterJSON

Those methods uses the glob (which is here '*') and not the files list, because the file may not exist yet.

**Example :**
- `Files.getFiles('*').write('new file content')`
> This will not work, because this method is not usable on several files at once.



### Multiple files to one file destination
 
Methods : 
- copyTo
- moveTo

Those methods will target one file as destination if there is no trailing slash on destination path. 

**Example :** Copying several files to a single file
- `Files.getFiles('input/*').copyTo('output')`
> Without trailing slash, only the last file targeted will be renamed as 'output'
> This is surely not what you want !

**Example :** Moving several files to a single file
- `Files.getFiles('input/*').moveTo('output')`
> Same as above 