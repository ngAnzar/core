import { Observable } from "rxjs"


export type Executor = () => Observable<any>


export class ExecQueue {
    protected items: Executor[] = []
    protected running: boolean = false

    public add(executor: Executor) {
        this.items.push(executor)
        this._start()
    }

    protected _start() {
        if (!this.running) {
            this.running = true
            this._next()
        }
    }

    protected _next() {
        if (this.items.length > 0) {
            let exec = this.items.shift()
            exec().subscribe(this._next.bind(this))
        } else {
            this.running = false
        }
    }
}
