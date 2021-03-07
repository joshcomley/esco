import * as ts from "typescript";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";

export class IndexNode extends ElementNode
{
	public isAbstract: boolean;
	public isStatic: boolean;
	public writeMode: WriteModifier = WriteModifier.writable;

	constructor(sourceFile: ts.SourceFile, indexDeclaration: ts.IndexedAccessTypeNode)
	{
		super(indexDeclaration);

		this.name = "index";

		this.fullStart = indexDeclaration.getFullStart();
		this.end = indexDeclaration.getEnd();
		this.start = indexDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(indexDeclaration);
		this.isAbstract = this.getIsAbstract(indexDeclaration);
		this.isStatic = this.getIsStatic(indexDeclaration);
		this.writeMode = this.getWriteMode(indexDeclaration);
		this.decorators = this.getDecorators(indexDeclaration, sourceFile);
	}
}