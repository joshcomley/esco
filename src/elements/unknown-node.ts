import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class UnknownNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, unknownNode: ts.Node)
	{
		super(unknownNode);

		this.name = "unknown";

		this.fullStart = unknownNode.getFullStart();
		this.end = unknownNode.getEnd();
		this.start = unknownNode.getStart(sourceFile, false);
	}
}