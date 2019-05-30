import { Directive, Input, Output, Inject, ElementRef, EventEmitter, HostListener, OnDestroy } from "@angular/core"
import { Observable } from "rxjs"

import { Destruct } from "@anzar/core/util"

import { RichtextService, RichtextAcProvider } from "./richtext.service"
import { RichtextStream, Word } from "./richtext-stream"



export const RT_AUTOCOMPLET_TAG_NAME = "nz-rt-autocomplete"


@Directive({
    selector: "[nzRichtext]",
    exportAs: "nzRichtext",
    providers: [RichtextService, RichtextStream]
})
export class RichtextDirective implements OnDestroy {
    public readonly destruct = new Destruct()

    @Input("nzRichtext")
    public set value(val: string) {
        if (this._value !== val) {
            this.stream.value = val
            this._value = this.stream.value;
            (this.changes as EventEmitter<string>).emit(this.stream.value)
        }
    }
    public get value(): string { return this._value }
    private _value: string

    @Output("change")
    public readonly changes: Observable<string> = new EventEmitter<string>()

    @Output("cursorMove")
    public readonly cursorMove: Observable<any> = new EventEmitter()

    public readonly inAutoComplete: boolean

    private _acProviders: { [key: string]: RichtextAcProvider[] } = {}

    public constructor(
        @Inject(RichtextService) protected readonly svc: RichtextService,
        @Inject(RichtextStream) public readonly stream: RichtextStream) {
    }

    @HostListener("input")
    public onInput() {
        if (this.stream.editable) {
            this.triggerAutoComplete();
            (this.changes as EventEmitter<string>).emit(this.stream.value)
        }
    }

    @HostListener("keyup")
    public onKeyup() {
        if (this.stream.editable) {
            (this.cursorMove as EventEmitter<any>).emit()
        }
    }

    @HostListener("pointerup")
    public onPointerup() {
        if (this.stream.editable) {
            (this.cursorMove as EventEmitter<any>).emit()
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    protected triggerAutoComplete() {
        (this as any).inAutoComplete = false

        let selection = this.stream.selection
        if (selection) {
            let acNode = this.inAcNode(selection.nodes)
            if (acNode) {
                (this as any).inAutoComplete = true
                console.log("inAc", acNode, acNode.innerText)
            } else {
                let word = selection.word
                if (word) {
                    let ac = this.svc.getAcProviders(word.value)
                    if (ac.length) {
                        (this as any).inAutoComplete = true
                        this.beginAc(word)
                    }
                }
            }
        }

        // let word = this.stream.wordUnderCaret
        // if (word) {
        //     let ac = this.svc.getAcProviders(word)
        //     console.log("autocomplete", ac)
        // }
    }

    protected inAcNode(nodes: Node[]): HTMLElement | null {
        for (const node of nodes) {
            let acNode = node
            do {
                if (acNode.nodeType == 1 && (acNode as HTMLElement).tagName.toLowerCase() === RT_AUTOCOMPLET_TAG_NAME) {
                    return acNode as HTMLElement
                } else {
                    acNode = acNode.parentNode
                }
            } while (acNode)
        }
        return null
    }

    protected beginAc(word: Word) {
        console.log("beginAc", word)
        let html = `<${RT_AUTOCOMPLET_TAG_NAME}>${word.value}</${RT_AUTOCOMPLET_TAG_NAME}>`
        word.select()
        this.stream.command().insertHTML(html).exec()
    }
}
