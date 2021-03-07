import * as ts from "typescript";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";

export class PropertySignatureNode extends ElementNode
{
	public writeMode: WriteModifier = WriteModifier.writable;

	constructor(sourceFile: ts.SourceFile, propertySignatureDeclaration: ts.PropertySignature)
	{
		super(propertySignatureDeclaration);

		this.name = (<ts.Identifier>propertySignatureDeclaration.name).escapedText.toString();

		this.fullStart = propertySignatureDeclaration.getFullStart();
		this.end = propertySignatureDeclaration.getEnd();
		this.start = propertySignatureDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(propertySignatureDeclaration);
		this.writeMode = this.getWriteMode(propertySignatureDeclaration);
		this.decorators = this.getDecorators(propertySignatureDeclaration, sourceFile);
	}
}