import { Inject, ElementRef } from "@angular/core"
import { DOCUMENT } from "@angular/common"

import { RichtextStream } from "./richtext-stream"


export class Command {
    public constructor(
        public readonly name: string,
        public readonly arg: string = null) {
    }
}


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
        @Inject(RichtextStream) private readonly stream: RichtextStream) {
        this.el = el.nativeElement
        doc.execCommand("defaultParagraphSeparator", false, this.defaultParagraph)
    }

    public exec(command: Command): void;
    public exec(command: string, arg?: string): void;

    public exec(name: string | Command, arg: string = null): void {
        if (name instanceof Command) {
            return this.exec(name.name, name.arg)
        }

        setTimeout(() => {
            this.el.focus()
            this.doc.execCommand(name, false, arg)
            this.stream.emitChanges()
        }, 0)
    }
}


export interface ContentEditable {
    bold(): void
    italic(): void
    underline(): void
    strikeThrough(): void
    insertHTML(html: string): void
    insertText(text: string): void
    formatBlock(text: string): void
}

const COMMANDS = ["bold", "italic", "underline", "strikeThrough", "insertHTML", "insertText", "formatBlock"]

for (let cmd of COMMANDS) {
    (ContentEditable.prototype as any)[cmd] = function (arg: any) {
        return this.exec(cmd, arg)
    }
}
