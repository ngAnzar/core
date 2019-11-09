import { Directive, Component, Inject, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from "@angular/core"
import { startWith } from "rxjs/operators"


import { Destructible } from "../../../util"
import { LayerService, LayerRef, DropdownLayer, ComponentLayerRef } from "../../../layer.module"
import { RichtextStream } from "./core/richtext-stream"
import { ContentEditable } from "./core/content-editable"
import { RichtextFormatElement } from "./core/richtext-el"
import { RICHTEXT_CMP_PORTAL_EL } from "./core/component-manager"


const BOLD_EL = new RichtextFormatElement("b", "bold")
const ITALIC_EL = new RichtextFormatElement("i", "italic")
const UNDERLINE_EL = new RichtextFormatElement("u", "underline")
const STRIKE_THROUGHT_EL = new RichtextFormatElement("s", "strikeThrough")

const ELEMENTS = [
    BOLD_EL,
    ITALIC_EL,
    UNDERLINE_EL,
    STRIKE_THROUGHT_EL,
]


@Directive({
    selector: "[nzRichtextMenu]",
    exportAs: "nzRichtextMenu"
})
export class RichtextMenuDirective extends Destructible {
    private _layerRef: ComponentLayerRef<RichtextMenuComponent>

    public get isVisible() { return this._layerRef && this._layerRef.isVisible }
    public get isMouseOver() { return this._layerRef && this._layerRef.component.instance && this._layerRef.component.instance.mouseIsOver }

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(LayerService) private readonly layerSvc: LayerService,
        @Inject(RichtextStream) protected readonly stream: RichtextStream,
        @Inject(ContentEditable) protected readonly ce: ContentEditable) {
        super()
        // stream.addElementHandler(BOLD_EL, null)
        // stream.addElementHandler(ITALIC_EL, null)
        // stream.addElementHandler(UNDERLINE_EL, null)
        // stream.addElementHandler(STRIKE_THROUGHT_EL, null)
    }

    public canShowByState(): boolean {
        return Boolean(this.stream.getState(BOLD_EL)
            || this.stream.getState(ITALIC_EL)
            || this.stream.getState(UNDERLINE_EL)
            || this.stream.getState(STRIKE_THROUGHT_EL))
    }

    public show() {
        if (!this._layerRef || !this._layerRef.isVisible) {
            let behavior = new DropdownLayer({
                backdrop: null,
                elevation: 4,
                rounded: 2,
                position: {
                    anchor: {
                        ref: this.el.nativeElement,
                        align: "top left",
                        margin: 10
                    },
                    align: "bottom left"
                }
            })
            this._layerRef = this.layerSvc.createFromComponent(RichtextMenuComponent, behavior, null, [
                { provide: RichtextStream, useValue: this.stream },
                { provide: ContentEditable, useValue: this.ce },
            ])
            this._layerRef.subscribe(event => {
                if (event.type === "hiding") {
                    delete this._layerRef
                }
            })
            this._layerRef.show()
        }
    }

    public hide() {
        if (this._layerRef) {
            this._layerRef.hide()
            delete this._layerRef
        }
    }
}




@Component({
    selector: "nz-richtext-menu",
    host: {
        "(mouseenter)": "mouseIsOver=true",
        "(mouseleave)": "mouseIsOver=false",
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./richtext-menu.component.pug"
})
export class RichtextMenuComponent extends Destructible implements OnInit {
    public readonly mouseIsOver: boolean = false
    public readonly btnState: { [key: string]: boolean } = {}

    public constructor(
        @Inject(RichtextStream) protected readonly stream: RichtextStream,
        @Inject(ContentEditable) protected readonly ce: ContentEditable,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef) {
        super()
    }

    public ngOnInit() {
        this.destruct.subscription(this.stream.cursorMove).pipe(startWith(null)).subscribe(_ => {
            let inComponent = this.stream.getState(RICHTEXT_CMP_PORTAL_EL)
            if (!inComponent) {
                for (const el of ELEMENTS) {
                    this.btnState[el.commandName] = !!this.stream.getState(el)
                }
            } else {
                for (const el of ELEMENTS) {
                    this.btnState[el.commandName] = false
                }
            }

            this.cdr.detectChanges()
        })
    }

    public exec(cmd: string) {
        this.ce.exec(cmd)
    }
}
