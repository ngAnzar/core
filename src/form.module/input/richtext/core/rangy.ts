import { Inject, ElementRef } from "@angular/core"

import * as rangy from "@rangy/core"
import { WrappedSelection } from "@rangy/core"


export class RangyService {
    private readonly el: HTMLElement

    public constructor(@Inject(ElementRef) el: ElementRef<HTMLElement>) {
        this.el = el.nativeElement
    }

    public getSelection() {
        return rangy.getSelection(this.el)
    }

    public createRange() {
        return rangy.createRangyRange()
    }

    public getSelectedNodes(selection: WrappedSelection): Node[] {
        let result: Node[] = []

        for (const range of selection.getAllRanges()) {
            if (range.collapsed) {
                result.push(range.startContainer)
            } else {
                result = result.concat(range.getNodes([1, 3]))
            }
        }

        return result
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
