import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class MethodSignatureNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, methodSignatureDeclaration: ts.MethodSignature)
	{
		super(methodSignatureDeclaration);

		this.name = (<ts.Identifier>methodSignatureDeclaration.name).escapedText.toString();

		this.fullStart = methodSignatureDeclaration.getFullStart();
		this.end = methodSignatureDeclaration.getEnd();
		this.start = methodSignatureDeclaration.getStart(sourceFile, false);
		this.decorators = this.getDecorators(methodSignatureDeclaration, sourceFile);
	}
}