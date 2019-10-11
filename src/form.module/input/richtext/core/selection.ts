import { Inject, ElementRef } from "@angular/core"
import { DOCUMENT } from "@angular/common"

import { getDeepestNode, getParentsUntil, matchTagName } from "../util"


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

    public getRangeNodes(range: Range): Node[] {
        return getRangeNodes(range)
    }

    public getInfoBeforeCaret() {
        return CaretSibling.create(this.current, this.root, -1)
    }

    public getInfoAfterCaret() {
        return CaretSibling.create(this.current, this.root, 1)
    }

    public moveCaretBefore(node: Node) {
        const range = this.createRange()
        range.setStartBefore(node)
        range.setEndBefore(node)
        range.collapse()
        this.current.empty()
        this.current.addRange(range)
    }

    public moveCaretAfter(node: Node) {
        const range = this.createRange()
        range.setStartAfter(node)
        range.setEndAfter(node)
        range.collapse()
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

function rangeNode(container: Node, offset: number): Node {
    if (container.nodeType === 1) {
        return container.childNodes[Math.max(0, Math.min(container.childNodes.length - 1, offset))]
    } else {
        return container
    }
}


export class CaretSibling {
    public static create(selection: Selection, root: Node, direction: -1 | 1) {
        if (selection.type !== "Caret") {
            return null
        }
        const range = selection.getRangeAt(selection.rangeCount - 1)
        if (!range) {
            return null
        }

        const container = range.commonAncestorContainer
        const startNode = rangeNode(range.startContainer, range.startOffset)
        const endNode = rangeNode(range.endContainer, range.endOffset)

        if (!startNode) {
            return null
        }

        console.log("NFO", range, (container as HTMLElement).children, (container as HTMLElement).childNodes, { container, startNode, endNode })

        let resultNode: Node
        let char: string
        let offset: number
        if (direction === -1) {
            if (container.nodeType === 3) {
                if (range.startOffset !== 0) {
                    return new CaretSibling("before", startNode, startNode.nodeValue[range.startOffset], range.startOffset, root)
                } else {
                    resultNode = getBlock(startNode, root, "previousSibling")
                }
            } else if (startNode.nodeType === 3 || matchTagName(startNode, "br")) {
                resultNode = getBlock(startNode, root, "previousSibling")
            } else {
                resultNode = startNode
            }

            if (!resultNode) {
                return null
            }

            resultNode = getDeepestNode(resultNode, "lastChild")
            if (resultNode.nodeValue) {
                offset = resultNode.nodeValue.length - 1
                char = resultNode.nodeValue[offset]
            } else {
                offset = NaN
                char = null
            }
        } else {
            if (endNode.nodeType === 3) {
                let value = endNode.nodeValue
                if (value.length === range.endOffset) {
                    resultNode = getBlock(endNode, root, "nextSibling")
                } else {
                    return new CaretSibling("after", endNode, value[range.endOffset], range.endOffset, root)
                }
            } else {
                resultNode = endNode
            }

            if (!resultNode) {
                return null
            }

            resultNode = getDeepestNode(resultNode, "firstChild")
            if (resultNode.nodeValue) {
                offset = 0
                char = resultNode.nodeValue[offset]
            } else {
                offset = NaN
                char = null
            }
        }

        return new CaretSibling(direction === -1 ? "before" : "after", resultNode, char, offset, root)
    }

    public constructor(
        public readonly type: "before" | "after",
        public readonly node: Node,
        public readonly character: string,
        public readonly offset: number,
        public readonly root: Node) {
    }

    public get parents() {
        return getParentsUntil(this.node, this.root)
    }
}


function getBlock(fromNode: Node, container: Node, direction: "previousSibling" | "nextSibling"): Node | null {
    let prev: Node

    while (fromNode && fromNode !== container) {
        prev = fromNode[direction]
        while (prev && prev.nodeType === 3 && !prev.nodeValue) {
            prev = prev[direction]
        }
        if (prev) {
            return prev
        } else {
            fromNode = fromNode.parentNode
        }
    }

    return null
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
