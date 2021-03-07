import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class FunctionNode extends ElementNode
{
	public isExport: boolean;

	constructor(sourceFile: ts.SourceFile, functionDeclaration: ts.FunctionDeclaration)
	{
		super(functionDeclaration);

		this.name = (<ts.Identifier>functionDeclaration.name).escapedText.toString();

		this.fullStart = functionDeclaration.getFullStart();
		this.end = functionDeclaration.getEnd();
		this.start = functionDeclaration.getStart(sourceFile, false);

		this.isExport = this.getIsExport(functionDeclaration);
		this.decorators = this.getDecorators(functionDeclaration, sourceFile);
	}
}