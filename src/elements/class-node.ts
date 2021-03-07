import * as ts from "typescript";
import { sort } from "../utils";
import { ConstructorNode } from "./constructor-node";
import { ElementNode } from "./element-node";
import { GetterNode } from "./getter-node";
import { IndexNode } from "./index-node";
import { MethodNode } from "./method-node";
import { PropertyNode } from "./property-node";
import { SetterNode } from "./setter-node";

export class ClassNode extends ElementNode {
	public constructors: ConstructorNode[] = [];
	public getters: GetterNode[] = [];
	public indexes: IndexNode[] = [];
	public isAbstract: boolean;
	public isStatic: boolean;
	public membersEnd: number = 0;
	public membersStart: number = 0;
	public methods: MethodNode[] = [];
	public properties: PropertyNode[] = [];
	public setters: SetterNode[] = [];

	constructor(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration) {
		super(classDeclaration);

		this.name = (<ts.Identifier>classDeclaration.name).escapedText.toString();

		this.fullStart = classDeclaration.getFullStart();
		this.end = classDeclaration.getEnd();
		this.start = classDeclaration.getStart(sourceFile, false);

		if (classDeclaration.members &&
			classDeclaration.members.length > 0) {
			this.membersStart = classDeclaration.members[0].getFullStart();
			this.membersEnd = classDeclaration.members[classDeclaration.members.length - 1].getEnd();
		}

		this.isAbstract = this.getIsAbstract(classDeclaration);
		this.isStatic = this.getIsStatic(classDeclaration);
		this.decorators = this.getDecorators(classDeclaration, sourceFile);
	}

	public getGettersAndSetters(hasDecorators: boolean = false) {
		let all = this.getters.concat(this.setters);
		const withDecorators = new Array<string>();
		for (const getSet of all) {
			if (getSet.hasDecorators) {
				withDecorators.push(getSet.name);
			}
		}
		return all.filter(x => {
			const hasDecorator = withDecorators.filter(_ => _ === x.name).length > 0;
			return hasDecorators ? hasDecorator : !hasDecorator;
		});
	}

	public getPrivateAbstractGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateAbstractIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateAbstractMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateAbstractProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateConstProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateConstructors(hasDecorators: boolean = false) {
		return this.constructors.filter(x => this.isPrivate(x)).sort((a, b) => sort(a, b));
	}

	public getPrivateDecoratedAbstractProperties() {
		return this.getPrivateAbstractProperties(true);
	}

	public getPrivateDecoratedConstProperties() {
		return this.getPrivateConstProperties(true);
	}

	public getPrivateDecoratedGettersAndSetters() {
		return this.getPrivateGettersAndSetters(true);
	}

	public getPrivateDecoratedIndexes() {
		return this.getPrivateIndexes(true);
	}

	public getPrivateDecoratedMethods() {
		return this.getPrivateMethods(true);
	}

	public getPrivateDecoratedProperties() {
		return this.getPrivateProperties(true);
	}

	public getPrivateDecoratedReadOnlyProperties() {
		return this.getPrivateReadOnlyProperties(true);
	}

	public getPrivateGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && !x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticConstProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticDecoratedMethods() {
		return this.getPrivateStaticMethods(true);
	}

	public getPrivateStaticDecoratedProperties() {
		return this.getPrivateStaticProperties(true);
	}

	public getPrivateStaticGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPrivateStaticReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPrivate(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedAbstractGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedAbstractIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedAbstractMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedAbstractProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedConstProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedConstructors(hasDecorators: boolean = false) {
		return this.constructors.filter(x => this.isProtected(x)).sort((a, b) => sort(a, b));
	}

	public getProtectedDecoratedAbstractProperties() {
		return this.getProtectedAbstractProperties(true);
	}

	public getProtectedDecoratedConstProperties() {
		return this.getProtectedConstProperties(true);
	}

	public getProtectedDecoratedGettersAndSetters() {
		return this.getProtectedGettersAndSetters(true);
	}

	public getProtectedDecoratedIndexes() {
		return this.getProtectedIndexes(true);
	}

	public getProtectedDecoratedMethods() {
		return this.getProtectedMethods(true);
	}

	public getProtectedDecoratedProperties() {
		return this.getProtectedProperties(true);
	}

	public getProtectedDecoratedReadOnlyProperties() {
		return this.getProtectedReadOnlyProperties(true);
	}

	public getProtectedGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && !x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticConstProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticDecoratedMethods() {
		return this.getProtectedStaticMethods(true);
	}

	public getProtectedStaticDecoratedProperties() {
		return this.getProtectedStaticProperties(true);
	}

	public getProtectedStaticGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getProtectedStaticReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isProtected(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicAbstractGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicAbstractIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicAbstractMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicAbstractProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicConstProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicConstructors(hasDecorators: boolean = false) {
		return this.constructors.filter(x => this.isPublic(x)).sort((a, b) => sort(a, b));
	}

	public getPublicDecoratedAbstractProperties() {
		return this.getPublicAbstractProperties(true);
	}

	public getPublicDecoratedConstProperties() {
		return this.getPublicConstProperties(true);
	}

	public getPublicDecoratedGettersAndSetters() {
		return this.getPublicGettersAndSetters(true);
	}

	public getPublicDecoratedIndexes() {
		return this.getPublicIndexes(true);
	}

	public getPublicDecoratedMethods() {
		return this.getPublicMethods(true);
	}

	public getPublicDecoratedProperties() {
		return this.getPublicProperties(true);
	}

	public getPublicDecoratedReadOnlyProperties() {
		return this.getPublicReadOnlyProperties(true);
	}

	public getPublicGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && !x.isAbstract && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicStaticConstProperties(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicStaticDecoratedMethods() {
		return this.getPublicStaticMethods(true);
	}

	public getPublicStaticDecoratedProperties() {
		return this.getPublicStaticProperties(true);
	}

	public getPublicStaticGettersAndSetters(hasDecorators: boolean = false) {
		return this.getGettersAndSetters(hasDecorators).filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicStaticIndexes(hasDecorators: boolean = false) {
		return this.indexes.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicStaticMethods(hasDecorators: boolean = false) {
		return this.methods.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b));
	}

	public getPublicStaticProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b));
	}

	public getPublicStaticReadOnlyProperties(hasDecorators: boolean = false) {
		return this.properties.filter(x => x.hasDecorators === hasDecorators && this.isPublic(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b));
	}
}
