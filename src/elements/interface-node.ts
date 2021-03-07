import * as ts from "typescript";
import { sort } from "../utils";
import { ElementNode } from "./element-node";
import { IndexSignatureNode } from "./index-signature-node";
import { MethodSignatureNode } from "./method-signature-node";
import { PropertySignatureNode } from "./property-signature-node";

export class InterfaceNode extends ElementNode
{
	public indexes: IndexSignatureNode[] = [];
	public membersEnd: number = 0;
	public membersStart: number = 0;
	public methods: MethodSignatureNode[] = [];
	public properties: PropertySignatureNode[] = [];

	constructor(sourceFile: ts.SourceFile, interfaceDeclaration: ts.InterfaceDeclaration)
	{
		super(interfaceDeclaration);

		this.name = (<ts.Identifier>interfaceDeclaration.name).escapedText.toString();

		this.fullStart = interfaceDeclaration.getFullStart();
		this.end = interfaceDeclaration.getEnd();
		this.start = interfaceDeclaration.getStart(sourceFile, false);

		if (interfaceDeclaration.members &&
			interfaceDeclaration.members.length > 0)
		{
			this.membersStart = interfaceDeclaration.members[0].getFullStart();
			this.membersEnd = interfaceDeclaration.members[interfaceDeclaration.members.length - 1].getEnd();
		}
	}

	public getConstProperties()
	{
		return this.properties.filter(x => this.isConstant(x)).sort((a, b) => sort(a, b));
	}

	public getIndexes()
	{
		return this.indexes.sort((a, b) => sort(a, b));
	}

	public getMethods()
	{
		return this.methods.sort((a, b) => sort(a, b));
	}

	public getProperties()
	{
		return this.properties.filter(x => this.isWritable(x)).sort((a, b) => sort(a, b));
	}

	public getReadOnlyProperties()
	{
		return this.properties.filter(x => this.isReadOnly(x)).sort((a, b) => sort(a, b));
	}
}