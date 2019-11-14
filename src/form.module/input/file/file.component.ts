import { Component, HostBinding, Inject, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { FormControl } from "@angular/forms"

import { INPUT_MODEL, InputComponent, InputModel } from "../abstract"
import { Model, Field } from "../../../data.module"
import { FileUploadEvent, FileDownloadService } from "../../../common.module"
import { ToastService } from "../../../layer.module"
// import { merge } from 'rxjs'
// import { startWith, debounceTime } from 'rxjs/operators'

export class UploadedFile extends Model {
    @Field({ primary: true }) public id: any
    @Field() public name: string
    @Field() public size: number
    @Field() public downloadUrl: string
    @Field() public mime: string
}


@Component({
    selector: ".nz-file-input",
    templateUrl: "./file.component.pug",
    providers: INPUT_MODEL,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileInputComponent extends InputComponent<File | UploadedFile> {
    @HostBinding("attr.tabindex") public tabIndexAttr = -1

    public readonly filename = new FormControl()
    public readonly file: File
    public readonly uploadInProgress: boolean
    public readonly uploaded: boolean = false
    public readonly downloadUrl: string = null

    public constructor(
        @Inject(InputModel) model: InputModel<File>,
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(FileDownloadService) private readonly downloader: FileDownloadService,
        @Inject(ToastService) private readonly toast: ToastService) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
    }

    public ngOnInit() {
        super.ngOnInit()
        this.destruct.subscription(this.model.progress)
            .subscribe((event: FileUploadEvent) => {
                if (!this.uploadInProgress && event.state !== "done") {
                    (this as { uploadInProgress: boolean }).uploadInProgress = true
                    this.cdr.detectChanges()
                }
            })
    }

    public _renderValue(value: File | UploadedFile) {
        (this as { file: File }).file = null;
        (this as { uploaded: boolean }).uploaded = false;
        (this as { uploadInProgress: boolean }).uploadInProgress = false;
        (this as { downloadUrl: string }).downloadUrl = null;

        if (value instanceof File) {
            (this as { file: File }).file = value
            this.filename.setValue(value.name)
        } else if (value instanceof UploadedFile) {
            (this as { uploaded: boolean }).uploaded = true;
            (this as { uploadInProgress: boolean }).uploadInProgress = false;
            (this as { downloadUrl: string }).downloadUrl = value.downloadUrl;
            this.filename.setValue(value.name)
        } else {
            (this as { file: File }).file = null
            this.filename.setValue(null)
        }
        this.cdr.detectChanges()
    }

    public _clearValue(event: Event) {
        event.preventDefault()

        this._renderValue(null)
        this.model.emitValue(null)
        this.cdr.detectChanges()
    }

    public onFileChange(event: Event) {
        const input = event.target as HTMLInputElement
        this._renderValue(input.files[0])
        this.model.emitValue(this.file)
    }

    public _download(event: Event) {
        event.preventDefault()

        this.destruct.subscription(this.downloader.download(this.downloadUrl))
            .pipe(this.toast.handleFileDownload({ align: "bottom center" }))
            .subscribe()
    }
}
