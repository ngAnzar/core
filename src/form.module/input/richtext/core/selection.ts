import { Inject, ElementRef, Injectable } from "@angular/core"
import { DOCUMENT } from "@angular/common"

import { getDeepestNode, getSiblingInside, findUpwards } from "../util"


@Injectable()
export class SelectionService {
    private readonly root: HTMLElement
    public constructor(
        @Inject(DOCUMENT) private readonly doc: Document,
        @Inject(ElementRef) el: ElementRef<HTMLElement>) {
        this.root = el.nativeElement
    }

    public createRange() {
        return this.doc.createRange()
    }

    public get current() {
        return this.doc.getSelection()
    }

    public get nodes(): Node[] {
        const selection = this.current
        let result: Node[] = []

        for (let i = 0, l = selection.rangeCount; i < l; i++) {
            const range = selection.getRangeAt(i)
            result = result.concat(getRangeNodes(range))
        }

        return result
    }

    public get caret() {
        return Caret.create(this.current, this.root)
    }

    public getRangeNodes(range: Range): Node[] {
        return getRangeNodes(range)
    }

    public moveCaretBefore(node: Node) {
        const range = this.createRange()
        range.setStartBefore(node)
        range.setEndBefore(node)
        range.collapse(true)
        this.current.empty()
        this.current.addRange(range)
    }

    public moveCaretAfter(node: Node) {
        const range = this.createRange()
        range.setStartAfter(node)
        range.setEndAfter(node)
        range.collapse(false)
        this.current.empty()
        this.current.addRange(range)
    }
}


export class RangeFactory {
    public constructor(
        public readonly startNode: Node,
        public readonly startOffset: number,
        public readonly endNode: Node,
        public readonly endOffset: number) {
    }

    public create() {
        let range = document.createRange()
        range.setStart(this.startNode, this.startOffset)
        range.setEnd(this.endNode, this.endOffset)
        return range
    }

    public select() {
        const selection = document.getSelection()
        selection.empty()
        selection.addRange(this.create())
    }
}


function getRangeNodes(range: Range): Node[] {
    const container = range.commonAncestorContainer

    if (container.nodeType !== 1) {
        return [container]
    }

    const startNode = rangeNode(range.startContainer, range.startOffset)
    const endNode = rangeNode(range.endContainer, range.endOffset)

    let result: Node[] = []
    let append: boolean = false

    nodeWalker(container, (path: Node[], idx: number) => {
        const node = path[path.length - 1]

        if (container === node) {
            return true
        }

        if (!append) {
            append = node === startNode
        }

        if (append) {
            result.push(node)
            if (node === endNode) {
                return false
            }
        }

        return true
    })

    return result
}


export class Caret {
    public static create(selection: Selection, root: Node): Caret {
        if (selection.type !== "Caret") {
            return null
        }
        const range = selection.getRangeAt(selection.rangeCount - 1)
        if (!range) {
            return null
        }

        const container = range.commonAncestorContainer

        let inside: CaretNode
        let before: CaretNode = null
        let after: CaretNode = null

        if (container.nodeType === 3) {
            inside = CaretNode.create("inside", container, range.startOffset, root)
            if (range.startOffset === 0) {
                after = CaretNode.create("after", container, range.startOffset, root)
                before = CaretNode.create("before", getSiblingInside(container, root, "previousSibling"), range.startOffset, root)
            } else if (range.startOffset === container.nodeValue.length) {
                before = inside
                after = CaretNode.create("after", getSiblingInside(container, root, "nextSibling"), range.startOffset, root)
            }
        } else {
            const startNode = rangeNode(range.startContainer, range.startOffset)
            if (!startNode) {
                return null
            }

            inside = CaretNode.create("inside", startNode, range.startOffset, root)

            if (startNode.nodeType === 3) {
                before = CaretNode.create("before", getSiblingInside(startNode, root, "previousSibling"), range.startOffset, root)
                after = inside
            } else {
                if (range.startOffset === 0 || container.childNodes.length - 1 === range.startOffset) {
                    before = CaretNode.create("before", getSiblingInside(startNode, root, "previousSibling"), range.startOffset, root)
                    after = inside
                }
            }
        }

        return new Caret(inside, before, after)
    }

    public constructor(
        public inside: CaretNode,
        public before: CaretNode | null,
        public after: CaretNode | null) {
    }
}


export type CaretNodeType = "before" | "after" | "inside"


export class CaretNode {
    public static create(type: CaretNodeType, node: Node, offset: number, root: Node) {
        if (!node) {
            return null
        }

        if (node.nodeType === 1) {
            let deepest = getDeepestNode(node, type === "before" ? "lastChild" : "firstChild")
            if (deepest !== node) {
                offset = type === "before" ? deepest.parentNode.childNodes.length - 1 : 0
            }
            node = deepest
        } else if (node.nodeType === 3 && type !== "inside") {
            offset = node.nodeValue
                ? type === "before" ? node.nodeValue.length : 0
                : NaN
        }
        return new CaretNode(type, node, offset, root)
    }

    public get character(): string | null {
        return !isNaN(this.offset) && this.node.nodeValue ? this.node.nodeValue[this.offset] : null
    }

    public constructor(
        public readonly type: CaretNodeType,
        public readonly node: Node,
        public readonly offset: number,
        public readonly root: Node
    ) {

    }

    public findNode(filter: (node: HTMLElement) => boolean): HTMLElement {
        return findUpwards(this.node, this.root, filter)
    }
}


function rangeNode(container: Node, offset: number): Node {
    if (container.nodeType === 1) {
        return container.childNodes[Math.max(0, Math.min(container.childNodes.length - 1, offset))]
    } else {
        return container
    }
}




function nodeWalker(node: Node, cb: (path: Node[], childIndex: number) => boolean) {
    let xx = node.parentNode.children
    let childIndex: number = 0
    for (let i = 0, l = xx.length; i < l; i++) {
        if (xx[i] === node) {
            childIndex = i
            break
        }
    }
    _nodeWalker(node, [node], childIndex, cb)
}

function _nodeWalker(node: Node, path: Node[], childIndex: number, cb: any) {
    if (!cb(path, childIndex)) {
        return false
    } else {
        let child = node.firstChild
        let idx = 0
        while (child) {
            if (_nodeWalker(child, path.concat(child), idx, cb)) {
                idx++
                child = child.nextSibling
            } else {
                return false
            }
        }
        return true
    }
}
