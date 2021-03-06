

export const enum ListDiffKind {
    DELETE = 1,
    UPDATE = 2,
    CREATE = 3
}

export interface ListDiffItem<T> {
    kind: ListDiffKind
    item: T
    index: number
}

export type ListDiff<T> = Array<ListDiffItem<T>>

export function listDiff<T>(oldList: T[], newList: T[], oldIndexBegin: number = 0, newIndexBegin: number = 0, isEq: (a: T, b: T) => boolean): ListDiff<T> {
    let result: ListDiff<T> = []
    let oldEnd = oldIndexBegin + oldList.length
    let newEnd = newIndexBegin + newList.length
    let begin = Math.min(oldIndexBegin, newIndexBegin)
    let end = Math.max(oldEnd, newEnd)

    let offsetOld = 0, offsetNew = 0
    if (oldIndexBegin < newIndexBegin) {
        offsetNew = oldIndexBegin - newIndexBegin
    } else {
        offsetOld = newIndexBegin - oldIndexBegin
    }

    for (let i = begin; i < end; i++) {
        if ((i >= oldIndexBegin && i <= oldEnd) || (i >= newIndexBegin && i <= newEnd)) {
            let oldItem = oldList[i - begin + offsetOld]
            let newItem = newList[i - begin + offsetNew]

            if (newItem === undefined) {
                result[result.length] = { kind: ListDiffKind.DELETE, item: oldItem, index: i }
            } else if (oldItem === undefined) {
                result[result.length] = { kind: ListDiffKind.CREATE, item: newItem, index: i }
            } else if ((isEq && !isEq(oldItem, newItem)) || (!isEq && oldItem !== newItem)) {
                result[result.length] = { kind: ListDiffKind.UPDATE, item: newItem, index: i }
            }
        }
    }

    return result.sort(_sortListDiff)
}


function _sortListDiff(a: ListDiffItem<any>, b: ListDiffItem<any>): number {
    return a.kind - b.kind
}
