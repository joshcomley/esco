import { ESLint } from "eslint";
import * as ts from "typescript";
import { Configuration } from "./configuration";
import { ElementNodeGroup } from "./element-node-group";
import { ClassNode } from "./elements/class-node";
import { ElementNode } from "./elements/element-node";
import { GetterNode } from "./elements/getter-node";
import { InterfaceNode } from "./elements/interface-node";
import { MethodNode } from "./elements/method-node";
import { PropertyNode } from "./elements/property-node";
import { SetterNode } from "./elements/setter-node";
import { UnknownNode } from "./elements/unknown-node";
import { MemberType } from "./member-type";
import { formatLines, removeRegions } from "./regions";
import { Transformer } from "./transformer";
import { compareNumbers, getClasses, getEnums, getFunctions, getImports, getInterfaces, getTypeAliases } from "./utils";

export class Esco {
    constructor(public configuration: Configuration) {
    }

    public organizeTypes(sourceCode: string, fileName: string): Promise<string> {
        // See: https://eslint.org/docs/developer-guide/nodejs-api
        const cli = new ESLint({
            useEslintrc: true
        });
        return new Promise<string>(resolver => {
            cli.isPathIgnored(fileName).then(isIgnored => {
                if (!isIgnored) {
                    cli.calculateConfigForFile(fileName).then(eslintConfig => {
                        const memberOrdering = this.resolveMemberOrdering(eslintConfig);
                        if (!memberOrdering) {
                            resolver(sourceCode);
                        } else {
                            resolver(this.organizeFile(sourceCode, fileName, this.mapMemberOrdering(memberOrdering)));
                        }
                    });
                } else {
                    resolver(sourceCode);
                }
            });
        });
    }

    protected getIndentation(sourceCode: string): string {
        let tab = "\t";
        let twoSpaces = "  ";
        let fourSpaces = "    ";

        for (const sourceCodeLine of sourceCode.split("\n")) {
            if (sourceCodeLine.startsWith(tab)) {
                return tab;
            }
            else if (sourceCodeLine.startsWith(fourSpaces)) {
                return fourSpaces;
            }
            else if (sourceCodeLine.startsWith(twoSpaces)) {
                return twoSpaces;
            }
        }

        return twoSpaces;
    }

    protected mapMemberOrder(memberOrder: string): MemberType | MemberType[] | null {
        switch (memberOrder) {
            // Index signature
            case "signature": return [
                MemberType.publicDecoratedIndexes,
                MemberType.protectedDecoratedIndexes,
                MemberType.privateDecoratedIndexes,
                MemberType.publicStaticIndexes,
                MemberType.protectedStaticIndexes,
                MemberType.privateStaticIndexes,
                MemberType.publicIndexes,
                MemberType.protectedIndexes,
                MemberType.privateIndexes,
                MemberType.publicAbstractIndexes,
                MemberType.protectedAbstractIndexes,
                MemberType.privateAbstractIndexes,
            ];

            // Fields
            case "public-static-field": return [
                MemberType.publicStaticDecoratedProperties,
                MemberType.publicStaticConstProperties,
                MemberType.publicStaticReadOnlyProperties,
                MemberType.publicStaticProperties,
                MemberType.publicStaticGettersAndSetters
            ];
            case "protected-static-field": return [
                MemberType.protectedStaticDecoratedProperties,
                MemberType.protectedStaticConstProperties,
                MemberType.protectedStaticReadOnlyProperties,
                MemberType.protectedStaticProperties,
                MemberType.protectedStaticGettersAndSetters
            ];
            case "private-static-field": return [
                MemberType.privateStaticDecoratedProperties,
                MemberType.privateStaticConstProperties,
                MemberType.privateStaticReadOnlyProperties,
                MemberType.privateStaticProperties,
                MemberType.privateStaticGettersAndSetters
            ];

            case "public-decorated-field": return [
                MemberType.publicDecoratedConstProperties,
                MemberType.publicDecoratedProperties,
                MemberType.publicDecoratedGettersAndSetters,
                MemberType.publicDecoratedReadOnlyProperties,
                MemberType.publicDecoratedAbstractProperties
            ];
            case "protected-decorated-field": return [
                MemberType.protectedDecoratedConstProperties,
                MemberType.protectedDecoratedProperties,
                MemberType.protectedDecoratedGettersAndSetters,
                MemberType.protectedDecoratedReadOnlyProperties,
                MemberType.protectedDecoratedAbstractProperties
            ];
            case "private-decorated-field": return [
                MemberType.privateDecoratedConstProperties,
                MemberType.privateDecoratedProperties,
                MemberType.privateDecoratedGettersAndSetters,
                MemberType.privateDecoratedReadOnlyProperties,
                MemberType.privateDecoratedAbstractProperties
            ];

            case "public-instance-field": return [
                MemberType.publicConstProperties,
                MemberType.publicReadOnlyProperties,
                MemberType.publicProperties,
                MemberType.publicGettersAndSetters
            ];
            case "protected-instance-field": return [
                MemberType.protectedConstProperties,
                MemberType.protectedReadOnlyProperties,
                MemberType.protectedProperties,
                MemberType.protectedGettersAndSetters
            ];
            case "private-instance-field": return [
                MemberType.privateConstProperties,
                MemberType.privateReadOnlyProperties,
                MemberType.privateProperties,
                MemberType.privateGettersAndSetters
            ];

            case "public-abstract-field": return [
                MemberType.publicAbstractProperties,
                MemberType.publicAbstractGettersAndSetters
            ];
            case "protected-abstract-field": return [
                MemberType.protectedAbstractProperties,
                MemberType.protectedAbstractGettersAndSetters
            ];
            case "private-abstract-field": return [
                MemberType.privateAbstractProperties,
                MemberType.privateAbstractGettersAndSetters
            ];

            // Constructors
            case "public-constructor": return MemberType.publicConstructors;
            case "protected-constructor": return MemberType.protectedConstructors;
            case "private-constructor": return MemberType.privateConstructors;

            // case "constructor": return MemberType.;

            // Methods
            case "public-static-method": return [MemberType.publicStaticMethods, MemberType.publicStaticDecoratedMethods];
            case "protected-static-method": return [MemberType.protectedStaticMethods, MemberType.protectedStaticDecoratedMethods];
            case "private-static-method": return [MemberType.privateStaticMethods, MemberType.privateStaticDecoratedMethods];

            case "public-decorated-method": return MemberType.publicDecoratedMethods;
            case "protected-decorated-method": return MemberType.protectedDecoratedMethods;
            case "private-decorated-method": return MemberType.privateDecoratedMethods;

            case "public-instance-method": return MemberType.publicMethods;
            case "protected-instance-method": return MemberType.protectedMethods;
            case "private-instance-method": return MemberType.privateMethods;

            case "public-abstract-method": return MemberType.publicAbstractMethods;
            case "protected-abstract-method": return MemberType.protectedAbstractMethods;
            case "private-abstract-method": return MemberType.privateAbstractMethods;

            // Not yet supported:
            // case "public-field": return MemberType.;
            // case "protected-field": return MemberType.;
            // case "private-field": return MemberType.;

            // case "static-field": return MemberType.;
            // case "instance-field": return MemberType.;
            // case "abstract-field": return MemberType.;

            // case "decorated-field": return MemberType.;

            // case "field": return MemberType.;

            // case "public-method": return MemberType.;
            // case "protected-method": return MemberType.;
            // case "private-method": return MemberType.;

            // case "static-method": return MemberType.;
            // case "instance-method": return MemberType.;
            // case "abstract-method": return MemberType.;

            // case "decorated-method": return MemberType.;

            // case "method": return MemberType.;
        }
        return null;
    }

    protected mapMemberOrdering(memberOrdering: Array<string>): Array<MemberType> {
        const result = new Array<MemberType>();
        for (const memberOrder of memberOrdering) {
            const mapped = this.mapMemberOrder(memberOrder);
            if (mapped != null) {
                if (Array.isArray(mapped)) {
                    result.push(...mapped);
                } else {
                    result.push(mapped);
                }
            }
        }
        return result;
    }

    protected organizeClassMembers(
        classNode: ClassNode,
        eslintOrdering: MemberType[]): ElementNodeGroup[] {
        let regions: ElementNodeGroup[] = [];
        let memberGroups: ElementNodeGroup[] = [];

        for (const memberType of eslintOrdering) {
            if (memberType === MemberType.privateDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedProperties(), false));
            }
            else if (memberType === MemberType.protectedDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedProperties(), false));
            }
            else if (memberType === MemberType.publicDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedProperties(), false));
            }
            else if (memberType === MemberType.privateStaticDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticDecoratedMethods(), false));
            }
            else if (memberType === MemberType.protectedStaticDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticDecoratedMethods(), false));
            }
            else if (memberType === MemberType.publicStaticDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticDecoratedMethods(), false));
            }
            else if (memberType === MemberType.privateStaticDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticDecoratedProperties(), false));
            }
            else if (memberType === MemberType.protectedStaticDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticDecoratedProperties(), false));
            }
            else if (memberType === MemberType.publicStaticDecoratedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticDecoratedProperties(), false));
            }
            else if (memberType === MemberType.publicDecoratedIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedIndexes(), false));
            }
            else if (memberType === MemberType.protectedDecoratedIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedIndexes(), false));
            }
            else if (memberType === MemberType.privateDecoratedIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedIndexes(), false));
            }
            else if (memberType === MemberType.publicDecoratedGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedGettersAndSetters(), false));
            }
            else if (memberType === MemberType.privateDecoratedGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedGettersAndSetters(), false));
            }
            else if (memberType === MemberType.protectedDecoratedGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedGettersAndSetters(), false));
            }
            else if (memberType === MemberType.publicDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedMethods(), false));
            }
            else if (memberType === MemberType.protectedDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedMethods(), false));
            }
            else if (memberType === MemberType.privateDecoratedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedMethods(), false));
            }
            else if (memberType === MemberType.privateStaticConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticConstProperties(), false));
            }
            else if (memberType === MemberType.privateConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateConstProperties(), false));
            }
            else if (memberType === MemberType.privateStaticReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.privateReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.privateStaticProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticProperties(), false));
            }
            else if (memberType === MemberType.privateProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateProperties(), false));
            }
            else if (memberType === MemberType.protectedStaticConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticConstProperties(), false));
            }
            else if (memberType === MemberType.protectedConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedConstProperties(), false));
            }
            else if (memberType === MemberType.protectedStaticReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.protectedReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.protectedStaticProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticProperties(), false));
            }
            else if (memberType === MemberType.protectedProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedProperties(), false));
            }
            else if (memberType === MemberType.publicStaticConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticConstProperties(), false));
            }
            else if (memberType === MemberType.publicConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicConstProperties(), false));
            }
            else if (memberType === MemberType.publicStaticReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.publicStaticProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticProperties(), false));
            }
            else if (memberType === MemberType.publicProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicProperties(), false));
            }
            else if (memberType === MemberType.publicConstructors) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicConstructors(), false));
            }
            else if (memberType === MemberType.protectedConstructors) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedConstructors(), false));
            }
            else if (memberType === MemberType.privateConstructors) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateConstructors(), false));
            }
            else if (memberType === MemberType.publicStaticIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticIndexes(), false));
            }
            else if (memberType === MemberType.publicIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicIndexes(), false));
            }
            else if (memberType === MemberType.publicAbstractIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractIndexes(), false));
            }
            else if (memberType === MemberType.protectedStaticIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticIndexes(), false));
            }
            else if (memberType === MemberType.protectedIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedIndexes(), false));
            }
            else if (memberType === MemberType.protectedAbstractIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractIndexes(), false));
            }
            else if (memberType === MemberType.privateStaticIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticIndexes(), false));
            }
            else if (memberType === MemberType.privateIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateIndexes(), false));
            }
            else if (memberType === MemberType.privateAbstractIndexes) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractIndexes(), false));
            }
            else if (memberType === MemberType.publicStaticGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticGettersAndSetters(), false));
            }
            else if (memberType === MemberType.publicGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicGettersAndSetters(), false));
            }
            else if (memberType === MemberType.publicAbstractGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractGettersAndSetters(), false));
            }
            else if (memberType === MemberType.protectedStaticGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticGettersAndSetters(), false));
            }
            else if (memberType === MemberType.protectedGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedGettersAndSetters(), false));
            }
            else if (memberType === MemberType.protectedAbstractGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractGettersAndSetters(), false));
            }
            else if (memberType === MemberType.privateStaticGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticGettersAndSetters(), false));
            }
            else if (memberType === MemberType.privateGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateGettersAndSetters(), false));
            }
            else if (memberType === MemberType.privateAbstractGettersAndSetters) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractGettersAndSetters(), false));
            }
            else if (memberType === MemberType.publicStaticMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticMethods(), false));
            }
            else if (memberType === MemberType.publicMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicMethods(), false));
            }
            else if (memberType === MemberType.publicAbstractMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractMethods(), false));
            }
            else if (memberType === MemberType.protectedStaticMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticMethods(), false));
            }
            else if (memberType === MemberType.protectedMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedMethods(), false));
            }
            else if (memberType === MemberType.protectedAbstractMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractMethods(), false));
            }
            else if (memberType === MemberType.privateStaticMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticMethods(), false));
            }
            else if (memberType === MemberType.privateMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateMethods(), false));
            }
            else if (memberType === MemberType.privateAbstractMethods) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractMethods(), false));
            }
            else if (memberType === MemberType.publicAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractProperties(), false));
            }
            else if (memberType === MemberType.protectedAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractProperties(), false));
            }
            else if (memberType === MemberType.privateAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractProperties(), false));
            }
            else if (memberType === MemberType.publicDecoratedConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedConstProperties(), false));
            }
            else if (memberType === MemberType.publicDecoratedAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedAbstractProperties(), false));
            }
            else if (memberType === MemberType.publicDecoratedReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicDecoratedReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.protectedDecoratedConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedConstProperties(), false));
            }
            else if (memberType === MemberType.protectedDecoratedAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedAbstractProperties(), false));
            }
            else if (memberType === MemberType.protectedDecoratedReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedDecoratedReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.privateDecoratedConstProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedConstProperties(), false));
            }
            else if (memberType === MemberType.privateDecoratedAbstractProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedAbstractProperties(), false));
            }
            else if (memberType === MemberType.privateDecoratedReadOnlyProperties) {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateDecoratedReadOnlyProperties(), false));
            }
        }

        regions.push(new ElementNodeGroup("all", memberGroups, [], true));

        return regions;
    }

    protected organizeFile(sourceCode: string, fileName: string, eslintConfig: Array<MemberType>) {
        sourceCode = removeRegions(sourceCode);

        let indentation = this.getIndentation(sourceCode);

        // organize type aliases, interfaces, classes, enums, functions and variables
        let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        let elements = new Transformer().analyzeSyntaxTree(sourceFile);

        if (!elements.some(x => !(x instanceof UnknownNode))) {
            let imports = getImports(elements);
            let functions = getFunctions(elements);
            let typeAliases = getTypeAliases(elements);
            let interfaces = getInterfaces(elements);
            let classes = getClasses(elements);
            let enums = getEnums(elements);

            let groups = [
                new ElementNodeGroup("Imports", [], imports, false),
                new ElementNodeGroup("Type aliases", [], typeAliases, true),
                new ElementNodeGroup("Interfaces", [], interfaces, true),
                new ElementNodeGroup("Classes", [], classes, true),
                new ElementNodeGroup("Enums", [], enums, true),
                new ElementNodeGroup("Functions", [], functions, true)
            ];

            if (functions.length + typeAliases.length + interfaces.length + classes.length + enums.length > 1 ||
                functions.length > 0) {
                sourceCode = this.print(
                    groups,
                    sourceCode,
                    0,
                    sourceCode.length,
                    0,
                    this.configuration.addPublicModifierIfMissing,
                    indentation);
            }
        }

        // organize members of interfaces and classes
        sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        elements = new Transformer().analyzeSyntaxTree(sourceFile);

        for (let element of elements.sort((a, b) => compareNumbers(a.fullStart, b.fullStart) * -1)) {
            if (element instanceof InterfaceNode) {
                let interfaceNode = <InterfaceNode>element;
                let groups = this.organizeInterfaceMembers(interfaceNode, eslintConfig);

                sourceCode = this.print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, this.configuration.addPublicModifierIfMissing, indentation);
            }
            else if (element instanceof ClassNode) {
                let classNode = <ClassNode>element;
                let groups = this.organizeClassMembers(classNode, eslintConfig);

                sourceCode = this.print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, this.configuration.addPublicModifierIfMissing, indentation);
            }
        }

        sourceCode = formatLines(sourceCode);
        return sourceCode;
    }

    protected organizeInterfaceMembers(interfaceNode: InterfaceNode, eslintOrdering: MemberType[]) {
        let regions: ElementNodeGroup[] = [];
        let memberGroups: ElementNodeGroup[] = [];

        for (const memberType of eslintOrdering) {
            if (memberType === MemberType.publicConstProperties) {
                // protected const properties
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getConstProperties(), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties) {
                // protected readonly methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getReadOnlyProperties(), false));
            }
            else if (memberType === MemberType.publicProperties) {
                // protected methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getProperties(), false));
            }
            else if (memberType === MemberType.publicIndexes) {
                // protected indexes
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getIndexes(), false));
            }
            else if (memberType === MemberType.publicMethods) {
                // protected methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getMethods(), false));
            }
        }

        regions.push(new ElementNodeGroup("all", memberGroups, [], true));

        return regions;
    }

    protected print(
        groups: ElementNodeGroup[],
        sourceCode: string,
        start: number,
        end: number,
        IndentationLevel: number,
        addPublicModifierIfMissing: boolean,
        Indentation: string) {
        let sourceCode2: string;
        let count = 0;
        let members = "";
        let newLine = "\r\n";
        let nodeGroups: ElementNode[][] = [];

        for (let group of groups) {
            if (group.nodes &&
                group.nodes.length > 0) {
                count = group.nodes.length;
                nodeGroups = [group.nodes];
            }
            else if (group.nodeSubGroups &&
                group.nodeSubGroups.length > 0) {
                count = group.nodeSubGroups.reduce((sum, x) => sum + x.nodes.length, 0);
                nodeGroups = group.nodeSubGroups.map(x => x.nodes).filter(x => x.length > 0);
            }
            else {
                count = 0;
                nodeGroups = [];
            }

            if (count > 0) {
                members += newLine;

                for (let nodeGroup of nodeGroups) {
                    for (let i = 0; i < nodeGroup.length; i++) {
                        const node = nodeGroup[i];
                        let comment = sourceCode.substring(node.fullStart, node.start).trim();
                        let code = sourceCode.substring(node.start, node.end).trim();

                        if (addPublicModifierIfMissing && node.accessModifier == null &&
                            (node instanceof MethodNode ||
                                node instanceof PropertyNode ||
                                node instanceof GetterNode ||
                                node instanceof SetterNode)) {
                            let left = "";
                            const prop = node.node as ts.PropertyDeclaration;
                            if (prop.name) {
                                left = sourceCode.substr(node.start, prop.name.pos - node.start);
                            } else {
                                const match = new RegExp("(.*?)" + node.name).exec(code);
                                left = (match == null || match.length < 1 ? "" : match[1]).trim();
                            }
                            code = code.substr(left.length);
                            const otherModifiers = ["async", "abstract", "readonly", "static", "get", "set"];
                            const foundModifiers = new Array<string>();
                            while (true) {
                                let canExit = true;
                                for (const modifier of otherModifiers) {
                                    left = left.trim();
                                    if (left.endsWith(modifier)) {
                                        canExit = false;
                                        if (!foundModifiers.includes(modifier)) {
                                            foundModifiers.push(modifier);
                                        }
                                        left = left.substr(0, left.length - modifier.length).trim();
                                    }
                                }
                                if (canExit) {
                                    break;
                                }
                            }
                            const prefix = [left, "public", foundModifiers.reverse().join(" ")]
                                .filter(_ => _ != null && _.trim() !== "")
                                .join(" ");
                            code = `${prefix} ${code.trimLeft()}`;
                        }

                        if (comment !== "") {
                            members += `${IndentationLevel === 1 ? Indentation : ""}${comment}${newLine}`;
                        }

                        members += `${IndentationLevel === 1 ? Indentation : ""}${code}`;
                        members += newLine;

                        if (code.endsWith("}")) {
                            members += newLine;
                        }
                        else if (node instanceof PropertyNode &&
                            node.isArrowFunction) {
                            // arrow protected property -> add a new line
                            members += newLine;
                        }
                    }

                    members += newLine;
                }

                members += newLine;
            }
        }

        sourceCode2 = sourceCode.substring(0, start).trimRight();
        sourceCode2 += newLine;
        sourceCode2 += Indentation + members.trim();
        sourceCode2 += newLine;
        sourceCode2 += sourceCode.substring(end, sourceCode.length).trimLeft();

        return sourceCode2.trimLeft();
    }

    protected resolveMemberOrdering(eslintConfig: any): Array<string> | null {
        if (!eslintConfig) {
            return null;
        }
        const rules = eslintConfig["rules"];
        if (!rules) {
            return null;
        }
        const memberOrdering = rules["@typescript-eslint/member-ordering"];
        if (!memberOrdering) {
            return null;
        }
        if (Array.isArray(memberOrdering) && memberOrdering.length > 1) {
            const definitions = memberOrdering[1];
            const props = new Array<string>();
            props.push("default");
            for (const prop in definitions) {
                props.push(prop);
            }
            if (props.length === 0) {
                return null;
            }
            for (const prop of props) {
                const result = definitions[prop];
                if (Array.isArray(result) && typeof result !== "string") {
                    return result;
                }
            }
            return null;
        }
        return null;
    }
}
