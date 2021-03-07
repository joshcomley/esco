import { ClassNode } from "./elements/class-node";
import { ElementNode } from "./elements/element-node";
import { EnumNode } from "./elements/enum-node";
import { FunctionNode } from "./elements/function-node";
import { ImportNode } from "./elements/import-node";
import { InterfaceNode } from "./elements/interface-node";
import { TypeAliasNode } from "./elements/type-alias-node";

export function compareStrings(a: string, b: string)
{
	if (a > b)
	{
		return 1;
	}
	else if (a < b)
	{
		return -1;
	}
	else
	{
		return 0;
	}
}

export function compareNumbers(a: number, b: number)
{
	if (a > b)
	{
		return 1;
	}
	else if (a < b)
	{
		return -1;
	}
	else
	{
		return 0;
	}
}

export function getTypeAliases(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof TypeAliasNode).sort((a, b) => sort(a, b));
}

export function getInterfaces(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof InterfaceNode).sort((a, b) => sort(a, b));
}

export function getClasses(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof ClassNode).sort((a, b) => sort(a, b));
}

export function getEnums(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof EnumNode).sort((a, b) => sort(a, b));
}

export function getImports(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof ImportNode).sort((a, b) => sort(a, b));
}

export function getFunctions(nodes: ElementNode[])
{
	return nodes.filter(x => x instanceof FunctionNode).sort((a, b) => sort(a, b));
}

export function getName(node: ElementNode): string
{
	return node.name;
}

export function sort<T extends ElementNode>(a: T, b: T)
{
	return compareStrings(getName(a), getName(b));
}