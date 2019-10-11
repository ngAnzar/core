import { Inject, ElementRef } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { Observable, Subject } from "rxjs"

import { Destructible } from "../../../../util"

import { getParentsUntil } from "../util"
import { SelectionService, RangeFactory } from "./selection"
import { RichtextElement, StateQuery, RichtextState } from "./richtext-el"


export type CleanupElementFn = (el: HTMLElement) => void


export class RichtextStream extends Destructible {
    public readonly el: HTMLElement
    public readonly changes: Observable<RichtextStream> = this.destruct.subject(new Subject<RichtextStream>())
    public readonly cursorMove: Observable<any> = this.destruct.subject(new Subject())

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

    private _elementHandlers: Array<{ handler: RichtextElement, cleanup: CleanupElementFn }> = []

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(SelectionService) private readonly _selection: SelectionService) {
        super()
        this.el = el.nativeElement

    }

    public addElementHandler(handler: RichtextElement, cleanup: CleanupElementFn) {
        this._elementHandlers.push({ handler, cleanup })
    }

    public getState(query: StateQuery): RichtextState {
        return query.getState(this, this._selection.nodes)
    }

    public getWordUnderCaret(): Word {
        const selection = this._selection.current
        if (selection && selection.type === "Caret") {
            return extractWord(selection, /\s/)
        }
        return null
    }

    public getNodeUnerCaret(): Node {
        const selection = this._selection.current
        if (selection && selection.type === "Caret") {
            return selection.anchorNode
        }
        return null
    }

    public updatePosition() {
        (this.cursorMove as Subject<any>).next()
    }

    public emitChanges() {
        this.updatePosition();
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
