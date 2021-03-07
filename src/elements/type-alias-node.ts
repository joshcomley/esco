import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class TypeAliasNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, typeAliasDeclaration: ts.TypeAliasDeclaration)
	{
		super(typeAliasDeclaration);

		this.name = (<ts.Identifier>typeAliasDeclaration.name).escapedText.toString();

		this.fullStart = typeAliasDeclaration.getFullStart();
		this.end = typeAliasDeclaration.getEnd();
		this.start = typeAliasDeclaration.getStart(sourceFile, false);
		this.decorators = this.getDecorators(typeAliasDeclaration, sourceFile);
	}
}
