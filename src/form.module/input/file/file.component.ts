import { Component, HostBinding, Inject, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { FormControl } from "@angular/forms"

import { INPUT_MODEL, InputComponent, InputModel } from "../abstract"
// import { merge } from 'rxjs'
// import { startWith, debounceTime } from 'rxjs/operators'


@Component({
    selector: ".nz-file-input",
    templateUrl: "./file.component.pug",
    providers: INPUT_MODEL,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileInputComponent extends InputComponent<File> {
    @HostBinding("attr.tabindex") public tabIndexAttr = -1

    public readonly filename = new FormControl()
    public readonly file: File
    public readonly uploadInProgress: boolean

    public constructor(
        @Inject(InputModel) model: InputModel<File>,
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
    }

    public ngOnInit() {
        super.ngOnInit()
        this.destruct.subscription(this.model.progress)
            .subscribe(event => {
                if (!this.uploadInProgress) {
                    (this as { uploadInProgress: boolean }).uploadInProgress = true
                    this.cdr.detectChanges()
                }
                console.log(event)
            })
    }

    public _renderValue(value: File) {
        if (value instanceof File) {
            (this as { file: File }).file = value
            this.filename.setValue(value.name)
        } else {
            (this as { file: File }).file = null
            this.filename.setValue(null)
        }
        this.cdr.detectChanges()
    }

    public _clearValue(event: Event) {
        this._renderValue(null)
        this.model.emitValue(null)
        this.cdr.detectChanges()
    }

    public onFileChange(event: Event) {
        const input = event.target as HTMLInputElement
        this._renderValue(input.files[0])
        this.model.emitValue(this.file)
    }
}
