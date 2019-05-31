

export function matchTagName(elm: Node, name: string): boolean {
    return elm.nodeType === 1 && (elm as HTMLElement).tagName.toLowerCase() === name
}
