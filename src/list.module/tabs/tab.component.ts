import { Component, ContentChild, ViewChild, TemplateRef, Input, forwardRef, Output, EventEmitter, Inject } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { StackItemDirective, StackItemRef } from "../../layout.module"


@Component({
    selector: "nz-tab",
    templateUrl: "./tab.template.pug",
    providers: [
        StackItemRef,
        { provide: StackItemDirective, useExisting: forwardRef(() => TabComponent) }
    ]
})
export class TabComponent extends StackItemDirective {
    @Input() public label: string

    @ContentChild("content", { read: TemplateRef, static: true }) public readonly tpl: TemplateRef<any>
    @ContentChild("label", { read: TemplateRef, static: true }) protected readonly cLabelTpl: TemplateRef<any>
    @ViewChild("vLabelTpl", { read: TemplateRef, static: true }) protected readonly vLabelTpl: TemplateRef<any>

    @Input()
    public set selected(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._selected !== val) {
            this._selected = val;
            (this.selectedChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get selected(): boolean { return this._selected }
    private _selected: boolean
    @Output("selected") public readonly selectedChanges: Observable<boolean> = new EventEmitter()


    @Input()
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            this._disabled = val;
            (this.disabledChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get disabled(): boolean { return this._disabled }
    private _disabled: boolean
    @Output("disabled") public readonly disabledChanges: Observable<boolean> = new EventEmitter()


    public get labelTpl(): TemplateRef<any> {
        return this.cLabelTpl || this.vLabelTpl
    }

    public constructor(@Inject(StackItemRef) itemRef: StackItemRef) {
        super(itemRef, null)
    }
}
