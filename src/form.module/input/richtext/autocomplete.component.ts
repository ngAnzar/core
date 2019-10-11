import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from "@angular/core"

import { Destructible } from "../../../util"
import { ComponentLayerRef, DropdownLayer, LayerService } from "../../../layer.module"
import { SingleSelection, ISelectionModel, SelectionModel } from "../../../data.module"
import { AutocompleteManager, RichtextAcItem, PROVIDER, RichtextAcSession } from "./core/autocomplete"
import { RichtextStream } from "./core/richtext-stream"
import { ComponentManager } from "./core/component-manager"
import { ContentEditable } from "./core/content-editable"


export class AutocompletePopup extends Destructible {
    public readonly selection = new SingleSelection<RichtextAcItem>()

    private _anchor: HTMLElement
    private _layerRef: ComponentLayerRef<AutocompleteComponent>

    public constructor(
        @Inject(AutocompleteManager) private readonly acManager: AutocompleteManager,
        @Inject(RichtextStream) private readonly stream: RichtextStream,
        @Inject(ComponentManager) private readonly cmpManager: ComponentManager,
        @Inject(LayerService) private readonly layerSvc: LayerService,
        @Inject(ContentEditable) private readonly ce: ContentEditable) {
        super()

        this.selection.keyboard.instantSelection = false

        this.destruct.subscription(acManager.items$).subscribe(trigger => {
            this._anchor = trigger.anchor
            const items = trigger.items
            if (items && items.length) {
                this.show()
                this._layerRef.component.instance.items = items
                this._layerRef.component.instance.cdr.detectChanges()
            } else {
                this.hide()
            }
        })

        this.destruct.subscription(this.selection.changes).subscribe(selection => {
            let selected = selection[0]
            if (selected) {
                const sess = new RichtextAcSession(this.stream, this._anchor, this.cmpManager, this.ce)
                selected[PROVIDER].onSelect(sess, selected)
            }
            this.hide()
        })

        this.destruct.any(this.hide.bind(this))
    }

    public handleKeyEvent(event: KeyboardEvent) {
        return this._layerRef
            && this._layerRef.isVisible
            && this.selection.keyboard.handleKeyEvent(event)
    }

    private show() {
        if ((!this._layerRef || !this._layerRef.isVisible) && this._anchor) {
            const behavior = new DropdownLayer({
                backdrop: { type: "empty", hideOnClick: true },
                elevation: 5,
                position: {
                    anchor: {
                        ref: this._anchor,
                        align: "bottom left",
                        margin: "4 0"
                    },
                    align: "top left",
                }
            })

            this._layerRef = this.layerSvc.createFromComponent(AutocompleteComponent, behavior, null, [
                { provide: SelectionModel, useValue: this.selection },
            ])
            this._layerRef.show()
        }
    }

    private hide() {
        if (this._layerRef) {
            this._layerRef.hide()
            delete this._layerRef
        }
        this.selection.clear()
    }
}


@Component({
    selector: "nz-richtext-acpopup",
    templateUrl: "./autocomplete.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteComponent {
    public items: RichtextAcItem[] = []

    public constructor(
        @Inject(SelectionModel) protected readonly selection: ISelectionModel<RichtextAcItem>,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef) {
    }
}
