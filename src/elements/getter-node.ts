import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class GetterNode extends ElementNode
{
	public isAbstract: boolean;
	public isStatic: boolean;

	constructor(sourceFile: ts.SourceFile, getterDeclaration: ts.GetAccessorDeclaration)
	{
		super(getterDeclaration);

		this.name = (<ts.Identifier>getterDeclaration.name).escapedText.toString();

		this.fullStart = getterDeclaration.getFullStart();
		this.end = getterDeclaration.getEnd();
		this.start = getterDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(getterDeclaration);
		this.isAbstract = this.getIsAbstract(getterDeclaration);
		this.isStatic = this.getIsStatic(getterDeclaration);
		this.decorators = this.getDecorators(getterDeclaration, sourceFile);
	}
}