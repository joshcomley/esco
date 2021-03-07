import * as ts from "typescript";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";

export class PropertyNode extends ElementNode
{
    public isAbstract: boolean;
    public isArrowFunction: boolean;
    public isStatic: boolean;
    public writeMode: WriteModifier = WriteModifier.writable;

    constructor(sourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration)
    {
        super(propertyDeclaration);

        this.name = (<ts.Identifier>propertyDeclaration.name).escapedText.toString();

        this.fullStart = propertyDeclaration.getFullStart();
        this.end = propertyDeclaration.getEnd();
        this.start = propertyDeclaration.getStart(sourceFile, false);

        this.accessModifier = this.getAccessModifier(propertyDeclaration);
        this.isAbstract = this.getIsAbstract(propertyDeclaration);
        this.isStatic = this.getIsStatic(propertyDeclaration);
        this.writeMode = this.getWriteMode(propertyDeclaration);
        this.decorators = this.getDecorators(propertyDeclaration, sourceFile);

        this.isArrowFunction = this.getIsArrowFunction(propertyDeclaration);
    }

    private getIsArrowFunction(propertyDeclaration: ts.PropertyDeclaration)
    {
        return typeof propertyDeclaration.initializer !== 'undefined' &&
            propertyDeclaration.initializer.kind === ts.SyntaxKind.ArrowFunction;
    }
}