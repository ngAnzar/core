import { Inject, ElementRef } from "@angular/core"


export class RichtextStream {
    public readonly el: HTMLElement
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

    public constructor(@Inject(ElementRef) el: ElementRef<HTMLElement>) {
        this.el = el.nativeElement
    }

    public get value(): string {
        return this._reconstructible()
    }

    public set value(val: string) {
        this.el.innerHTML = val
        this.process()
    }

    public process() {

    }

    public command(): RTCommand {
        return new RTCommand(this)
    }

    protected _reconstructible(): string {
        return this.el.innerHTML
    }
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
