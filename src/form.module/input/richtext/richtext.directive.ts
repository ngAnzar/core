import { Directive, Input, Output, Inject, ElementRef, EventEmitter, HostListener, OnDestroy } from "@angular/core"
import { UP_ARROW, DOWN_ARROW, ESCAPE } from "@angular/cdk/keycodes"
import { Observable, Subject } from "rxjs"

import { Destruct } from "../../../util"
import { LayerService } from "../../../layer.module"

import { RichtextService } from "./richtext.service"
import { RichtextStream, Word, RT_AC_TAG_NAME, RT_PORTAL_TAG_NAME } from "./richtext-stream"
import { RichtextAcManager, RichtextAcProvider } from "./richtext-ac.component"

import { matchTagName } from "./util"


let RT_UNIQUE_IDX = 0


@Directive({
    selector: "[nzRichtext]",
    exportAs: "nzRichtext",
    providers: [RichtextStream]
})
export class RichtextDirective {
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

    public constructor(@Inject(RichtextStream) public readonly stream: RichtextStream) {
    }
}


@Directive({
    selector: "[nzRichtext][contenteditable='true']",
    providers: [RichtextService]
})
export class RichtextEditableDirective implements OnDestroy {
    public readonly destruct = new Destruct()

    @Output("cursorMove")
    public readonly cursorMove: Observable<any> = new EventEmitter()

    // public readonly inAutoComplete: boolean

    private _acManagers: { [key: string]: RichtextAcManager } = {}

    public constructor(
        @Inject(RichtextService) public readonly svc: RichtextService,
        @Inject(LayerService) public readonly layerSvc: LayerService,
        @Inject(RichtextDirective) public readonly rt: RichtextDirective) {

        let mutation = new MutationObserver(this.onMuation)
        this.destruct.any(mutation.disconnect.bind(mutation))
        mutation.observe(rt.stream.el, {
            childList: true,
            subtree: true
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
        for (const k in this._acManagers) {
            this._acManagers[k].dispose()
        }
        delete this._acManagers
    }

    @HostListener("input", ["$event"])
    public onInput(event: Event) {
        this.triggerAutoComplete();
        (this.rt.changes as EventEmitter<string>).emit(this.rt.stream.value)
    }

    @HostListener("keydown", ["$event"])
    public onKeydown(event: KeyboardEvent) {
        if (this._handleKeyEvent(event) || event.defaultPrevented) {
            return
        }
    }

    @HostListener("keyup", ["$event"])
    public onKeyup(event: KeyboardEvent) {
        if (this._handleKeyEvent(event) || event.defaultPrevented) {
            return
        }

        (this.cursorMove as Subject<any>).next()
    }

    protected _handleKeyEvent(event: KeyboardEvent): boolean {
        let handled = false
        for (const k in this._acManagers) {
            let manager = this._acManagers[k]
            if (manager.selection.keyboard.handleKeyEvent(event)) {
                handled = true
            }
        }

        if (event.type === "keyup" && event.keyCode === ESCAPE) {
            let ac = this.rt.stream.state.autocomplete
            if (ac.enabled) {
                ac.value.parentNode.removeChild(ac.value)
                handled = true
                event.stopImmediatePropagation()
                event.preventDefault()
            }
        }

        return handled
    }

    @HostListener("pointerup")
    public onPointerup() {
        (this.cursorMove as Subject<any>).next()
    }

    protected onMuation = (mutations: MutationRecord[]) => {
        for (const record of mutations) {
            let removedNodes = record.removedNodes
            for (let i = 0, l = removedNodes.length, removed: Node; i < l; i++) {
                removed = removedNodes[i]

                // dispose autocomplete manager
                if (matchTagName(removed, RT_AC_TAG_NAME)) {
                    let id = (removed as HTMLElement).getAttribute("rtid")
                    if (id in this._acManagers) {
                        this._acManagers[id].dispose()
                        delete this._acManagers[id]
                    }
                }
            }

            let addedNodes = record.addedNodes
            for (let i = 0, l = addedNodes.length, added: Node; i < l; i++) {
                added = addedNodes[i]

                if (matchTagName(added, RT_PORTAL_TAG_NAME)) {
                    let id: any = (added as HTMLElement).getAttribute("rtid")
                    if (!id) {
                        id = ++RT_UNIQUE_IDX;
                        (added as HTMLElement).setAttribute("rtid", id)
                    }

                    if (!(added as HTMLElement).innerText) {
                        this.createComponent(added as HTMLElement)
                    }
                }
            }

            // remove empty ac anchor element
            if (matchTagName(record.target, RT_AC_TAG_NAME)) {
                let content = (record.target as HTMLElement).innerText
                if (content) {
                    content = content.replace(/^\s+|\s+$/, "")
                }

                if (!content) {
                    record.target.parentNode.removeChild(record.target)
                }
            }
        }
    }

    protected triggerAutoComplete() {
        let selection = this.rt.stream.selection
        if (selection) {
            let acNode = selection.findElement(RT_AC_TAG_NAME)
            if (acNode) {
                let rtid = acNode.getAttribute("rtid")
                let manager = this._acManagers[rtid]
                if (manager) {
                    manager.update(acNode.innerText)
                }
            } else {
                let word = selection.word
                if (word) {
                    let ac = this.svc.getAcProviders(word.value)
                    if (ac.length) {
                        this.beginAc(ac, word)
                    }
                }
            }
        }
    }

    protected beginAc(providers: RichtextAcProvider[], word: Word) {
        let id = ++RT_UNIQUE_IDX
        let html = `<${RT_AC_TAG_NAME} rtid="${id}">${word.value}</${RT_AC_TAG_NAME}>`
        word.select()
        this.rt.stream.command().insertHTML(html).exec()

        let acNode = this.rt.stream.state.autocomplete.value
        if (acNode) {
            this._acManagers[id] = new RichtextAcManager(acNode, providers, this.layerSvc)
            this._acManagers[id].update(word.value)
            // this._acManagers[id].selection.keyboard.connect(this.rt.stream.el)
        } else {
            throw new Error("Runtime error")
        }
    }

    protected createComponent(anchor: HTMLElement) {

    }
}
