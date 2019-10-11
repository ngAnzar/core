

export function matchTagName(elm: Node, name: string): boolean {
    return elm.nodeType === 1 && (elm as HTMLElement).tagName.toLowerCase() === name
}


export function removeNode(node: Node) {
    let parent = node.parentNode
    if (parent) {
        parent.removeChild(node)
    }
}


export function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


export function getParentsUntil(fromNode: Node, toNode: Node): Node[] {
    let result: Node[] = [fromNode]
    let parent = fromNode.parentNode
    do {
        result.push(parent)
        parent = parent.parentNode
    } while (parent && parent !== toNode)
    return result
}


export function getDeepestNode(start: Node, direction: "firstChild" | "lastChild") {
    while (start) {
        if (start[direction]) {
            start = start[direction]
        } else {
            break
        }
    }
    return start
}


export function getSiblingInside(fromNode: Node, container: Node, direction: "previousSibling" | "nextSibling"): Node | null {
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

export function findUpwards(fromNode: Node, container: Node, filter: (node: HTMLElement) => boolean): HTMLElement {
    let node = fromNode as HTMLElement
    while (node && node.nodeType === 3 || !filter(node)) {
        if (node === container) {
            return null
        }
        node = node.parentNode as HTMLElement
    }
    return node
}
