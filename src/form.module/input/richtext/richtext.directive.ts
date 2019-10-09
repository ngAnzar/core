import { Directive, Input, Inject, ElementRef, Output, HostListener, Optional } from "@angular/core"
import { BACKSPACE, DELETE, LEFT_ARROW, RIGHT_ARROW } from "@angular/cdk/keycodes"
import { Subject, Observable } from "rxjs"


import { Destructible, __zone_symbol__ } from "../../../util"
import { ScrollerService } from "../../../list.module"
import { RangyService } from "./core/rangy"
import { RichtextStream, Word } from "./core/richtext-stream"
import { ComponentManager, RICHTEXT_CMP_PORTAL_EL } from "./core/component-manager"
import { ContentEditable } from "./core/content-editable"
import { AutocompleteManager, RICHTEXT_AUTO_COMPLETE_EL } from "./core/autocomplete"
import { removeNode, matchTagName } from "./util"
import { AutocompletePopup } from "./autocomplete.component"
import { take } from 'rxjs/operators'


const MUTATION_OBSERVER: "MutationObserver" = __zone_symbol__("MutationObserver")


@Directive({
    selector: "[nzRichtext]",
    host: {
        "[style.white-space]": "'normal'"
    },
    exportAs: "nzRichtext",
    providers: [
        RangyService,
        RichtextStream,
        ComponentManager
    ]
})
export class RichtextDirective extends Destructible {
    @Input("nzRichtext")
    public set value(val: string) { this.stream.content = val }
    public get value(): string { return this.stream.content }

    @Output("value") public readonly valueChange = this.stream.changes

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(RichtextStream) public readonly stream: RichtextStream,
        @Inject(ComponentManager) public readonly cmpManager: ComponentManager) {
        super()

        this.destruct.any(watchMutation(el.nativeElement, this.onMutation.bind(this), {
            childList: true,
            subtree: true
        }))

        this.destruct.disposable(cmpManager)
    }

    private onMutation(mutations: MutationRecord[]) {
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            nodes = record.addedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                if (RICHTEXT_CMP_PORTAL_EL.testNode(node)) {
                    this.cmpManager.getRef(node as HTMLElement)
                } else if (node.nodeType === 1) {
                    let portalEls = (node as HTMLElement).querySelectorAll(RICHTEXT_CMP_PORTAL_EL.selector)
                    for (let k = 0, kl = portalEls.length; k < kl; k++) {
                        this.cmpManager.getRef(portalEls[k] as HTMLElement)
                    }
                }
            }
        }
    }
}

//
@Directive({
    selector: "[nzRichtext][contenteditable='true']",
    host: {
        "[attr.autocomplete]": "'off'"
    },
    providers: [
        ContentEditable,
        AutocompleteManager,
        AutocompletePopup
    ]
})
export class RichtextEditableDirective extends Destructible {
    @Output() public readonly cursorMove = this.stream.cursorMove

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(RichtextStream) private readonly stream: RichtextStream,
        @Inject(ContentEditable) private readonly ce: ContentEditable,
        @Inject(AutocompleteManager) private readonly acManager: AutocompleteManager,
        @Inject(AutocompletePopup) private readonly acPopup: AutocompletePopup,
        @Inject(ComponentManager) private readonly cmpManager: ComponentManager,
        @Inject(ScrollerService) @Optional() private readonly scroller: ScrollerService) {
        super()

        this.destruct.any(watchMutation(el.nativeElement, this.onMutation.bind(this), {
            childList: true,
            subtree: true
        }))
    }

    @HostListener("input", ["$event"])
    public onInput(event: Event) {
        const target = event.target as HTMLElement
        const firstChild = target.firstChild

        if (firstChild && firstChild.nodeType === 3) {
            this.ce.formatBlock(`<${this.ce.defaultParagraph}>`)
        }

        this.stream.emitChanges()
        this.triggerAc()
    }

    @HostListener("pointerup", ["$event"])
    public onPointerUp(event: Event) {
        this.emitCursorMove()
    }

    @HostListener("keydown", ["$event"])
    public onKeyDown(event: KeyboardEvent) {
        if (event.defaultPrevented || this.acPopup.handleKeyEvent(event)) {
            return
        }

        if (event.keyCode === BACKSPACE || event.keyCode === DELETE) {
            const nodes = event.keyCode === BACKSPACE
                ? this.stream.getNodesBeforeCaret()
                : this.stream.getNodesAfterCaret()
            const portalEl = nodes.filter(n => RICHTEXT_CMP_PORTAL_EL.testNode(n))
            if (portalEl && portalEl.length) {
                event.preventDefault()
                this.cmpManager.remove(portalEl[0] as HTMLElement)
                    .pipe(take(1))
                    .subscribe(this.emitCursorMove.bind(this))
            }
        }

        this.emitCursorMove()
    }

    @HostListener("keyup", ["$event"])
    public onKeyUp(event: KeyboardEvent) {
        if (event.defaultPrevented || this.acPopup.handleKeyEvent(event)) {
            return
        }
        this.emitCursorMove()
    }

    @HostListener("blur", ["$event"])
    public onBlur(event: Event) {
        const acEls = this.el.nativeElement.querySelectorAll(RICHTEXT_AUTO_COMPLETE_EL.selector)
        if (acEls.length === 1) {
            this.acManager.terminate(acEls[0] as HTMLElement)
        } else if (acEls.length !== 0) {
            throw new Error("Something went worng...")
        }
    }

    private onMutation(mutations: MutationRecord[]) {
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            nodes = record.removedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                if (RICHTEXT_AUTO_COMPLETE_EL.testNode(node)) {
                    this.acManager.terminate()
                }
            }
        }

        // remove empty <div><br></div>
        const el = this.el.nativeElement
        if (el.childNodes.length === 1) {
            const line = el.childNodes[0] as HTMLElement
            if (matchTagName(line, "div") && line.childNodes.length === 1) {
                if (matchTagName(line.childNodes[0], "br")) {
                    this.stream.content = ""
                }
            }
        }
    }

    private triggerAc() {
        let acState = this.stream.getState(RICHTEXT_AUTO_COMPLETE_EL)
        if (!acState) {
            const word = this.stream.getWordUnderCaret()
            if (word && this.acManager.hasAcProviderFor(word.value)) {
                this.beginAc(word)
                acState = this.stream.getState(RICHTEXT_AUTO_COMPLETE_EL, true)
            }

            if (!acState) {
                return
            }
        }

        const qs = (acState.value as HTMLElement).innerText

        if (!this.acManager.hasAcProviderFor(qs)) {
            removeNode(acState.value)
        } else {
            this.acManager.trigger(acState.value)
        }
    }

    private beginAc(word: Word) {
        let el = RICHTEXT_AUTO_COMPLETE_EL.create()
        el.innerHTML = word.value
        el.setAttribute("spellcheck", "false")
        el.setAttribute("focused", "true")
        word.select()
        this.ce.insertHTML(el.outerHTML)
    }

    private emitCursorMove() {
        this.stream.updatePosition()
        if (this.scroller) {
            const node = this.stream.getNodeUnerCaret()
            if (node) {
                this.scroller.scrollIntoViewport(node)
            }
        }
    }
}


function watchMutation(el: HTMLElement, callback: (mutations: MutationRecord[]) => void, options?: MutationObserverInit): () => void {
    const observer = new window[MUTATION_OBSERVER](callback)
    observer.observe(el, options)
    return function () {
        return observer.disconnect()
    }
}
