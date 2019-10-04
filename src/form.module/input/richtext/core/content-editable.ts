import { Inject, ElementRef } from "@angular/core"
import { DOCUMENT } from "@angular/common"

import { } from "./caret"

export class Command {
    public constructor(
        public readonly name: string,
        public readonly arg: string = null) {
    }
}


export class ContentEditable {
    private readonly el: HTMLElement

    public get isFocused() {
        const active = this.doc.activeElement
        return active && (active === this.el || this.el.contains(active))
    }

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) private readonly doc: Document) {
        this.el = el.nativeElement
    }

    public exec(command: Command): void;
    public exec(command: string, arg?: string): void;

    public exec(name: string | Command, arg: string = null): void {
        if (name instanceof Command) {
            return this.exec(name.name, name.arg)
        }
        if (this.isFocused) {
            document.execCommand(name, false, arg)
        }
    }
}


export interface ContentEditable {
    bold(): void
    italic(): void
    underline(): void
    strikeThrough(): void
    insertHTML(html: string): void
    insertText(text: string): void
}

const COMMANDS = ["bold", "italic", "underline", "strikeThrough", "insertHTML", "insertText"]

for (let cmd of COMMANDS) {
    (ContentEditable.prototype as any)[cmd] = function (arg: any) {
        return this.exec(cmd, arg)
    }
}
