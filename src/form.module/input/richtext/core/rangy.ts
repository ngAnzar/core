import { Inject, ElementRef } from "@angular/core"

import * as rangy from "@rangy/core"
import "core-js/features/object/assign"


export class RangyService {
    private readonly el: HTMLElement

    public constructor(@Inject(ElementRef) el: ElementRef<HTMLElement>) {
        this.el = el.nativeElement
    }

    public getSelection() {
        return rangy.getSelection(this.el)
    }

    public getCaretPosition() {

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
        let range = rangy.createRangyRange()
        range.setStart(this.startNode, this.startOffset)
        range.setEnd(this.endNode, this.endOffset)
        return range
    }

    public select() {
        const range = this.create()
        range.select()
        return rangy.getSelection()
    }
}
