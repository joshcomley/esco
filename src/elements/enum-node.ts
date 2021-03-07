import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class EnumNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, enumDeclaration: ts.EnumDeclaration)
	{
		super(enumDeclaration);

		this.name = (<ts.Identifier>enumDeclaration.name).escapedText.toString();

		this.fullStart = enumDeclaration.getFullStart();
		this.end = enumDeclaration.getEnd();
		this.start = enumDeclaration.getStart(sourceFile, false);
		this.decorators = this.getDecorators(enumDeclaration, sourceFile);
	}
}
