# ESLint TypeScript Class Organizer for VS Code

VS Code extension for ordering class members according to the ESLint configuration rule `@typescript-eslint/member-ordering`.

(this package isn't published just yet... coming soon!)

## Credits

This package is derived from another extension by [aljazsim](https://github.com/aljazsim/vs-code-typescript-class-organizer).

## Usage

### Command Palette

From the command palette you can:

- organize current TypeScript file by invoking command "ESCO: Organize Current File",
- organize all TypeScript files in the project by invoking command "ESCO: Organize All Files"

### Shortcuts

You can invoke command "ESCO: Organize Current File" by using the shortcut Ctr + Shift + O. You can change the shortcut by assigning a different shortcut to command "esco.organize".

### Context menu

You can invoke command "ESCO: Organize Current File" by using the context menu item.

## Configuration

Extensions supports the following configuration options:

- `esco.addPublicModifierIfMissing`: When true public access modifier is added. True by default.
- `esco.organizeOnSave`: When true file will get organized automatically whenever saved. False by default.