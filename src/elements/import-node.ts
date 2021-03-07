import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class ImportNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, importDeclaration: ts.ImportDeclaration)
	{
		super(importDeclaration);

		this.name = "import";

		this.fullStart = importDeclaration.getFullStart();
		this.end = importDeclaration.getEnd();
		this.start = importDeclaration.getStart(sourceFile, false);
	}
}