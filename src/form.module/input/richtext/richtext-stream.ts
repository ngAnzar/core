import { Inject, ElementRef, OnDestroy, Attribute } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { Observable, Subject } from "rxjs"

import { Destruct, IDisposable } from "@anzar/core/util"


export class RichtextStream implements IDisposable, OnDestroy {
    public readonly destruct = new Destruct()

    public readonly el: HTMLElement
    public readonly editable: boolean
    public readonly state: RTState = new Proxy({}, {
        get(target, name, receiver) {
            return {
                enabled: document.queryCommandState(name as string),
                params: document.queryCommandValue(name as string)
            }
        },
        set(target, name, value, receiver) {
            throw new Error("State values readonly")
        }
    }) as RTState

    public readonly cursorMove: Observable<any> = new Subject()

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(EventManager) protected readonly evtManager: EventManager,
        @Attribute("contenteditable") contenteditable: any) {
        this.el = el.nativeElement
        this.editable = contenteditable === "true"

        this.destruct.any(evtManager.addEventListener(this.el, "keyup", this.onCursorMove) as any)
        this.destruct.any(evtManager.addEventListener(this.el, "pointerup", this.onCursorMove) as any)
    }

    public get value(): string {
        return this._reconstructible()
    }

    public set value(val: string) {
        this.el.innerHTML = val
        this.process()
    }

    public get selection(): RTSelection | null {
        let sel = window.getSelection()
        if (this.el.contains(sel.anchorNode)) {
            return new RTSelection(sel)
        } else {
            return null
        }
    }

    public process() {

    }

    public command(): RTCommand {
        return new RTCommand(this)
    }

    protected _reconstructible(): string {
        return this.el.innerHTML
    }

    public dispose() {
        delete (this as any).el
        this.destruct.run()
    }

    public ngOnDestroy() {
        this.dispose()
    }

    private onCursorMove = () => {
        (this.cursorMove as Subject<any>).next()
    }
}


export class RTSelection {
    public constructor(public readonly native: Selection) {

    }

    public get word(): Word | null {
        if (this.native.type === "Caret") {
            let content = this.native.anchorNode.nodeValue
            if (content) {
                return extractWord(this.native)
            }
        }
        return null
    }

    public get nodes(): Node[] {
        if (this.native.isCollapsed) {
            return [this.native.anchorNode]
        } else {
            return this.getSelectedNodes()
        }
    }

    private getSelectedNodes(): Node[] {
        let range = this.native.getRangeAt(0)
        let all: Node[]
        let startc = range.startContainer
        let endc = range.startContainer

        if (startc.nodeType === 1) {
            all = (startc as HTMLElement).querySelectorAll("*") as any
        } else if (startc.nodeType == 3) {
            return [startc]
        }

        if (endc.nodeType === 1) {
            for (const el of (endc as HTMLElement).querySelectorAll("*") as any) {
                all.push(el)
            }
        } else if (endc.nodeType == 3) {
            throw new Error("Runtime error")
        }

        throw new Error("TODO")
    }
}


export class RangeFactory {
    public constructor(
        public readonly startNode: Node,
        public readonly startOffset: number,
        public readonly endNode: Node,
        public readonly endOffset: number) {

    }

    public create(): Range {
        let range = document.createRange()
        range.setStart(this.startNode, this.startOffset)
        range.setEnd(this.endNode, this.endOffset)
        return range
    }

    public select(): Range {
        let range = this.create()
        let sel = document.getSelection()
        sel.empty()
        sel.addRange(range)
        return range
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


function extractWord(sel: Selection): Word | null {
    let offset = sel.anchorOffset
    let content = sel.anchorNode.nodeValue
    let begin = offset
    let end = content.length

    for (let i = offset; i >= 0; i--) {
        begin = i
        if (/\s/.test(content[i])) {
            begin = i + 1
            break
        }
    }

    for (let i = offset, l = content.length; i < l; i++) {
        if (/\s/.test(content[i])) {
            end = i
            break
        }
    }

    let result = content.substring(begin, end).replace(/^\s+|\s+$/, "")
    return result ? new Word(result, sel.anchorNode, begin, sel.anchorNode, end) : null
}

/**
 * stream.command().selected_or_block().bold().underline()
 * stream.command().selected_or_word().bold().underline()
 */

export class RTCommand {
    public constructor(
        protected readonly stream: RichtextStream,
        public readonly prev?: RTCommand,
        public readonly name?: string,
        public readonly params?: any) {

    }

    public bold() { return new RTCommand(this.stream, this, "bold", null) }

    public italic() { return new RTCommand(this.stream, this, "italic", null) }

    public underline() { return new RTCommand(this.stream, this, "underline", null) }

    public strikeThrough() { return new RTCommand(this.stream, this, "strikeThrough", null) }

    public insertHTML(html: string) { return new RTCommand(this.stream, this, "insertHTML", html) }

    public exec() {
        let cmds = []
        let obj: RTCommand = this

        while (obj) {
            if (obj.name) {
                cmds.unshift(obj.name, obj.params)
            }
            obj = obj.prev
        }

        for (let i = 0, l = cmds.length; i < l; i += 2) {
            document.execCommand(cmds[i], false, cmds[i + 1])
        }

        this.stream.el.focus()
    }
}


export interface RTStateEntry {
    enabled: boolean
    params?: any
}


export interface RTState {
    bold: RTStateEntry
    italic: RTStateEntry
    underline: RTStateEntry
    strikeThrough: RTStateEntry
}
