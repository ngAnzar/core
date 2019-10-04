import { Subject } from "rxjs"

import { RangeFactory } from "./rangy"


export class Caret {
    public readonly positionChange = new Subject()

    public getWordUnderCaret(): Word {
        return null
    }

    public getNodeUnerCaret(): Node {
        return null
    }

    public getNodeBeforeCaret() {

    }

    public getNodeAfterCaret() {

    }

    public _updatePosition() {

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
