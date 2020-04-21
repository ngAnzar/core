import { Inject, ElementRef, Injectable } from "@angular/core"
import { DOCUMENT } from "@angular/common"

import { matchTagName, removeNode } from "../util"
import { RichtextStream } from "./richtext-stream"
import { SelectionService } from "./selection"


export class Command {
    public constructor(
        public readonly name: string,
        public readonly arg: string = null) {
    }
}


@Injectable()
export class ContentEditable {
    private readonly el: HTMLElement
    public readonly defaultParagraph: string = "div"

    public get isFocused() {
        const active = this.doc.activeElement
        return active && (active === this.el || this.el.contains(active))
    }

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) private readonly doc: Document,
        @Inject(RichtextStream) private readonly stream: RichtextStream,
        @Inject(SelectionService) private readonly selection: SelectionService) {
        this.el = el.nativeElement
        doc.execCommand("defaultParagraphSeparator", false, this.defaultParagraph)
    }

    public exec(command: Command): void
    public exec(command: string, arg?: string): void

    public exec(name: string | Command, arg: string = null): void {
        if (name instanceof Command) {
            return this.exec(name.name, name.arg)
        }

        this.el.focus()
        this.doc.execCommand(name, false, arg)
        this.stream.emitChanges()
    }

    public insertNode(node: Node) {
        let range = this.selection.current.getRangeAt(0)
        let insertNode = node as HTMLElement

        if (!range.collapsed) {
            this.delete()
            range = this.selection.current.getRangeAt(0)
        }

        // Firefox hack, for contenteditbale=false
        // if ((node as HTMLElement).contentEditable === "false") {
        //     let ceWrapper = document.createElement("span")
        //     ceWrapper.appendChild(node)
        //     insertNode = ceWrapper
        // }

        const firstChild = this.el.firstChild
        if (!matchTagName(firstChild, this.defaultParagraph)) {
            let p = this.doc.createElement(this.defaultParagraph)
            p.appendChild(insertNode)
            insertNode = p
        }

        range.insertNode(insertNode)
        this.selection.moveCaretAfter(insertNode.lastChild || insertNode)
        this.stream.emitChanges()
    }

    public removeNode(node: Node) {
        removeNode(node)
        this.stream.emitChanges()
    }

    public replaceNode(node: Node, replacement: Node) {
        this.selection.moveCaretAfter(node)
        this.insertNode(replacement)
        this.removeNode(node)
        this.selection.moveCaretAfter(replacement)
    }
}


export interface ContentEditable {
    bold(): void
    italic(): void
    underline(): void
    strikeThrough(): void
    delete(): void
    removeFormat(): void
    backColor(color: string): void
    hiliteColor(color: string): void
    insertHTML(html: string): void
    insertText(text: string): void
    formatBlock(text: string): void
}

const COMMANDS = ["bold", "italic", "underline", "strikeThrough", "delete", "removeFormat", "backColor", "hiliteColor", "insertHTML", "insertText", "formatBlock"]

for (let cmd of COMMANDS) {
    (ContentEditable.prototype as any)[cmd] = function (arg: any) {
        return this.exec(cmd, arg)
    }
}
