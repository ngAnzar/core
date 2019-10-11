import { Inject, ElementRef } from "@angular/core"
import { LEFT_ARROW, RIGHT_ARROW } from "@angular/cdk/keycodes"

import { SelectionService, Caret } from "./selection"
import { getSiblingInside, getDeepestNode, findUpwards } from "../util"


export class ImmutableService {
    public readonly root: HTMLElement

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(SelectionService) private readonly selection: SelectionService) {
        this.root = el.nativeElement
    }

    public handleKeydown(caret: Caret, event: KeyboardEvent): boolean {
        if (this._handleKeydown(caret, event)) {
            event.preventDefault()
            return true
        } else {
            return false
        }
    }

    private _handleKeydown(caret: Caret, event: KeyboardEvent): boolean {
        let immutable: HTMLElement

        switch (event.keyCode) {
            case LEFT_ARROW:
                if (immutable = immutableBefore(caret)) {
                    this._moveCaret(immutable, true)
                    return true
                }
                break

            case RIGHT_ARROW:
                if (immutable = immutableAfter(caret)) {
                    this._moveCaret(immutable, false)
                    return true
                }
                break
        }


        return false
    }

    public handleKeyup(event: KeyboardEvent): boolean {
        return false
    }

    private _moveCaret(refNode: Node, toStart: boolean) {
        let sibling = refNode
        while (true) {
            sibling = getSiblingInside(sibling, this.root, toStart ? "previousSibling" : "nextSibling")
            if (sibling) {
                sibling = getDeepestNode(sibling, toStart ? "lastChild" : "firstChild")
                let immutable = findUpwards(sibling, this.root, filterImmutable)
                if (immutable) {
                    sibling = immutable
                    continue
                } else {
                    break
                }
            } else {
                break
            }
        }

        let targetNode: Node
        if (!sibling || sibling.nodeType !== 3) {
            targetNode = document.createTextNode("")
            if (toStart) {
                refNode.parentNode.insertBefore(targetNode, refNode)
            } else {
                let before = refNode.nextSibling
                if (before) {
                    refNode.parentNode.insertBefore(targetNode, before)
                } else {
                    refNode.parentNode.appendChild(targetNode)
                }
            }
        } else {
            targetNode = sibling
        }

        console.log("targetNode", targetNode, "refNode", refNode, refNode.parentNode.childNodes)

        const range = this.selection.createRange()
        if (toStart) {
            range.setStart(targetNode.parentNode, 0)
            range.setEnd(targetNode.parentNode, 0)
            range.collapse(false)
        } else {
            range.setStart(targetNode, 0)
            range.setEnd(targetNode, 0)
            range.collapse(true)
        }
        const selection = this.selection.current
        selection.empty()
        selection.addRange(range)
        console.log("AAAAA", this.selection.current.getRangeAt(0))
    }
}


function filterImmutable(node: Node): boolean {
    return node.nodeType === 1 && (node as HTMLElement).getAttribute("immutable") === "true"
}

function immutableBefore(caret: Caret) {
    return caret.before
        ? caret.before.findNode(filterImmutable)
        : caret.inside.findNode(filterImmutable)
}

function immutableAfter(caret: Caret) {
    return caret.after
        ? caret.after.findNode(filterImmutable)
        : caret.inside.findNode(filterImmutable)
}
