import { ElementNode } from "./elements/element-node";

export class ElementNodeGroup
{
    constructor(public caption: string | null, public nodeSubGroups: ElementNodeGroup[], public nodes: ElementNode[], public isRegion: boolean)
    {
    }
}