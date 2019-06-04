

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