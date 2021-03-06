import { RichtextStream } from "./richtext-stream"


export class RichtextState {
    public constructor(
        public readonly richtextEl: RichtextElement,
        public readonly value: any) {
    }
}


export interface StateQuery {
    getState(stream: RichtextStream, nodes: Node[]): RichtextState | null
}


export class RichtextElement implements StateQuery {
    public readonly selector: string

    public constructor(
        public readonly tagName: string,
        public readonly className?: string,
        public readonly attributes?: { [key: string]: any },
        public readonly options?: ElementCreationOptions) {
        this.selector = `${tagName}`
        if (className) {
            this.selector += `.${className}`
        }
    }

    public create(): HTMLElement {
        const el = document.createElement(this.tagName, this.options)
        if (this.className) {
            el.className = this.className
        }
        if (this.attributes) {
            for (const k in this.attributes) {
                if (this.attributes.hasOwnProperty(k)) {
                    el.setAttribute(k, this.attributes[k])
                }
            }
        }
        return el
    }

    public getState(stream: RichtextStream, nodes: Node[]): RichtextState | null {
        let found = this.findNode(nodes)
        if (found) {
            return new RichtextState(this, found)
        }
        return null
    }

    public testNode = (node: Node): boolean => {
        return node.nodeType === 1
            && ((node as HTMLElement).tagName.toLowerCase() === this.tagName)
            && (!this.className || ((node as HTMLElement).classList.contains(this.className)))
    }

    private findNode(nodes: Node[]): Node {
        let resultNode: Node
        for (const node of nodes) {
            resultNode = node
            do {
                if (this.testNode(resultNode)) {
                    return resultNode as HTMLElement
                } else {
                    resultNode = resultNode.parentNode
                }
            } while (resultNode)
        }
        return null
    }
}


export class RichtextFormatElement extends RichtextElement {
    public constructor(tagName: string, public readonly commandName: string) {
        super(tagName)
    }

    public getState(stream: RichtextStream, nodes: Node[]): RichtextState | null {
        if (document.queryCommandState(this.commandName)) {
            return new RichtextState(this, document.queryCommandValue(this.commandName))
        }
        return null
    }
}
