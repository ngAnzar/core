import { Inject, ElementRef } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { Observable, Subject } from "rxjs"
import { WrappedSelection } from "@rangy/core"

import { Destructible } from "../../../../util"

import { RangyService, RangeFactory } from "./rangy"
import { RichtextElement, StateQuery, RichtextState } from "./richtext-el"


export type CleanupElementFn = (el: HTMLElement) => void


export class RichtextStream extends Destructible {
    public readonly el: HTMLElement
    public readonly changes: Observable<RichtextStream> = this.destruct.subject(new Subject<RichtextStream>())

    public set content(val: string) {
        if (this.el.innerHTML !== val) {
            this.el.innerHTML = val
            this.emitChanges()
        }
    }
    public get content(): string { return this.el.innerHTML }

    public get contentTpl(): string {
        let clone = this.el.cloneNode(true) as HTMLElement

        for (const h of this._elementHandlers) {
            if (h.cleanup) {
                clone.querySelectorAll(h.handler.selector).forEach(h.cleanup)
            }
        }

        return clone.innerHTML
    }

    public readonly selection: WrappedSelection
    private _nodesForSelection: Node[]

    private _elementHandlers: Array<{ handler: RichtextElement, cleanup: CleanupElementFn }> = []

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(EventManager) protected readonly evtManager: EventManager,
        @Inject(RangyService) protected readonly rangy: RangyService) {
        super()
        this.el = el.nativeElement

    }

    public addElementHandler(handler: RichtextElement, cleanup: CleanupElementFn) {
        this._elementHandlers.push({ handler, cleanup })
    }

    public getState(query: StateQuery, refresh: boolean = false): RichtextState {
        if (refresh) {
            this._nodesForSelection = this.rangy.getSelectedNodes(this.rangy.getSelection())
        } else if (!this._nodesForSelection) {
            this._nodesForSelection = this.rangy.getSelectedNodes(this.selection)
        }

        return query.getState(this, this._nodesForSelection)
    }

    public getWordUnderCaret(): Word {
        const native = this.selection ? this.selection.nativeSelection : null
        if (native && native.type === "Caret") {
            return extractWord(native, /\s/)
        }
        return null
    }

    public getNodeUnerCaret(): Node {
        const native = this.selection ? this.selection.nativeSelection : null
        if (native && native.type === "Caret") {
            return native.anchorNode
        }
        return null
    }

    public getNodesBeforeCaret(): Node[] {
        return this._getCaretSiblings(-1)
    }

    public getNodesAfterCaret() {
        return this._getCaretSiblings(1)
    }

    private _getCaretSiblings(direction: number): Node[] {
        const native = this.selection ? this.selection.nativeSelection : null
        let result: Node[] = []

        if (native && native.type === "Caret") {
            const range = this.selection.getRangeAt(this.selection.rangeCount - 1)
            if (!range) {
                return
            }

            const newRange = this.rangy.createRange()
            let start: Node
            if (direction === -1) {
                newRange.setStart(this.el, 0)
                newRange.setEnd(range.startContainer, range.startOffset)
                const nodes = newRange.getNodes([1, 3])
                start = nodes[nodes.length - 1]
            } else {
                newRange.setStart(range.endContainer, range.endOffset)
                newRange.setEnd(this.el, this.el.childNodes.length)
                const nodes = newRange.getNodes([1, 3])
                start = nodes[1]
            }

            while (start && start !== this.el) {
                result.unshift(start)
                start = start.parentElement
            }
        }
        return result
    }

    public updatePosition() {
        (this as { selection: WrappedSelection }).selection = this.rangy.getSelection()
        delete this._nodesForSelection
    }

    public emitChanges() {
        (this.changes as Subject<RichtextStream>).next(this)
    }
}


export class Word extends RangeFactory {
    public constructor(
        public readonly value: string,
        startNode: Node,
        startOffset: number,
        endNode: Node,
        endOffset: number) {
        super(startNode, startOffset, endNode, endOffset)
    }
}


function extractWord(sel: Selection, separator: RegExp): Word | null {
    const content = sel.anchorNode.nodeValue
    if (!content || !content.length) {
        return null
    }

    const offset = sel.anchorOffset
    let begin = offset
    let end = content.length

    for (let i = Math.max(offset - 1); i >= 0; i--) {
        begin = i
        if (separator.test(content[i])) {
            begin = i + 1
            break
        }
    }

    for (let i = offset, l = content.length; i < l; i++) {
        if (separator.test(content[i])) {
            end = i
            break
        }
    }

    let result = content.substring(begin, end).replace(/^\s+|\s+$/, "")
    return result ? new Word(result, sel.anchorNode, begin, sel.anchorNode, end) : null
}
