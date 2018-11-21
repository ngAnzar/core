import { Pipe, PipeTransform, Inject } from "@angular/core"
import { format } from "date-fns"

import { LocaleService, DateFormat } from "./locale.service"


@Pipe({
    name: "nzDate"
})
export class DatePipe implements PipeTransform {
    public constructor(@Inject(LocaleService) protected readonly locale: LocaleService) {
    }

    public transform(value: Date, format: DateFormat = "long+time"): string {
        return this.locale.formatDate(value, format)
    }
}
